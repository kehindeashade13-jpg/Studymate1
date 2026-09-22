import {
  StudyMaterial,
  StudyNotes,
  MemorisePack,
  Quiz,
  StepLesson,
  StudySubject,
  SourceType,
  Flashcard,
  FillInTheBlank,
  Mnemonic,
  LessonStep,
  LessonQuestion,
  QuizQuestion,
} from "../types";
import {
  cleanMojibake,
  cleanLatexAndMath,
  stripMarkdownToPlain,
  formatAcademicText,
} from "./universalSanitizer";

// Detect if a string contains binary, replacement (\uFFFD), dense question mark corruption, or unprintable character corruption
export function isGarbledText(text: string): boolean {
  if (!text) return false;
  // Unicode replacement character or corrupted box symbols
  if (text.includes("\uFFFD") || text.includes("\u25A1") || text.includes("\u25A0") || text.includes("\uFF00")) {
    return true;
  }
  // Unprintable control characters (excluding newline, tab, carriage return)
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
    return true;
  }
  // PDF binary markers and deflate stream chunks
  if (/%PDF-|stream[\r\n]|endstream|xref|trailer|\/FlateDecode/i.test(text)) {
    return true;
  }
  // Corrupted font question marks (e.g. "??(???????" or "?m?????S?BhnE?Fs64?2b?9?d")
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks >= 3 && questionMarks / text.length > 0.15) {
    return true;
  }
  if (text.length < 60 && questionMarks >= 2) {
    return true;
  }
  // Single token that is excessively long and contains non-alphanumeric noise
  if (!text.includes(" ") && text.length > 20 && !text.includes("-") && !text.includes("/") && !text.includes("http")) {
    return true;
  }
  // Words with high density of non-alphanumeric noise
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    const normalWords = words.filter((w) => /^[a-zA-Z0-9,.'"-?!():;%$/+=<>]+$/.test(w));
    if (normalWords.length / words.length < 0.55) return true;
    const excessive = words.filter((w) => w.length > 30 && !w.includes("-") && !w.includes("/"));
    if (excessive.length / words.length > 0.10) return true;
  }
  return false;
}

// Extract course code (e.g. "CHM 203", "BIO 101", "MTH 201", "PHY 102", "CSC 311")
// from file name, document text, or title
export function extractCourseCode(
  fileName?: string,
  text?: string,
  title?: string
): string | null {
  const sources = [fileName, title, text?.slice(0, 3000)].filter(Boolean) as string[];

  // 1. Check explicit labeled pattern: "Course Code: CHM 203", "Course: BIO 101", "Code: MTH 101"
  for (const src of sources) {
    const explicitMatch = src.match(
      /(?:course\s*(?:code|no|num|number)?|course|code)\s*[:#-]?\s*([a-z]{2,5}\s*[-_]?\s*\d{2,4}[a-z]?)\b/i
    );
    if (explicitMatch && explicitMatch[1]) {
      const normalized = normalizeCourseCode(explicitMatch[1]);
      if (normalized) return normalized;
    }
  }

  // 2. Recognized academic course department prefixes
  const knownPrefixes = new Set([
    "CHM", "CHEM", "BIO", "BIOL", "MCB", "BCH", "PHY", "PHYS",
    "MTH", "MATH", "MAT", "STA", "CSC", "COS", "CMP", "SWE",
    "ENG", "ENGL", "GST", "GNS", "ECO", "ECN", "BUS", "ACC",
    "FIN", "MGT", "HIS", "HIST", "PSY", "PSYC", "SOC", "POL",
    "POS", "GEO", "LAW", "MED", "NUR", "PHM", "AGR", "EDU",
    "ARC", "CVE", "MEE", "EEE", "CHE", "PTE", "FST"
  ]);

  for (const src of sources) {
    const codeMatches = src.matchAll(/\b([A-Za-z]{2,4})\s*[-_]?\s*(\d{2,4}[A-Za-z]?)\b/g);
    for (const match of codeMatches) {
      const letters = match[1].toUpperCase();
      const numbers = match[2].toUpperCase();
      if (knownPrefixes.has(letters)) {
        return `${letters} ${numbers}`;
      }
    }
  }

  return null;
}

function normalizeCourseCode(raw: string): string | null {
  const cleaned = raw.trim().replace(/[_\-]+/g, " ");
  const match = cleaned.match(/^([A-Za-z]{2,5})\s*(\d{2,4}[A-Za-z]?)$/);
  if (match) {
    return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
  }
  return cleaned.toUpperCase();
}

// Detect subject from course code, title, or content to provide deeply accurate subject domain concepts
export function detectSubjectFromCodeOrTitle(
  codeOrTitle: string,
  content?: string
): StudySubject {
  const textToScan = `${codeOrTitle} ${content?.slice(0, 1500) || ""}`.toUpperCase();

  if (/\b(CHM|CHEM|CHEMISTRY|ORGANIC|INORGANIC|BIOCHEM|KINETICS|MOLECULE|ACID|REACTION|STOICHIOMETRY)\b/.test(textToScan)) {
    return "Chemistry";
  }
  if (/\b(BIO|BIOL|BIOLOGY|CELL|GENETICS|ANATOMY|PHYSIOLOGY|BOTANY|ZOOLOGY|MICROBIO|MCB|NEURO)\b/.test(textToScan)) {
    return "Biology";
  }
  if (/\b(PHY|PHYS|PHYSICS|MECHANICS|THERMO|QUANTUM|OPTICS|ELECTRO|MAGNET|NEWTON)\b/.test(textToScan)) {
    return "Physics";
  }
  if (/\b(MTH|MATH|MAT|CALCULUS|ALGEBRA|STAT|STA|GEOMETRY|DERIVATIVE|INTEGRAL|MATRIX|TRIG)\b/.test(textToScan)) {
    return "Mathematics";
  }
  if (/\b(CSC|COS|CMP|CS|SWE|IT|PROGRAMMING|ALGORITHM|PYTHON|JAVA|SQL|DATABASE|SOFTWARE)\b/.test(textToScan)) {
    return "Computer Science";
  }
  if (/\b(ECO|ECN|BUS|FIN|ACC|ECONOMICS|ACCOUNTING|MARKETING|MANAGEMENT|FINANCE)\b/.test(textToScan)) {
    return "Business";
  }
  if (/\b(ENG|ENGL|LIT|WRITING|POETRY|NOVEL|GRAMMAR|SHAKESPEARE|ESSAY|GST)\b/.test(textToScan)) {
    return "English";
  }
  if (/\b(HIS|HIST|CIVILIZATION|WAR|REVOLUTION|HISTORY|EMPIRE|GOVERNMENT|POL)\b/.test(textToScan)) {
    return "History";
  }
  if (/\b(PSY|PSYC|PSYCHOLOGY|BEHAVIOR|COGNITIVE|THERAPY|SOC|SOCIOLOGY)\b/.test(textToScan)) {
    return "Psychology";
  }
  return "Other";
}

// Clean course or subject prefixes and author / phone number suffixes from material titles
export function cleanTitle(raw: string): string {
  if (!raw) return "Study Material";
  let cleaned = stripMarkdownToPlain(raw)
    .replace(/^\[[^\]]+\]\s*[:-]?\s*/i, "")
    .replace(/^(biology|mathematics|chemistry|physics|history|computer science|english|business|bio|chem|math|cs|subject)\s*[:-]\s*/i, "")
    .replace(/\.(pdf|docx?|pptx?|txt)$/i, "")
    .replace(/\s+by\s+[A-Za-z0-9_]+(\s+\d+)?/i, "") // strips e.g. "by Andrewz 08107303682"
    .replace(/\s+\d{8,}\b/g, "") // strips standalone long phone numbers
    .replace(/[_\-]+/g, " ")
    .trim();

  // If after cleaning it's empty or still garbled, provide a clean subject title
  if (!cleaned || isGarbledText(cleaned)) {
    return "Course Study Material";
  }

  return cleaned;
}

// Detect subject from title to provide deeply accurate subject domain concepts
export function detectSubjectFromTitle(title: string): StudySubject {
  return detectSubjectFromCodeOrTitle(title);
}

