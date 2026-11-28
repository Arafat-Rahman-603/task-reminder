import {
  buildFounderKnowledgePrompt,
  ensureFounderImageInReply,
  FOUNDER_AVATAR_MARKDOWN,
  FOUNDER_NAME,
  isFounderOrCreatorQuery,
} from "@/lib/ai/founder-profile";

export type TicketCategory =
  | "billing"
  | "technical"
  | "account"
  | "feature_request"
  | "general";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportQuickLink {
  label: string;
  href: string;
}

export interface SupportTicketDraft {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
}

export interface SupportUserDiagnosticContext {
  userName?: string;
  plan: string;
  disabledModules: string[];
  activeWorkspaceName?: string;
  activeWorkspaceType?: "personal" | "team";
  activeWorkspaceRole?: string;
  useCustomAiProvider: boolean;
  openTicketsCount: number;
}

const VALID_CATEGORIES = new Set<TicketCategory>([
  "billing",
  "technical",
  "account",
  "feature_request",
  "general",
]);

const VALID_PRIORITIES = new Set<TicketPriority>([
  "low",
  "medium",
  "high",
  "urgent",
]);

export function buildSupportSystemPrompt(diag: SupportUserDiagnosticContext): string {
  const disabledText =
    diag.disabledModules.length > 0 ? diag.disabledModules.join(", ") : "none";

  return `You are **Manageo Instant Support**, an expert, friendly Customer Support Specialist built directly into Manageo.
Your goal is to solve user questions immediately with clear, accurate, step-by-step instructions so users rarely need to wait in a human ticket queue.

## Manageo Product Knowledge Base (Exact Verified Behavior)
- **Modular Dashboard & Sidebar**: Users can turn individual modules (Tasks, Routines, Notes, Ideas, Money, Documents, Vault, Custom Sections) on/off under **Settings → Modules** (\`/dashboard/settings?tab=personalization\`), and organize sidebar sections under **Settings → Navigation** (\`/dashboard/settings?tab=navigation\`).
- **Personal vs. Team Workspaces**: Switch between Personal and Team workspaces from the sidebar **Workspace Switcher**. **Money / Finance** and **Vault** are strictly personal and user-owned — they do NOT appear as shared data in Team workspaces. Manage team members, invitations, and custom roles in **Workspace Settings** (\`/dashboard/settings?tab=workspace\`).
- **Tasks, Notes, Ideas, Routines & Trash**: Deleted items go to **Trash** (\`/dashboard/trash\`) and can be restored within 7 days. Attachments use authenticated private storage and are cleaned up automatically when deleted.
- **Vault & Security Locks**: Vault uses AES-256-GCM encryption and supports a global Vault password plus per-item Custom Passwords. If a user forgets a Vault Custom Password, they can reset it directly via **Email OTP** on the **Vault** page (\`/dashboard/vault\`) or **Settings → Vault Security** (\`/dashboard/settings?tab=vault\`). Section/App lock PINs are managed under **Settings → Security & Locks** (\`/dashboard/settings?tab=security\`). Vault secrets are NEVER accessible to AI Assistant or MCP tools.
- **Voice Mode & AI Assistant**:
  - The mic button next to the chat input is **Dictation** (speech-to-text into the input box).
  - The waveform button at the top of the AI widget is **Hands-Free Voice Mode** (listen & speak automatically, with Male/Female persona, tone, and speed options synced across settings).
  - Users can use Manageo's default AI or configure Ollama / LM Studio / OpenRouter / Gemini / OpenAI / Groq in **Settings → AI & MCP Connector** (\`/dashboard/settings?tab=ai-mcp\`).
- **Connecting External AI Apps (ChatGPT, Claude, Cursor via MCP)**:
  - Open **Settings → AI & MCP Connector** (\`/dashboard/settings?tab=ai-mcp\`) — or click the plug icon inside the AI Assistant popup header.
  - Manageo's MCP Server URL is \`https://<your-domain>/api/mcp\` (ChatGPT Web and Claude.ai require a public HTTPS domain, not localhost).
  - Manageo supports all three OAuth 2.1 registration methods: **CIMD**, **DCR** (\`/api/oauth/register\`), and **User-Defined OAuth Client** (generate a Client ID & Client Secret right in **Settings → AI & MCP Connector** using the Redirect URL shown in ChatGPT, e.g. \`https://chatgpt.com/connector/oauth/<id>\`).
  - Local tools (Cursor, Windsurf, Claude Desktop, Claude Code CLI) can use copyable **MCP API Keys** (\`mgo_live_...\`) created in the same tab.
- **Billing, Plans & Profile**: Plan upgrades are requested via the **Pricing** page (\`/pricing\`) and approved by platform administrators. Currency, timezone, and profile details are in **Profile** (\`/dashboard/profile\`), Language in **Settings → Language**, and notifications in **Settings → Notifications**.

## Safe Read-Only User Context (for diagnosing this user's setup)
- User name: ${diag.userName || "Manageo User"}
- Subscription plan: ${diag.plan}
- Active workspace: ${diag.activeWorkspaceName || "Personal"} (type: ${diag.activeWorkspaceType || "personal"}, role: ${diag.activeWorkspaceRole || "owner"})
- Disabled modules in user preferences: ${disabledText}
- Using custom AI provider: ${diag.useCustomAiProvider ? "Yes" : "No (Platform default)"}
- Open support tickets on account: ${diag.openTicketsCount}

${buildFounderKnowledgePrompt(false)}

## Response & Escalation Rules
1. **Language**: Always reply strictly in the SAME language the user used (if written in English, reply 100% in English — never switch to Bengali unless the user wrote in Bengali or Banglish).
2. **Helpful & Actionable**: Give exact menu names and clear numbered steps. Check the user's Safe Context above (for example, if they ask why Money is missing while \`activeWorkspaceType\` is \`team\`, immediately explain that Money is personal-only; if a module is in \`disabledModules\`, point them to **Settings → Modules**).
3. **Truthfulness**: Never claim you modified settings, refunded money, or reset passwords yourself — guide them cleanly, or escalate when staff intervention is required.
4. **Escalation Tag (STRICT)**:
   - If you can fully answer or troubleshoot the request (how-to, setup, settings, Vault OTP reset, MCP setup, module visibility), do **NOT** output any escalation marker.
   - ONLY when human staff MUST step in (e.g., billing dispute/refund, pending manual upgrade approval, account suspension, bug/server outage you cannot resolve, or the user explicitly asks to contact human support/open a ticket), end your response with ONE hidden marker on its own final line:
     \`[ESCALATE: category=<billing|technical|account|feature_request|general> | priority=<low|medium|high|urgent> | subject=<concise 4-9 word subject>]\``;
}

