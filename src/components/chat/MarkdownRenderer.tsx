'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = language.trim() || 'plaintext';

  return (
    <div className="my-3 rounded-xl border border-slate-700/60 bg-slate-950 overflow-hidden text-xs shadow-lg font-mono">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {displayLang}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <pre className="m-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// Inline formatting parser: bold, italic, code, links
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={`inline-code-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded-md font-mono text-[11px] bg-slate-200/80 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Bold text: **bold** or __bold__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-bold text-slate-900 dark:text-white">
          {parseInline(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Italic text: *italic* or _italic_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch && !remaining.startsWith('**') && !remaining.startsWith('__')) {
      parts.push(
        <em key={`italic-${keyIndex++}`} className="italic">
          {parseInline(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 4. Markdown links: [text](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 dark:text-cyan-400 underline underline-offset-2 hover:text-cyan-500 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Standard plain character chunk up to next special syntax
    const nextSpecial = remaining.search(/[`*_\[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Split content into blocks: code blocks, tables, lists, headings, and paragraphs
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;
  let elementIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Fenced Code Block: ```lang
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <CodeBlock
          key={`code-block-${elementIndex++}`}
          language={language}
          code={codeLines.join('\n')}
        />
      );
      continue;
    }

    // 2. Markdown Table Detection: lines starting and ending with |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        const isDelimiter = tableLines[1].includes('---');
        const dataRows = (isDelimiter ? tableLines.slice(2) : tableLines.slice(1)).map((rowStr) =>
          rowStr
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div key={`table-${elementIndex++}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold">
                <tr>
                  {headerRow.map((head, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 whitespace-nowrap">
                      {parseInline(head)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/60">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${elementIndex++}`} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${elementIndex++}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-4 mb-1.5 border-b border-slate-200/60 dark:border-slate-800 pb-1">
          {parseInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${elementIndex++}`} className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-4 mb-2">
          {parseInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // 4. Blockquotes
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${elementIndex++}`} className="my-2 pl-3.5 border-l-3 border-cyan-500 text-xs italic text-slate-600 dark:text-slate-400 bg-cyan-500/5 py-1 rounded-r-lg">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // 5. Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(
        <hr key={`hr-${elementIndex++}`} className="my-3 border-slate-200 dark:border-slate-800" />
      );
      i++;
      continue;
    }

    // 6. Unordered List Items: - or *
    if (line.trim().match(/^[-*]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${elementIndex++}`} className="my-2 space-y-1 list-disc list-inside text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="pl-1">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. Ordered List Items: 1. 2. etc.
    if (line.trim().match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${elementIndex++}`} className="my-2 space-y-1 list-decimal list-inside text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="pl-1">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 8. Normal Paragraphs
    if (line.trim() === '') {
      i++;
      continue;
    }

    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().match(/^[-*]\s+/) &&
      !lines[i].trim().match(/^\d+\.\s+/)
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={`p-${elementIndex++}`} className="my-1.5 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {parseInline(paragraphLines.join(' '))}
      </p>
    );
  }

  return <div className="space-y-1 text-xs sm:text-sm">{elements}</div>;
}
