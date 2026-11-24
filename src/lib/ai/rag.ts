import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import AiKnowledgeChunk, { RagEntityType } from "@/models/AiKnowledgeChunk";
import Task from "@/models/Task";
import Idea from "@/models/Idea";
import Note from "@/models/Note";
import Routine from "@/models/Routine";
import CustomRecord from "@/models/custom/CustomRecord";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import FinancialReminder from "@/models/FinancialReminder";

const VECTOR_DIM = 256;
const SYNC_TTL_MS = 15_000;
const syncTimestamps = new Map<string, number>();

export interface RetrievedKnowledgeHit {
  entityType: RagEntityType;
  entityId: string;
  title: string;
  snippet: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Clears the 15-second incremental RAG sync cache for a user+workspace after mutations.
 */
export function invalidateKnowledgeCache(userId: string, workspaceId: string) {
  syncTimestamps.delete(`${userId}:${workspaceId}`);
}

function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Extracts normalized Unicode tokens (supporting English, Banglish, and Bengali words).
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, " ")
    .trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\s+/)
    .filter((tok) => tok.length >= 2)
    .slice(0, 120);
}

/**
 * Computes a deterministic 256-dim L2-normalized hybrid feature vector (word unigrams + bigrams + char trigrams)
 * with zero external embedding API dependency or latency.
 */
export function computeLocalEmbedding(text: string): number[] {
  const vec = new Array<number>(VECTOR_DIM).fill(0);
  const tokens = tokenizeText(text);
  if (tokens.length === 0) return vec;

  const featureCounts = new Map<string, number>();
  const addFeature = (feat: string, weight = 1) => {
    featureCounts.set(feat, (featureCounts.get(feat) || 0) + weight);
  };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    addFeature(`w:${tok}`, 1.4);
    if (i < tokens.length - 1) {
      addFeature(`b:${tok}_${tokens[i + 1]}`, 1.1);
    }
    if (tok.length >= 3) {
      for (let j = 0; j <= tok.length - 3; j++) {
        addFeature(`c:${tok.slice(j, j + 3)}`, 0.45);
      }
    }
  }

  for (const [feat, rawWeight] of featureCounts.entries()) {
    const h = fnv1aHash(feat);
    const bucket = h % VECTOR_DIM;
    const sign = (fnv1aHash(`s:${feat}`) & 1) === 0 ? 1 : -1;
    const tf = 1 + Math.log(Math.max(1, rawWeight));
    vec[bucket] += sign * tf * (rawWeight < 1 ? 0.65 : 1);
  }

  let normSq = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(6));
    }
  }
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

interface RawChunkCandidate {
  scopeType: "workspace" | "personal_finance";
  workspaceId: mongoose.Types.ObjectId | null;
  entityType: RagEntityType;
  entityId: mongoose.Types.ObjectId;
  title: string;
  contentText: string;
  metadata: Record<string, unknown>;
  entityUpdatedAt: Date;
}

function buildTextFromEntity(parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(" | ")
    .slice(0, 2200);
}

/**
 * Incrementally syncs workspace and personal finance entities into AiKnowledgeChunk.
 * VaultItem is strictly excluded to preserve zero-knowledge Vault privacy.
 */