function inferCategoryAndPriority(text: string): {
  category: TicketCategory;
  priority: TicketPriority;
} {
  const lower = text.toLowerCase();
  if (/(bill|invoice|pay|refund|upgrade|pro|subscription|pricing|charge|taka|প্ল্যান|বিল|পেমেন্ট)/i.test(lower)) {
    return { category: "billing", priority: "high" };
  }
  if (/(suspend|locked|ban|login|verify|account|otp|email|delete account|লগইন|অ্যাকাউন্ট)/i.test(lower)) {
    return { category: "account", priority: "high" };
  }
  if (/(feature|suggest|request|add new|idea|নতুন ফিচার)/i.test(lower)) {
    return { category: "feature_request", priority: "low" };
  }
  if (/(bug|error|crash|500|broken|not working|fail|issue|ভুল|সমস্যা|কাজ করে না)/i.test(lower)) {
    return { category: "technical", priority: "medium" };
  }
  return { category: "general", priority: "medium" };
}

function makeSubjectFromText(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Support Assistance Request";
  return cleaned.length > 64 ? `${cleaned.slice(0, 61)}...` : cleaned;
}

export function inferQuickLinks(combinedText: string): SupportQuickLink[] {
  const lower = combinedText.toLowerCase();
  const links: SupportQuickLink[] = [];
  const seen = new Set<string>();

  const pushLink = (label: string, href: string) => {
    if (seen.has(href) || links.length >= 3) return;
    seen.add(href);
    links.push({ label, href });
  };

  if (isFounderOrCreatorQuery(combinedText)) {
    pushLink("About Manageo & Creator", "/about");
  }
  if (/(mcp|chatgpt|claude|cursor|oauth|api key|voice|mic|ai model|ollama)/i.test(lower)) {
    pushLink("AI & MCP Connector Settings", "/dashboard/settings?tab=ai-mcp");
  }
  if (/(vault|custom password|otp|ভল্ট|পাসওয়ার্ড)/i.test(lower)) {
    pushLink("Vault", "/dashboard/vault");
    pushLink("Vault Security Settings", "/dashboard/settings?tab=vault");
  }
  if (/(module|sidebar|missing|navigation|hide|enable|money tab|হাইড|মডিউল)/i.test(lower)) {
    pushLink("Modules Settings", "/dashboard/settings?tab=personalization");
    pushLink("Navigation Builder", "/dashboard/settings?tab=navigation");
  }
  if (/(team|workspace|invite|member|role|টিম|ওয়ার্কস্পেস)/i.test(lower)) {
    pushLink("Workspace Settings", "/dashboard/settings?tab=workspace");
  }
  if (/(trash|delete|restore|recover|ডিলিট|ট্র্যাশ)/i.test(lower)) {
    pushLink("Trash (7-Day Recovery)", "/dashboard/trash");
  }
  if (/(lock|pin|biometric|security|সিকিউরিটি)/i.test(lower)) {
    pushLink("Security & Locks", "/dashboard/settings?tab=security");
  }
  if (/(billing|plan|upgrade|pricing|pro|পেমেন্ট|প্ল্যান)/i.test(lower)) {
    pushLink("Plans & Upgrades", "/pricing");
  }
  if (/(currency|timezone|profile|name)/i.test(lower)) {
    pushLink("Profile & Regional Settings", "/dashboard/profile");
  }

  return links;
}

