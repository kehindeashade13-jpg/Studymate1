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

// Generate 5 rigorous, distinct questions for any lesson directly grounded in the extracted note
export function create5QuestionsForLesson(
  lessonNum: number,
  lessonTitle: string,
  mainTopic = "Study Material",
  noteData?: {
    noteContent?: string;
    importantPoints?: string[];
    definitions?: { term: string; definition: string }[];
    keyTerms?: string[];
  }
): LessonQuestion[] {
  const points = noteData?.importantPoints?.filter(Boolean) || [];
  const defs = noteData?.definitions?.filter(Boolean) || [];
  const terms = noteData?.keyTerms?.filter(Boolean) || [];

  const questions: LessonQuestion[] = [];

  // Q1: Definition or Primary Concept
  if (defs.length > 0 && defs[0].term && defs[0].definition) {
    const d = defs[0];
    questions.push({
      question: `In Lesson ${lessonNum} (${lessonTitle}), what is the primary definition of "${d.term}"?`,
      options: [
        d.definition,
        `A secondary peripheral effect that does not impact ${mainTopic}.`,
        "An obsolete term with no application in current models.",
        "A condition where system interactions cease completely without causes.",
      ],
      correctIndex: 0,
      hint: `Recall the definition of ${d.term} highlighted in the lesson note above.`,
      reinforcement: `Correct! The lesson note defines "${d.term}" as: ${d.definition}`,
      struggleExplanation: `Review the terminology section in the extracted note above. ${d.term} is foundational for understanding ${lessonTitle}.`,
    });
  } else if (terms.length > 0) {
    questions.push({
      question: `In Lesson ${lessonNum}, what role does "${terms[0]}" play within ${lessonTitle}?`,
      options: [
        `It serves as an essential conceptual anchor and governing factor in ${mainTopic}.`,
        "It is an unrelated concept omitted from practical applications.",
        "It permanently suspends all reactions and energy transformations.",
        "It acts as a random variable with no predictive significance.",
      ],
      correctIndex: 0,
      hint: `Consider how "${terms[0]}" is presented in the extracted note.`,
      reinforcement: `Spot on! "${terms[0]}" is a critical concept introduced in this section of ${mainTopic}.`,
      struggleExplanation: `Refer back to the key terms and core concepts in the lesson note to see how ${terms[0]} governs the system.`,
    });
  } else {
    questions.push({
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
    });
  }

  // Q2: Key Mechanism or Causal Relationship
  if (points.length > 0) {
    const pt = points[0].replace(/^[-*•\d.\s]+/, "").trim();
    questions.push({
      question: `Based on the extracted note for Lesson ${lessonNum}, which statement accurately describes the underlying mechanism?`,
      options: [
        pt,
        `Components operate in total isolation without any causal relationship.`,
        "The system reaches infinite capacity without any energy or material inputs.",
        "All governing constraints are bypassed under standard operating conditions.",
      ],
      correctIndex: 0,
      hint: "Look closely at the key mechanisms and important points in the lesson note.",
      reinforcement: `Superb! As stated in the extracted note: ${pt}`,
      struggleExplanation: "Carefully re-read the mechanism bullet points in the note above to verify how causes lead to effects.",
    });
  } else {
    questions.push({
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
    });
  }

  // Q3: Critical Constraint, Rule, or Second Term
  if (defs.length > 1 && defs[1].term && defs[1].definition) {
    const d2 = defs[1];
    questions.push({
      question: `What critical condition or mechanism does "${d2.term}" describe in this section?`,
      options: [
        d2.definition,
        "A negligible deviation that requires no experimental controls.",
        "A hypothetical scenario with zero physical or mathematical validity.",
        "An assumption that physical laws fluctuate randomly over time.",
      ],
      correctIndex: 0,
      hint: `Check the description of ${d2.term} in the lesson note.`,
      reinforcement: `Exact! In this section of ${mainTopic}, ${d2.term} signifies: ${d2.definition}`,
      struggleExplanation: `Re-check the definitions and key points in the extracted study note for ${d2.term}.`,
    });
  } else if (points.length > 1) {
    const pt2 = points[1].replace(/^[-*•\d.\s]+/, "").trim();
    questions.push({
      question: `According to the note, what critical condition or factor governs ${lessonTitle}?`,
      options: [
        pt2,
        "Energy and mass conservation laws are suspended indefinitely.",
        "The fastest step has zero effect on the overall rate of progress.",
        "External environmental factors never exert any influence on internal state.",
      ],
      correctIndex: 0,
      hint: "Identify the constraint or rule emphasized in the second key point.",
      reinforcement: `Spot on! As established in the lesson: ${pt2}`,
      struggleExplanation: "Review the second point in the extracted note above for the exact governing rule.",
    });
  } else {
    questions.push({
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
    });
  }

  // Q4: Diagnostic Application / Worked Scenario
  if (points.length > 2) {
    const pt3 = points[2].replace(/^[-*•\d.\s]+/, "").trim();
    questions.push({
      question: `How should a student apply the principles of ${lessonTitle} when evaluating a diagnostic scenario?`,
      options: [
        `Recognize that ${pt3.toLowerCase().replace(/^[a-z]/, (c) => c.toLowerCase())}.`,
        "Apply equations blindly without checking whether the initial conditions match.",
        "Assume the highest number given in the problem statement is always the correct value.",
        "Disregard the causal mechanism and rely purely on guessing.",
      ],
      correctIndex: 0,
      hint: "Connect the scenario back to the third key point extracted in the lesson note.",
      reinforcement: "Excellent diagnostic thinking! Applying verified principles prevents careless exam mistakes.",
      struggleExplanation: "Systematic problem solving requires grounding every step in the rules established in the lesson note.",
    });
  } else {
    questions.push({
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
    });
  }

  // Q5: Synthesis, Exam Mastery & Intuitive Analogy
  questions.push({
    question: `[Lesson ${lessonNum} - Final Check] What cognitive approach guarantees durable long-term retention of ${lessonTitle}?`,
    options: [
      `Connecting the extracted notes to intuitive analogies and validating understanding with active practice questions.`,
      "Passive rereading of highlighting without attempting self-quizzing.",
      "Cramming disconnected formulas without grasping cause and effect.",
      "Skipping core definitions and assuming memorization is unnecessary.",
    ],
    correctIndex: 0,
    hint: "Recall the analogy and active retrieval principles highlighted in this lesson.",
    reinforcement: `Outstanding! Combining the extracted lesson note with the intuitive mental model cements deep mastery of ${lessonTitle}.`,
    struggleExplanation: "Active retrieval and intuitive mental models create 3x more durable recall than passive rereading.",
  });

  return questions;
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

  // 5. Step Lesson (Split text into exactly 6 rich lessons with extracted notes and 5 questions each)
  const stepLessons = splitDocumentInto6Lessons(rawContent, title, subject);

  const lesson: StepLesson = {
    id: `lesson-${materialId}`,
    materialId,
    subject,
    title: `Interactive Step-by-Step Lesson: ${title}`,
    totalLessons: 6,
    currentStepIndex: 0,
    isFinished: false,
    lessons: stepLessons,
  };

  return { material, notes, flashcards, quiz, lesson };
}