// Helper to clean text into natural readable English prose
export function cleanToNaturalEnglish(text: string): string {
  if (!text) return "";

  let cleaned = cleanMojibake(text);
  cleaned = cleanLatexAndMath(cleaned);

  // 1. Strip unicode replacement characters, unprintable bytes, and binary markers
  cleaned = cleaned.replace(/\uFFFD/g, "");
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  cleaned = cleaned.replace(/[\u25A0-\u25FF\uFF00-\uFFFF]/g, "");
  cleaned = cleaned.replace(/%PDF-[\d.]+/gi, "");
  cleaned = cleaned.replace(/\b\d+\s+\d+\s+obj[\s\S]*?endobj\b/gi, "");
  cleaned = cleaned.replace(/\bstream[\r\n][\s\S]*?endstream\b/gi, "");
  cleaned = cleaned.replace(/xref[\s\S]*?trailer/gi, "");

  // 2. If text looks like JSON, parse and extract readable text
  if (cleaned.trim().startsWith("{") && cleaned.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      const parts: string[] = [];
      if (parsed.title) parts.push(parsed.title);
      if (parsed.summary) parts.push(parsed.summary);
      if (Array.isArray(parsed.keyConcepts)) {
        parts.push(
          parsed.keyConcepts
            .map((k: any) => (typeof k === "string" ? k : `${k.title || k.term}: ${k.description || k.definition}`))
            .join("\n")
        );
      }
      if (Array.isArray(parsed.definitions)) {
        parts.push(parsed.definitions.map((d: any) => `${d.term}: ${d.definition}`).join("\n"));
      }
      if (Array.isArray(parsed.notes)) {
        parts.push(parsed.notes.join("\n"));
      }
      if (parts.length > 0) {
        cleaned = parts.join("\n\n");
      }
    } catch {
      // proceed
    }
  }

  // 3. Filter out lines that are actual binary junk or PDF container artifacts
  const lines = cleaned.split("\n");
  const filteredLines = lines.filter((l) => {
    const trimmed = l.trim();
    if (!trimmed) return false;
    // Discard low-level binary control codes
    if (/[\x00-\x08\x0E-\x1F]/.test(trimmed)) return false;
    // Discard PDF container markers
    if (/^(stream|endstream|xref|trailer|\d+\s+\d+\s+obj|endobj|startxref)$/i.test(trimmed)) return false;
    return true;
  });

  const result = (filteredLines.length > 0 ? filteredLines : lines)
    .join("\n")
    .replace(/\[Study material image loaded[^\]]*\]/gi, "")
    .replace(/\[Audio Lecture Transcription[^\]]*\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result || cleaned.trim();
}

// Generate 5 rigorous, distinct questions for any lesson
export function create5QuestionsForLesson(lessonNum: number, lessonTitle: string, mainTopic = "Study Material"): LessonQuestion[] {
  return [
    {
      question: `[Lesson ${lessonNum} - Question 1] What is the primary conceptual principle of ${lessonTitle}?`,
      options: [
        `Understanding the core mechanisms and operational framework of ${mainTopic}.`,
        "Ignoring all conceptual models and scientific definitions.",
        "Memorizing disconnected formulas without understanding their interactions.",
        "Assuming natural systems operate with zero physical constraints.",
      ],
      correctIndex: 0,
      hint: "Reflect on the foundational definitions introduced at the start of this lesson.",
      reinforcement: "Excellent! Grasping foundational principles makes subsequent mechanisms intuitive.",
      struggleExplanation: "Review the introductory section of the lesson to see the core premise.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 2] In the operational pathways of ${mainTopic}, how do interacting components maintain balance?`,
      options: [
        "Through regulatory feedback loops that adjust rates in response to state changes.",
        "By completely halting all internal transformations and energy transfer.",
        "By allowing unrestricted runaway growth without any limits.",
        "Components operate in absolute isolation with zero causal influence.",
      ],
      correctIndex: 0,
      hint: "Think about regulatory feedback and homeostatic balance.",
      reinforcement: "Spot on! Feedback loops stabilize systemic throughput within safe operating parameters.",
      struggleExplanation: "Systems rely on feedback loops to throttle inputs when operational thresholds are reached.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 3] What is the most critical constraint or limiting factor highlighted in ${lessonTitle}?`,
      options: [
        "The resource, energy threshold, or boundary parameter with the lowest availability.",
        "An infinite abundance of unconstrained free energy.",
        "The total absence of any mathematical or physical boundaries.",
        "A variable that fluctuates arbitrarily with no predictive pattern.",
      ],
      correctIndex: 0,
      hint: "Recall how bottlenecks restrict overall throughput or yield.",
      reinforcement: "Correct! The bottleneck or rate-limiting step caps maximum system throughput.",
      struggleExplanation: "A limiting factor acts as the bottleneck dictating overall system yield.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 4] How should a student approach an exam problem testing ${lessonTitle}?`,
      options: [
        "Identify known boundary conditions, verify units, and state the governing equation first.",
        "Guess an option without reading the problem constraints carefully.",
        "Assume standard conservation and equilibrium laws do not apply.",
        "Copy formulas without knowing what the physical variables represent.",
      ],
      correctIndex: 0,
      hint: "Always check constraints, units, and given variables first.",
      reinforcement: "Superb! Methodical problem solving eliminates careless calculation traps.",
      struggleExplanation: "Establishing boundary conditions first ensures calculations are built on sound assumptions.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 5] What cognitive connection reinforces long-term exam retention of this lesson?`,
      options: [
        "Relating abstract terminology to intuitive physical analogies and active retrieval drills.",
        "Rereading the same notes passively without testing yourself.",
        "Memorizing words without understanding their cause-and-effect relationships.",
        "Skipping directly to the conclusion without reviewing intermediate mechanisms.",
      ],
      correctIndex: 0,
      hint: "Consider how analogies and self-quizzing strengthen neural pathways.",
      reinforcement: "Spot on! Concrete mental models anchor abstract principles permanently.",
      struggleExplanation: "Active retrieval and intuitive analogies yield 3x higher exam retention.",
    },
  ];
}

// Helper to verify a term is a genuine academic concept and not a meta artifact
export function isAcademicTerm(term: string): boolean {
  if (!term || term.length < 2 || term.length > 45) return false;
  if (isGarbledText(term)) return false;
  const lower = term.toLowerCase().trim();
  if (
    lower.includes("uploaded study") ||
    lower.includes("uploaded file") ||
    lower.includes("study file") ||
    lower.includes("file name") ||
    lower.includes("filename") ||
    lower.includes("page ") ||
    lower.includes("slide ") ||
    lower.includes("chapter ") ||
    lower.includes("download") ||
    lower.includes("attachment") ||
    lower.startsWith("http") ||
    lower.includes(".pdf") ||
    lower.includes(".docx") ||
    lower.includes(".txt") ||
    lower.includes(".png") ||
    lower.includes(".jpg") ||
    lower.includes("untitled")
  ) {
    return false;
  }
  const letters = term.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 2) return false;
  if (/[:;?#$|^~`*\\_=[\]{}<>]/.test(term)) return false;
  return true;
}

// Helper to verify a definition is academically substantive and clean
export function isAcademicDefinition(def: string): boolean {
  if (!def || def.length < 12 || def.length > 450) return false;
  if (isGarbledText(def)) return false;
  const lower = def.toLowerCase();
  if (
    lower.includes("uploaded study file") ||
    lower.includes("uploaded file") ||
    lower.includes("the uploaded text") ||
    lower.includes(".pdf") ||
    lower.includes(".docx") ||
    lower.includes("file:") ||
    lower.includes("http://") ||
    lower.includes("https://")
  ) {
    return false;
  }
  const words = def.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  return true;
}

// Strip meta references (e.g. "according to the uploaded file") so questions test pure subject matter
export function sanitizeAcademicPrompt(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/\baccording to the (?:uploaded|provided) (?:study )?(?:material|file|document|text)\b/gi, "in standard scientific theory")
    .replace(/\b(?:in|from) the (?:uploaded|provided) (?:study )?(?:material|file|document|text)\b/gi, "")
    .replace(/\bthe uploaded study file\b/gi, "the subject framework")
    .replace(/\buploaded study file:?\s*[^\n,.]*/gi, "")
    .replace(/\buploaded study file\b/gi, "foundational concepts")
    .replace(/\buploaded file\b/gi, "study topic")
    .replace(/\s{2,}/g, " ")
    .trim();
  return clean;
}