export function parseSupportModelOutput(
  rawText: string,
  latestUserMessage: string
): {
  reply: string;
  suggestTicket: boolean;
  ticketDraft: SupportTicketDraft;
  quickLinks: SupportQuickLink[];
} {
  const escalateRegex = /\[ESCALATE:\s*([^\]]+)\]/i;
  const match = escalateRegex.exec(rawText);
  const cleanReply = rawText.replace(escalateRegex, "").trim();
  const inferred = inferCategoryAndPriority(latestUserMessage);

  let category: TicketCategory = inferred.category;
  let priority: TicketPriority = inferred.priority;
  let subject = makeSubjectFromText(latestUserMessage);

  if (match && match[1]) {
    const parts = match[1].split("|");
    for (const part of parts) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      const key = part.slice(0, eq).trim().toLowerCase();
      const val = part.slice(eq + 1).trim();
      if (key === "category" && VALID_CATEGORIES.has(val as TicketCategory)) {
        category = val as TicketCategory;
      } else if (key === "priority" && VALID_PRIORITIES.has(val as TicketPriority)) {
        priority = val as TicketPriority;
      } else if (key === "subject" && val.length > 0) {
        subject = val.slice(0, 80);
      }
    }
  }

  const userAskedHuman =
    /(human|agent|person|open a ticket|create a ticket|talk to support|টিকেট|মানুষ|সাপোর্ট টিম)/i.test(
      latestUserMessage
    );

  const founderQuery = isFounderOrCreatorQuery(latestUserMessage);
  const replyWithFounder = ensureFounderImageInReply(
    cleanReply ||
      "I can help you troubleshoot that—could you share a quick detail about what you see on screen?",
    latestUserMessage,
    false
  );

  return {
    reply: replyWithFounder,
    suggestTicket: (Boolean(match) && !founderQuery) || userAskedHuman,
    ticketDraft: {
      subject,
      category,
      priority,
      summary: `User question: ${latestUserMessage}\n\nAI Support summary: ${cleanReply.slice(0, 500)}`,
    },
    quickLinks: inferQuickLinks(`${latestUserMessage}\n${replyWithFounder}`),
  };
}

