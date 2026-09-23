// Universal Content Processing & Rendering Pipeline for StudyMate
// Handles all subjects: Chemistry, Biology, Physics, Mathematics, Engineering, Medicine,
// Economics, History, Literature, Philosophy, Languages, Law, etc.
// Automatically normalizes UTF-8 encoding (mojibake), renders authentic LaTeX/Math via KaTeX,
// formats chemistry notations, parses rich Markdown (headings, lists, tables, code, quotes),
// and guarantees zero raw syntax leaks into student UI.

import katex from "katex";

export interface ContentBlockHeading {
  type: "heading";
  level: number;
  text: string;
}

export interface ContentBlockDisplayMath {
  type: "display-math";
  latex: string;
}

export interface ContentBlockCode {
  type: "code-block";
  code: string;
  language?: string;
}

export interface ContentBlockTable {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface ContentBlockBlockquote {
  type: "blockquote";
  text: string;
}

export interface ContentBlockBulletList {
  type: "bullet-list";
  items: string[];
}

export interface ContentBlockNumberedList {
  type: "numbered-list";
  items: string[];
}

export interface ContentBlockParagraph {
  type: "paragraph";
  text: string;
}

export type ContentBlock =
  | ContentBlockHeading
  | ContentBlockDisplayMath
  | ContentBlockCode
  | ContentBlockTable
  | ContentBlockBlockquote
  | ContentBlockBulletList
  | ContentBlockNumberedList
  | ContentBlockParagraph;

export type InlineSegment =
  | { type: "math"; latex: string; display?: boolean }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; url: string }
  | { type: "text"; text: string };

// 1. Comprehensive Mojibake and Corrupted Encoding Maps
const MOJIBAKE_REPLACEMENTS: [RegExp, string][] = [
  // Windows-1252 / ISO-8859-1 double decoding
  [/â€™/g, "’"],
  [/â€˜/g, "‘"],
  [/â€œ/g, "“"],
  [/â€\x9d/g, "”"],
  [/â€/g, "”"],
  [/â€”/g, "—"],
  [/â€“/g, "–"],
  [/â€¦/g, "…"],
  [/â€¢/g, "•"],
  [/â‰¥/g, "≥"],
  [/â‰¤/g, "≤"],
  [/â‰/g, "≠"],
  [/â†’/g, "→"],
  [/â†/g, "←"],
  [/Ã©/g, "é"],
  [/Ã¨/g, "è"],
  [/Ãª/g, "ê"],
  [/Ã«/g, "ë"],
  [/Ã /g, "à"],
  [/Ã¡/g, "á"],
  [/Ã¢/g, "â"],
  [/Ã£/g, "ã"],
  [/Ã®/g, "î"],
  [/Ã¯/g, "ï"],
  [/Ã­/g, "í"],
  [/Ã¬/g, "ì"],
  [/Ã´/g, "ô"],
  [/Ã³/g, "ó"],
  [/Ã²/g, "ò"],
  [/Ãµ/g, "õ"],
  [/Ã¹/g, "ù"],
  [/Ãº/g, "ú"],
  [/Ã»/g, "û"],
  [/Ã¼/g, "ü"],
  [/Ã¶/g, "ö"],
  [/Ã¤/g, "ä"],
  [/Ã±/g, "ñ"],
  [/Ã§/g, "ç"],
  [/ÃŸ/g, "ß"],
  [/Ã‰/g, "É"],
  [/Ãˆ/g, "È"],
  [/Ã€/g, "À"],
  [/Ã‚/g, "Â"],
  [/Ã”/g, "Ô"],
  [/Ã›/g, "Û"],
  [/Ãœ/g, "Ü"],
  [/Ã–/g, "Ö"],
  [/Ã„/g, "Ä"],
  [/Ã‘/g, "Ñ"],
  [/Ã‡/g, "Ç"],
  // Unprintable replacement characters and blank squares
  [/\uFFFD/g, ""],
  [/[\u25A0-\u25FF]+/g, " "], // square / box artifacts (□ ■ etc.)
  [/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""], // non-printable control chars
  // Common HTML entities
  [/&nbsp;/g, " "],
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&times;/g, "×"],
  [/&divide;/g, "÷"],
];

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  "n": "ⁿ", "i": "ⁱ",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
  "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
  "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
  "v": "ᵥ", "x": "ₓ",
  "N": "ₙ", "A": "ₐ", "E": "ₑ", "H": "ₕ", "I": "ᵢ",
  "K": "ₖ", "L": "ₗ", "M": "ₘ", "O": "ₒ", "P": "ₚ",
  "R": "ᵣ", "S": "ₛ", "T": "ₜ", "U": "ᵤ", "V": "ᵥ", "X": "ₓ",
};