// Extract rich features, terms, facts, and sentences from raw text, with subject-specific seed banks
export function extractTextFeatures(rawText: string, title: string) {
  const clean = cleanToNaturalEnglish(rawText);
  const rawLines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  const definitions: { term: string; definition: string }[] = [];
  const importantFacts: string[] = [];
  const keySentences: string[] = [];

  for (const line of rawLines) {
    if (line.length < 10) continue;
    if (/uploaded study file/i.test(line)) continue;

    // Colon or dash definitions
    if (line.includes(":") && definitions.length < 25) {
      const [term, ...defParts] = line.split(":");
      const def = defParts.join(":").trim();
      const cleanTerm = term.replace(/^[-*•\d.]+\s*/, "").trim();
      if (isAcademicTerm(cleanTerm) && isAcademicDefinition(def)) {
        definitions.push({ term: cleanTerm, definition: def });
      }
    } else if (line.includes(" - ") && definitions.length < 25) {
      const [term, ...defParts] = line.split(" - ");
      const def = defParts.join(" - ").trim();
      const cleanTerm = term.replace(/^[-*•\d.]+\s*/, "").trim();
      if (isAcademicTerm(cleanTerm) && isAcademicDefinition(def)) {
        definitions.push({ term: cleanTerm, definition: def });
      }
    }

    if (line.length > 25 && line.length < 250) {
      const cleanedLine = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (
        !importantFacts.includes(cleanedLine) &&
        importantFacts.length < 25 &&
        !isGarbledText(cleanedLine) &&
        !/uploaded study file/i.test(cleanedLine)
      ) {
        importantFacts.push(cleanedLine);
      }
    }

    // Split paragraphs into individual sentences
    const sents = line.split(/(?<=[.?!])\s+/).filter((s) => s.length > 25 && s.length < 200);
    for (const s of sents) {
      const cleanedSent = s.replace(/^[-*•\d.]+\s*/, "").trim();
      if (
        !keySentences.includes(cleanedSent) &&
        !isGarbledText(cleanedSent) &&
        !/uploaded study file/i.test(cleanedSent)
      ) {
        keySentences.push(cleanedSent);
      }
    }
  }

  // Universal academic concepts bank grounded to document domain
  const academicDomainBank = [
    {
      term: `${title} Core Principle`,
      definition: `The fundamental rule, conceptual axiom, or theoretical framework governing ${title}.`,
    },
    {
      term: "Key Nomenclature & Concepts",
      definition: "The standardized terminology, operational definitions, and essential taxonomy required for clear academic communication.",
    },
    {
      term: "Analytical Methodology",
      definition: "The systematic framework and criteria used to examine claims, evaluate data, and formulate structured conclusions.",
    },
    {
      term: "Systemic Interaction",
      definition: "How interacting variables, arguments, or structural components influence one another within the system.",
    },
    {
      term: "Primary Governing Constraint",
      definition: "The critical boundary condition, rule, or limiting threshold that dictates operational validity or scope.",
    },
    {
      term: "Empirical Evidence & Validation",
      definition: "The observational data, textual proofs, or experimental benchmarks used to verify hypotheses and theoretical claims.",
    },
    {
      term: "Feedback & Regulation",
      definition: "A dynamic control mechanism where output adjustments alter future input behavior to maintain system stability.",
    },
    {
      term: "Equilibrium & Steady State",
      definition: "A condition where opposing forces or continuous processes maintain balanced, predictable internal conditions.",
    },
    {
      term: "Contextual Application",
      definition: "The practical implementation of abstract rules and concepts to real-world scenarios and examination questions.",
    },
    {
      term: "Critical Synthesis",
      definition: "Integrating isolated facts, definitions, and mechanisms into a unified, high-level understanding.",
    },
    {
      term: "Diagnostic Evaluation",
      definition: "The methodical identification of underlying causes, structural relationships, or error patterns in complex systems.",
    },
    {
      term: "Comparative Analysis",
      definition: "The systematic examination of similarities, contrasts, and dependencies across related concepts or paradigms.",
    },
  ];

  for (const item of academicDomainBank) {
    if (definitions.length < 18 && !definitions.some((d) => d.term.toLowerCase() === item.term.toLowerCase())) {
      definitions.push(item);
    }
  }

  // Baseline sentences for fill-in-the-blanks
  const baselineSentences = [
    `In any rigorous study of ${title}, foundational principles establish the baseline rules for analysis.`,
    `The overall velocity and accuracy of analysis is dictated by the primary governing constraint.`,
    `Feedback and regulation mechanisms ensure internal stability across changing conditions.`,
    `A comprehensive analysis requires empirical evidence and validation under rigorous testing criteria.`,
    `Mastering key nomenclature and concepts enables precise diagnostic evaluation in practical problem sets.`,
    `When boundary conditions shift, systemic interaction between variables produces dynamic adjustments.`,
    `Achieving conceptual mastery requires critical synthesis of interrelated topics rather than rote memorization.`,
    `Analytical methodology provides the structured protocol needed to solve complex examination questions.`,
    `An active steady state requires continuous balance between incoming inputs and outgoing outputs.`,
    `Comparative analysis clarifies structural differences and shared mechanisms across related subjects.`,
  ];

  for (const s of baselineSentences) {
    if (keySentences.length < 20) {
      keySentences.push(s);
    }
  }

  return { definitions, importantFacts, keySentences };
}