export async function syncWorkspaceKnowledgeIndex(
  userId: string,
  workspaceId: string,
  options?: { force?: boolean; includeFinance?: boolean }
) {
  const cacheKey = `${userId}:${workspaceId}`;
  const nowMs = Date.now();
  const lastSync = syncTimestamps.get(cacheKey);
  if (!options?.force && lastSync && nowMs - lastSync < SYNC_TTL_MS) {
    return;
  }

  await dbConnect();
  const userObjId = new mongoose.Types.ObjectId(userId);
  const wsObjId = new mongoose.Types.ObjectId(workspaceId);
  const includeFinance = options?.includeFinance !== false;

  const [tasks, ideas, notes, routines, customRecords, accounts, transactions, reminders] =
    await Promise.all([
      Task.find({ workspaceId: wsObjId })
        .select("title description notes status priority dueDate dueTime tags updatedAt")
        .sort({ updatedAt: -1 })
        .limit(180)
        .lean(),
      Idea.find({ workspaceId: wsObjId })
        .select("title description content status priority tags updatedAt")
        .sort({ updatedAt: -1 })
        .limit(120)
        .lean(),
      Note.find({ workspaceId: wsObjId })
        .select("title content date updatedAt")
        .sort({ updatedAt: -1 })
        .limit(140)
        .lean(),
      Routine.find({ workspaceId: wsObjId })
        .select("name description recurrence schedule startTime endTime isActive updatedAt")
        .sort({ updatedAt: -1 })
        .limit(80)
        .lean(),
      CustomRecord.find({ workspaceId: wsObjId })
        .select("title data updatedAt")
        .sort({ updatedAt: -1 })
        .limit(120)
        .lean(),
      includeFinance
        ? Account.find({ userId: userObjId })
            .select("name type currency balance updatedAt")
            .lean()
        : Promise.resolve([]),
      includeFinance
        ? Transaction.find({ userId: userObjId })
            .select("description type amount currency date tags updatedAt")
            .sort({ date: -1 })
            .limit(80)
            .lean()
        : Promise.resolve([]),
      includeFinance
        ? FinancialReminder.find({ userId: userObjId })
            .select("title category amount currency dueDate status recurrence notes updatedAt")
            .sort({ dueDate: 1 })
            .limit(60)
            .lean()
        : Promise.resolve([]),
    ]);

  const candidates: RawChunkCandidate[] = [];

  for (const t of tasks) {
    const dueStr = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "";
    const isPending = !["Completed", "Done", "Cancelled"].includes(String(t.status || ""));
    candidates.push({
      scopeType: "workspace",
      workspaceId: wsObjId,
      entityType: "Task",
      entityId: t._id as mongoose.Types.ObjectId,
      title: String(t.title || "Task"),
      contentText: buildTextFromEntity([
        `Task: ${t.title}`,
        `Status: ${t.status}`,
        isPending ? "pending active open todo task" : "finished",
        `Priority: ${t.priority}`,
        dueStr ? `Due: ${dueStr}` : "",
        t.description ? String(t.description) : "",
        t.notes ? String(t.notes).slice(0, 600) : "",
        Array.isArray(t.tags) && t.tags.length ? `Tags: ${t.tags.join(", ")}` : "",
      ]),
      metadata: {
        status: t.status,
        priority: t.priority,
        dueDate: dueStr || null,
        isPending,
      },
      entityUpdatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
    });
  }

  for (const i of ideas) {
    candidates.push({
      scopeType: "workspace",
      workspaceId: wsObjId,
      entityType: "Idea",
      entityId: i._id as mongoose.Types.ObjectId,
      title: String(i.title || "Idea"),
      contentText: buildTextFromEntity([
        `Idea: ${i.title}`,
        `Status: ${i.status}`,
        `Priority: ${i.priority}`,
        i.description ? String(i.description) : "",
        i.content ? String(i.content).slice(0, 700) : "",
        Array.isArray(i.tags) && i.tags.length ? `Tags: ${i.tags.join(", ")}` : "",
      ]),
      metadata: { status: i.status, priority: i.priority },
      entityUpdatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
    });
  }

  for (const n of notes) {
    candidates.push({
      scopeType: "workspace",
      workspaceId: wsObjId,
      entityType: "Note",
      entityId: n._id as mongoose.Types.ObjectId,
      title: String(n.title || "Note"),
      contentText: buildTextFromEntity([
        `Note: ${n.title}`,
        n.content ? String(n.content).slice(0, 1400) : "",
      ]),
      metadata: { date: n.date ? new Date(n.date).toISOString().slice(0, 10) : null },
      entityUpdatedAt: n.updatedAt ? new Date(n.updatedAt) : new Date(),
    });
  }

  for (const r of routines) {
    candidates.push({
      scopeType: "workspace",
      workspaceId: wsObjId,
      entityType: "Routine",
      entityId: r._id as mongoose.Types.ObjectId,
      title: String(r.name || "Routine"),
      contentText: buildTextFromEntity([
        `Routine: ${r.name}`,
        r.recurrence ? `Recurrence: ${r.recurrence}` : "",
        Array.isArray(r.schedule) ? `Schedule: ${r.schedule.join(", ")}` : "",
        r.startTime ? `Time: ${r.startTime}-${r.endTime || ""}` : "",
        r.description ? String(r.description) : "",
      ]),
      metadata: { isActive: Boolean(r.isActive), recurrence: r.recurrence },
      entityUpdatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    });
  }

  for (const cr of customRecords) {
    const dataObj = cr.data instanceof Map ? Object.fromEntries(cr.data.entries()) : cr.data || {};
    const flatData = Object.entries(dataObj)
      .slice(0, 12)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(", ");
    candidates.push({
      scopeType: "workspace",
      workspaceId: wsObjId,
      entityType: "CustomRecord",
      entityId: cr._id as mongoose.Types.ObjectId,
      title: String(cr.title || "Custom Record"),
      contentText: buildTextFromEntity([`Custom Record: ${cr.title}`, flatData]),
      metadata: {},
      entityUpdatedAt: cr.updatedAt ? new Date(cr.updatedAt) : new Date(),
    });
  }

  for (const a of accounts) {
    const bal = a.balance != null ? parseFloat(a.balance.toString()) : 0;
    candidates.push({
      scopeType: "personal_finance",
      workspaceId: null,
      entityType: "Account",
      entityId: a._id as mongoose.Types.ObjectId,
      title: String(a.name || "Account"),
      contentText: buildTextFromEntity([
        `Account: ${a.name}`,
        `Type: ${a.type}`,
        `Balance: ${bal} ${a.currency || "USD"}`,
      ]),
      metadata: { balance: bal, currency: a.currency, type: a.type },
      entityUpdatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    });
  }

  for (const tx of transactions) {
    const amt = tx.amount != null ? parseFloat(tx.amount.toString()) : 0;
    const dt = tx.date ? new Date(tx.date).toISOString().slice(0, 10) : "";
    candidates.push({
      scopeType: "personal_finance",
      workspaceId: null,
      entityType: "Transaction",
      entityId: tx._id as mongoose.Types.ObjectId,
      title: String(tx.description || "Transaction"),
      contentText: buildTextFromEntity([
        `Transaction: ${tx.description}`,
        `Type: ${tx.type}`,
        `Amount: ${amt} ${tx.currency || "USD"}`,
        dt ? `Date: ${dt}` : "",
      ]),
      metadata: { amount: amt, type: tx.type, currency: tx.currency, date: dt },
      entityUpdatedAt: tx.updatedAt ? new Date(tx.updatedAt) : new Date(),
    });
  }

  for (const rem of reminders) {
    const amt = rem.amount != null ? parseFloat(rem.amount.toString()) : 0;
    const due = rem.dueDate ? new Date(rem.dueDate).toISOString().slice(0, 10) : "";
    candidates.push({
      scopeType: "personal_finance",
      workspaceId: null,
      entityType: "FinancialReminder",
      entityId: rem._id as mongoose.Types.ObjectId,
      title: String(rem.title || "Financial Reminder"),
      contentText: buildTextFromEntity([
        `Bill/Reminder: ${rem.title}`,
        `Category: ${rem.category}`,
        `Status: ${rem.status}`,
        `Amount: ${amt} ${rem.currency || "USD"}`,
        due ? `Due: ${due}` : "",
        rem.notes ? String(rem.notes) : "",
      ]),
      metadata: { amount: amt, status: rem.status, dueDate: due },
      entityUpdatedAt: rem.updatedAt ? new Date(rem.updatedAt) : new Date(),
    });
  }

  // Incremental delta check against existing chunks
  const existingChunks = await AiKnowledgeChunk.find({
    userId: userObjId,
    $or: [{ workspaceId: wsObjId }, { scopeType: "personal_finance" }],
  })
    .select("entityType entityId entityUpdatedAt")
    .lean();

  const existingMap = new Map<string, number>();
  for (const ch of existingChunks) {
    existingMap.set(
      `${ch.entityType}:${String(ch.entityId)}`,
      ch.entityUpdatedAt ? new Date(ch.entityUpdatedAt).getTime() : 0
    );
  }

  const activeKeySet = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulkOps: any[] = [];

  for (const item of candidates) {
    const key = `${item.entityType}:${String(item.entityId)}`;
    activeKeySet.add(key);
    const prevTs = existingMap.get(key);
    const currTs = item.entityUpdatedAt.getTime();
    if (prevTs !== undefined && Math.abs(prevTs - currTs) < 500) {
      continue;
    }

    const tokens = Array.from(new Set(tokenizeText(`${item.title} ${item.contentText}`)));
    const vector = computeLocalEmbedding(`${item.title} ${item.contentText}`);

    bulkOps.push({
      updateOne: {
        filter: {
          userId: userObjId,
          entityType: item.entityType,
          entityId: item.entityId,
        },
        update: {
          $set: {
            userId: userObjId,
            workspaceId: item.workspaceId,
            scopeType: item.scopeType,
            entityType: item.entityType,
            entityId: item.entityId,
            title: item.title,
            contentText: item.contentText,
            tokens,
            vector,
            metadata: item.metadata,
            entityUpdatedAt: item.entityUpdatedAt,
          },
        },
        upsert: true,
      },
    });
  }

  // Prune chunks whose underlying entities were deleted
  const staleIds = existingChunks
    .filter((ch) => !activeKeySet.has(`${ch.entityType}:${String(ch.entityId)}`))
    .map((ch) => ch._id);

  if (staleIds.length > 0) {
    bulkOps.push({
      deleteMany: {
        filter: { _id: { $in: staleIds }, userId: userObjId },
      },
    });
  }

  if (bulkOps.length > 0) {
    await AiKnowledgeChunk.bulkWrite(bulkOps, { ordered: false });
  }

  syncTimestamps.set(cacheKey, nowMs);
}