export function convertToSuperscript(str: string): string {
  return str.split("").map((c) => SUPERSCRIPT_MAP[c] || SUPERSCRIPT_MAP[c.toLowerCase()] || c).join("");
}

export function convertToSubscript(str: string): string {
  return str.split("").map((c) => SUBSCRIPT_MAP[c] || SUBSCRIPT_MAP[c.toLowerCase()] || c).join("");
}

export function scrubMetaPhrases(input: string): string {
  if (!input || typeof input !== "string") return input || "";
  let res = input;
  res = res.replace(/\bnoted in (?:any|the|this|that|each)?\s*pr?ar?ag?graphs?\b/gi, "in this section");
  res = res.replace(/\bnoted in pr?ar?ag?graphs?\s*\d+(?:\s*-\s*\d+)?\b/gi, "");
  res = res.replace(/\bas noted in pr?ar?ag?graphs?\s*\d+(?:\s*-\s*\d+)?\b/gi, "");
  res = res.replace(/\bas noted in (?:any|the|this)?\s*pr?ar?ag?graphs?\b/gi, "as covered in this section");
  res = res.replace(/\bnoted in\s+pr?ar?ag?graphs?\b/gi, "in this section");
  res = res.replace(/\bnoted in Section\s*\d+\b/gi, "");
  res = res.replace(/regarding\s+("?[^"?]+"??)\s+noted in\s+pr?ar?ag?graphs?\s*\d+(?:-\d+)?/gi, "regarding $1");
  res = res.replace(/regarding\s+("?[^"?]+"??)\s+noted in\s+pr?ar?ag?graphs?/gi, "regarding $1");
  res = res.replace(/\s{2,}/g, " ").replace(/\s+\?/g, "?").trim();
  return res;
}

/**
 * Normalizes encoding, strips corrupted mojibake and cleans unprintable artifacts.
 */
export function cleanMojibake(input: string): string {
  if (!input) return "";
  let res = input;
  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    res = res.replace(pattern, replacement);
  }
  // Standardize line endings
  res = res.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  res = scrubMetaPhrases(res);
  return res;
}

export const normalizeEncoding = cleanMojibake;

/**
 * Renders LaTeX math with KaTeX with complete fallback guarantee.
 * Never throws an error or breaks the UI.
 */
export function renderMathWithKatex(
  latex: string,
  displayMode = false
): { html: string; isMath: boolean } {
  if (!latex || !latex.trim()) return { html: "", isMath: false };
  const trimmed = latex.trim();
  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      trust: false,
    });
    return { html, isMath: true };
  } catch {
    // If KaTeX parser encounters fatal structural issues, return clean human-readable plain text
    const fallbackText = cleanLatexAndMath(trimmed);
    return { html: escapeHtml(fallbackText), isMath: false };
  }
}

/**
 * Escapes raw HTML to prevent injection attacks while rendering
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converts raw LaTeX into clean natural English and Unicode symbols.
 * Used for plain text targets (card front/back previews, titles, speech, etc.)
 * or as a robust fallback if math rendering fails.
 */