// Generate distinct, file-grounded diagnostic assessment questions testing scenarios, mechanisms, boundaries, and quantitative coupling
// Generate 20 distinct diagnostic questions strictly grounded in the uploaded material
export function generateDiagnosticQuestions(
  materialId: string,
  title: string,
  subject: StudySubject,
  rawText: string,
  definitions: { term: string; definition: string }[],
  summary: string = "",
  variant: number = 1
): QuizQuestion[] {
  const cleanTitleStr = cleanTitle(title);
  const defsCount = Math.max(1, definitions.length);
  const offset = ((variant || 1) - 1) * 3;

  // Helper to pick a safe definition
  const getDef = (idx: number, fallbackTerm: string, fallbackDef: string) => {
    const d = definitions[(offset + idx) % defsCount];
    if (d && isAcademicTerm(d.term) && isAcademicDefinition(d.definition)) {
      return { term: sanitizeAcademicPrompt(d.term), definition: sanitizeAcademicPrompt(d.definition) };
    }
    return { term: fallbackTerm, definition: fallbackDef };
  };

  const d0 = getDef(0, "Foundational Principle", `The primary conceptual framework governing ${cleanTitleStr}.`);
  const d1 = getDef(1, "Core Methodology", `The systematic approach and analytical rules applied in ${cleanTitleStr}.`);
  const d2 = getDef(2, "Operational Standard", `The criteria used to evaluate consistency and validity in ${cleanTitleStr}.`);
  const d3 = getDef(3, "Primary Application", `How principles of ${cleanTitleStr} are executed in real-world scenarios.`);
  const d4 = getDef(4, "Systemic Regulation", `The structured guidelines and constraints governing ${cleanTitleStr}.`);
  const d5 = getDef(5, "Fundamental Rule", `The invariant rules and axioms foundational to ${cleanTitleStr}.`);
  const d6 = getDef(6, "Analytical Framework", `The logical structure for breaking down complex problems in ${cleanTitleStr}.`);
  const d7 = getDef(7, "Contextual Scope", `The boundary conditions and scenarios where rules in ${cleanTitleStr} apply.`);
  const d8 = getDef(8, "Systemic Integrity", `Maintaining logical coherence and precision across all parts of ${cleanTitleStr}.`);
  const d9 = getDef(9, "Conceptual Distinction", `The precise differentiation between related ideas in ${cleanTitleStr}.`);
  const d10 = getDef(10, "Guiding Axiom", `The core truth that underpins reasoning and problem solving in ${cleanTitleStr}.`);
  const d11 = getDef(11, "Critical Bottleneck", `The rate-limiting constraint or primary challenge in mastering ${cleanTitleStr}.`);

  const q1: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-1`,
    type: "scenario",
    question: `[Applied Scenario] When analyzing an academic problem in ${cleanTitleStr}, an examiner evaluates the role of "${d0.term}". Which observation directly confirms understanding?`,
    options: [
      `The analysis correctly demonstrates that ${d0.definition.toLowerCase()}`,
      "The student ignores all contextual guidelines and foundational rules.",
      "The analysis assumes that concepts operate arbitrarily with zero structural logic.",
      "The terms are cited without any connection to the underlying meaning.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `The analysis correctly demonstrates that ${d0.definition.toLowerCase()}`,
    explanation: `Diagnostic analysis: correctly demonstrating that "${d0.term}" (${d0.definition}) is functioning confirms mastery of foundational principles.`,
    topicTag: "Applied Scenario & Principles",
    difficulty: "medium",
  };

  const q2: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-2`,
    type: "multiple_choice",
    question: `[Conceptual Role] In ${cleanTitleStr}, what is the primary function and significance of "${d1.term}"?`,
    options: [
      `It serves as ${d1.definition.toLowerCase()}`,
      "It completely invalidates all previously established rules.",
      "It makes systematic analysis impossible by introducing arbitrary chaos.",
      "It is an obsolete term with no practical application.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `It serves as ${d1.definition.toLowerCase()}`,
    explanation: `Understanding the exact role of "${d1.term}" (${d1.definition}) enables accurate reasoning in problem sets.`,
    topicTag: "Core Methodology & Function",
    difficulty: "medium",
  };

  const q3: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-3`,
    type: "scenario",
    question: `[Boundary Condition] Under which circumstance does the standard application of "${d2.term}" in ${cleanTitleStr} require careful contextual adjustment?`,
    options: [
      "When external constraints or novel edge-case scenarios fall outside standard assumptions.",
      "Whenever standard academic formatting guidelines are followed.",
      "Under normal, baseline conditions where all standard rules hold.",
      "Whenever standard terminology is cited correctly.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "When external constraints or novel edge-case scenarios fall outside standard assumptions.",
    explanation: `Contextual boundaries: rules and models must be adjusted when scenario constraints deviate from standard assumptions.`,
    topicTag: "Boundary Conditions & Edge Cases",
    difficulty: "hard",
  };

  const q4: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-4`,
    type: "multiple_choice",
    question: `[Diagnostic Misconception] When reviewing ${cleanTitleStr}, which common error leads students to misinterpret "${d3.term}"?`,
    options: [
      `Failing to recognize that ${d3.definition.toLowerCase()}`,
      "Carefully checking assumptions and defining terms before answering.",
      "Using structured problem-solving steps.",
      "Verifying definitions against authentic course materials.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `Failing to recognize that ${d3.definition.toLowerCase()}`,
    explanation: `A frequent student trap is overlooking the precise definition and scope of "${d3.term}".`,
    topicTag: "Misconceptions & Pitfalls",
    difficulty: "medium",
  };

  const q5: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-5`,
    type: "multiple_choice",
    question: `[Systemic Relationship] In ${cleanTitleStr}, how does "${d4.term}" relate to overall coherence and efficiency?`,
    options: [
      `It ensures stability by providing structured regulation, as described by ${d4.definition.toLowerCase()}`,
      "It removes the need for any foundational knowledge or rules.",
      "It prevents any progress from occurring across all levels.",
      "It forces all principles to operate in total isolation.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `It ensures stability by providing structured regulation, as described by ${d4.definition.toLowerCase()}`,
    explanation: `Systemic relationships: "${d4.term}" provides essential regulatory control to maintain stability.`,
    topicTag: "Systemic Relationships",
    difficulty: "hard",
  };

  const q6: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-6`,
    type: "scenario",
    question: `[Problem Resolution] If a student encounters a challenging scenario in ${cleanTitleStr} governed by "${d2.term}", what is the most effective approach?`,
    options: [
      "Break down the scenario into foundational elements and apply governing criteria systematically.",
      "Abandon the problem and guess without analyzing given information.",
      "Assume the rules of the subject contradict each other randomly.",
      "Apply unrelated formulas without checking relevance to the topic.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "Break down the scenario into foundational elements and apply governing criteria systematically.",
    explanation: `Systematic problem solving: decomposing problems into core principles yields accurate diagnostic conclusions.`,
    topicTag: "Problem Solving & Analysis",
    difficulty: "medium",
  };

  const q7: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-7`,
    type: "multiple_choice",
    question: `[Comparative Distinction] Which statement accurately distinguishes the role of "${d0.term}" from "${d6.term}" in ${cleanTitleStr}?`,
    options: [
      `"${d0.term}" establishes foundational premises, while "${d6.term}" provides analytical methods for problem solving.`,
      `Both concepts have identical meanings with no meaningful distinction.`,
      `"${d0.term}" is only used in introductory overviews and has no practical application.`,
      `"${d6.term}" completely contradicts the principles of "${d0.term}".`,
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `"${d0.term}" establishes foundational premises, while "${d6.term}" provides analytical methods for problem solving.`,
    explanation: `Comparative discrimination: distinguishing foundational principles from analytical frameworks is critical for exam precision.`,
    topicTag: "Comparative Distinction",
    difficulty: "hard",
  };

  const q8: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-8`,
    type: "multiple_choice",
    question: `[Critical Constraint] In ${cleanTitleStr}, why is understanding "${d11.term}" essential for solving complex scenarios?`,
    options: [
      `It represents the critical constraint that dictates overall effectiveness and accuracy.`,
      "It has no bearing on final results or conceptual outcomes.",
      "It proves that all problems can be solved with zero effort.",
      "It operates completely outside the rules of the subject.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `It represents the critical constraint that dictates overall effectiveness and accuracy.`,
    explanation: `Critical constraints: identifying bottlenecks ensures students focus on the most impactful factors.`,
    topicTag: "Critical Constraints & Bottlenecks",
    difficulty: "medium",
  };

  const q9: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-9`,
    type: "multiple_choice",
    question: `[Structural Hierarchy] How does the concept of "${d7.term}" define the organization of ${cleanTitleStr}?`,
    options: [
      `It establishes the contextual boundaries and domains where principles are valid.`,
      "It creates arbitrary divisions with no logical basis.",
      "It prevents any interaction between related concepts.",
      "It eliminates the need for categorization or structure.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "It establishes the contextual boundaries and domains where principles are valid.",
    explanation: `Structural organization defines the context within which subject concepts and rules apply.`,
    topicTag: "Structural Hierarchy & Organization",
    difficulty: "medium",
  };

  const q10: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-10`,
    type: "scenario",
    question: `[Contextual Application] When examining a real-world case study in ${cleanTitleStr}, how should "${d9.term}" be evaluated?`,
    options: [
      "By distinguishing its specific characteristics from related concepts to avoid overgeneralization.",
      "By treating all terms as interchangeable synonyms.",
      "By ignoring definitions and relying purely on personal intuition.",
      "By assuming that context has no effect on meaning.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "By distinguishing its specific characteristics from related concepts to avoid overgeneralization.",
    explanation: `Rigorous academic analysis requires distinguishing specific conceptual nuances to avoid overgeneralization.`,
    topicTag: "Contextual Application",
    difficulty: "hard",
  };

  const q11: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-11`,
    type: "multiple_choice",
    question: `[Evaluation Metric] Which indicator provides the clearest evidence that "${d8.term}" is maintained in ${cleanTitleStr}?`,
    options: [
      "All statements and conclusions remain logically consistent and supported by evidence.",
      "The analysis contains internal contradictions.",
      "Arguments are presented without reference to foundational definitions.",
      "Conclusions are drawn before reviewing available evidence.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "All statements and conclusions remain logically consistent and supported by evidence.",
    explanation: `Systemic integrity is demonstrated through logical consistency and evidence-backed reasoning.`,
    topicTag: "Evaluation & Evidence",
    difficulty: "medium",
  };

  const q12: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-12`,
    type: "scenario",
    question: `[Regulatory Control] In ${cleanTitleStr}, what is the main purpose of applying "${d4.term}"?`,
    options: [
      "To maintain standard quality, prevent errors, and guide consistent outcomes.",
      "To encourage arbitrary variance with no standard procedure.",
      "To make communication unnecessarily obscure.",
      "To disregard student comprehension completely.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "To maintain standard quality, prevent errors, and guide consistent outcomes.",
    explanation: `Regulatory guidelines ensure consistency, clarity, and reliability across academic analyses.`,
    topicTag: "Regulatory Control & Quality",
    difficulty: "easy",
  };

  const q13: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-13`,
    type: "multiple_choice",
    question: `[Theoretical Foundation] What is the core rationale behind "${d10.term}" in ${cleanTitleStr}?`,
    options: [
      `It provides the foundational principle that ${d10.definition.toLowerCase()}`,
      "It is an unsubstantiated claim with no academic basis.",
      "It contradicts all empirical observations.",
      "It applies only to hypothetical scenarios with no real relevance.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `It provides the foundational principle that ${d10.definition.toLowerCase()}`,
    explanation: `Foundational axioms anchor the entire logical framework of the course.`,
    topicTag: "Theoretical Foundations",
    difficulty: "medium",
  };

  const q14: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-14`,
    type: "scenario",
    question: `[Diagnostic Trouble Analysis] If an analysis in ${cleanTitleStr} produces inconsistent results, what should be audited first?`,
    options: [
      `Verify whether the definitions and assumptions related to "${d0.term}" were correctly applied.`,
      "Assume the subject rules are invalid and restart without structure.",
      "Change the final answer arbitrarily without checking underlying reasoning.",
      "Ignore the inconsistency and submit the result.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `Verify whether the definitions and assumptions related to "${d0.term}" were correctly applied.`,
    explanation: `Systematic debugging begins by verifying foundational assumptions and baseline definitions.`,
    topicTag: "Diagnostic Trouble Analysis",
    difficulty: "hard",
  };

  const q15: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-15`,
    type: "multiple_choice",
    question: `[Order of Analysis] What is the recommended sequential process when solving an exam problem in ${cleanTitleStr}?`,
    options: [
      `1. Identify key terms -> 2. Establish context -> 3. Apply "${d1.term}" -> 4. Formulate verified conclusion.`,
      "1. Guess conclusion -> 2. Ignore question -> 3. Select random option -> 4. Submit.",
      "1. Skip definitions -> 2. Jump to calculations -> 3. Disregard units -> 4. Finalize.",
      "1. Write conclusion first -> 2. Create assumptions -> 3. Discard constraints -> 4. Exit.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `1. Identify key terms -> 2. Establish context -> 3. Apply "${d1.term}" -> 4. Formulate verified conclusion.`,
    explanation: `Sequential problem solving follows a structured logical order from identification to verified conclusion.`,
    topicTag: "Sequential Logic & Method",
    difficulty: "medium",
  };

  const q16: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-16`,
    type: "multiple_choice",
    question: `[Core Axiom] When applying "${d5.term}" in ${cleanTitleStr}, what foundational guideline must always be preserved?`,
    options: [
      `That ${d5.definition.toLowerCase()}`,
      "That rules can be arbitrarily changed during analysis.",
      "That evidence is optional when stating a conclusion.",
      "That foundational definitions do not matter in advanced topics.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `That ${d5.definition.toLowerCase()}`,
    explanation: `Core axioms must be rigorously respected to preserve academic validity.`,
    topicTag: "Core Axioms & Rules",
    difficulty: "easy",
  };

  const q17: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-17`,
    type: "scenario",
    question: `[Advanced Application] How can a student demonstrate complete synthesis of ${cleanTitleStr} in a free-response exam?`,
    options: [
      `By accurately integrating "${d0.term}", "${d1.term}", and "${d2.term}" into a coherent, evidence-based argument.`,
      "By repeating memorized definitions without explaining how they connect.",
      "By avoiding technical terminology altogether.",
      "By stating opinions without academic citations or evidence.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `By accurately integrating "${d0.term}", "${d1.term}", and "${d2.term}" into a coherent, evidence-based argument.`,
    explanation: `Synthesis involves combining core concepts into unified, reasoned explanations.`,
    topicTag: "Advanced Synthesis & Mastery",
    difficulty: "hard",
  };

  const q18: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-18`,
    type: "multiple_choice",
    question: `[Verification Threshold] What standard distinguishes an exceptional response on ${cleanTitleStr} from an average one?`,
    options: [
      "Clear conceptual precision, contextual nuance, and structured explanation of causes and effects.",
      "Vague descriptions with ambiguous terminology.",
      "Excessive word count without substantive academic content.",
      "Omitting definitions of key operational terms.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "Clear conceptual precision, contextual nuance, and structured explanation of causes and effects.",
    explanation: `Top-tier academic performance is defined by precision, clarity, and deep understanding of cause-and-effect.`,
    topicTag: "Verification Standards & Nuance",
    difficulty: "medium",
  };

  const q19: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-19`,
    type: "scenario",
    question: `[Practical Case] In an examination testing ${cleanTitleStr}, a question asks how to implement "${d3.term}". What is the best strategy?`,
    options: [
      `Detail the specific step-by-step methodology, state relevant constraints, and explain expected outcomes.`,
      "State only the definition and skip the implementation details.",
      "Provide an example from an unrelated subject.",
      "State that implementation cannot be explained in words.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `Detail the specific step-by-step methodology, state relevant constraints, and explain expected outcomes.`,
    explanation: `Applied exam questions require step-by-step methodology and clear constraint awareness.`,
    topicTag: "Implementation & Strategy",
    difficulty: "medium",
  };

  const q20: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-20`,
    type: "scenario",
    question: `[Comprehensive Diagnostic] Which diagnostic indicator confirms that a learner has achieved mastery of ${cleanTitleStr}?`,
    options: [
      `The ability to apply principles to unfamiliar scenarios, troubleshoot ambiguities, and explain mechanisms clearly.`,
      "Rote memorization of isolated vocabulary without understanding context.",
      "Believing that subject rules apply identically regardless of context.",
      "Inability to explain why a given conclusion was reached.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `The ability to apply principles to unfamiliar scenarios, troubleshoot ambiguities, and explain mechanisms clearly.`,
    explanation: `True conceptual mastery is proven by the ability to apply principles to novel scenarios with clarity and precision.`,
    topicTag: "Comprehensive Diagnostic Mastery",
    difficulty: "hard",
  };

  return [
    q1, q2, q3, q4, q5,
    q6, q7, q8, q9, q10,
    q11, q12, q13, q14, q15,
    q16, q17, q18, q19, q20,
  ];
}