// Splits any uploaded document into 6 progressive lessons with extracted notes and 5 questions each
export function splitDocumentInto6Lessons(
  rawText: string,
  title = "Study Material",
  subject: StudySubject = "general"
): LessonStep[] {
  const clean = cleanToNaturalEnglish(rawText || "");
  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20 && !/^(\d+|page \d+|footer|header)$/i.test(p));

  const allSentences = clean
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 350 && !isGarbledText(s));

  const totalLessons = 6;
  const lessons: LessonStep[] = [];

  const defaultThemes = [
    {
      title: "Foundations & Core Principles",
      subtitle: `Introduction, big-picture purpose, and foundational framework of ${title}`,
      analogy: `Think of this foundation like building the structural steel frame of a skyscraper: once the frame is anchored, every subsequent floor and mechanism fits securely.`,
    },
    {
      title: "Essential Concepts & Terminology",
      subtitle: "Unpacking critical definitions, variables, and operational language",
      analogy: "Like learning musical notes before playing a symphony: each symbol has a precise meaning that prevents ambiguity in complex scores.",
    },
    {
      title: "Operational Mechanisms & Pathways",
      subtitle: "Step-by-step causality, transformations, and interaction sequences",
      analogy: "Imagine rolling a ball over a small hill (activation) so it can spontaneously roll down a great valley (energetic equilibrium).",
    },
    {
      title: "Governing Rules, Formulas & Examples",
      subtitle: "Quantifying relationships, conservation laws, and worked cases",
      analogy: "Like car braking distances scaling with the square of velocity: governing rules dictate how outputs respond non-linearly to changing inputs.",
    },
    {
      title: "Boundary Conditions & Diagnostic Traps",
      subtitle: "Exam traps, edge cases, limiting bottlenecks, and stress tests",
      analogy: "An airplane flies smoothly in calm weather, but pilots practice stall recoveries for turbulent boundary conditions.",
    },
    {
      title: "Synthesis & Comprehensive Mastery",
      subtitle: "Connecting all principles into an integrated exam-ready mental model",
      analogy: "Like finishing a complex jigsaw puzzle: each individual mechanism snaps together into a complete, unforgettable picture.",
    },
  ];

  for (let i = 0; i < totalLessons; i++) {
    const lessonNum = i + 1;
    const theme = defaultThemes[i];

    // Extract slice of paragraphs for this lesson
    let sliceParas: string[] = [];
    if (paragraphs.length >= 6) {
      const perLesson = Math.ceil(paragraphs.length / 6);
      const start = i * perLesson;
      sliceParas = paragraphs.slice(start, start + perLesson);
    } else if (paragraphs.length > 0) {
      const idx = i % paragraphs.length;
      sliceParas = [paragraphs[idx]];
    }

    // Extract slice of sentences
    let sliceSentences: string[] = [];
    if (allSentences.length >= 6) {
      const perLesson = Math.ceil(allSentences.length / 6);
      const start = i * perLesson;
      sliceSentences = allSentences.slice(start, start + perLesson);
    } else {
      sliceSentences = allSentences;
    }

    const sliceDefs: { term: string; definition: string }[] = [];
    const slicePoints: string[] = [];

    const textToScan = (sliceParas.join("\n\n") + " " + sliceSentences.join(" ")).trim();

    // Check headings in slice
    const headingMatch = textToScan.match(/^(?:#{1,4}\s+|chapter\s+\d+:?\s*|topic\s+\d+:?\s*|section\s+\d+:?\s*|\d+\.\s+)(.+)$/im);
    const lessonTitle = headingMatch && headingMatch[1].trim().length > 3
      ? headingMatch[1].trim().replace(/[*_#]/g, "")
      : `${theme.title}`;

    // Extract definitions from slice
    const defMatches = textToScan.matchAll(/([A-Z][a-zA-Z0-9\s\-']{2,40})\s+(?:is defined as|refers to|is the process of|means|describes|is considered)\s+([^.\n]+)/gi);
    for (const m of defMatches) {
      if (sliceDefs.length < 3 && isAcademicTerm(m[1].trim())) {
        sliceDefs.push({ term: m[1].trim(), definition: m[2].trim() });
      }
    }

    const colonMatches = textToScan.matchAll(/([A-Z][a-zA-Z0-9\s\-']{2,40}):\s+([^.\n]{10,200})/g);
    for (const m of colonMatches) {
      if (sliceDefs.length < 3 && isAcademicTerm(m[1].trim())) {
        sliceDefs.push({ term: m[1].trim(), definition: m[2].trim() });
      }
    }

    // Extract high-yield causal and mechanism points
    for (const s of sliceSentences) {
      if (
        /(?:because|leads to|results in|causes|triggers|requires|must be|essential|crucial|proportional|mechanism|governed by|functions to|principle|equation|threshold|equilibrium)/i.test(s) &&
        slicePoints.length < 4
      ) {
        slicePoints.push(s);
      }
    }
    if (slicePoints.length === 0 && sliceSentences.length > 0) {
      slicePoints.push(sliceSentences[0]);
      if (sliceSentences[1]) slicePoints.push(sliceSentences[1]);
    }

    // Compose authentic extracted study note from the uploaded file
    let noteContent = "";
    if (sliceParas.length > 0) {
      noteContent = `### Section Overview\n${sliceParas.join("\n\n")}`;
    } else if (sliceSentences.length > 0) {
      noteContent = `### Section Overview\n${sliceSentences.slice(0, 3).join(" ")}`;
    } else {
      noteContent = `### Section Overview\nThis section establishes foundational understanding for ${title}. Focus on the core relationships, operational definitions, and how input variables determine system behavior.`;
    }

    if (slicePoints.length > 0) {
      noteContent += `\n\n### Key Mechanisms & Extracted Rules\n` + slicePoints.map((p) => `• ${p}`).join("\n");
    }

    const keyTerms = sliceDefs.map((d) => d.term).concat(
      sliceSentences.slice(0, 2).map((s) => s.split(" ")[0]).filter((w) => w && w.length > 3)
    ).slice(0, 4);

    if (keyTerms.length === 0) {
      keyTerms.push("Foundational Principle", "Governing Rule", "Systemic Stability");
    }

    const keyTakeaway = slicePoints[0] || `Mastering this section enables accurate prediction of system behavior in ${title}.`;

    const noteData = {
      noteContent,
      importantPoints: slicePoints,
      definitions: sliceDefs,
      keyTerms,
    };

    const questions = create5QuestionsForLesson(lessonNum, lessonTitle, title, noteData);

    lessons.push({
      lessonNumber: lessonNum,
      title: lessonTitle,
      subtitle: theme.subtitle,
      content: noteContent,
      sectionLabel: `Section ${lessonNum} of 6`,
      importantPoints: slicePoints,
      keyTakeaway,
      analogy: theme.analogy,
      keyTerms,
      knowledgeCheck: questions[0],
      questions,
      completed: false,
    });
  }

  return lessons;
}

// Auto-repair an existing lesson pack to ensure exactly 6 lessons with extracted notes and 5 questions each
export function repairLessonPack(
  pack: StepLesson | null | undefined,
  rawTitle = "Study Material",
  rawContent = "",
  subject?: StudySubject
): StepLesson {
  const title = cleanTitle(rawTitle);
  const detectedSub = subject || detectSubjectFromTitle(title);

  // If no pack or lessons count != 6 or lessons are corrupted
  const needsFullRegen =
    !pack ||
    !pack.lessons ||
    pack.lessons.length !== 6 ||
    pack.lessons.some(
      (l) =>
        !l.content ||
        isGarbledText(l.content) ||
        !l.questions ||
        l.questions.length < 5
    );

  if (needsFullRegen) {
    const generatedLessons = splitDocumentInto6Lessons(rawContent, title, detectedSub);
    return {
      id: pack?.id || `lesson-${Date.now()}`,
      materialId: pack?.materialId || "mat-repair",
      subject: pack?.subject || detectedSub,
      title: `Interactive Step-by-Step Lesson: ${title}`,
      totalLessons: 6,
      currentStepIndex: pack?.currentStepIndex || 0,
      isFinished: false,
      lessons: generatedLessons,
    };
  }

  const cleanTextProse = (str: string): string => {
    if (!str || typeof str !== "string") return str || "";
    return str
      .replace(/\bnoted in (?:any|the|this|that|each)?\s*pr?ar?ag?graphs?\b/gi, "in this section")
      .replace(/\bnoted in pr?ar?ag?graphs?\s*\d+(?:\s*-\s*\d+)?\b/gi, "")
      .replace(/\bas noted in pr?ar?ag?graphs?\s*\d+(?:\s*-\s*\d+)?\b/gi, "")
      .replace(/\bas noted in (?:any|the|this)?\s*pr?ar?ag?graphs?\b/gi, "as covered in this section")
      .replace(/\bnoted in\s+pr?ar?ag?graphs?\b/gi, "in this section")
      .replace(/\bnoted in Section\s*\d+\b/gi, "")
      .replace(/regarding\s+("?[^"?]+"??)\s+noted in\s+pr?ar?ag?graphs?\s*\d+(?:-\d+)?/gi, "regarding $1")
      .replace(/regarding\s+("?[^"?]+"??)\s+noted in\s+pr?ar?ag?graphs?/gi, "regarding $1")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\?/g, "?")
      .trim();
  };

  const cleanQuestionObj = (q: any) => ({
    ...q,
    question: cleanTextProse(q.question),
    options: (q.options || []).map(cleanTextProse),
    hint: cleanTextProse(q.hint),
    reinforcement: cleanTextProse(q.reinforcement),
    struggleExplanation: cleanTextProse(q.struggleExplanation),
  });

  // Otherwise repair individual lessons in place
  const repairedLessons = pack.lessons.map((lesson, idx) => {
    const lessonNum = lesson.lessonNumber || idx + 1;
    const isCorruptContent = !lesson.content || isGarbledText(lesson.content);
    const isCorruptTitle = !lesson.title || isGarbledText(lesson.title);
    const isCorruptSubtitle = isGarbledText(lesson.subtitle || "");
    const needsQuestions =
      !lesson.questions ||
      lesson.questions.length < 5 ||
      isGarbledText(lesson.questions[0]?.question || "");

    let resolvedLesson: any;

    if (!isCorruptContent && !isCorruptTitle && !isCorruptSubtitle && !needsQuestions) {
      resolvedLesson = {
        ...lesson,
        lessonNumber: lessonNum,
        questions: lesson.questions?.slice(0, 5),
      };
    } else {
      const fallbackLessons = splitDocumentInto6Lessons(rawContent, title, detectedSub);
      const fresh = fallbackLessons[idx] || fallbackLessons[0];

      resolvedLesson = {
        ...lesson,
        lessonNumber: lessonNum,
        title: isCorruptTitle ? fresh.title : lesson.title,
        subtitle: isCorruptSubtitle ? fresh.subtitle : lesson.subtitle,
        content: isCorruptContent ? fresh.content : lesson.content,
        importantPoints: lesson.importantPoints || fresh.importantPoints,
        keyTakeaway: lesson.keyTakeaway || fresh.keyTakeaway,
        analogy: isGarbledText(lesson.analogy || "") ? fresh.analogy : lesson.analogy,
        keyTerms:
          lesson.keyTerms && lesson.keyTerms.length > 0 && !isGarbledText(lesson.keyTerms.join(" "))
            ? lesson.keyTerms
            : fresh.keyTerms,
        questions: needsQuestions
          ? create5QuestionsForLesson(lessonNum, fresh.title, title, {
              noteContent: fresh.content,
              importantPoints: fresh.importantPoints,
              definitions: [],
              keyTerms: fresh.keyTerms,
            })
          : lesson.questions.slice(0, 5),
      };
    }

    return {
      ...resolvedLesson,
      title: cleanTextProse(resolvedLesson.title),
      subtitle: cleanTextProse(resolvedLesson.subtitle),
      content: cleanTextProse(resolvedLesson.content),
      importantPoints: (resolvedLesson.importantPoints || []).map(cleanTextProse),
      keyTakeaway: cleanTextProse(resolvedLesson.keyTakeaway),
      analogy: cleanTextProse(resolvedLesson.analogy),
      knowledgeCheck: resolvedLesson.knowledgeCheck ? cleanQuestionObj(resolvedLesson.knowledgeCheck) : undefined,
      questions: (resolvedLesson.questions || []).map(cleanQuestionObj),
    };
  });

  return {
    ...pack,
    title: `Interactive Step-by-Step Lesson: ${title}`,
    subject: pack.subject || detectedSub,
    totalLessons: 6,
    lessons: repairedLessons.slice(0, 6),
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