export function cleanLatexAndMath(input: string): string {
  if (!input) return "";
  let res = input;

  // 1. Remove enclosing delimiters ($$, $, \[, \])
  res = res.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  res = res.replace(/\$([^\$\n]+)\$/g, "$1");
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, "$1");
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, "$1");

  // 2. Unpack nested or multiple \text{...}, \mathrm{...}, \mathbf{...}, \ce{...}
  for (let i = 0; i < 4; i++) {
    res = res.replace(/\\(?:text|mathrm|mathbf|mathit|textbf|textit|ce)\{([^{}]*)\}/g, "$1");
  }

  // 3. Arrows
  res = res.replace(/\\(?:rightleftharpoons|rightleftarrows)(?![a-zA-Z])/g, "⇌");
  res = res.replace(/\\(?:leftrightarrow)(?![a-zA-Z])/g, "↔");
  res = res.replace(/\\(?:rightarrow|to|longrightarrow)(?![a-zA-Z])/g, "→");
  res = res.replace(/\\(?:leftarrow|longleftarrow)(?![a-zA-Z])/g, "←");
  res = res.replace(/\\(?:uparrow)(?![a-zA-Z])/g, "↑");
  res = res.replace(/\\(?:downarrow)(?![a-zA-Z])/g, "↓");
  res = res.replace(/\\(?:Rightarrow)(?![a-zA-Z])/g, "⇒");
  res = res.replace(/\\(?:Leftarrow)(?![a-zA-Z])/g, "⇐");
  res = res.replace(/\\(?:Leftrightarrow)(?![a-zA-Z])/g, "⇔");

  // 4. Greek letters
  res = res.replace(/\\Delta(?![a-zA-Z])/g, "Δ");
  res = res.replace(/\\delta(?![a-zA-Z])/g, "δ");
  res = res.replace(/\\alpha(?![a-zA-Z])/g, "α");
  res = res.replace(/\\beta(?![a-zA-Z])/g, "β");
  res = res.replace(/\\gamma(?![a-zA-Z])/g, "γ");
  res = res.replace(/\\Gamma(?![a-zA-Z])/g, "Γ");
  res = res.replace(/\\theta(?![a-zA-Z])/g, "θ");
  res = res.replace(/\\lambda(?![a-zA-Z])/g, "λ");
  res = res.replace(/\\mu(?![a-zA-Z])/g, "μ");
  res = res.replace(/\\pi(?![a-zA-Z])/g, "π");
  res = res.replace(/\\sigma(?![a-zA-Z])/g, "σ");
  res = res.replace(/\\omega(?![a-zA-Z])/g, "ω");
  res = res.replace(/\\Omega(?![a-zA-Z])/g, "Ω");
  res = res.replace(/\\phi(?![a-zA-Z])/g, "φ");
  res = res.replace(/\\psi(?![a-zA-Z])/g, "ψ");
  res = res.replace(/\\rho(?![a-zA-Z])/g, "ρ");
  res = res.replace(/\\tau(?![a-zA-Z])/g, "τ");
  res = res.replace(/\\epsilon(?![a-zA-Z])/g, "ε");

  // 5. Mathematical operators & relations
  res = res.replace(/\\pm(?![a-zA-Z])/g, "±");
  res = res.replace(/\\mp(?![a-zA-Z])/g, "∓");
  res = res.replace(/\\times(?![a-zA-Z])/g, "×");
  res = res.replace(/\\div(?![a-zA-Z])/g, "÷");
  res = res.replace(/\\cdot(?![a-zA-Z])/g, "·");
  res = res.replace(/\\circ(?![a-zA-Z])/g, "°");
  res = res.replace(/\\degree(?![a-zA-Z])/g, "°");
  res = res.replace(/\\approx(?![a-zA-Z])/g, "≈");
  res = res.replace(/\\neq(?![a-zA-Z])/g, "≠");
  res = res.replace(/\\le(?![a-zA-Z])|\\leq(?![a-zA-Z])/g, "≤");
  res = res.replace(/\\ge(?![a-zA-Z])|\\geq(?![a-zA-Z])/g, "≥");
  res = res.replace(/\\infty(?![a-zA-Z])/g, "∞");
  res = res.replace(/\\partial(?![a-zA-Z])/g, "∂");
  res = res.replace(/\\nabla(?![a-zA-Z])/g, "∇");
  res = res.replace(/\\sum(?![a-zA-Z])/g, "∑");
  res = res.replace(/\\prod(?![a-zA-Z])/g, "∏");
  res = res.replace(/\\int(?![a-zA-Z])/g, "∫");
  res = res.replace(/\\in(?![a-zA-Z])/g, "∈");
  res = res.replace(/\\notin(?![a-zA-Z])/g, "∉");
  res = res.replace(/\\subset(?![a-zA-Z])/g, "⊂");
  res = res.replace(/\\forall(?![a-zA-Z])/g, "∀");
  res = res.replace(/\\exists(?![a-zA-Z])/g, "∃");

  // 6. Fractions & Square Roots
  res = res.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1 / $2)");
  res = res.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  res = res.replace(/\\sqrt([a-zA-Z0-9])/g, "√$1");

  // 7. Subscripts & Superscripts
  res = res.replace(/_\{([^{}]+)\}/g, (_, inner) => convertToSubscript(inner));
  res = res.replace(/_([0-9a-zA-Z+-])/g, (_, ch) => convertToSubscript(ch));
  res = res.replace(/\^\{([^{}]+)\}/g, (_, inner) => convertToSuperscript(inner));
  res = res.replace(/\^([0-9a-zA-Z+-])/g, (_, ch) => convertToSuperscript(ch));

  // 8. Stray backslashes
  res = res.replace(/\\[,;! ]/g, " ");
  res = res.replace(/\\(?:quad|qquad|enspace)\b/g, " ");
  res = res.replace(/\\([a-zA-Z]+)/g, "$1");

  return formatChemistryNotation(res);
}

