import React, { useMemo } from "react";
import {
  parseMarkdownBlocks,
  parseInlineSegments,
  renderMathWithKatex,
  cleanLatexAndMath,
  cleanMojibake,
  formatChemistryNotation,
  ContentBlock,
  InlineSegment,
} from "../utils/universalSanitizer";

export interface UniversalContentRendererProps {
  content: string;
  className?: string;
  as?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4";
  renderMarkdownBlocks?: boolean;
  inline?: boolean;
}

/**
 * Renders individual inline segments: math, bold, italic, code, links, text
 */
function renderInlineElement(seg: InlineSegment, key: string): React.ReactNode {
  switch (seg.type) {
    case "math": {
      const rendered = renderMathWithKatex(seg.latex, seg.display);
      if (rendered.isMath) {
        return (
          <span
            key={key}
            className={`inline-block align-baseline max-w-full overflow-x-auto ${
              seg.display ? "my-2 block text-center" : "px-0.5"
            }`}
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        );
      }
      // Fallback plain text if KaTeX parser could not parse
      return (
        <span key={key} className="font-mono text-inherit">
          {cleanLatexAndMath(seg.latex)}
        </span>
      );
    }
    case "bold":
      return (
        <strong key={key} className="font-bold text-inherit opacity-95">
          {seg.text}
        </strong>
      );
    case "italic":
      return (
        <em key={key} className="italic text-inherit">
          {seg.text}
        </em>
      );
    case "code":
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 break-all"
        >
          {seg.text}
        </code>
      );
    case "link":
      return (
        <a
          key={key}
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline underline-offset-2 break-all"
        >
          {seg.text}
        </a>
      );
    case "text":
    default:
      return <React.Fragment key={key}>{seg.text}</React.Fragment>;
  }
}

/**
 * Universal content processing and rendering engine for StudyMate.
 * Converts raw LaTeX, math equations, chemistry formulas, markdown headings/lists/tables,
 * and mojibake into clean, responsive, human-readable UI.
 */
