import React, { useState } from "react";
import { Sparkles, HelpCircle, Copy, Check, Download } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  theme?: "light" | "dark";
}

// Map language to extension
function getExtension(lang: string): string {
  const l = lang.toLowerCase().trim();
  if (l === "python" || l === "py") return "py";
  if (l === "javascript" || l === "js") return "js";
  if (l === "typescript" || l === "ts") return "ts";
  if (l === "html") return "html";
  if (l === "css") return "css";
  if (l === "java") return "java";
  if (l === "cpp" || l === "c++") return "cpp";
  if (l === "c") return "c";
  if (l === "sql") return "sql";
  if (l === "json") return "json";
  if (l === "bash" || l === "sh") return "sh";
  return "txt";
}

// Light tokenizer for multi-language syntax highlighting in React
function highlightCode(code: string, language: string): React.ReactNode[] {
  const lang = language.toLowerCase().trim();
  const lines = code.split("\n");

  const isHashComment = lang === "python" || lang === "py" || lang === "bash" || lang === "sh";
  const isHyphenComment = lang === "sql";

  return lines.map((line, lineIndex) => {
    if (!line) {
      // Empty line preserved
      return (
        <span key={lineIndex} className="block min-h-[1.25rem] select-all">
          {"\n"}
        </span>
      );
    }

    const elements: React.ReactNode[] = [];
    let i = 0;
    const n = line.length;

    const addSpan = (text: string, styleClass: string, key: string) => {
      elements.push(
        <span key={key} className={styleClass}>
          {text}
        </span>
      );
    };

    while (i < n) {
      const char = line[i];

      // 1. Comment checking
      if (isHashComment && char === "#") {
        addSpan(line.substring(i), "text-slate-500 italic", `comment-${i}`);
        break;
      }
      if (isHyphenComment && char === "-" && line[i + 1] === "-") {
        addSpan(line.substring(i), "text-slate-500 italic", `comment-${i}`);
        break;
      }
      if (!isHashComment && !isHyphenComment && char === "/" && line[i + 1] === "/") {
        addSpan(line.substring(i), "text-slate-500 italic", `comment-${i}`);
        break;
      }

      // 2. String checking
      if (char === '"' || char === "'" || char === "`") {
        const quoteChar = char;
        const start = i;
        i++;
        while (i < n && line[i] !== quoteChar) {
          if (line[i] === "\\" && i + 1 < n) {
            i += 2;
          } else {
            i++;
          }
        }
        if (i < n) {
          i++;
        }
        addSpan(line.substring(start, i), "text-emerald-400 font-medium", `str-${start}`);
        continue;
      }

      // 3. Number checking
      const lastChar = i > 0 ? line[i - 1] : "";
      const isWordChar = (c: string) => /[a-zA-Z0-9_]/.test(c);
      if (/[0-9]/.test(char) && !isWordChar(lastChar)) {
        const start = i;
        while (i < n && /[0-9.]/.test(line[i])) {
          i++;
        }
        addSpan(line.substring(start, i), "text-amber-400 font-semibold", `num-${start}`);
        continue;
      }

      // 4. Identifiers or Keywords checking
      if (/[a-zA-Z_$]/.test(char)) {
        const start = i;
        while (i < n && /[a-zA-Z0-9_$]/.test(line[i])) {
          i++;
        }
        const token = line.substring(start, i);

        const isKeyword = (word: string) => {
          const common = [
            "if", "else", "for", "while", "return", "break", "continue",
            "switch", "case", "default", "try", "catch", "finally", "throw",
            "import", "class", "extends", "new", "this", "super", "null",
            "true", "false", "void", "const", "let", "var", "function",
            "export", "from", "in", "of", "and", "or", "not", "is", "def",
            "elif", "except", "with", "as", "lambda", "yield", "pass",
            "select", "from", "where", "insert", "into", "values", "update",
            "set", "delete", "join", "on", "group", "by", "order", "having",
            "limit", "create", "table", "alter", "drop", "index", "view"
          ];
          return common.includes(word.toLowerCase());
        };

        const isBuiltin = (word: string) => {
          const common = [
            "int", "float", "double", "char", "boolean", "long", "short", "byte",
            "string", "number", "boolean", "any", "unknown", "never", "print",
            "console", "log", "len", "range", "input", "str", "list", "dict",
            "set", "tuple", "map", "filter", "math", "sys", "os", "json"
          ];
          return common.includes(word.toLowerCase());
        };

        if (isKeyword(token)) {
          addSpan(token, "text-pink-400 font-bold", `kw-${start}`);
        } else if (isBuiltin(token)) {
          addSpan(token, "text-sky-400 font-semibold", `builtin-${start}`);
        } else if (line[i] === "(") {
          addSpan(token, "text-violet-300 font-medium", `func-${start}`);
        } else {
          addSpan(token, "text-slate-100", `ident-${start}`);
        }
        continue;
      }

      // 5. Normal default characters (operators, spaces, punctuation)
      addSpan(char, "text-slate-300", `char-${i}`);
      i++;
    }

    return (
      <span key={lineIndex} className="block select-text min-h-[1.25rem]">
        {elements}
        {"\n"}
      </span>
    );
  });
}