/**
 * Natural chemical and scientific formula formatting for plain text segments.
 * Formats chemical formulas (H2O -> H₂O, CO2 -> CO₂), ion charges (OH- -> OH⁻, H+ -> H⁺, Ca2+ -> Ca²⁺),
 * and standard reaction arrows (-> -> →).
 */
export function formatChemistryNotation(input: string): string {
  if (!input) return "";
  let res = input;

  // Replace reaction arrow symbols
  res = res.replace(/-->|->/g, "→");
  res = res.replace(/<->|<-->/g, "↔");
  res = res.replace(/<=>|<==>/g, "⇌");

  // Specific multi-atom and polyatomic ion charges FIRST (before number subscripting)
  res = res.replace(/\bOH[\-–]/g, "OH⁻");
  res = res.replace(/\bH\+/g, "H⁺");
  res = res.replace(/\bCN[\-–]/g, "CN⁻");
  res = res.replace(/\bNu[\-–]/g, "Nu⁻");
  res = res.replace(/\bCl[\-–]/g, "Cl⁻");
  res = res.replace(/\bBr[\-–]/g, "Br⁻");
  res = res.replace(/\bI[\-–]/g, "I⁻");
  res = res.replace(/\bF[\-–]/g, "F⁻");
  res = res.replace(/\bNa\+/g, "Na⁺");
  res = res.replace(/\bK\+/g, "K⁺");
  res = res.replace(/\bCa2\+/g, "Ca²⁺");
  res = res.replace(/\bMg2\+/g, "Mg²⁺");
  res = res.replace(/\bFe3\+/g, "Fe³⁺");
  res = res.replace(/\bAl3\+/g, "Al³⁺");
  res = res.replace(/\b([A-Z][a-z]?)([1-4])\+/g, (_, elem, num) => `${elem}${convertToSuperscript(num + "+")}`);
  res = res.replace(/\b([A-Z][a-z]?)([1-4])[\-–]/g, (_, elem, num) => `${elem}${convertToSuperscript(num + "-")}`);

  // Common multi-element formulas like H2O, CO2, CH4, C6H12O6, NH3, SO4, NO3, PO4, CaCO3, NaCl, HCl, NaOH, CH3OH
  res = res.replace(/\bH2O\b/g, "H₂O");
  res = res.replace(/\bCO2\b/g, "CO₂");
  res = res.replace(/\bCH4\b/g, "CH₄");
  res = res.replace(/\bC6H12O6\b/g, "C₆H₁₂O₆");
  res = res.replace(/\bNH3\b/g, "NH₃");
  res = res.replace(/\bSO4\b/g, "SO₄");
  res = res.replace(/\bNO3\b/g, "NO₃");
  res = res.replace(/\bPO4\b/g, "PO₄");
  res = res.replace(/\bCH3OH\b/g, "CH₃OH");
  res = res.replace(/\bC2H5OH\b/g, "C₂H₅OH");
  res = res.replace(/\bH2SO4\b/g, "H₂SO₄");
  res = res.replace(/\bHNO3\b/g, "HNO₃");
  res = res.replace(/\bO2\b/g, "O₂");
  res = res.replace(/\bN2\b/g, "N₂");
  res = res.replace(/\bH2\b/g, "H₂");
  res = res.replace(/\bCl2\b/g, "Cl₂");

  // Common inorganic and organic chemical compounds (subscripts for numbers not part of an ion charge)
  res = res.replace(/\b([A-Z][a-z]?)(2|3|4|5|6|7|8|9|10|12)(?![+\-a-zA-Z0-9])/g, (_, elem, num) => {
    return `${elem}${convertToSubscript(num)}`;
  });

  // SN1, SN2 mechanisms
  res = res.replace(/\bSN1\b/g, "Sₙ1");
  res = res.replace(/\bSN2\b/g, "Sₙ2");

  return res;
}

