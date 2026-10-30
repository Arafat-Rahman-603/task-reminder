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
  Check
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
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Undo / Redo history state
  const [history, setHistory] = useState<string[]>([value || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Dropdown states
  const [showHeadings, setShowHeadings] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes into history if not from internal undo/redo
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    if (value !== history[historyIndex]) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(value);
      // Limit history to 50 steps
      if (newHist.length > 50) newHist.shift();
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
  }, [value, history, historyIndex]);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowHeadings(false);
        setShowMore(false);
        setShowLinkModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const end = el.selectionEnd;
    const currentVal = el.value;

    // Find the start of the current line
    const lastNewline = currentVal.lastIndexOf("\n", start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const before = currentVal.substring(0, lineStart);
    const after = currentVal.substring(lineStart);

    // If already starts with prefix, remove it
    if (after.startsWith(prefix)) {
      const newText = before + after.substring(prefix.length);
      updateContent(newText, Math.max(0, start - prefix.length), Math.max(0, end - prefix.length));
    } else {
      // Remove any other existing heading prefix first if applying a heading
      let cleanedAfter = after;
      if (prefix.startsWith("#")) {
        cleanedAfter = after.replace(/^#{1,6}\s+/, "");
      }
      const newText = before + prefix + cleanedAfter;
      updateContent(newText, start + prefix.length, end + prefix.length);
    }
    setShowHeadings(false);
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
    setLinkText(selected || "link text");
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
    const mdLink = `[${linkText || "link"}](${linkUrl || "https://"})`;
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
      className={`rounded-2xl border border-surface-container-high bg-surface-container-high/40 overflow-hidden focus-within:border-stitch-primary/50 focus-within:ring-1 focus-within:ring-stitch-primary/30 transition-all ${className}`}
    >
      {/* Rich Text Toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 bg-surface-container border-b border-surface-container-high select-none relative">
        {/* Left Toolbar Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none py-0.5">
          {/* 1. Undo Button */}
          <button
            type="button"
            disabled={historyIndex <= 0 || activeTab === "preview"}
            onClick={handleUndo}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 2. Redo Button */}
          <button
            type="button"
            disabled={historyIndex >= history.length - 1 || activeTab === "preview"}
            onClick={handleRedo}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest mx-1 shrink-0" />

          {/* 3. Normal / Heading Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={activeTab === "preview"}
              onClick={() => {
                setShowHeadings(!showHeadings);
                setShowMore(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
              title="Heading style"
            >
              <span>Normal</span>
              <ChevronDown className="w-3 h-3 text-on-surface-variant" />
            </button>

            {showHeadings && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-surface-container-high border border-surface-container-highest rounded-xl shadow-xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => applyBlockPrefix("")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container font-normal transition-colors"
                >
                  Normal (Body)
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockPrefix("# ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm text-on-surface hover:bg-surface-container font-bold transition-colors"
                >
                  Heading 1
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockPrefix("## ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container font-bold transition-colors"
                >
                  Heading 2
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockPrefix("### ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container font-semibold transition-colors"
                >
                  Heading 3
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest mx-1 shrink-0" />

          {/* 4. Bold Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={() => applyInlineWrap("**", "**", "bold text")}
            className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors font-bold text-xs"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 5. Italic Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={() => applyInlineWrap("*", "*", "italic text")}
            className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors italic text-xs"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest mx-1 shrink-0" />

          {/* 6. Link Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={handleOpenLink}
            className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 7. Inline Code Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={() => applyInlineWrap("`", "`", "code")}
            className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors font-mono"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 8. Code Block Button */}
          <button
            type="button"
            disabled={activeTab === "preview"}
            onClick={applyCodeBlock}
            className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
            title="Code Block"
          >
            <SquareCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-surface-container-highest mx-1 shrink-0" />

          {/* 9. More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={activeTab === "preview"}
              onClick={() => {
                setShowMore(!showMore);
                setShowHeadings(false);
              }}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
              title="More formatting"
            >
              <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {showMore && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-surface-container-high border border-surface-container-highest rounded-xl shadow-xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    applyInlineWrap("~~", "~~", "strikethrough");
                    setShowMore(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <Strikethrough className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Strikethrough</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("- ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <List className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Bullet List</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("1. ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Numbered List</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("- [ ] ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Checklist</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyBlockPrefix("> ")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <Quote className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Quote</span>
                </button>

                <button
                  type="button"
                  onClick={applyHorizontalRule}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Divider Line</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Toggle: Write vs Preview */}
        <div className="flex items-center gap-1 bg-surface-container-high p-0.5 rounded-lg shrink-0 ml-2">
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

      {/* Editor Body */}
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-4 bg-transparent text-on-surface text-sm focus:outline-none transition-all resize-y leading-relaxed font-sans placeholder:text-on-surface-variant/40"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full p-4 overflow-y-auto bg-surface-container/20 text-on-surface"
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-xs text-on-surface-variant/50 italic">Nothing to preview...</p>
          )}
        </div>
      )}

      {/* Insert Link Dialog Popup */}
      {showLinkModal && (
        <div className="p-3 bg-surface-container border-t border-surface-container-high animate-in fade-in">
          <form onSubmit={handleSubmitLink} className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link title"
              className="h-8 px-2.5 rounded-lg bg-surface-container-high text-xs text-on-surface flex-1 w-full focus:outline-none focus:ring-1 focus:ring-stitch-primary"
              required
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-8 px-2.5 rounded-lg bg-surface-container-high text-xs text-on-surface flex-1 w-full focus:outline-none focus:ring-1 focus:ring-stitch-primary"
              required
            />
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="submit"
                className="h-8 px-3 rounded-lg bg-stitch-primary text-black text-xs font-semibold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insert</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="h-8 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