export const UniversalContentRenderer: React.FC<UniversalContentRendererProps> = ({
  content,
  className = "",
  as = "div",
  renderMarkdownBlocks = true,
  inline = false,
}) => {
  if (!content) return null;

  // Single-line or strictly inline request (used for card fronts, titles, option pills, badges)
  if (inline || !renderMarkdownBlocks || (!content.includes("\n") && !content.includes("|") && !content.includes("$$"))) {
    const segments = parseInlineSegments(content);
    const renderedNodes = segments.map((seg, idx) => renderInlineElement(seg, `inline-${idx}`));

    if (as === "span") {
      return <span className={`break-words ${className}`}>{renderedNodes}</span>;
    }
    if (as === "p") {
      return <p className={`break-words leading-relaxed ${className}`}>{renderedNodes}</p>;
    }
    if (as === "h1") {
      return <h1 className={`break-words font-bold ${className}`}>{renderedNodes}</h1>;
    }
    if (as === "h2") {
      return <h2 className={`break-words font-bold ${className}`}>{renderedNodes}</h2>;
    }
    if (as === "h3") {
      return <h3 className={`break-words font-bold ${className}`}>{renderedNodes}</h3>;
    }
    if (as === "h4") {
      return <h4 className={`break-words font-bold ${className}`}>{renderedNodes}</h4>;
    }
    return <div className={`break-words ${className}`}>{renderedNodes}</div>;
  }

  // Parse structured markdown blocks (Headings, Tables, Lists, Quotes, Math, Code, Paragraphs)
  const blocks: ContentBlock[] = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={`space-y-3.5 break-words max-w-full overflow-hidden ${className}`}>
      {blocks.map((block, bIdx) => {
        switch (block.type) {
          case "heading": {
            const headingSegments = parseInlineSegments(block.text);
            const nodes = headingSegments.map((seg, sIdx) =>
              renderInlineElement(seg, `h-${bIdx}-${sIdx}`)
            );
            if (block.level === 1) {
              return (
                <h2
                  key={`b-${bIdx}`}
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-200 dark:border-slate-800 leading-snug"
                >
                  {nodes}
                </h2>
              );
            }
            if (block.level === 2) {
              return (
                <h3
                  key={`b-${bIdx}`}
                  className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 pt-2 pb-1 border-b border-slate-200/80 dark:border-slate-800/80 leading-snug"
                >
                  {nodes}
                </h3>
              );
            }
            return (
              <h4
                key={`b-${bIdx}`}
                className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-300 pt-1 pb-0.5 leading-snug"
              >
                {nodes}
              </h4>
            );
          }

          case "display-math": {
            const mathResult = renderMathWithKatex(block.latex, true);
            return (
              <div
                key={`b-${bIdx}`}
                className="my-3 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 overflow-x-auto text-center"
              >
                {mathResult.isMath ? (
                  <div dangerouslySetInnerHTML={{ __html: mathResult.html }} />
                ) : (
                  <div className="font-mono text-sm">{cleanLatexAndMath(block.latex)}</div>
                )}
              </div>
            );
          }

          case "table": {
            return (
              <div
                key={`b-${bIdx}`}
                className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-semibold border-b border-slate-200 dark:border-slate-700">
                      {block.headers.map((h, hIdx) => (
                        <th key={`th-${bIdx}-${hIdx}`} className="p-2.5 sm:p-3 whitespace-nowrap">
                          {parseInlineSegments(h).map((seg, sIdx) =>
                            renderInlineElement(seg, `th-${bIdx}-${hIdx}-${sIdx}`)
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={`tr-${bIdx}-${rIdx}`}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={`td-${bIdx}-${rIdx}-${cIdx}`}
                            className="p-2.5 sm:p-3 text-slate-700 dark:text-slate-300 align-top break-words"
                          >
                            {parseInlineSegments(cell).map((seg, sIdx) =>
                              renderInlineElement(seg, `td-${bIdx}-${rIdx}-${cIdx}-${sIdx}`)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case "code-block": {
            return (
              <div
                key={`b-${bIdx}`}
                className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100"
              >
                {block.language && (
                  <div className="px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-slate-800">
                    {block.language}
                  </div>
                )}
                <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          }

          case "blockquote": {
            const quoteSegments = parseInlineSegments(block.text);
            return (
              <blockquote
                key={`b-${bIdx}`}
                className="my-2 p-3 sm:p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-500 text-slate-800 dark:text-blue-100 text-xs sm:text-sm leading-relaxed"
              >
                {quoteSegments.map((seg, sIdx) =>
                  renderInlineElement(seg, `q-${bIdx}-${sIdx}`)
                )}
              </blockquote>
            );
          }

          case "bullet-list": {
            return (
              <ul key={`b-${bIdx}`} className="space-y-2 pl-1 my-2">
                {block.items.map((item, iIdx) => (
                  <li
                    key={`li-${bIdx}-${iIdx}`}
                    className="flex items-start gap-2.5 text-inherit leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span className="flex-1 break-words">
                      {parseInlineSegments(item).map((seg, sIdx) =>
                        renderInlineElement(seg, `ul-${bIdx}-${iIdx}-${sIdx}`)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }

          case "numbered-list": {
            return (
              <ol key={`b-${bIdx}`} className="space-y-2 pl-1 my-2">
                {block.items.map((item, iIdx) => (
                  <li
                    key={`ol-${bIdx}-${iIdx}`}
                    className="flex items-start gap-2 text-inherit leading-relaxed"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm shrink-0 min-w-4 text-right">
                      {iIdx + 1}.
                    </span>
                    <span className="flex-1 break-words">
                      {parseInlineSegments(item).map((seg, sIdx) =>
                        renderInlineElement(seg, `ol-${bIdx}-${iIdx}-${sIdx}`)
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            );
          }

          case "paragraph":
          default: {
            const paraSegments = parseInlineSegments(block.text);
            return (
              <p
                key={`b-${bIdx}`}
                className="leading-relaxed text-inherit break-words"
              >
                {paraSegments.map((seg, sIdx) =>
                  renderInlineElement(seg, `p-${bIdx}-${sIdx}`)
                )}
              </p>
            );
          }
        }
      })}
    </div>
  );
};

// Re-export as CleanFormattedText for seamless drop-in compatibility across the entire app
export const CleanFormattedText = UniversalContentRenderer;