/**
 * Pre-processes text to detect bare LaTeX commands that lack dollar delimiters,
 * so that KaTeX can render them properly.
 */
export function detectAndWrapBareLatex(input: string): string {
  if (!input) return "";
  let res = input;

  // If already inside $...$ or $$...$$, leave them intact.
  // Detect bare LaTeX commands:
  // e.g. \text{S}_\text{N}2, \text{Nu}^-, \frac{a}{b}, \sqrt{x}, \rightarrow, \Delta G, etc.
  // We wrap them in $...$ so inline math parser catches them.
  res = res.replace(
    /(?<!\$)(?:\\(?:text|mathrm|mathbf|ce)\{[^{}]+\}(?:_\\(?:text|mathrm|mathbf)\{[^{}]+\}|_\{[^{}]+\}|_[a-zA-Z0-9]+|\^\\(?:text|mathrm|mathbf)\{[^{}]+\}|\^\{[^{}]+\}|\^[a-zA-Z0-9+-]+|\d+)*|\\(?:frac|sqrt)\{[^{}]+\}(?:\{[^{}]+\})?|\\(?:rightarrow|to|longrightarrow|leftarrow|longleftarrow|leftrightarrow|rightleftharpoons|rightleftarrows|uparrow|downarrow|Rightarrow|Leftarrow|Leftrightarrow)\b|\\(?:Delta|delta|alpha|beta|gamma|Gamma|theta|lambda|mu|pi|sigma|omega|Omega|phi|psi|rho|tau|epsilon|pm|mp|times|div|cdot|approx|neq|le|leq|ge|geq|infty|partial|nabla|sum|prod|int|in)\b)(?!\$)/g,
    "$$$&$"
  );

  return res;
}

/**
 * Parses raw markdown into structured blocks:
 * Headings, Tables, Code Blocks, Blockquotes, Bullet Lists, Numbered Lists, Display Math, Paragraphs.
 */