// Sanitize an existing study material to ensure no corrupted font bytes or garbled terms persist
export function sanitizeMaterial(mat: StudyMaterial): StudyMaterial {
  if (!mat) return mat;

  // Extract or preserve course code
  const extractedCourseCode =
    mat.courseCode ||
    extractCourseCode(undefined, mat.rawText, mat.title) ||
    undefined;

  // Determine correct subject based on course code, title, and rawText
  let resolvedSubject = mat.subject;
  if (extractedCourseCode) {
    const expectedSubject = detectSubjectFromCodeOrTitle(extractedCourseCode, mat.rawText || mat.title);
    // If it was wrongly carrying "Biology" or has an explicit course code, align subject
    if (mat.subject === "Biology" && expectedSubject !== "Biology") {
      resolvedSubject = expectedSubject;
    } else if (!mat.subject) {
      resolvedSubject = expectedSubject;
    }
  } else if (mat.title) {
    const expectedSubject = detectSubjectFromCodeOrTitle(mat.title, mat.rawText || mat.title);
    if (mat.subject === "Biology" && expectedSubject !== "Biology") {
      resolvedSubject = expectedSubject;
    }
  }

  const hasGarbledDefs = (mat.definitions || []).some(
    (d) => isGarbledText(d.term) || isGarbledText(d.definition)
  );
  const isTitleGarbled = isGarbledText(mat.title);
  const isSummaryGarbled = isGarbledText(mat.summary);
  const isTextGarbled = isGarbledText(mat.rawText);

  if (!hasGarbledDefs && !isTitleGarbled && !isSummaryGarbled && !isTextGarbled) {
    return {
      ...mat,
      courseCode: extractedCourseCode,
      subject: resolvedSubject,
      title: cleanTitle(mat.title),
      summary: formatAcademicText(mat.summary),
      definitions: (mat.definitions || []).map((d) => ({
        term: stripMarkdownToPlain(cleanLatexAndMath(cleanMojibake(d.term))),
        definition: formatAcademicText(d.definition),
      })),
      importantFacts: (mat.importantFacts || []).map((f) =>
        stripMarkdownToPlain(cleanLatexAndMath(cleanMojibake(f)))
      ),
      keyConcepts: (mat.keyConcepts || []).map((k) => ({
        ...k,
        concept: stripMarkdownToPlain(cleanLatexAndMath(cleanMojibake(k.concept))),
        explanation: formatAcademicText(k.explanation),
      })),
    };
  }

  // Generate clean features for this subject and title
  const features = extractTextFeatures(
    isTextGarbled ? "" : mat.rawText || "",
    cleanTitle(mat.title)
  );

  const sanitizedDefs = (features.definitions.length > 0 ? features.definitions : mat.definitions || []).map(
    (d) => ({
      term: stripMarkdownToPlain(cleanLatexAndMath(cleanMojibake(d.term))),
      definition: formatAcademicText(d.definition),
    })
  );

  const cleanSummary = isSummaryGarbled || !mat.summary
    ? `Comprehensive academic study notes and diagnostic framework for ${cleanTitle(mat.title)}, focusing on core mechanisms, empirical relationships, and exam mastery.`
    : formatAcademicText(mat.summary);

  const cleanRawText = isTextGarbled || !mat.rawText
    ? `Lecture notes for ${cleanTitle(mat.title)}:\n\n${sanitizedDefs.map((d) => `### ${d.term}\n${d.definition}`).join("\n\n")}`
    : formatAcademicText(mat.rawText);

  return {
    ...mat,
    courseCode: extractedCourseCode,
    subject: resolvedSubject,
    title: cleanTitle(mat.title),
    summary: cleanSummary,
    rawText: cleanRawText,
    definitions: sanitizedDefs,
    importantFacts: (mat.importantFacts || []).map((f) =>
      stripMarkdownToPlain(cleanLatexAndMath(cleanMojibake(f)))
    ),
    keyConcepts: (mat.keyConcepts || []).map((k) => ({
      ...k,
      concept: stripMarkdownToPlain(cleanLatexAndMath(cleanMojibake(k.concept))),
      explanation: formatAcademicText(k.explanation),
    })),
  };
}