function CodeBlockComponent({ code, language, theme = "light" }: { code: string; language: string; theme?: "light" | "dark"; key?: string | number }) {
  const [copied, setCopied] = useState(false);

  const displayLanguage = language ? language.toUpperCase() : "CODE";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy code:", err);
    }
  };

  const handleDownload = () => {
    const ext = getExtension(language);
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const highlightedLines = highlightCode(code, language);

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-slate-205 bg-slate-900 shadow-md text-slate-100 dark:border-slate-800">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 select-none">
        <span className="font-mono text-xs font-semibold tracking-wider text-slate-300">
          {displayLanguage}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-450" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code contents block */}
      <div className="p-4 overflow-x-auto select-text bg-slate-900">
        <pre className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre font-normal text-slate-100">
          <code>{highlightedLines}</code>
        </pre>
      </div>
    </div>
  );
}

// Inline content parser
function renderInlineText(text: string, theme: "light" | "dark", defaultColorClass = "text-slate-950 dark:text-slate-100") {
  if (!text) return "";

  let cleaned = text.replace(/\[\s*\]/g, "");

  const tokens: React.ReactNode[] = [];
  let index = 0;

  const inlineRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
  let match;

  while ((match = inlineRegex.exec(cleaned)) !== null) {
    const matchIndex = match.index;

    if (matchIndex > index) {
      tokens.push(
        <span key={`prev-${matchIndex}`} className={defaultColorClass}>
          {cleaned.slice(index, matchIndex)}
        </span>
      );
    }

    if (match[1]) {
      tokens.push(
        <strong key={matchIndex} className="font-bold text-slate-950 dark:text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      tokens.push(
        <em key={matchIndex} className={`italic font-medium ${defaultColorClass}`}>
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      tokens.push(
        <code
          key={matchIndex}
          className="px-1.5 py-0.5 rounded-md font-mono text-xs bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
        >
          {match[6]}
        </code>
      );
    }

    index = inlineRegex.lastIndex;
  }

  if (index < cleaned.length) {
    tokens.push(
      <span key={`rem-${index}`} className={defaultColorClass}>
        {cleaned.slice(index)}
      </span>
    );
  }

  return tokens.length > 0 ? tokens : <span className={defaultColorClass}>{cleaned}</span>;
}

export default function MarkdownRenderer({ content, theme = "light" }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const parsedBlocks: React.ReactNode[] = [];

  let currentListItems: string[] = [];
  let isCurrentListOrdered = false;
  let currentBlockquoteText = "";
  let paragraphBuffer: string[] = [];

  const flushList = (key: number) => {
    if (currentListItems.length > 0) {
      parsedBlocks.push(
        <ul key={`list-${key}`} className="space-y-1.5 my-3 pl-5 list-none select-text">
          {currentListItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-sm md:text-base font-normal leading-relaxed text-slate-950 dark:text-slate-100"
            >
              <span className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50 dark:border-indigo-900/30">
                {isCurrentListOrdered ? idx + 1 : "•"}
              </span>
              <span className="flex-1 pt-0.5">{renderInlineText(item, theme, "text-slate-950 dark:text-slate-100")}</span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushBlockquote = (key: number) => {
    if (currentBlockquoteText) {
      const isTip = currentBlockquoteText.includes("💡") || currentBlockquoteText.toLowerCase().includes("tip");
      const isQuiz = currentBlockquoteText.toLowerCase().includes("quiz") || currentBlockquoteText.toLowerCase().includes("question");

      let cardBg = "bg-slate-50 border-slate-200 text-slate-950 dark:bg-slate-900/40 dark:border-slate-800";
      let iconColor = "text-indigo-600 dark:text-indigo-400";
      let CardIcon = Sparkles;
      let textThemeColor = "text-slate-950 dark:text-slate-100";

      if (isTip) {
        cardBg = "bg-amber-50/70 border-amber-200 text-amber-950 dark:bg-amber-950/25 dark:border-amber-900/40";
        iconColor = "text-amber-600 dark:text-amber-400";
        CardIcon = Sparkles;
        textThemeColor = "text-amber-950 dark:text-amber-100";
      } else if (isQuiz) {
        cardBg = "bg-indigo-50/70 border-indigo-200 text-indigo-950 dark:bg-indigo-950/25 dark:border-indigo-900/40";
        iconColor = "text-indigo-650 dark:text-indigo-400";
        CardIcon = HelpCircle;
        textThemeColor = "text-indigo-950 dark:text-indigo-100";
      }

      parsedBlocks.push(
        <div
          key={`quote-${key}`}
          className={`p-4 rounded-xl border my-4 shadow-sm relative overflow-hidden flex gap-3 select-text ${cardBg}`}
        >
          <div className="p-1.5 bg-white dark:bg-slate-850 rounded-lg shadow-sm border border-slate-100/40 self-start shrink-0">
            <CardIcon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="flex-1 text-sm md:text-base font-normal leading-relaxed">
            {renderInlineText(currentBlockquoteText.trim(), theme, textThemeColor)}
          </div>
        </div>
      );
      currentBlockquoteText = "";
    }
  };

  const flushParagraph = (key: number) => {
    if (paragraphBuffer.length > 0) {
      const fullText = paragraphBuffer.join(" ").trim();
      paragraphBuffer = [];

      if (!fullText) return;

      const isExplicitHighlight = fullText.startsWith("💡") || fullText.startsWith("🌟") || fullText.startsWith("🚀") || fullText.startsWith("🎯") || fullText.startsWith("🔍") || fullText.startsWith("🧠");

      if (isExplicitHighlight) {
        const emoji = fullText.charAt(0);
        const rest = fullText.slice(1).trim();
        parsedBlocks.push(
          <div
            key={`highlight-${key}`}
            className="bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 my-3 flex gap-3 shadow-xs select-text"
          >
            <span className="text-xl select-none shrink-0 self-start">{emoji}</span>
            <div className="text-sm md:text-base font-normal leading-relaxed text-slate-950 dark:text-slate-100">
              {renderInlineText(rest, theme, "text-slate-950 dark:text-slate-100")}
            </div>
          </div>
        );
      } else {
        parsedBlocks.push(
          <p key={`p-${key}`} className="text-sm md:text-base leading-relaxed font-normal text-slate-950 dark:text-slate-100 my-2 select-text">
            {renderInlineText(fullText, theme, "text-slate-950 dark:text-slate-100")}
          </p>
        );
      }
    }
  };

  // State to track if we are in a code block
  let isInCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLanguage = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle Code Block logic
    if (isInCodeBlock) {
      if (trimmed.startsWith("```")) {
        // End of code block - render the codeblock
        parsedBlocks.push(
          <CodeBlockComponent
            key={`code-block-${i}`}
            code={codeBlockLines.join("\n")}
            language={codeBlockLanguage}
            theme={theme}
          />
        );
        isInCodeBlock = false;
        codeBlockLines = [];
        codeBlockLanguage = "";
      } else {
        // Keep the exact original line intact with proper tabs or spacing spaces
        codeBlockLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      // Start of code block
      flushList(i);
      flushBlockquote(i);
      flushParagraph(i);

      isInCodeBlock = true;
      codeBlockLanguage = trimmed.slice(3).trim();
      codeBlockLines = [];
      continue;
    }

    // 1. Skip empty lines
    if (trimmed === "") {
      flushList(i);
      flushBlockquote(i);
      flushParagraph(i);
      continue;
    }

    // 2. Blockquote
    if (trimmed.startsWith(">")) {
      flushList(i);
      flushParagraph(i);
      const cleanQuotePart = line.replace(/^\s*>\s?/, "");
      currentBlockquoteText += (currentBlockquoteText ? " " : "") + cleanQuotePart;
      continue;
    } else {
      if (currentBlockquoteText) {
        flushBlockquote(i);
      }
    }

    // 3. Headings
    const headingMatch = line.match(/^(\s*)(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList(i);
      flushBlockquote(i);
      flushParagraph(i);

      const level = headingMatch[2].length;
      const headingText = headingMatch[3].trim();

      if (level === 1) {
        parsedBlocks.push(
          <h1 key={`h-${i}`} className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800 select-text">
            {renderInlineText(headingText, theme, "text-slate-900 dark:text-white")}
          </h1>
        );
      } else if (level === 2) {
        parsedBlocks.push(
          <h2 key={`h-${i}`} className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-4 mb-2 select-text">
            {renderInlineText(headingText, theme, "text-slate-900 dark:text-slate-100")}
          </h2>
        );
      } else {
        parsedBlocks.push(
          <h3 key={`h-${i}`} className="text-base md:text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-3 mb-1.5 select-text">
            {renderInlineText(headingText, theme, "text-slate-800 dark:text-slate-200")}
          </h3>
        );
      }
      continue;
    }

    // 4. Handle Lists (Unordered vs Ordered)
    const unorderedMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

    if (unorderedMatch) {
      flushBlockquote(i);
      flushParagraph(i);
      if (isCurrentListOrdered) {
        flushList(i);
      }
      isCurrentListOrdered = false;
      currentListItems.push(unorderedMatch[3].trim());
      continue;
    } else if (orderedMatch) {
      flushBlockquote(i);
      flushParagraph(i);
      if (!isCurrentListOrdered) {
        flushList(i);
      }
      isCurrentListOrdered = true;
      currentListItems.push(orderedMatch[3].trim());
      continue;
    } else {
      if (currentListItems.length > 0) {
        flushList(i);
      }
    }

    // 5. Accumulate Normal paragraph content
    paragraphBuffer.push(trimmed);
  }

  // Handle case where code block was not closed
  if (isInCodeBlock && codeBlockLines.length > 0) {
    parsedBlocks.push(
      <CodeBlockComponent
        key={`code-block-unclosed`}
        code={codeBlockLines.join("\n")}
        language={codeBlockLanguage}
        theme={theme}
      />
    );
  }

  // Flush remaining buffers
  flushList(lines.length);
  flushBlockquote(lines.length);
  flushParagraph(lines.length);

  return <div className="space-y-1.5 select-text">{parsedBlocks}</div>;
}