export function parseMarkdownBlocks(rawContent: string): ContentBlock[] {
  if (!rawContent) return [];
  const normalized = cleanMojibake(rawContent);
  const lines = normalized.split("\n");
  const blocks: ContentBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Display Math: $$ ... $$ or \[ ... \]
    if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) {
      const isBracket = trimmed.startsWith("\\[");
      const endMarker = isBracket ? "\\]" : "$$";
      if (trimmed.length > 2 && trimmed.endsWith(endMarker) && trimmed !== "$$" && trimmed !== "\\[") {
        const latex = isBracket ? trimmed.slice(2, -2) : trimmed.slice(2, -2);
        blocks.push({ type: "display-math", latex: latex.trim() });
        i++;
        continue;
      }
      // Multiline display math
      let mathLines: string[] = [];
      const firstLineContent = isBracket ? trimmed.slice(2) : trimmed.slice(2);
      if (firstLineContent) mathLines.push(firstLineContent);
      i++;
      while (i < lines.length && !lines[i].trim().endsWith(endMarker)) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        const lastLine = lines[i].trim();
        const lastContent = lastLine.slice(0, lastLine.length - endMarker.length);
        if (lastContent) mathLines.push(lastContent);
        i++;
      }
      blocks.push({ type: "display-math", latex: mathLines.join("\n").trim() });
      continue;
    }

    // 2. Code Block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      blocks.push({
        type: "code-block",
        code: codeLines.join("\n"),
        language: language || undefined,
      });
      continue;
    }

    // 3. Headings: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 4. Markdown Table: lines containing pipe |
    if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const splitRow = (rowStr: string) =>
          rowStr
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

        const rawHeaders = splitRow(tableLines[0]);
        const secondLine = tableLines[1];
        const isSeparator = /^\|[\s\-:|]+\|$/.test(secondLine);

        if (isSeparator && rawHeaders.length > 0) {
          const rows: string[][] = [];
          for (let r = 2; r < tableLines.length; r++) {
            rows.push(splitRow(tableLines[r]));
          }
          blocks.push({
            type: "table",
            headers: rawHeaders,
            rows,
          });
          continue;
        }
      }
      // If not a formal table, treat as paragraphs
      blocks.push({
        type: "paragraph",
        text: tableLines.join("\n"),
      });
      continue;
    }

    // 5. Blockquote: > ...
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // 6. Bullet List: *, -, •, +
    const isBulletStart = /^[\*\-•\+]\s+/.test(trimmed);
    if (isBulletStart) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-•\+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[\*\-•\+]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "bullet-list",
        items,
      });
      continue;
    }

    // 7. Numbered List: 1. , 2. , etc.
    const isNumberedStart = /^\d+\.\s+/.test(trimmed);
    if (isNumberedStart) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "numbered-list",
        items,
      });
      continue;
    }

    // 8. Normal Paragraph (gather lines until blank line or new block)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("$$") &&
      !lines[i].trim().startsWith("\\[") &&
      !/^[\*\-•\+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().includes("|", 1))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paraLines.join(" "),
      });
    }
  }

  return blocks;
}

/**
 * Parses inline text into segments of math, bold, italic, code, links, and text.
 */
