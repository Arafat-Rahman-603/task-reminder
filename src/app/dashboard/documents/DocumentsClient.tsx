"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Edit3,
  Search,
  X,
  HardDrive,

  AlertCircle,
  Calendar,
  Plus,

  Grid,
  List,
  Loader2,



  Eye,

} from "lucide-react";
import {

  deleteDocument,
  updateDocument,
  getStorageUsage,
  StorageUsageResult,
} from "@/actions/document.actions";
import { formatBytes } from "@/lib/formatBytes";

import { formatDate } from "@/lib/dateUtils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FilePreviewModal } from "@/components/ui/FilePreviewModal";
import { useUpload } from "@/context/UploadContext";

export interface DocumentItem {
  _id: string;
  userId: string;
  workspaceId?: string | null;
  title: string;
  category: 'General' | 'Finance' | 'Legal' | 'Work' | 'Personal' | 'Medical' | 'Other';
  fileUrl: string;
  publicId?: string;
  resourceType?: string;
  originalFilename?: string;
  mimeType?: string;
  sizeBytes: number;
  sizeFormatted: string;
  expiryDate?: string | null;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentsClientProps {
  initialDocuments: DocumentItem[];
  initialStorage: StorageUsageResult;
}

const CATEGORIES = [
  "All",
  "General",
  "Finance",
  "Legal",
  "Work",
  "Personal",
  "Medical",
  "Other",
] as const;

export default function DocumentsClient({
  initialDocuments,
  initialStorage,
}: DocumentsClientProps) {
  const { startDocumentUpload } = useUpload();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [storage, setStorage] = useState<StorageUsageResult>(initialStorage);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Real-time synchronization when background uploads finish
  React.useEffect(() => {
    const handleUploaded = (e: Event) => {
      const customEvt = e as CustomEvent<{ document: DocumentItem }>;
      const doc = customEvt.detail?.document;
      if (doc && doc._id) {
        setDocuments((prev) => {
          if (prev.some((d) => d._id === doc._id)) return prev;
          return [doc, ...prev];
        });
        getStorageUsage().then(setStorage).catch(console.error);
      }
    };

    window.addEventListener("manageo:document-uploaded", handleUploaded);
    return () => {
      window.removeEventListener("manageo:document-uploaded", handleUploaded);
    };
  }, []);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<DocumentItem["category"]>("General");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<DocumentItem["category"]>("General");
  const [editNotes, setEditNotes] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editError, setEditError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCat =
        selectedCategory === "All" || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.originalFilename && doc.originalFilename.toLowerCase().includes(q)) ||
        (doc.notes && doc.notes.toLowerCase().includes(q)) ||
        (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesCat && matchesQuery;
    });
  }, [documents, selectedCategory, searchQuery]);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError("");
      // Pre-fill title without extension
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      if (!uploadTitle) {
        setUploadTitle(nameWithoutExt);
      }
      if (file.type.startsWith("image/")) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  // Upload submission (non-blocking background stream with live percentage)
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Please provide a title for the document.");
      return;
    }

    // Check quota locally first
    if (storage.usedBytes + selectedFile.size > storage.maxBytes) {
      setUploadError(
        `File size (${formatBytes(selectedFile.size)}) exceeds remaining cloud quota. Please upgrade to Professional for 5 GB storage.`
      );
      return;
    }

    // Queue streaming upload to background manager
    startDocumentUpload(selectedFile, {
      title: uploadTitle.trim(),
      category: uploadCategory,
      notes: uploadNotes.trim() || undefined,
      expiryDate: uploadExpiry || undefined,
      tags: uploadTags
        ? uploadTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });

    // Reset form and close modal immediately so user can freely navigate and do other work!
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setUploadTitle("");
    setUploadCategory("General");
    setUploadNotes("");
    setUploadExpiry("");
    setUploadTags("");
    setUploadError("");
    setIsUploadOpen(false);
  };

  // Open Edit Modal
  const openEdit = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditNotes(doc.notes || "");
    setEditExpiry(doc.expiryDate ? doc.expiryDate.split("T")[0] : "");
    setEditTags(doc.tags ? doc.tags.join(", ") : "");
    setEditError("");
  };

  // Save Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editTitle.trim()) {
      setEditError("Title cannot be empty.");
      return;
    }

    setIsEditing(true);
    setEditError("");

    try {
      const res = await updateDocument(editingDoc._id, {
        title: editTitle.trim(),
        category: editCategory,
        notes: editNotes.trim(),
        expiryDate: editExpiry ? editExpiry : null,
        tags: editTags
          ? editTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      });

      if (!res.success || !res.document) {
        setEditError(res.error || "Failed to update document.");
        setIsEditing(false);
        return;
      }

      setDocuments((prev) =>
        prev.map((d) => (d._id === editingDoc._id ? { ...d, ...res.document } : d))
      );
      setEditingDoc(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update document.");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    startTransition(async () => {
      const res = await deleteDocument(deletingDoc._id);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== deletingDoc._id));
        const freshStorage = await getStorageUsage();
        setStorage(freshStorage);
        setDeletingDoc(null);
      } else {
        alert(res.error || "Failed to delete document.");
      }
    });
  };

  // Get download / preview link
  const getDocHref = (doc: DocumentItem) => {
    if (doc.publicId) {
      return `/api/assets/${doc.publicId}?resourceType=${doc.resourceType || "raw"}`;
    }
    return doc.fileUrl;
  };

  return (
    <div className="space-y-6">
      {/* ─── Storage Overview Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stitch-surface to-surface-container-high border border-surface-variant/40 p-6 shadow-xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-stitch-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 text-stitch-primary shrink-0">
                  <HardDrive className="w-5 h-5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white whitespace-normal">
                  Documents &amp; Cloud Storage
                </h1>
              </div>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border whitespace-nowrap shrink-0",
                  storage.planType === "pro"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                    : storage.planType === "enterprise"
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                    : "bg-surface-variant/50 text-slate-300 border-surface-variant"
                )}
              >
                {storage.planName} Plan ({storage.maxFormatted})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Securely store, organize, and access your digital assets, contracts, financial records, and personal documents with AES-256 cloud encryption.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 pt-1 lg:pt-0">
            {storage.planType === "free" && (
              <Link
                href="/pricing"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/30 transition-all shadow-sm whitespace-nowrap shrink-0"
              >
                <span>Upgrade to Pro (5 GB)</span>
              </Link>
            )}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-sky-200 text-slate-950 shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Storage Bar Meter */}
        <div className="mt-6 pt-5 border-t border-surface-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mb-2 font-medium">
            <span className="text-slate-300">
              Used <strong className="text-white font-bold">{storage.usedFormatted}</strong> of{" "}
              <strong className="text-stitch-primary font-bold">{storage.maxFormatted}</strong>
            </span>
            <span className="text-slate-400 font-mono text-left sm:text-right">
              {storage.percentUsed}% full &bull; {storage.totalDocuments} {storage.totalDocuments === 1 ? "File" : "Files"}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-black/40 border border-white/5 overflow-hidden p-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                storage.percentUsed > 90
                  ? "bg-gradient-to-r from-red-500 to-rose-400"
                  : storage.percentUsed > 70
                  ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                  : "bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-400"
              )}
              style={{ width: `${Math.max(1, storage.percentUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Search, Filters & View Toggle ─── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border",
                selectedCategory === cat
                  ? "bg-stitch-primary text-slate-950 font-semibold border-stitch-primary shadow-sm shadow-sky-500/20"
                  : "bg-stitch-surface/60 text-slate-400 border-surface-variant/30 hover:bg-surface-variant/30 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-stitch-surface/80 border border-surface-variant/40 text-white placeholder-slate-500 focus:outline-none focus:border-stitch-primary/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-stitch-surface border border-surface-variant/40 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "grid"
                  ? "bg-surface-variant text-stitch-primary"
                  : "text-slate-400 hover:text-white"
              )}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "list"
                  ? "bg-surface-variant text-stitch-primary"
                  : "text-slate-400 hover:text-white"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Documents Display ─── */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-stitch-surface/40 border border-surface-variant/30 min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary mb-4 shadow-lg shadow-sky-500/5">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {searchQuery || selectedCategory !== "All"
              ? "No matching documents found"
              : "No documents stored yet"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your category filter or search query to find your files."
              : "Upload PDFs, receipts, deeds, contracts, warranties, and assets directly to your cloud storage."}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-stitch-primary text-slate-950 hover:bg-sky-300 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Your First Document</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="group relative flex flex-col justify-between rounded-xl bg-stitch-surface/80 hover:bg-stitch-surface border border-surface-variant/30 hover:border-surface-variant/60 p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
            >
              <div>
                {/* Top bar with Category & Actions */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-variant/50 text-slate-300 border border-surface-variant">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-stitch-primary hover:bg-stitch-primary/10 transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* File Title & Icon */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="flex items-start gap-3 mb-2 cursor-pointer group/title"
                  title="Click to preview document"
                >
                  <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0 group-hover/title:bg-stitch-primary/20 group-hover/title:border-stitch-primary/40 group-hover/title:scale-105 transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate group-hover/title:text-stitch-primary transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate font-mono">
                      {doc.originalFilename || doc.title}
                    </p>
                  </div>
                </div>

                {/* Optional Notes */}
                {doc.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-2 bg-black/20 p-2 rounded-lg border border-white/5">
                    {doc.notes}
                  </p>
                )}

                {/* Expiry Warning */}
                {doc.expiryDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-1 rounded-md mb-2 border border-amber-500/20">
                    <Calendar className="w-3 h-3" />
                    <span suppressHydrationWarning>Expires: {formatDate(doc.expiryDate)}</span>
                  </div>
                )}

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom footer */}
              <div className="pt-3 mt-3 border-t border-surface-variant/20 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-slate-300 font-medium">
                  {doc.sizeFormatted}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stitch-primary/15 hover:bg-stitch-primary/25 text-stitch-primary font-semibold border border-stitch-primary/30 transition-all shadow-sm"
                    title="Preview Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <a
                    href={getDocHref(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Direct Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List / Table View */
        <div className="overflow-x-auto rounded-2xl bg-stitch-surface/80 border border-surface-variant/30 shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-high/60 border-b border-surface-variant/30 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20 text-slate-300">
              {filteredDocuments.map((doc) => (
                <tr key={doc._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-[220px]">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                          {doc.originalFilename || doc.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-variant/50 text-slate-300 border border-surface-variant">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{doc.sizeFormatted}</td>
                  <td className="py-3 px-4">
                    {doc.expiryDate ? (
                      <span className="text-amber-400 text-[11px]" suppressHydrationWarning>
                        {formatDate(doc.expiryDate)}
                      </span>
                    ) : (
                      <span className="text-slate-500">&mdash;</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400" suppressHydrationWarning>
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-stitch-primary bg-stitch-primary/10 hover:bg-stitch-primary/20 transition-colors text-xs font-semibold"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={getDocHref(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Download / Open"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => openEdit(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Upload Modal ─── */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-stitch-surface border border-surface-variant/50 shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[min(88dvh,750px)] my-auto overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant/30 bg-stitch-surface/95 backdrop-blur-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-stitch-primary" />
                <h3 className="text-base font-bold text-white">Upload to Cloud Storage</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
                {uploadError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select File (Documents, PDFs, Images, Records)
                  </label>
                  <div className="relative border-2 border-dashed border-surface-variant/60 hover:border-stitch-primary/60 rounded-xl p-3 sm:p-4 text-center transition-colors bg-black/20">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-3 text-left">
                        {filePreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={filePreviewUrl}
                            alt="Selected preview"
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl shrink-0 border border-stitch-primary/40 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                            {formatBytes(selectedFile.size)} &bull; {selectedFile.type || "file"}
                          </p>
                          <span className="inline-block text-[10px] text-stitch-primary font-medium mt-1 hover:underline">
                            Click or drag to replace file
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2">
                        <UploadCloud className="w-7 h-7 text-slate-400 mb-1.5" />
                        <p className="text-xs font-medium text-white">
                          Click or drag &amp; drop to upload
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                          PDF, DOCX, XLSX, PNG, JPG, ZIP (Available:{" "}
                          {formatBytes(Math.max(0, storage.maxBytes - storage.usedBytes))})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Passport Scan, Tax Report"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white placeholder-slate-500 focus:outline-none focus:border-stitch-primary/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as DocumentItem['category'])}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c} className="bg-stitch-surface text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Expiry Date & Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={uploadExpiry}
                      onChange={(e) => setUploadExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g. 2026, tax, legal"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white placeholder-slate-500 focus:outline-none focus:border-stitch-primary/60"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Add any relevant reference or description..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white placeholder-slate-500 focus:outline-none focus:border-stitch-primary/60"
                  />
                </div>

                {/* Background Upload notice */}
                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-stitch-primary/10 border border-stitch-primary/25 text-xs text-stitch-primary">
                  <UploadCloud className="w-4 h-4 shrink-0 mt-0.5 text-stitch-primary animate-pulse" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">Non-blocking Background Upload</p>
                    <p className="text-[11px] text-slate-300">
                      Upload runs in the background dock with real-time percentage and speed. You can close this modal and use the app freely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 px-5 py-3.5 border-t border-surface-variant/30 bg-surface-container-high/60 backdrop-blur-sm z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-stitch-primary hover:bg-sky-300 text-slate-950 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Start Background Upload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Details Modal ─── */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-stitch-surface border border-surface-variant/50 shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[min(88dvh,750px)] my-auto overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant/30 bg-stitch-surface/95 backdrop-blur-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-stitch-primary" />
                <h3 className="text-base font-bold text-white">Edit Document Details</h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
                {editError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as DocumentItem['category'])}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c} className="bg-stitch-surface text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editExpiry}
                      onChange={(e) => setEditExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-surface-variant/40 text-white focus:outline-none focus:border-stitch-primary/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 sm:gap-3 px-5 py-3.5 border-t border-surface-variant/30 bg-surface-container-high/60 backdrop-blur-sm z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-stitch-primary hover:bg-sky-300 text-slate-950 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-stitch-surface border border-surface-variant/50 shadow-2xl p-6 text-center my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Delete Document?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">&ldquo;{deletingDoc.title}&rdquo;</strong>? This will permanently remove the file from cloud storage and free up {deletingDoc.sizeFormatted}.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={isPending}
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/20"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Document Preview Modal ─── */}
      <FilePreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        file={
          previewDoc
            ? {
                title: previewDoc.title,
                url: getDocHref(previewDoc),
                originalFilename: previewDoc.originalFilename,
                mimeType: previewDoc.mimeType,
                resourceType: previewDoc.resourceType,
                sizeFormatted: previewDoc.sizeFormatted,
                category: previewDoc.category,
                createdAt: previewDoc.createdAt,
                notes: previewDoc.notes,
                tags: previewDoc.tags,
              }
            : null
        }
      />
    </div>
  );
}