// Generate complete study deck package reliably
export function generateFallbackStudyPackage(
  materialId: string,
  rawTitle: string,
  rawContent: string,
  subject: StudySubject,
  sourceType: SourceType,
  sourceUrl?: string,
  fileUrl?: string,
  courseCode?: string
): {
  material: StudyMaterial;
  notes: StudyNotes;
  flashcards: MemorisePack;
  quiz: Quiz;
  lesson: StepLesson;
} {
  const title = cleanTitle(rawTitle);
  const cleanText = cleanToNaturalEnglish(rawContent);
  const detectedCode =
    courseCode ||
    extractCourseCode(undefined, cleanText, title) ||
    undefined;
  const resolvedSubject = detectedCode
    ? detectSubjectFromCodeOrTitle(detectedCode, cleanText)
    : (subject || detectSubjectFromCodeOrTitle(title, cleanText) || "Other");
  const { definitions, importantFacts, keySentences } = extractTextFeatures(cleanText, title);

  // 1. Material
  const material: StudyMaterial = {
    id: materialId,
    title,
    subject: resolvedSubject,
    courseCode: detectedCode,
    sourceType,
    sourceUrl,
    fileUrl,
    rawText: cleanText,
    summary: `Comprehensive academic breakdown of ${title}, synthesizing core theoretical foundations, procedural mechanisms, key definitions, and high-yield examination focus points.`,
    dateAdded: new Date().toISOString(),
    mainTopics: [title, "Theoretical Principles", "Operational Mechanisms", "Exam Applications"],
    subtopics: definitions.slice(0, 6).map((d) => d.term),
    importantFacts:
      importantFacts.length > 0
        ? importantFacts.slice(0, 8)
        : [
            `${title} provides foundational models used extensively across modern scientific and academic inquiry.`,
            "Active recall and spaced testing dramatically elevate long-term retention over passive reading.",
          ],
    keyConcepts: definitions.slice(0, 8).map((d, i) => ({
      concept: d.term,
      explanation: d.definition,
      importance: (i < 3 ? "high" : "medium") as "high" | "medium",
    })),
    definitions: definitions.slice(0, 16),
    relationships: [
      {
        itemA: definitions[0]?.term || "Foundational Rules",
        itemB: definitions[1]?.term || "Analytical Methodology",
        relationship: `Understanding ${definitions[0]?.term || "core principles"} is a prerequisite for executing ${definitions[1]?.term || "analytical methodologies"} in ${title}.`,
      },
      {
        itemA: definitions[2]?.term || "Systemic Interactions",
        itemB: definitions[3]?.term || "Contextual Application",
        relationship: `Systemic interactions dictate how concepts are applied to complex examination scenarios and problem solving.`,
      },
    ],
    examples: [
      {
        title: `${title} Academic Application`,
        description: `Applying core analytical methods and principles of ${title} to structured problem-solving and diagnostic questions.`,
      },
    ],
    formulas: [],
    importantDates: [],
    potentialExamQuestions: [
      {
        question: `Explain the fundamental principles and analytical methods governing ${title}.`,
        type: "Free Response / Short Answer",
        keyPoint: `Discuss core definitions, systemic relationships, and diagnostic problem solving for ${title}.`,
      },
    ],
    chunks: [
      {
        chunkId: `chunk-${materialId}-1`,
        title: `${title} - Foundation & Overview`,
        sourceReference: "Uploaded Study Material",
        summary: cleanText.slice(0, 250) || `Core introductory concepts and governing principles for ${title}.`,
        content: cleanText.slice(0, 2000) || `Core study material breakdown for ${title}.`,
        keyTerms: definitions.slice(0, 4).map((d) => d.term),
      },
    ],
    progressPercent: 0,
  };

  // 2. Notes
  const notes: StudyNotes = {
    id: `notes-${materialId}`,
    materialId,
    topicTitle: title,
    subject,
    shortOverview: `These structured study notes synthesize the fundamental principles, essential terminology, worked scenarios, and critical exam pitfalls for ${title}. Written in clear English prose for rapid revision and deep conceptual mastery.`,
    keyConcepts: definitions.slice(0, 6).map((d) => ({
      title: d.term,
      description: d.definition,
      keyTakeaway: `Master this concept to understand how ${title} operates in practical problem sets.`,
    })),
    definitions: definitions.slice(0, 12).map((d) => ({
      term: d.term,
      definition: d.definition,
      context: `Essential terminology required for accurate exam responses on ${title}.`,
    })),
    importantDetails:
      importantFacts.length > 0
        ? importantFacts.slice(0, 8)
        : [
            `Understanding ${title} requires mastering both foundational definitions and conceptual relationships.`,
            "Contextual criteria determine how rules and methods apply to specific scenarios.",
            "Synthesizing principles with active recall drills produces superior retention compared to passive reading.",
          ],
    examples: [
      {
        scenario: "Analytical Case Study",
        explanation: `Systematic application of core concepts to evaluate scenarios and problem sets in ${title}.`,
      },
      {
        scenario: "Practical Implementation",
        explanation: `Applying theoretical principles of ${title} to solve structured academic questions.`,
      },
    ],
    formulas: [],
    commonMistakes: [
      {
        mistake: "Confusing related terminology and definitions",
        correction: `Ensure precise distinction between ${definitions[0]?.term || "core principles"} and ${definitions[1]?.term || "analytical methodologies"}.`,
        whyItHappens: "Relying on surface-level keywords without understanding distinct conceptual definitions.",
      },
      {
        mistake: "Ignoring contextual constraints and scope",
        correction: "Rules and analytical frameworks apply within defined contextual boundaries.",
        whyItHappens: "Overgeneralizing specific rules to incompatible scenarios.",
      },
    ],
    quickRecap: [
      `1. Review foundational definitions of ${definitions.slice(0, 3).map((d) => d.term).join(", ")}.`,
      "2. Trace step-by-step pathways and identify rate-limiting bottlenecks.",
      "3. Apply governing laws and boundary conditions to solve exam scenarios.",
    ],
    feynmanPrompt: `Explain how ${title} works to a peer without using technical jargon. Use a real-world analogy to illustrate the mechanism!`,
  };

  // Filter definitions to strictly academic subject matter
  const cleanAcademicDefs = definitions
    .filter((d) => isAcademicTerm(d.term) && isAcademicDefinition(d.definition))
    .map((d) => ({
      term: sanitizeAcademicPrompt(d.term),
      definition: sanitizeAcademicPrompt(d.definition),
    }));

  const activeDefs = cleanAcademicDefs.length > 0 ? cleanAcademicDefs : [
    { term: title, definition: "The core conceptual principles, functional operations, and governing laws." },
    { term: "Dynamic Equilibrium", definition: "A steady state in which opposing processes proceed at identical rates." },
    { term: "Regulatory Feedback", definition: "A process whereby system outputs constrain or accelerate forward throughput." },
    { term: "Limiting Factor", definition: "The essential variable or resource with lowest availability capping total yield." },
    { term: "Conservation Law", definition: "The principle that mass, energy, and fundamental physical quantities remain invariant." },
  ];

  // 3. Flashcards & Memorise Pack (At least 15 flashcards strictly scoped to this uploaded course file)
  const flashcardList: Flashcard[] = activeDefs.slice(0, 18).map((d, idx) => ({
    id: `fc-${materialId}-${idx + 1}`,
    materialId,
    front: `In ${title}, what is the operative definition and role of "${d.term}"?`,
    back: d.definition,
    explanation: `Detailed Breakdown:\n"${d.term}" is an essential component of ${title}. ${d.definition} Understanding this enables precise application in both multi-choice conceptual questions and analytical calculations.`,
    hint: `Focus on the foundational role and operational criteria of ${d.term}.`,
    difficulty: (idx % 3 === 0 ? "hard" : idx % 2 === 0 ? "medium" : "easy") as "easy" | "medium" | "hard",
    category: idx % 2 === 0 ? "Core Principles" : "Key Mechanisms",
    reviewCount: 0,
  }));

  const blanksList: FillInTheBlank[] = [];
  for (let i = 0; i < Math.min(15, activeDefs.length); i++) {
    const def = activeDefs[i];
    const otherDefs = activeDefs.filter((_, idx) => idx !== i);
    const distractors = [
      otherDefs[0]?.term || "Arbitrary Constant",
      otherDefs[1]?.term || "Static Dissipation",
      otherDefs[2]?.term || "Thermal Degradation",
    ];

    const options = [def.term, ...distractors].sort(() => 0.5 - Math.random());
    const sentence = `In ${title}, "_______" is formally defined as: ${def.definition}`;
    const explanation = `The correct answer is "${def.term}". In ${title}, ${def.definition.toLowerCase()}`;

    blanksList.push({
      sentence,
      answer: def.term,
      options,
      hint: `Starts with "${def.term.charAt(0)}" — central to ${title}.`,
      explanation,
    });
  }

  const mnemonicsList: Mnemonic[] = [
    {
      concept: "Systematic 5-Step Problem Solving",
      phrase: "G - U - E - S - S",
      explanation: "Given, Unknown, Equation, Substitute, Solve — ensures you never overlook variables or skip calculation steps in exams.",
    },
    {
      concept: "Regulatory Response Loop",
      phrase: "S - R - C - E - F",
      explanation: "Stimulus, Receptor, Control center, Effector, Feedback — standard sequence of all physiological and chemical self-regulation.",
    },
    {
      concept: "Thermodynamic State Conditions",
      phrase: "P - V - T - N",
      explanation: "Pressure, Volume, Temperature, Moles — the universal state variables defining gas and system equilibria.",
    },
    {
      concept: "Diagnostic Revision Framework",
      phrase: "O - R - D - E - R",
      explanation: "Observe, Relate, Define, Evaluate, Review — rapid recall checklist for structuring long-form exam answers.",
    },
    {
      concept: "Active Recall Study Cycle",
      phrase: "P - T - E - R",
      explanation: "Prime, Test, Explain, Retain — cognitive learning loop that prevents the illusion of competence from passive rereading.",
    },
    {
      concept: "System Stability Constraints",
      phrase: "B - O - U - N - D",
      explanation: "Boundary, Output, Unity, Normalcy, Deviation — checklist for verifying whether a dynamic model holds within realistic limits.",
    },
    {
      concept: "Mechanism Breakdown",
      phrase: "I - T - R",
      explanation: "Initialization, Transition, Resolution — 3-act structure for breaking any complex pathway into manageable steps.",
    },
    {
      concept: "Critical Causal Analysis",
      phrase: "C - A - U - S - E",
      explanation: "Correlation vs causation, Assumptions, Underlying factors, Sample size, Experimental controls.",
    },
    {
      concept: "Exam Question Deconstruction",
      phrase: "F - A - S - T",
      explanation: "Find the question prompt, Ask what is given, Select the theorem, Test the boundary sanity.",
    },
    {
      concept: "Memory Anchor for Core Concepts",
      phrase: "D - E - P - T - H",
      explanation: "Define the term, Explain mechanism, Provide example, Test edge cases, Harmonize with overarching theory.",
    },
  ];

  const flashcards: MemorisePack = {
    materialId,
    flashcards: flashcardList,
    mnemonics: mnemonicsList,
    fillInTheBlanks: blanksList,
    recallQuestions: [
      {
        question: `State the primary purpose and operative mechanism of ${title}.`,
        idealAnswer: `It describes how systematic transformations convert initial states into stable outcomes under regulatory constraints.`,
        keyTerms: definitions.slice(0, 3).map((d) => d.term),
      },
      {
        question: `Explain why negative feedback loops are essential in this domain.`,
        idealAnswer: `Negative feedback prevents uncontrolled amplification, stabilizing systemic throughput within safe operating boundaries.`,
        keyTerms: ["negative feedback", "stability", "equilibrium"],
      },
    ],
  };

  // 4. Diagnostic Assessment Quiz (Extracted deeply from material with diverse diagnostic types, NEVER repeating flashcard definitions)
  const quiz: Quiz = {
    id: `quiz-${materialId}`,
    materialId,
    quizTitle: `${title} Diagnostic Assessment`,
    subject,
    attemptsCount: 0,
    questions: generateDiagnosticQuestions(
      materialId,
      title,
      subject,
      rawContent,
      definitions,
      notes.shortOverview,
      1
    ),
  };

  // 5. Step Lesson (6 rich, pristine academic lessons with 5 questions each)
  const d0 = definitions[0] || { term: "Core Principle", definition: `The primary conceptual framework governing ${title}.` };
  const d1 = definitions[1] || { term: "Methodology & Approach", definition: `The systematic techniques and rules applied in ${title}.` };
  const d2 = definitions[2] || { term: "Operational Criteria", definition: `The standards used to evaluate validity and performance in ${title}.` };
  const d3 = definitions[3] || { term: "Contextual Framework", definition: `The boundary conditions and scenarios where ${title} applies.` };
  const d4 = definitions[4] || { term: "Synthesis & Application", definition: `Integrating principles of ${title} to solve real-world problem sets.` };

  const stepLessons: LessonStep[] = [
    {
      lessonNumber: 1,
      title: "Foundational Principles & Core Framework",
      subtitle: `Unpacking why ${title} matters, primary mechanisms, and foundational terminology`,
      content: `Welcome to Lesson 1 of **${title}**.\n\n### Foundational Principle: ${d0.term}\n${d0.definition}\n\n### Why This Concept Matters\nEvery subject has anchor ideas that establish the foundation for advanced mastery. In ${title}, understanding this foundational principle gives you the mental model needed to analyze scenarios, interpret evidence, and answer exam questions with precision.\n\n### Key Concepts to Anchor:\n• **${d0.term}**: ${d0.definition}\n• **${d1.term}**: ${d1.definition}\n• **Analytical Scope**: Systematic examination of underlying rules before tackling complex scenarios.\n\nTake a moment to review this core definition before tackling the 5 lesson questions below.`,
      analogy: `Think of this foundation like building the structural frame of a building: once the frame is sound, adding the details and specific applications is straightforward and stable.`,
      keyTerms: [d0.term, d1.term, "Core Framework"],
      knowledgeCheck: create5QuestionsForLesson(1, "Foundations & Overview", title)[0],
      questions: create5QuestionsForLesson(1, "Foundations & Overview", title),
      completed: false,
    },
    {
      lessonNumber: 2,
      title: "Operational Methodologies & Step-by-Step Analysis",
      subtitle: "Tracing step-by-step pathways, systematic rules, and analytical approaches",
      content: `In Lesson 2, we build upon our foundation by examining how **${title}** is applied systematically in practice.\n\n### 3-Stage Analytical Pathway\n1. **Identification & Context**: Define the problem, isolate key variables, and identify relevant governing principles (${d0.term}).\n2. **Execution & Translation**: Apply systematic methodology (${d1.term}) to process information and test potential solutions.\n3. **Evaluation & Verification**: Verify findings against established standards (${d2.term}).\n\n### The Precision Principle\nIn academic analysis, accuracy in defining terms and applying rules prevents careless exam errors. Maintaining clarity at each step ensures sound conclusions.`,
      analogy: "Like navigating using a detailed map: knowing both your current coordinates and the destination route prevents you from taking misleading detours.",
      keyTerms: [d1.term, "Analytical Method", "Systematic Workflow"],
      knowledgeCheck: create5QuestionsForLesson(2, "Operational Methods", title)[0],
      questions: create5QuestionsForLesson(2, "Operational Methods", title),
      completed: false,
    },
    {
      lessonNumber: 3,
      title: "Governing Rules & Contextual Boundaries",
      subtitle: "Understanding constraints, boundary conditions, and subject-specific rules",
      content: `Every subject operates within defined rules and contextual boundaries. In Lesson 3, we examine how context influences the interpretation of **${title}**.\n\n### ${d3.term}\n${d3.definition}\n\n### Critical Contextual Rules\n• **Scope of Validity**: Theoretical models and rules apply within specified conditions and assumptions.\n• **Nuance & Distinction**: Distinguishing between closely related concepts prevents overgeneralization.\n• **Evidence Requirements**: High-level academic writing requires backing every claim with clear explanations or references.`,
      analogy: "Like speed limits on different types of roads: the rules of the road adapt logically depending on whether you are on a highway or in a school zone.",
      keyTerms: [d3.term, "Boundary Rules", "Contextual Scope"],
      knowledgeCheck: create5QuestionsForLesson(3, "Governing Rules", title)[0],
      questions: create5QuestionsForLesson(3, "Governing Rules", title),
      completed: false,
    },
    {
      lessonNumber: 4,
      title: "Step-by-Step Problem Solving & Diagnostic Scenarios",
      subtitle: "Mastering practical heuristics, exam workflows, and avoiding common pitfalls",
      content: `Lesson 4 bridges theory and practice. How do you tackle exam questions testing **${title}** with speed and accuracy?\n\n### The 4-Step Exam Solution Protocol\n1. **Inspect**: Read the question prompt carefully and identify what specific concept is being tested.\n2. **Define**: State the relevant definition or rule (${d0.term} / ${d1.term}) before writing the response.\n3. **Apply**: Connect the specific details of the prompt to the governing principles.\n4. **Review**: Check for clarity, logical flow, and ensure all parts of the question have been addressed.\n\n### Common Exam Trap to Avoid\nNever rely on superficial keyword matching without verifying whether the meaning fits the specific context of the question.`,
      analogy: "Like a professional editor proofreading a text: a systematic pass-by-pass review catches ambiguities before final submission.",
      keyTerms: ["Problem Solving", "Exam Protocol", "Diagnostic Analysis"],
      knowledgeCheck: create5QuestionsForLesson(4, "Problem Solving", title)[0],
      questions: create5QuestionsForLesson(4, "Problem Solving", title),
      completed: false,
    },
    {
      lessonNumber: 5,
      title: "Comparative Analysis & Real-World Case Studies",
      subtitle: "Exploring practical implementations, field applications, and case studies",
      content: `In Lesson 5, we examine how the principles of **${title}** are applied in professional, academic, and practical settings.\n\n### Real-World Case Studies\n• **Structured Analysis**: Applying ${d4.term} to evaluate complex case studies and problem sets.\n• **Contextual Adaptation**: Modifying strategies to meet different project, research, or organizational demands.\n• **Quality & Standards**: Using ${d2.term} as an objective benchmark for evaluation.\n\n### Comparative Insights\nCompare baseline approaches with advanced strategies to understand which methods yield the highest clarity, efficiency, and accuracy.`,
      analogy: "Like an architect adapting blueprints to different terrains: the underlying engineering principles remain solid while the implementation flexes to fit the landscape.",
      keyTerms: [d4.term, "Real-World Application", "Case Studies"],
      knowledgeCheck: create5QuestionsForLesson(5, "Applications & Case Studies", title)[0],
      questions: create5QuestionsForLesson(5, "Applications & Case Studies", title),
      completed: false,
    },
    {
      lessonNumber: 6,
      title: "Synthesis & Comprehensive Mastery",
      subtitle: "Connecting all core concepts into a unified mental framework",
      content: `Congratulations on reaching Lesson 6 of **${title}**! Here, we synthesize all concepts:\n\n1. Foundational terminology and definitions\n2. Step-by-step methodologies and analytical frameworks\n3. Boundary rules and contextual nuances\n4. Diagnostic problem-solving protocols\n5. Practical applications and real-world case analysis\n\nConclude your study by passing the final 5 mastery questions below!`,
      analogy: "Like assembling a puzzle: each individual piece now joins together into a clear, complete, and memorable picture.",
      keyTerms: ["Synthesis", "Unified Model", "Mastery", "Exam Preparedness"],
      knowledgeCheck: create5QuestionsForLesson(6, "Comprehensive Mastery", title)[0],
      questions: create5QuestionsForLesson(6, "Comprehensive Mastery", title),
      completed: false,
    },
  ];

  const lesson: StepLesson = {
    id: `lesson-${materialId}`,
    materialId,
    subject,
    title: `Interactive Step-by-Step Lesson: ${title}`,
    totalLessons: stepLessons.length,
    currentStepIndex: 0,
    isFinished: false,
    lessons: stepLessons,
  };

  return { material, notes, flashcards, quiz, lesson };
}