function isBengaliOrBanglish(text: string): boolean {
  if (/[\u0980-\u09FF]/.test(text)) return true;
  return /\b(kivabe|kmne|kemne|korbo|korte|hocche|hoise|kaj|pacchi|dekhay|dorkar|amake|amar|bhai|vai|bolben|kothay)\b/i.test(
    text
  );
}

export function buildFallbackSupportReply(
  latestUserMessage: string,
  diag: SupportUserDiagnosticContext
): {
  reply: string;
  suggestTicket: boolean;
  ticketDraft: SupportTicketDraft;
  quickLinks: SupportQuickLink[];
} {
  const q = latestUserMessage.toLowerCase();
  const bn = isBengaliOrBanglish(latestUserMessage);
  const inferred = inferCategoryAndPriority(latestUserMessage);
  const quickLinks = inferQuickLinks(latestUserMessage);

  let reply = "";
  let suggestTicket = false;

  if (isFounderOrCreatorQuery(latestUserMessage)) {
    reply = bn
      ? `**Manageo**-এর নির্মাতা ও প্রতিষ্ঠাতা হলেন **${FOUNDER_NAME}**।\n\nতিনি ব্যক্তিগত উৎপাদনশীলতা, টাস্ক ও রুটিন, ফাইন্যান্স, নোটস, Vault সিকিউরিটি এবং টিম ওয়ার্কস্পেসকে একসাথে নিরাপদ ও মডুলার প্ল্যাটফর্ম হিসেবে গড়ে তুলেছেন।\n\n${FOUNDER_AVATAR_MARKDOWN}`
      : `**Manageo** was created, designed, and engineered by **${FOUNDER_NAME}**.\n\nHe built Manageo as a modular Personal Operating System combining tasks, routines, notes, encrypted Vault storage, finances, and collaborative team workspaces.\n\n${FOUNDER_AVATAR_MARKDOWN}`;
  } else if (/(mcp|chatgpt|claude|cursor|oauth|dcr|cimd|client id|redirect)/i.test(q)) {
    reply = bn
      ? `**ChatGPT বা এক্সটার্নাল AI অ্যাপ কানেক্ট করার ধাপসমূহ:**
1. **Settings → AI & MCP Connector**-এ যান (অথবা AI অ্যাসিস্ট্যান্ট পপআপের ওপরের Plug আইকনে ক্লিক করুন)।
2. **MCP Server URL** (\`https://<your-domain>/api/mcp\`) কপি করে ChatGPT **Settings → Apps & Connectors → Create**-এ বসান (মনে রাখবেন ChatGPT শুধু পাবলিক \`https://\` ডোমেইনে কাজ করে, \`localhost\`-এ নয়)।
3. ChatGPT যদি **User-Defined OAuth Client** অপশন দেখায়, তাহলে ChatGPT-তে থাকা **Redirect URL** (যেমন \`https://chatgpt.com/connector/oauth/...\`) কপি করে Manageo-এর **OAuth 2.1 Clients** ফর্মে Client তৈরি করুন এবং পাওয়া **Client ID** ও **Client Secret** ChatGPT-তে দিন।
4. Cursor বা Claude Desktop-এর জন্য নিচের **Generate MCP Key** থেকে একটি \`mgo_live_...\` কী তৈরি করে রেডি JSON কনফিগ কপি করুন।`
      : `**How to connect ChatGPT, Claude, or Cursor to Manageo MCP:**
1. Open **Settings → AI & MCP Connector** (or click the **Plug** icon inside the AI Assistant popup).
2. Copy your **MCP Server URL** (\`https://<your-domain>/api/mcp\`) — note that ChatGPT & Claude Web require a deployed public \`https://\` domain rather than \`localhost\`.
3. In ChatGPT OAuth settings:
   - If using **CIMD / DCR**, ChatGPT discovers endpoints automatically once deployed on HTTPS.
   - If using **User-Defined OAuth Client**, copy ChatGPT's Redirect URL (\`https://chatgpt.com/connector/oauth/...\`), create a client in Manageo's **OAuth 2.1 Clients** card, and paste the generated **Client ID** and **Client Secret** into ChatGPT.
4. For **Cursor / Claude Desktop**, generate an **MCP API Key** (\`mgo_live_...\`) and copy the ready-to-use config snippet from that tab.`;
  } else if (/(vault|password|otp|unlock|decrypt|ভল্ট|পাসওয়ার্ড)/i.test(q)) {
    reply = bn
      ? `**Vault পাসওয়ার্ড বা Custom Password রিসেট করার নিয়ম:**
- আপনার কোনো Vault আইটেমের **Custom Password** ভুলে গেলে **Vault** পেজে (\`/dashboard/vault\`) অথবা **Settings → Vault Security**-তে গিয়ে **Forgot Custom Password / Reset via Email OTP** অপশনে ক্লিক করুন।
- আপনার রেজিস্টার্ড ইমেইলে একটি ৬-সংখ্যার OTP যাবে—সেটি দিলে নিরাপদে নতুন Custom Password সেট করতে পারবেন।
- নিরাপত্তার কারণে Vault আইটেম সবসময় কেবল আপনার ব্যক্তিগত \`Personal\` অ্যাকাউন্টেই সীমাবদ্ধ থাকে।`
      : `**Resetting or unlocking Vault passwords:**
- If you forgot an item's **Custom Password**, open the **Vault** page (\`/dashboard/vault\`) or **Settings → Vault Security** and trigger **Reset via Email OTP**.
- Enter the 6-digit OTP sent to your registered email to restore access safely.
- Note: For strict privacy, Vault items never appear inside Team workspaces or MCP/AI tools.`;
  } else if (/(money|finance|module|sidebar|missing|hidden|নেই|দেখায় না|হাইড)/i.test(q)) {
    const teamNote =
      diag.activeWorkspaceType === "team"
        ? bn
          ? `\n- **গুরুত্বপূর্ণ:** আপনি এখন একটি **Team Workspace (${diag.activeWorkspaceName})**-এ আছেন। নিরাপত্তার স্বার্থে **Money / Finance** এবং **Vault** কেবল **Personal Workspace**-এই দেখানো হয়—সাইডবারের ওপরের Workspace Switcher থেকে Personal-এ ফিরে গেলেই এগুলো পাবেন।`
          : `\n- **Heads up:** You are currently in a **Team Workspace (${diag.activeWorkspaceName})**. For privacy, **Money / Finance** and **Vault** only appear in your **Personal Workspace**—switch back via the sidebar Workspace Switcher.`
        : "";
    const disabledNote =
      diag.disabledModules.length > 0
        ? bn
          ? `\n- আপনার অ্যাকাউন্টে এই মুহূর্তে **${diag.disabledModules.join(", ")}** মডিউলগুলো বন্ধ রয়েছে।`
          : `\n- Currently disabled in your preferences: **${diag.disabledModules.join(", ")}**.`
        : "";

    reply = bn
      ? `**সাইডবারে কোনো মডিউল না দেখালে করণীয়:**
1. **Settings → Modules** (\`/dashboard/settings?tab=personalization\`)-এ গিয়ে কাঙ্ক্ষিত মডিউলটি অন আছে কি না দেখুন।
2. **Settings → Navigation**-এ আপনার কাস্টম নেভিগেশন গ্রুপে মডিউলটি যুক্ত আছে কি না যাচাই করুন।${teamNote}${disabledNote}`
      : `**Troubleshooting missing modules in the sidebar:**
1. Open **Settings → Modules** (\`/dashboard/settings?tab=personalization\`) and ensure the module toggle is enabled.
2. Check **Settings → Navigation** (\`/dashboard/settings?tab=navigation\`) to verify how your navigation groups are arranged.${teamNote}${disabledNote}`;
  } else if (/(trash|deleted|restore|recover|ডিলিট|মুছে)/i.test(q)) {
    reply = bn
      ? `মুছে ফেলা টাস্ক, নোট বা আইটেম **৭ দিন** পর্যন্ত **Trash** (\`/dashboard/trash\`)-এ সংরক্ষিত থাকে। সেখান থেকে এক ক্লিকে **Restore** করতে পারবেন।`
      : `Deleted tasks, notes, and workspace records stay recoverable in **Trash** (\`/dashboard/trash\`) for **7 days**—you can restore them from there with one click.`;
  } else if (/(bill|upgrade|pricing|plan|refund|payment|পেমেন্ট|প্ল্যান|আপগ্রেড)/i.test(q)) {
    suggestTicket = true;
    reply = bn
      ? `**প্ল্যান ও আপগ্রেড তথ্য (বর্তমান প্ল্যান: ${diag.plan}):**
- নতুন প্ল্যান রিকোয়েস্ট করতে **Pricing** পেজে (\`/pricing\`) যান—প্ল্যাটফর্ম অ্যাডমিন রিভিউ করে আপনার আপগ্রেড অ্যাপ্রুভ করবেন।
- পেমেন্ট, ইনভয়েস বা ম্যানুয়াল অ্যাপ্রুভাল সংক্রান্ত সহায়তার জন্য নিচের **Create Ticket** বাটনে ক্লিক করে সরাসরি আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করতে পারেন।`
      : `**Plans & Upgrades (Current plan: ${diag.plan}):**
- You can request a plan upgrade directly from the **Pricing** page (\`/pricing\`), which is reviewed and approved by platform admins.
- For billing adjustments, invoices, or urgent upgrade approval, click **Create Ticket** below so our team can assist you directly.`;
  } else if (/(voice|mic|speak|ভয়েস|মাইক)/i.test(q)) {
    reply = bn
      ? `**Voice Mode ও Dictation ব্যবহারের নিয়ম:**
- ইনপুট বক্সের পাশের **Mic আইকন** আপনার কথা টেক্সট আকারে টাইপ করে দেবে (আপনি দেখে Send করতে পারবেন)।
- উইজেটের ওপরের **Waveform আইকন** হলো পূর্ণ **Hands-Free Voice Mode**—যেখানে আপনি কথা বললে AI কাজ করে সরাসরি ভয়েসে উত্তর শোনাবে। Voice Stage বা Settings-এ গিয়ে Male/Female ভয়েস, Tone এবং Speed বদলাতে পারবেন।`
      : `**Using Dictation & Hands-Free Voice Mode:**
- Tap the **Mic** icon beside the chat input for speech-to-text dictation directly into the message box.
- Tap the **Waveform** icon in the assistant header for full **Hands-Free Voice Mode** (listen + spoken replies, with Male/Female personas, tone, and speed controls).`;
  } else {
    suggestTicket =
      /(human|agent|ticket|bug|error|broken|suspended|টিকেট|সমস্যা)/i.test(q);
    reply = bn
      ? `আমি Manageo Instant Support! আপনার প্রশ্নটি আরেকটু বিস্তারিত লিখলে (যেমন: **MCP/ChatGPT কানেকশন**, **Vault OTP**, **মডিউল সেটিংস**, **Team Workspace**, বা **Voice Mode**) আমি এখনি সমাধান দিয়ে দিচ্ছি। প্রয়োজন হলে নিচের বাটন থেকে সরাসরি **Support Ticket** ও খুলতে পারবেন।`
      : `I'm **Manageo Instant Support**! Share a bit more detail about what you're trying to do (for example: **ChatGPT / MCP setup**, **missing modules**, **Vault OTP reset**, **Team workspaces**, **Voice mode**, or **Billing**), and I'll walk you through it right away—or escalate to a human specialist if needed.`;
  }

  return {
    reply,
    suggestTicket,
    ticketDraft: {
      subject: makeSubjectFromText(latestUserMessage),
      category: inferred.category,
      priority: inferred.priority,
      summary: `User inquiry: ${latestUserMessage}\n\nWorkspace context: ${diag.activeWorkspaceName || "Personal"} (${diag.activeWorkspaceType || "personal"}), Plan: ${diag.plan}`,
    },
    quickLinks,
  };
}