export function parseInlineSegments(rawText: string): InlineSegment[] {
  if (!rawText) return [];

  // 1. Clean mojibake first
  let text = cleanMojibake(rawText);
  // 2. Detect and wrap bare LaTeX commands e.g. \text{S}_\text{N}2, \frac{a}{b}, \sqrt{x}
  text = detectAndWrapBareLatex(text);

  const segments: InlineSegment[] = [];

  // Match token regex:
  // Math: \$\$([\s\S]+?)\$\$ | \$([^\$\n]+)\$ | \\\(([\s\S]+?)\\\)
  // Bold: \*\*([^*]+)\*\* | __([^_]+)__
  // Italic: \*([^*]+)\* | _([^_]+)_
  // Code: `([^`]+)`
  // Link: \[([^\]]+)\]\(([^)]+)\)
  const tokenRegex =
    /(\$\$[\s\S]+?\$\$|\$[^\$\n]+\$|\\\([\s\S]+?\\\)|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const plain = text.slice(lastIndex, matchIndex);
      segments.push({
        type: "text",
        text: formatChemistryNotation(cleanLatexAndMath(plain)),
      });
    }

    const tok = match[0];

    // Display / Inline math
    if (tok.startsWith("$$") && tok.endsWith("$$")) {
      segments.push({
        type: "math",
        latex: tok.slice(2, -2).trim(),
        display: true,
      });
    } else if (tok.startsWith("$") && tok.endsWith("$")) {
      segments.push({
        type: "math",
        latex: tok.slice(1, -1).trim(),
        display: false,
      });
    } else if (tok.startsWith("\\(") && tok.endsWith("\\)")) {
      segments.push({
        type: "math",
        latex: tok.slice(2, -2).trim(),
        display: false,
      });
    } else if (
      (tok.startsWith("**") && tok.endsWith("**")) ||
      (tok.startsWith("__") && tok.endsWith("__"))
    ) {
      segments.push({
        type: "bold",
        text: formatChemistryNotation(cleanLatexAndMath(tok.slice(2, -2))),
      });
    } else if (tok.startsWith("*") && tok.endsWith("*")) {
      segments.push({
        type: "italic",
        text: formatChemistryNotation(cleanLatexAndMath(tok.slice(1, -1))),
      });
    } else if (tok.startsWith("`") && tok.endsWith("`")) {
      segments.push({
        type: "code",
        text: tok.slice(1, -1),
      });
    } else if (tok.startsWith("[") && tok.includes("](") && tok.endsWith(")")) {
      const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        segments.push({
          type: "link",
          text: formatChemistryNotation(cleanLatexAndMath(linkMatch[1])),
          url: linkMatch[2],
        });
      }
    }

    lastIndex = matchIndex + tok.length;
  }

  if (lastIndex < text.length) {
    const plain = text.slice(lastIndex);
    segments.push({
      type: "text",
      text: formatChemistryNotation(cleanLatexAndMath(plain)),
    });
  }

  return segments;
}

/**
 * Strips raw markdown syntax completely to yield clean, natural English prose.
 * Use for questions, choices, badges, titles, flashcard fronts/backs, tooltips.
 */
export function stripMarkdownToPlain(input: string): string {
  if (!input) return "";

  let res = cleanMojibake(input);
  res = cleanLatexAndMath(res);

  // Remove headings (#, ##, ###)
  res = res.replace(/^#+\s+/gm, "");
  // Remove bold / italic markers (**text**, *text*, __text__, _text_)
  res = res.replace(/\*\*([^*]+)\*\*/g, "$1");
  res = res.replace(/__([^_]+)__/g, "$1");
  res = res.replace(/\*([^*]+)\*/g, "$1");
  res = res.replace(/_([^_]+)_/g, "$1");
  // Remove blockquote markers (> )
  res = res.replace(/^>\s*/gm, "");
  // Remove code markers (`code` or ```code```)
  res = res.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, "$1");
  res = res.replace(/`([^`]+)`/g, "$1");
  // Remove bullet points at start of line
  res = res.replace(/^[\s•\-*]+\s*/gm, "");
  // Remove numbered list prefixes
  res = res.replace(/^\d+\.\s+/gm, "");
  // Format chemistry notation
  res = formatChemistryNotation(res);
  // Normalize extra spacing
  res = res.replace(/[ \t]+/g, " ");
  res = res.replace(/\n{3,}/g, "\n\n");

  return res.trim();
}

export const cleanToNaturalEnglish = stripMarkdownToPlain;

/**
 * Legacy support for formatAcademicText
 */
export function formatAcademicText(input: string): string {
  if (!input) return "";
  let res = cleanMojibake(input);
  res = cleanLatexAndMath(res);
  res = formatChemistryNotation(res);
  return res.trim();
}