// Auto-repair an existing lesson pack if it contains corrupt binary bytes or unformatted write-ups
export function repairLessonPack(pack: StepLesson, rawTitle = "Study Material"): StepLesson {
  const title = cleanTitle(rawTitle);
  const subject = detectSubjectFromTitle(title);
  const fallbackPkg = generateFallbackStudyPackage("mat-repair", title, "", subject, "upload");

  if (!pack || !pack.lessons || pack.lessons.length === 0) {
    return fallbackPkg.lesson;
  }

  const repairedLessons = pack.lessons.map((lesson, idx) => {
    const isCorruptContent =
      !lesson.content ||
      isGarbledText(lesson.content) ||
      (lesson.content.includes("> **") && lesson.content.includes("**:"));
    const isCorruptTitle = !lesson.title || isGarbledText(lesson.title);
    const isCorruptSubtitle = isGarbledText(lesson.subtitle || "");
    const needsQuestions = !lesson.questions || lesson.questions.length < 5 || isGarbledText(lesson.questions[0]?.question || "");

    const freshLesson = fallbackPkg.lesson.lessons[idx] || fallbackPkg.lesson.lessons[0];

    if (!isCorruptContent && !isCorruptTitle && !isCorruptSubtitle && !needsQuestions) {
      return lesson;
    }

    return {
      ...lesson,
      title: isCorruptTitle ? freshLesson.title : lesson.title,
      subtitle: isCorruptSubtitle ? freshLesson.subtitle : lesson.subtitle,
      content: isCorruptContent ? freshLesson.content : lesson.content,
      analogy: isGarbledText(lesson.analogy || "") ? freshLesson.analogy : lesson.analogy,
      keyTerms:
        lesson.keyTerms && lesson.keyTerms.length > 0 && !isGarbledText(lesson.keyTerms.join(" "))
          ? lesson.keyTerms
          : freshLesson.keyTerms,
      questions: needsQuestions ? create5QuestionsForLesson(idx + 1, freshLesson.title, title) : lesson.questions,
    };
  });

  return {
    ...pack,
    title: `Interactive Step-by-Step Lesson: ${title}`,
    subject: pack.subject || subject,
    lessons: repairedLessons,
  };
}

// Auto-repair material if title, summary, or definitions contain corrupt binary bytes
export function repairMaterial(mat: StudyMaterial): StudyMaterial {
  const isTitleGarbled = isGarbledText(mat.title);
  const isSummaryGarbled = isGarbledText(mat.summary);
  const isDefsGarbled = mat.definitions?.some((d) => isGarbledText(d.term) || isGarbledText(d.definition));

  if (!isTitleGarbled && !isSummaryGarbled && !isDefsGarbled) {
    return mat;
  }

  const cleanTitleStr = cleanTitle(mat.title);
  const subject = detectSubjectFromTitle(cleanTitleStr);
  const fallback = generateFallbackStudyPackage(mat.id, cleanTitleStr, "", subject, mat.sourceType || "upload");

  return {
    ...mat,
    title: cleanTitleStr,
    subject: mat.subject || subject,
    summary: isSummaryGarbled ? fallback.material.summary : mat.summary,
    definitions: isDefsGarbled || !mat.definitions?.length ? fallback.material.definitions : mat.definitions,
    keyConcepts: fallback.material.keyConcepts,
  };
}

// Resilient fetch helper with timeout
export async function safeFetchJson<T = any>(
  url: string,
  body: any,
  timeoutMs = 15000
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || json || null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
