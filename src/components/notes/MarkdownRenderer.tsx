"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  // Split into lines to parse block structures
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code blocks (```)
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const codeString = codeLines.join("\n");
      elements.push(
        <CodeBlock key={`code-${i}`} code={codeString} language={language} />
      );
      continue;
    }

    // 2. Horizontal Rule (---, ***, ___)
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      elements.push(
        <hr key={`hr-${i}`} className="my-4 border-surface-container-highest" />
      );
      i++;
      continue;
    }

    // 3. Headings (#, ##, ###, ####)
    if (/^#{1,6}\s/.test(line)) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const inlineNode = parseInlineMarkdown(text);
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${i}`} className="text-xl sm:text-2xl font-bold text-on-surface mt-4 mb-2">
              {inlineNode}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${i}`} className="text-lg sm:text-xl font-bold text-on-surface mt-3.5 mb-1.5">
              {inlineNode}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={`h3-${i}`} className="text-base sm:text-lg font-bold text-on-surface mt-3 mb-1">
              {inlineNode}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={`h4-${i}`} className="text-sm sm:text-base font-semibold text-on-surface mt-2.5 mb-1">
              {inlineNode}
            </h4>
          );
        }
        i++;
        continue;
      }
    }

    // 4. Blockquotes (> )
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-stitch-primary/70 bg-surface-container/40 pl-3.5 py-1.5 my-2.5 rounded-r-lg italic text-on-surface-variant text-sm"
        >
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{parseInlineMarkdown(ql)}</div>
          ))}
        </blockquote>
      );
      continue;
    }

    // 5. Checklist items (- [ ] or - [x])
    if (/^[-*]\s+\[([ xX])\]\s/.test(line)) {
      const taskListItems: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+\[([ xX])\]\s/.test(lines[i])) {
        const m = lines[i].match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
        if (m) {
          const isChecked = m[1].toLowerCase() === "x";
          const itemText = m[2];
          taskListItems.push(
            <li key={`task-${i}`} className="flex items-start gap-2 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={isChecked}
                readOnly
                className="mt-1 w-4 h-4 rounded text-stitch-primary accent-stitch-primary cursor-default shrink-0"
              />
              <span className={isChecked ? "line-through text-on-surface-variant/70" : "text-on-surface"}>
                {parseInlineMarkdown(itemText)}
              </span>
            </li>
          );
        }
        i++;
      }
      elements.push(
        <ul key={`tasks-${i}`} className="space-y-1.5 my-2">
          {taskListItems}
        </ul>
      );
      continue;
    }

    // 6. Bullet lists (- or *)
    if (/^[-*]\s+/.test(line)) {
      const bulletItems: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i]) && !/^[-*]\s+\[([ xX])\]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*]\s+/, "");
        bulletItems.push(
          <li key={`bullet-${i}`} className="text-sm leading-relaxed text-on-surface">
            {parseInlineMarkdown(itemText)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 pl-1">
          {bulletItems}
        </ul>
      );
      continue;
    }

    // 7. Numbered lists (1. 2. etc.)
    if (/^\d+\.\s+/.test(line)) {
      const numItems: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, "");
        numItems.push(
          <li key={`num-${i}`} className="text-sm leading-relaxed text-on-surface">
            {parseInlineMarkdown(itemText)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-2 pl-1">
          {numItems}
        </ol>
      );
      continue;
    }

    // 8. Empty line -> space
    if (line.trim() === "") {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 9. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-on-surface my-1">
        {parseInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

/**
 * Parses inline elements: **bold**, *italic*, ~~strikethrough~~, `code`, and [link](url)
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return "";

  // Regular expression to match markdown inline formats
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-on-surface">
          {parseInlineMarkdown(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-on-surface">
          {parseInlineMarkdown(part.slice(1, -1))}
        </em>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={index} className="line-through text-on-surface-variant/75">
          {parseInlineMarkdown(part.slice(2, -2))}
        </del>
      );
    }

    // Inline Code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-surface-container-highest text-stitch-primary font-mono text-xs border border-surface-container-high"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link: [title](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      return (
        <a
          key={index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-stitch-primary hover:text-primary-fixed underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
        >
          {linkText}
        </a>
      );
    }

    // Plain text chunk
    return part;
  });
}

/**
 * Code Block with syntax tag and one-click copy button
 */
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-3 rounded-xl border border-surface-container-high bg-surface-container-low overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-surface-container border-b border-surface-container-high text-xs">
        <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-stitch-primary transition-colors py-0.5 px-1.5 rounded"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-on-surface leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

