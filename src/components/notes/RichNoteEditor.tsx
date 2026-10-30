"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  SquareCode,
  MoreHorizontal,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  ChevronDown,
  Eye,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface RichNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function RichNoteEditor({
  value,
  onChange,
  placeholder = "Write your note here...",
  minHeight = "160px",
  className = "",
}: RichNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const linkModalRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Undo / Redo history state
  const [history, setHistory] = useState<string[]>([value || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Dropdown states
  const [showMore, setShowMore] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Sync external value changes into history if not from internal undo/redo
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    if (value !== history[historyIndex]) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(value);
      if (newHist.length > 50) newHist.shift();
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
  }, [value, history, historyIndex]);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMore(false);
      }
      if (linkModalRef.current && !linkModalRef.current.contains(target)) {
        setShowLinkModal(false);
      }
    };
    if (showMore || showLinkModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMore, showLinkModal]);

  // Update text with history recording
  const updateContent = useCallback((newText: string, selectStart?: number, selectEnd?: number) => {
    onChange(newText);
    setTimeout(() => {
      if (textareaRef.current && selectStart !== undefined && selectEnd !== undefined) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selectStart, selectEnd);
      }
    }, 0);
  }, [onChange]);

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      onChange(history[targetIndex]);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      onChange(history[targetIndex]);
    }
  };

  // Wrap or insert inline formatting
  const applyInlineWrap = (prefix: string, suffix: string, defaultText: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;

    if (start !== end) {
      const selected = currentVal.substring(start, end);
      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);
      const newText = before + prefix + selected + suffix + after;
      updateContent(newText, start + prefix.length, end + prefix.length);
    } else {
      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);
      const newText = before + prefix + defaultText + suffix + after;
      updateContent(newText, start + prefix.length, start + prefix.length + defaultText.length);
    }
  };

  // Apply block-level prefix (headings, lists, quotes)
  const applyBlockPrefix = (prefix: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const currentVal = el.value;

    const lineStart = currentVal.lastIndexOf("\n", start - 1) + 1;
    let lineEnd = currentVal.indexOf("\n", start);
    if (lineEnd === -1) lineEnd = currentVal.length;

    const currentLine = currentVal.substring(lineStart, lineEnd);
    const cleanedLine = currentLine.replace(/^(#{1,6}\s+|- \[[ xX]\]\s+|- \s+|\d+\.\s+|> \s+)/, "");
    const newLine = prefix + cleanedLine;

    const before = currentVal.substring(0, lineStart);
    const after = currentVal.substring(lineEnd);
    const newText = before + newLine + after;

    const cursorOffset = newLine.length;
    updateContent(newText, lineStart + cursorOffset, lineStart + cursorOffset);
    setShowMore(false);
  };

  // Insert code block
  const applyCodeBlock = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;
    const selected = currentVal.substring(start, end) || "// code goes here";

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const prefix = before.endsWith("\n") || before === "" ? "" : "\n";
    const suffix = after.startsWith("\n") || after === "" ? "" : "\n";

    const snippet = `${prefix}\`\`\`javascript\n${selected}\n\`\`\`${suffix}`;
    const newText = before + snippet + after;
    updateContent(
      newText,
      start + prefix.length + 14,
      start + prefix.length + 14 + selected.length
    );
  };

  // Insert horizontal rule
  const applyHorizontalRule = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const currentVal = el.value;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(start);

    const prefix = before.endsWith("\n") || before === "" ? "" : "\n";
    const snippet = `${prefix}---\n`;
    const newText = before + snippet + after;
    updateContent(newText, start + snippet.length, start + snippet.length);
    setShowMore(false);
  };

  // Handle open Link dialog
  const handleOpenLink = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const selected = el.value.substring(el.selectionStart, el.selectionEnd);
    setLinkText(selected || "");
    setLinkUrl("https://");
    setShowLinkModal(true);
  };

  // Submit link insertion
  const handleSubmitLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const title = linkText.trim() || linkUrl.trim() || "link";
    const url = linkUrl.trim() || "https://";
    const mdLink = `[${title}](${url})`;
    const newText = before + mdLink + after;

    updateContent(newText, start + mdLink.length, start + mdLink.length);
    setShowLinkModal(false);
    setLinkText("");
    setLinkUrl("");
  };

  // Keyboard shortcut handlers (Ctrl+B, Ctrl+I, Ctrl+Z, Ctrl+Y)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        applyInlineWrap("**", "**", "bold text");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        applyInlineWrap("*", "*", "italic text");
      } else if (e.key === "z" || e.key === "Z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-surface-container-high bg-surface-container-high/40 relative transition-all focus-within:border-stitch-primary/50 focus-within:ring-1 focus-within:ring-stitch-primary/30 ${className}`}
    >
      {/* Rich Text Toolbar */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-surface-container border-b border-surface-container-high select-none rounded-t-2xl relative z-20">
        {/* Left Scrollable Formatting Actions */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 min-w-0">
          {/* 1. Undo Button */}
          <button
            type="button"
            disabled={historyIndex <= 0 || activeTab === "preview"}
            onClick={handleUndo}
            className="shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 2. Redo Button */}
          <button
            type="button"
            disabled={historyIndex >= history.length - 1 || activeTab === "preview"}
            onClick={handleRedo}
            className="shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest shrink-0 mx-0.5" />

          {/* 3. Normal / Heading Native-Styled Dropdown */}
          <div className="relative inline-flex items-center shrink-0">
            <select
              disabled={activeTab === "preview"}
              onChange={(e) => {
                applyBlockPrefix(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="appearance-none bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface text-xs font-medium pl-2.5 pr-6 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-stitch-primary cursor-pointer transition-colors border border-surface-variant/30 disabled:opacity-40"
              title="Heading style"
            >
              <option value="" className="bg-surface-container text-on-surface">Normal</option>
              <option value="# " className="bg-surface-container text-on-surface font-bold">Heading 1</option>
              <option value="## " className="bg-surface-container text-on-surface font-bold">Heading 2</option>
              <option value="### " className="bg-surface-container text-on-surface font-semibold">Heading 3</option>
            </select>
            <ChevronDown className="w-3 h-3 text-on-surface-variant pointer-events-none absolute right-1.5" />
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest shrink-0 mx-0.5" />

          {/* 4. Bold Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={() => applyInlineWrap("**", "**", "bold text")}
            className="shrink-0 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors font-bold text-xs"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 5. Italic Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={() => applyInlineWrap("*", "*", "italic text")}
            className="shrink-0 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors italic text-xs"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest shrink-0 mx-0.5" />

          {/* 6. Link Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={handleOpenLink}
            className="shrink-0 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 7. Inline Code Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={() => applyInlineWrap("`", "`", "code")}
            className="shrink-0 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors font-mono"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 8. Code Block Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={applyCodeBlock}
            className="shrink-0 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
            title="Code Block"
          >
            <SquareCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Right Section: 3-Dots Menu & Write/Preview Toggle */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest shrink-0 mx-0.5" />

          {/* 9. More Options Dropdown (Placed OUTSIDE overflow-x-auto so it NEVER clips!) */}
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              type="button"
              disabled={activeTab === "preview"}
              onClick={(e) => {
                e.stopPropagation();
                setShowMore((prev) => !prev);
              }}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                showMore
                  ? "bg-surface-container-high text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
              title="More formatting"
            >
              <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {showMore && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full right-0 mt-1.5 w-48 bg-surface-container border border-surface-variant/50 rounded-xl shadow-2xl p-1 z-50 space-y-0.5 animate-in fade-in zoom-in-95"
              >
                <button
                  type="button"
                  onClick={() => {
                    applyInlineWrap("~~", "~~", "strikethrough");
                    setShowMore(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                >
                  <Strikethrough className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Strikethrough</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("- ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                >
                  <List className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Bullet List</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("1. ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Numbered List</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("- [ ] ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Task Checklist</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("> ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                >
                  <Quote className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Quote</span>
                </button>

                <button
                  type="button"
                  onClick={applyHorizontalRule}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Divider Line</span>
                </button>
              </div>
            )}
          </div>

          {/* Write / Preview Mode Switcher */}
          <div className="flex items-center gap-1 bg-surface-container-high p-0.5 rounded-lg shrink-0 ml-1">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === "write"
                  ? "bg-stitch-primary text-black font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Edit mode"
            >
              <Edit3 className="w-3 h-3" />
              <span className="hidden xs:inline">Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-stitch-primary text-black font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Preview rendered markdown"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden xs:inline">Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-4 bg-transparent text-on-surface text-sm focus:outline-none transition-all resize-y leading-relaxed font-sans placeholder:text-on-surface-variant/40 rounded-b-2xl block border-0"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full p-4 overflow-y-auto bg-surface-container/20 text-on-surface rounded-b-2xl"
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-xs text-on-surface-variant/50 italic">Nothing to preview...</p>
          )}
        </div>
      )}

      {/* Floating Insert Link Modal Dialog */}
      {showLinkModal && (
        <div
          ref={linkModalRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-12 left-3 right-3 sm:left-auto sm:right-6 sm:w-80 bg-surface-container border border-surface-variant/50 shadow-2xl rounded-2xl p-3.5 z-50 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-stitch-primary" /> Insert Link
            </span>
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <form onSubmit={handleSubmitLink} className="space-y-2.5">
            <div>
              <label className="text-[10px] text-on-surface-variant font-medium block mb-1">Display Text</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. My Website"
                className="w-full h-8 px-2.5 rounded-lg bg-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-stitch-primary border border-surface-variant/30"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] text-on-surface-variant font-medium block mb-1">Target URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full h-8 px-2.5 rounded-lg bg-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-stitch-primary border border-surface-variant/30"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-2.5 py-1 text-xs text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-stitch-primary text-black font-semibold text-xs rounded-lg hover:opacity-90 transition-colors flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3 h-3" />
                <span>Insert</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