/**
 * Performs Hybrid Vector Cosine Similarity + BM25 + Reciprocal Rank Fusion (RRF) search
 * across the user's scoped Manageo knowledge chunks.
 */
export async function retrieveHybridContext(params: {
  userId: string;
  workspaceId: string;
  query: string;
  topK?: number;
  includeFinance?: boolean;
}): Promise<RetrievedKnowledgeHit[]> {
  const topK = params.topK ?? 8;
  const includeFinance = params.includeFinance !== false;

  await syncWorkspaceKnowledgeIndex(params.userId, params.workspaceId, {
    includeFinance,
  });

  const userObjId = new mongoose.Types.ObjectId(params.userId);
  const wsObjId = new mongoose.Types.ObjectId(params.workspaceId);

  const scopeFilter = includeFinance
    ? {
        userId: userObjId,
        $or: [
          { scopeType: "workspace", workspaceId: wsObjId },
          { scopeType: "personal_finance" },
        ],
      }
    : {
        userId: userObjId,
        scopeType: "workspace",
        workspaceId: wsObjId,
      };

  const chunks = await AiKnowledgeChunk.find(scopeFilter)
    .select("entityType entityId title contentText tokens vector metadata entityUpdatedAt")
    .lean();

  if (chunks.length === 0) return [];

  const queryTokens = tokenizeText(params.query);
  const queryVec = computeLocalEmbedding(params.query);

  // Document frequency map for BM25
  const df = new Map<string, number>();
  let totalDocLen = 0;
  for (const ch of chunks) {
    const docTokens = Array.isArray(ch.tokens) ? ch.tokens : [];
    totalDocLen += docTokens.length;
    for (const qt of queryTokens) {
      if (docTokens.includes(qt)) {
        df.set(qt, (df.get(qt) || 0) + 1);
      }
    }
  }
  const avgDl = Math.max(1, totalDocLen / chunks.length);
  const N = chunks.length;
  const k1 = 1.4;
  const b = 0.75;

  const lowerQuery = params.query.toLowerCase();

  const scored = chunks.map((ch) => {
    const docTokens = Array.isArray(ch.tokens) ? ch.tokens : [];
    const dl = docTokens.length || 1;
    const textLower = `${ch.title} ${ch.contentText}`.toLowerCase();

    // BM25 lexical score
    let bm25 = 0;
    for (const qt of queryTokens) {
      const docDf = df.get(qt) || 0;
      const idf = Math.log(1 + (N - docDf + 0.5) / (docDf + 0.5));
      let tf = 0;
      for (const dt of docTokens) {
        if (dt === qt) tf += 1;
        else if (dt.includes(qt) || qt.includes(dt)) tf += 0.35;
      }
      if (tf > 0) {
        bm25 += (idf * (tf * (k1 + 1))) / (tf + k1 * (1 - b + (b * dl) / avgDl));
      }
    }
    if (lowerQuery.length >= 3 && textLower.includes(lowerQuery)) {
      bm25 += 2.5;
    }

    // Vector cosine similarity
    const vecSim = cosineSimilarity(queryVec, Array.isArray(ch.vector) ? ch.vector : []);

    return {
      chunk: ch,
      bm25,
      vecSim,
    };
  });

  // Compute RRF ranks across BM25 and Vector similarity
  const byBm25 = [...scored].sort((a, b) => b.bm25 - a.bm25);
  const byVec = [...scored].sort((a, b) => b.vecSim - a.vecSim);

  const bm25Rank = new Map<string, number>();
  const vecRank = new Map<string, number>();
  byBm25.forEach((item, idx) => bm25Rank.set(String(item.chunk._id), idx + 1));
  byVec.forEach((item, idx) => vecRank.set(String(item.chunk._id), idx + 1));

  const ranked = scored
    .map((item) => {
      const id = String(item.chunk._id);
      const rBm25 = bm25Rank.get(id) || N;
      const rVec = vecRank.get(id) || N;
      const rrfScore =
        (item.bm25 > 0 ? 1 / (40 + rBm25) : 0) +
        (item.vecSim > 0.05 ? 1 / (45 + rVec) : 0) +
        item.vecSim * 0.02;

      return {
        entityType: item.chunk.entityType as RagEntityType,
        entityId: String(item.chunk.entityId),
        title: item.chunk.title,
        snippet: item.chunk.contentText,
        score: Number(rrfScore.toFixed(5)),
        metadata: (item.chunk.metadata as Record<string, unknown>) || {},
      };
    })
    .filter((hit) => hit.score > 0.004)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return ranked;
}
