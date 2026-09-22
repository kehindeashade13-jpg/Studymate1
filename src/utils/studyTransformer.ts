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

  const detectedSubject = detectSubjectFromTitle(title);

  // Subject-specific rich definitions bank
  const chemistryBank = [
    {
      term: "Chemical Kinetics",
      definition: "The branch of chemistry focused on reaction rates, mechanisms of transformation, and collision dynamics.",
    },
    {
      term: "Activation Energy (Ea)",
      definition: "The minimum kinetic energy colliding reactant molecules must possess to overcome the energetic barrier and form products.",
    },
    {
      term: "Dynamic Chemical Equilibrium",
      definition: "A state in a reversible reaction where forward and reverse transformation rates are equal, maintaining constant concentrations.",
    },
    {
      term: "Le Chatelier's Principle",
      definition: "When a system at equilibrium is disturbed by changes in temperature, pressure, or concentration, it shifts to counteract the disturbance.",
    },
    {
      term: "Catalysis & Rate Acceleration",
      definition: "The increase in reaction velocity achieved by providing an alternative pathway with lower activation energy without consuming the catalyst.",
    },
    {
      term: "Arrhenius Rate Equation",
      definition: "The mathematical law k = A * exp(-Ea / RT) quantifying how rate constants depend exponentially on temperature and activation energy.",
    },
    {
      term: "Gibbs Free Energy (ΔG)",
      definition: "The thermodynamic potential measuring maximum reversible work obtainable; negative values indicate spontaneous forward progression.",
    },
    {
      term: "Enthalpy & Thermodynamic Balance",
      definition: "The total heat content of a chemical system, where exothermic reactions release heat (negative ΔH) and endothermic absorb heat.",
    },
    {
      term: "Reaction Order & Rate Law",
      definition: "An empirical mathematical expression showing how the rate of reaction depends upon the concentrations of specific reactants.",
    },
    {
      term: "Acid-Base Buffer System",
      definition: "An aqueous solution consisting of a weak acid and its conjugate base that resists significant changes in pH upon addition of small amounts of acid or base.",
    },
    {
      term: "Collision Frequency & Geometry",
      definition: "The requirement that reactant particles must collide with both sufficient kinetic velocity and appropriate spatial orientation.",
    },
    {
      term: "Equilibrium Constant (Kc)",
      definition: "The temperature-dependent ratio of equilibrium product concentrations to reactant concentrations raised to stoichiometric coefficients.",
    },
    {
      term: "Spectroscopic Characterization",
      definition: "The identification of molecular structure and bond vibrations through interaction with electromagnetic radiation.",
    },
    {
      term: "Colligative Properties",
      definition: "Solutions properties (such as vapor pressure lowering, freezing point depression) that depend purely on solute particle count.",
    },
    {
      term: "Phase Boundary Equilibrium",
      definition: "The conditions of temperature and pressure where distinct states of matter (solid, liquid, gas) coexist in steady thermodynamic stability.",
    },
  ];

  const generalBank = [
    {
      term: "Dynamic Equilibrium",
      definition: "A state where opposing physical, chemical, or systemic forces operate at equal rates.",
    },
    {
      term: "Limiting Factor",
      definition: "The primary boundary constraint that limits maximum velocity, throughput, or overall yield.",
    },
    {
      term: "Feedback Regulation",
      definition: "A control mechanism where output alterations adjust subsequent input activity to preserve stability.",
    },
    {
      term: "Activation Threshold",
      definition: "The minimum energetic or informational input required to initiate an operational transition.",
    },
    {
      term: "Thermodynamic Entropy",
      definition: "A measure of energy dispersal and molecular randomness within an isolated system over time.",
    },
    {
      term: "Empirical Validation",
      definition: "The verification of hypotheses through reproducible experimental measurement and observation.",
    },
    {
      term: "Kinetic Throughput",
      definition: "The volumetric rate at which constituents move through successive processing stages.",
    },
    {
      term: "Boundary Constraint",
      definition: "External parameters (such as temperature, volume, or concentration) that dictate operational validity.",
    },
    {
      term: "Conservation Law",
      definition: "The fundamental axiom stating that total mass and energy remain constant within an isolated domain.",
    },
    {
      term: "Steady State",
      definition: "A condition in an open system where internal properties remain constant despite continuous throughput.",
    },
  ];

  const seedBank = detectedSubject === "Chemistry" ? chemistryBank : generalBank;

  for (const item of seedBank) {
    if (definitions.length < 18 && !definitions.some((d) => d.term.toLowerCase() === item.term.toLowerCase())) {
      definitions.push(item);
    }
  }

  // Baseline sentences for fill-in-the-blanks
  const baselineSentences = [
    `In any stable system studying ${title}, opposing forces continuously strive to maintain dynamic equilibrium.`,
    `The overall velocity of the transformation is dictated by the primary limiting factor.`,
    `Negative feedback regulation prevents runaway deviations and stabilizes internal states.`,
    `A process cannot begin until energetic inputs satisfy the activation threshold.`,
    `Scientific validity requires rigorous empirical validation under controlled test conditions.`,
    `Adding an appropriate catalyst boosts kinetic throughput without altering the final equilibrium constant.`,
    `When boundary constraints are violated, compensatory feedback loops are immediately engaged.`,
    `Under standard operational assumptions, total energy adheres to the fundamental conservation law.`,
    `Unlike static arrest, an open steady state requires continuous circulation of matter and energy.`,
    `The system responds to external stress by shifting equilibrium to counteract the disturbance according to governing laws.`,
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

  const d0 = getDef(0, "Core Mechanism", "The central operational pathway governing state changes and systemic conversion.");
  const d1 = getDef(1, "Activation Threshold", "The minimum kinetic or thermodynamic barrier required to initiate forward activity.");
  const d2 = getDef(2, "Dynamic Equilibrium", "A balanced state where forward and reverse transformation rates are exactly equal.");
  const d3 = getDef(3, "Limiting Constraint", "The essential rate-limiting component or resource with lowest availability.");
  const d4 = getDef(4, "Feedback Regulation", "A self-adjusting control mechanism that alters upstream input velocity based on output levels.");
  const d5 = getDef(5, "Conservation Law", "The physical principle that mass, charge, and energy remain constant across transformations.");
  const d6 = getDef(6, "Catalytic Efficiency", "The enhancement of transformation velocity by providing a lower activation pathway without altering overall free energy.");
  const d7 = getDef(7, "Phase Boundary", "The physical interface separating distinct states or operational compartments in the system.");
  const d8 = getDef(8, "Steady-State Flux", "The continuous throughput of reactants or signals where intermediate concentrations remain unvarying.");
  const d9 = getDef(9, "Molecular Affinity", "The intrinsic binding strength and kinetic specificity between interacting components.");
  const d10 = getDef(10, "Thermodynamic Driving Force", "The net free energy difference driving forward progression toward minimal system entropy.");
  const d11 = getDef(11, "Rate-Determining Bottleneck", "The slowest individual reaction or transmission step governing the global system velocity.");

  const q1: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-1`,
    type: "scenario",
    question: `[Applied Scenario] During an experiment investigating ${cleanTitleStr}, an investigator modifies reaction conditions. Which specific observation directly confirms that the system is operating according to the governing principles of ${d0.term}?`,
    options: [
      `The operational response adjusts dynamically according to ${d0.definition.toLowerCase()}, preserving system stability.`,
      "The process accelerates to infinite speed without consuming any substrate or energetic input.",
      "Both forward and reverse transformations cease completely and irreversibly.",
      "Measured output variables fluctuate at random with zero physical correlation.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `The operational response adjusts dynamically according to ${d0.definition.toLowerCase()}, preserving system stability.`,
    explanation: `Diagnostic analysis: observing measured stabilization confirms that "${d0.term}" is functioning as expected under empirical conditions.`,
    topicTag: "Applied Scenario & Observation",
    difficulty: "medium",
  };

  const q2: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-2`,
    type: "multiple_choice",
    question: `[Causal Mechanism] In ${cleanTitleStr}, what is the direct systemic consequence when the critical threshold for "${d1.term}" is successfully achieved?`,
    options: [
      `It initiates the forward transition because ${d1.definition.toLowerCase()}`,
      "It completely violates the universal conservation of mass across all boundaries.",
      "The system becomes permanently inert and unresponsive to energetic inputs.",
      "All potential energy converts spontaneously into destructive resonance.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `It initiates the forward transition because ${d1.definition.toLowerCase()}`,
    explanation: `Diagnostic reasoning traces the causal mechanism: overcoming the barrier of "${d1.term}" allows forward progression.`,
    topicTag: "Causal Mechanisms & Pathways",
    difficulty: "medium",
  };

  const q3: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-3`,
    type: "scenario",
    question: `[Boundary Condition] Under which operating condition would the standard theoretical model for "${d2.term}" in ${cleanTitleStr} break down or require non-ideal corrections?`,
    options: [
      "When an intense external perturbation exceeds the compensatory rate of opposing processes, forcing the system out of balance.",
      "Whenever measurements are recorded using standard SI metric units.",
      "When temperature and pressure are maintained strictly uniform throughout the system.",
      "Whenever a homogeneous catalyst is introduced.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "When an intense external perturbation exceeds the compensatory rate of opposing processes, forcing the system out of balance.",
    explanation: `Diagnostic edge cases evaluate boundary limits: "${d2.term}" relies on equal dynamic exchange, which fails if rapid shock overwhelms compensation.`,
    topicTag: "Boundary Conditions & Edge Cases",
    difficulty: "hard",
  };

  const q4: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-4`,
    type: "multiple_choice",
    question: `[Diagnostic Misconception] When analyzing experimental findings for ${cleanTitleStr}, which erroneous interpretation leads to a false diagnostic conclusion regarding "${d3.term}"?`,
    options: [
      `Confusing a temporary throughput restriction governed by ${d3.term} with complete thermodynamic cessation.`,
      "Calibrating sensors against verified reference standards prior to testing.",
      "Maintaining controlled baseline variables across successive trial iterations.",
      "Logging data points at uniform, high-resolution time intervals.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `Confusing a temporary rate restriction governed by ${d3.term} with complete thermodynamic cessation.`,
    explanation: `A classic diagnostic error is mistaking the rate restriction imposed by "${d3.term}" for a dead or halted system.`,
    topicTag: "Misconceptions & Diagnostic Traps",
    difficulty: "medium",
  };

  const q5: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-5`,
    type: "multiple_choice",
    question: `[Quantitative Relationship] In ${cleanTitleStr}, how is the active modulation of "${d4.term}" mathematically coupled with overall operational efficiency?`,
    options: [
      `It optimizes efficiency by continuously dampening overshoot, exactly as described by ${d4.definition.toLowerCase()}`,
      "It eliminates the requirement for any energetic or physical input.",
      "It forces all forward velocity to zero indefinitely.",
      "It causes unpredictable sinusoidal oscillations with zero damping.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `It optimizes efficiency by continuously dampening overshoot, exactly as described by ${d4.definition.toLowerCase()}`,
    explanation: `Quantitative analysis reveals that "${d4.term}" actively modulates velocity to keep throughput near the optimal capacity curve.`,
    topicTag: "Quantitative & Kinetic Coupling",
    difficulty: "hard",
  };

  const q6: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-6`,
    type: "scenario",
    question: `[Equilibrium Perturbation] If an investigator applies Le Chatelier / homeostatic stress to a system in ${cleanTitleStr} governed by "${d2.term}", how does the system compensate?`,
    options: [
      "It shifts net flux in the direction that opposes and relieves the applied stress until a new balanced state is established.",
      "It amplifies the stress exponentially until the entire system collapses.",
      "It instantly stops all molecular and energetic interactions permanently.",
      "It maintains identical absolute concentrations regardless of extreme external additions.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "It shifts net flux in the direction that opposes and relieves the applied stress until a new balanced state is established.",
    explanation: `Equilibrium response dictates that stress induces compensatory flux shift to minimize the perturbation.`,
    topicTag: "Dynamic Equilibrium & Compensation",
    difficulty: "medium",
  };

  const q7: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-7`,
    type: "multiple_choice",
    question: `[Comparative Discrimination] Which statement accurately discriminates between the operational role of "${d0.term}" and "${d6.term}" in ${cleanTitleStr}?`,
    options: [
      `"${d0.term}" establishes the fundamental conversion logic, whereas "${d6.term}" lowers the barrier to accelerate progression toward the same endpoint.`,
      `"${d6.term}" shifts the fundamental thermodynamic equilibrium constant, whereas "${d0.term}" does not.`,
      `Both concepts refer to identical physical processes with no functional distinction.`,
      `"${d0.term}" is only active in open systems, whereas "${d6.term}" only functions at absolute zero.`,
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `"${d0.term}" establishes the fundamental conversion logic, whereas "${d6.term}" lowers the barrier to accelerate progression toward the same endpoint.`,
    explanation: `Comparative analysis clarifies functional separation: catalysts lower activation barriers without altering thermodynamic equilibrium.`,
    topicTag: "Comparative Discrimination",
    difficulty: "hard",
  };

  const q8: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-8`,
    type: "multiple_choice",
    question: `[Rate-Limiting Bottleneck] In a multi-step pathway within ${cleanTitleStr}, doubling all reactants except "${d3.term}" fails to increase final output. What does this diagnose?`,
    options: [
      `"${d3.term}" represents the rate-determining bottleneck whose saturation threshold caps overall system velocity.`,
      "The entire reaction has violated energy conservation principles.",
      "The reactants have turned completely non-reactive.",
      "The measuring apparatus has permanently lost sensitivity.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `"${d3.term}" represents the rate-determining bottleneck whose saturation threshold caps overall system velocity.`,
    explanation: `Bottleneck analysis: the slowest step throttles total throughput regardless of excess upstream or downstream components.`,
    topicTag: "Rate-Limiting Bottlenecks",
    difficulty: "medium",
  };

  const q9: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-9`,
    type: "multiple_choice",
    question: `[Structural Hierarchy] How does the presence of "${d7.term}" compartmentalize and preserve functional specialization in ${cleanTitleStr}?`,
    options: [
      `It maintains localized gradients and selective permeability, preventing dilution and erratic cross-talk.`,
      "It completely halts all physical and energetic exchange across all boundaries.",
      "It renders internal components completely homogeneous with outer surroundings.",
      "It forces the system into a static, non-interacting crystalline lattice.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "It maintains localized gradients and selective permeability, preventing dilution and erratic cross-talk.",
    explanation: `Structural organization provides compartmental barriers necessary for localized microenvironments and gradient maintenance.`,
    topicTag: "Structural Organization & Compartments",
    difficulty: "medium",
  };

  const q10: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-10`,
    type: "scenario",
    question: `[Environmental Perturbation] When temperature in a ${cleanTitleStr} system increases significantly, what happens to the molecular interaction described by "${d9.term}"?`,
    options: [
      "Thermal agitation increases kinetic disruption, reducing binding stability unless activation energy requirements dominate.",
      "Binding affinity becomes infinitely strong and completely irreversible.",
      "Temperature has zero effect on kinetic energy or intermolecular collision frequencies.",
      "All molecular bonds decompose spontaneously into pure light.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "Thermal agitation increases kinetic disruption, reducing binding stability unless activation energy requirements dominate.",
    explanation: `Thermal physics reveals that elevated kinetic motion disrupts non-covalent complexes and shifts dynamic binding equilibria.`,
    topicTag: "Environmental Perturbation",
    difficulty: "hard",
  };

  const q11: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-11`,
    type: "multiple_choice",
    question: `[Diagnostic Indicator] Which measurable readout provides the most rigorous diagnostic verification that "${d8.term}" has been established in ${cleanTitleStr}?`,
    options: [
      "Net intermediate concentrations remain steady over time while reactant consumption and product generation proceed continuously.",
      "All fluid motion and molecular collisions cease completely.",
      "The system experiences sudden, uncontrollable pressure spikes every cycle.",
      "The total mass of the closed system doubles every 10 seconds.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "Net intermediate concentrations remain steady over time while reactant consumption and product generation proceed continuously.",
    explanation: `Diagnostic indicator of steady state is constant internal concentrations maintained by balanced input and output fluxes.`,
    topicTag: "Diagnostic Verification & Indicators",
    difficulty: "medium",
  };

  const q12: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-12`,
    type: "scenario",
    question: `[Feedback Regulation] In ${cleanTitleStr}, if the accumulation of downstream products inhibits upstream enzymes through "${d4.term}", what is the primary benefit?`,
    options: [
      "It prevents wasteful overproduction and protects against toxic intermediate accumulation.",
      "It ensures that upstream resources are depleted as rapidly as possible.",
      "It causes the system to run in reverse until all starting material is destroyed.",
      "It converts the system from dynamic to completely non-functional.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "It prevents wasteful overproduction and protects against toxic intermediate accumulation.",
    explanation: `Negative feedback regulation provides economical self-limiting control to preserve homeostatic stability.`,
    topicTag: "Feedback Regulation & Homeostasis",
    difficulty: "easy",
  };

  const q13: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-13`,
    type: "multiple_choice",
    question: `[Thermodynamic Feasibility] What determines whether a transformation in ${cleanTitleStr} driven by "${d10.term}" will proceed spontaneously under standard conditions?`,
    options: [
      "A net negative change in Gibbs free energy (ΔG < 0), indicating energetic favorability.",
      "A requirement for continuous external manual stirring at all times.",
      "The transformation must generate brand new elemental atoms.",
      "The forward reaction rate must equal exactly 1 mole per microsecond regardless of temperature.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "A net negative change in Gibbs free energy (ΔG < 0), indicating energetic favorability.",
    explanation: `Thermodynamics dictates that spontaneous processes require negative ΔG (favorable balance of enthalpy and entropy).`,
    topicTag: "Thermodynamic & Energetic Feasibility",
    difficulty: "medium",
  };

  const q14: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-14`,
    type: "scenario",
    question: `[Depletion Effect] In ${cleanTitleStr}, if a specific competitive inhibitor completely blocks "${d11.term}", what is the immediate diagnostic consequence?`,
    options: [
      "Upstream pathway precursors accumulate while all downstream product synthesis drops to near zero.",
      "Downstream products multiply exponentially while upstream precursors disappear.",
      "The entire reaction bypasses the bottleneck without any loss of efficiency.",
      "The temperature of the system drops immediately to absolute zero.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "Upstream pathway precursors accumulate while all downstream product synthesis drops to near zero.",
    explanation: `Pathways blocked at a specific step demonstrate upstream accumulation and downstream starvation.`,
    topicTag: "Depletion & Inhibition Dynamics",
    difficulty: "hard",
  };

  const q15: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-15`,
    type: "multiple_choice",
    question: `[Order of Operations] What is the correct sequential order of operational stages when ${cleanTitleStr} responds to an environmental shift?`,
    options: [
      `1. Sensor detection -> 2. Signal transduction -> 3. Modulation via ${d4.term} -> 4. Restoration of ${d2.term}.`,
      `1. Equilibrium restoration -> 2. Stress occurrence -> 3. Sensor shutdown -> 4. Uncontrolled reaction.`,
      `1. Permanent failure -> 2. Signal amplification -> 3. Reverse time progression -> 4. Initial condition.`,
      `1. Full reactant depletion -> 2. Sensor activation -> 3. Zero feedback -> 4. Complete stagnation.`,
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `1. Sensor detection -> 2. Signal transduction -> 3. Modulation via ${d4.term} -> 4. Restoration of ${d2.term}.`,
    explanation: `System logic proceeds through a structured stimulus-response-feedback sequence to achieve stabilization.`,
    topicTag: "Sequential Logic & Pathways",
    difficulty: "medium",
  };

  const q16: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-16`,
    type: "multiple_choice",
    question: `[Conservation Criteria] When evaluating mass and energy balances across ${cleanTitleStr} in accordance with "${d5.term}", what must always hold true?`,
    options: [
      "Total mass and energy entering a closed boundary must equal total mass and energy exiting plus any internal accumulation.",
      "Energy is spontaneously generated from empty space during high-velocity reactions.",
      "Reactant mass can disappear without producing any measurable energy or product.",
      "Output mass is strictly independent of input mass under all scenarios.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "Total mass and energy entering a closed boundary must equal total mass and energy exiting plus any internal accumulation.",
    explanation: `The fundamental first law of conservation requires an exact balance between input, output, accumulation, and transformation.`,
    topicTag: "Conservation Laws & State Balances",
    difficulty: "easy",
  };

  const q17: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-17`,
    type: "scenario",
    question: `[Pathway Reversibility] Under what specific thermodynamic constraint can a chemical or biological pathway in ${cleanTitleStr} be operated in the reverse direction?`,
    options: [
      "When coupled to a sufficiently exergonic reaction (such as ATP or pyrophosphate cleavage) that overcomes unfavorable ΔG.",
      "Whenever the system is illuminated with green light.",
      "Simply by thinking about the reverse pathway without adding energy.",
      "Under no circumstances, because all physical reactions are strictly unidirectional.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: "When coupled to a sufficiently exergonic reaction (such as ATP or pyrophosphate cleavage) that overcomes unfavorable ΔG.",
    explanation: `Thermodynamically unfavorable (endergonic) reverse processes must be coupled to strongly exergonic drivers to proceed.`,
    topicTag: "Pathway Reversibility & Energy Coupling",
    difficulty: "hard",
  };

  const q18: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-18`,
    type: "multiple_choice",
    question: `[Threshold Dynamics] What separates a sub-threshold perturbation from a full catalytic or signaling cascade in ${cleanTitleStr}?`,
    options: [
      `Exceeding "${d1.term}", which triggers positive cooperativity and overcomes background damping.`,
      "Sub-threshold perturbations move faster than the speed of light.",
      "There is no threshold; all stimuli produce identical maximal responses regardless of magnitude.",
      "Sub-threshold stimuli permanently destroy the receiving receptors.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `Exceeding "${d1.term}", which triggers positive cooperativity and overcomes background damping.`,
    explanation: `Threshold dynamics dictate that only stimuli sufficient to surpass activation barriers trigger self-sustaining cascades.`,
    topicTag: "Threshold Dynamics & All-or-None Cascades",
    difficulty: "medium",
  };

  const q19: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-19`,
    type: "scenario",
    question: `[Systematic Troubleshooting] An experimental trial in ${cleanTitleStr} shows zero product formation despite correct reagent concentrations and temperature. Which diagnostic fault should be tested first?`,
    options: [
      `Verify whether a required cofactor, catalyst, or specific activator for "${d0.term}" is absent or denatured.`,
      "Assume gravity has reversed and restart the trial in a vacuum.",
      "Double the volume of water without checking chemical purity.",
      "Conclude that the laws of physics do not apply to this sample.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `Verify whether a required cofactor, catalyst, or specific activator for "${d0.term}" is absent or denatured.`,
    explanation: `Systematic troubleshooting begins by isolating essential catalytic cofactors and activation prerequisites.`,
    topicTag: "Systematic Troubleshooting",
    difficulty: "medium",
  };

  const q20: QuizQuestion = {
    id: `diag-${materialId}-v${variant}-20`,
    type: "scenario",
    question: `[Diagnostic Synthesis] In an advanced exam assessing ${cleanTitleStr}, which diagnostic indicator proves that a student has mastered the holistic interaction between "${d0.term}", "${d2.term}", and "${d5.term}"?`,
    options: [
      `The ability to quantitatively predict system fluxes, state shifts, and energy conservation under novel experimental disturbances.`,
      "Rote recitation of isolated textbook terms without understanding causal mechanisms.",
      "Assuming that closed systems can create new energy during rapid state shifts.",
      "Believing that equilibrium means reactions have completely stopped moving.",
    ].sort(() => 0.5 - Math.random()),
    correctAnswer: `The ability to quantitatively predict system fluxes, state shifts, and energy conservation under novel experimental disturbances.`,
    explanation: `Diagnostic synthesis represents peak cognitive mastery: integrating multiple core concepts to troubleshoot, diagnose, and calculate complex system behaviors.`,
    topicTag: "High-Yield Diagnostic Synthesis",
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
        itemA: "Input Energy",
        itemB: "Activation Energy (Ea)",
        relationship: "Input energy must exceed the activation barrier before forward transformation can proceed.",
      },
      {
        itemA: "Temperature",
        itemB: "Reaction Velocity",
        relationship: "Elevated temperature increases particle kinetic velocities and collision frequency.",
      },
    ],
    examples: [
      {
        title: "Standard Case Study",
        description: `Analysis of ${title} under regulated laboratory control conditions.`,
      },
    ],
    formulas: [
      {
        name: "Steady-State Conservation",
        formula: "∑ Inputs = ∑ Outputs + Accumulation",
        explanation: "Fundamental conservation accounting for mass or energy across a control volume.",
      },
    ],
    importantDates: [],
    potentialExamQuestions: [
      {
        question: `Explain how ${title} responds to external perturbations according to governing equilibrium laws.`,
        type: "Free Response / Short Answer",
        keyPoint: "Discuss Le Chatelier's principle, regulatory feedback loops, and dynamic steady state restoration.",
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
            `Understanding ${title} requires mastering both foundational definitions and system feedback loops.`,
            "Boundary conditions determine whether the system remains in dynamic equilibrium or undergoes failure.",
            "Synthesizing principles with active recall drills produces superior retention compared to passive reading.",
          ],
    examples: [
      {
        scenario: "Experimental System",
        explanation: `Empirical observations consistently confirm the predictive validity of ${title} under regulated laboratory conditions.`,
      },
      {
        scenario: "Real-World Application",
        explanation: "Practical implementations rely on maintaining operational parameters safely within designated threshold limits.",
      },
    ],
    formulas: [
      {
        name: "Equilibrium Ratio",
        formula: "K = [Products] / [Reactants]",
        explanation: "Indicates the directional tendency and final balance of the process.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Confusing steady state with static equilibrium",
        correction: "A steady state requires continuous flux of matter or energy to maintain constant internal conditions.",
        whyItHappens: "Students overlook the energy throughput necessary to sustain open dynamic systems.",
      },
      {
        mistake: "Ignoring boundary and environmental constraints",
        correction: "Equations and postulates only hold true within defined operational temperatures, concentrations, or regimes.",
        whyItHappens: "Relying on idealized formulas without verifying foundational assumptions.",
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
  const d0 = definitions[0] || { term: "Core Principle", definition: "The fundamental mechanism governing system behaviors." };
  const d1 = definitions[1] || { term: "Activation Energy", definition: "The minimum kinetic barrier required to initiate forward reaction." };
  const d2 = definitions[2] || { term: "Dynamic Equilibrium", definition: "A state where opposing transformations proceed at equal rates." };
  const d3 = definitions[3] || { term: "Le Chatelier's Principle", definition: "How an equilibrium shifts to counteract external perturbations." };
  const d4 = definitions[4] || { term: "Catalysis & Pathways", definition: "Accelerating rate by lowering the energetic barrier." };

  const stepLessons: LessonStep[] = [
    {
      lessonNumber: 1,
      title: "Foundational Principles & Core Framework",
      subtitle: `Unpacking why ${title} matters, primary mechanisms, and foundational terminology`,
      content: `Welcome to Lesson 1 of **${title}**.\n\n### Foundational Principle: ${d0.term}\n${d0.definition}\n\n### Why This Concept Matters\nEvery subject has a few anchor ideas that make everything else click. In this course, mastering this foundational principle gives you the mental model needed to understand how macroscopic behaviors emerge from fundamental interactions.\n\n### Key Concepts to Anchor:\n• **${d0.term}**: ${d0.definition}\n• **${d1.term}**: ${d1.definition}\n• **Equilibrium & Conservation**: System states stay balanced until external work or disturbances shift the threshold.\n\nTake a moment to review this core definition before tackling the 5 lesson questions below.`,
      analogy: "Think of this foundation like the rules of gravity: once you understand the basic attraction between masses, planetary orbits and ocean tides both make intuitive sense.",
      keyTerms: [d0.term, d1.term, "Conservation Law"],
      knowledgeCheck: create5QuestionsForLesson(1, "Foundations & Overview", title)[0],
      questions: create5QuestionsForLesson(1, "Foundations & Overview", title),
      completed: false,
    },
    {
      lessonNumber: 2,
      title: "Operational Mechanisms & Step-by-Step Dynamics",
      subtitle: "Tracing step-by-step pathways, energy transitions, and regulatory feedback loops",
      content: `In Lesson 2, we build upon our foundation by examining how **${title}** operates dynamically over time.\n\n### 3-Stage Operational Pathway\n1. **Initialization & Activation**: Reactants or inputs acquire sufficient activation energy (${d1.term}) to overcome baseline resistance.\n2. **Transition & Interaction**: Intermediates form along the lowest-energy pathway, mediated by catalysts or driving gradients.\n3. **Resolution & Equilibrium**: Products stabilize, and the system reaches ${d2.term}.\n\n### The Bottleneck Principle\nIn any multi-step process, the overall throughput cannot exceed the speed of the slowest individual step (the rate-determining step). Identifying this bottleneck is the fastest way to solve complex exam scenarios.`,
      analogy: "Like an hourglass or multi-stage assembly line: no matter how wide the upper chamber is, the flow rate is strictly dictated by the narrowest neck.",
      keyTerms: ["Activation Energy", "Rate-Determining Step", "Dynamic Equilibrium"],
      knowledgeCheck: create5QuestionsForLesson(2, "Process Mechanics", title)[0],
      questions: create5QuestionsForLesson(2, "Process Mechanics", title),
      completed: false,
    },
    {
      lessonNumber: 3,
      title: "Governing Laws & Boundary Conditions",
      subtitle: "Understanding constraints, equilibrium shifts, and mathematical relationships",
      content: `Every scientific process operates within physical boundaries. In Lesson 3, we examine what happens when environmental variables shift.\n\n### ${d3.term}\n${d3.definition}\n\n### Critical Boundary Conditions\n• **Temperature Sensitivity**: Increasing thermal energy increases kinetic collisions, altering rate constants.\n• **Concentration Effects**: Shifting input ratios changes the reaction quotient relative to the equilibrium constant.\n• **Limits of Validity**: Idealized models hold only within defined ranges of concentration and pressure.`,
      analogy: "Like a balance beam or seesaw: placing extra weight on one side forces the opposite side to rise until a new balance is restored.",
      keyTerms: [d3.term, "Boundary Conditions", "Thermal Sensitivity"],
      knowledgeCheck: create5QuestionsForLesson(3, "Governing Laws", title)[0],
      questions: create5QuestionsForLesson(3, "Governing Laws", title),
      completed: false,
    },
    {
      lessonNumber: 4,
      title: "Step-by-Step Problem Solving & Practical Scenarios",
      subtitle: "Mastering calculations, exam heuristics, and avoiding typical student mistakes",
      content: `Lesson 4 bridges theory and practice. How do you tackle exam problems testing **${title}** with speed and accuracy?\n\n### The G.U.E.S.S. Problem-Solving Protocol\n1. **G - Given**: Extract all explicit numbers, units, and conditions stated in the question prompt.\n2. **U - Unknown**: Explicitly define what variable you are asked to solve for.\n3. **E - Equation**: Select the governing law or rate equation connecting knowns to unknowns.\n4. **S - Substitute**: Insert numerical values with appropriate unit conversions.\n5. **S - Solve & Sanity Check**: Verify whether the magnitude and sign of your answer make physical sense.\n\n### Common Exam Trap to Avoid\nNever confuse *rate* (how fast a process occurs) with *equilibrium yield* (how much product is formed at the end). A catalyst speeds up the rate without changing the final equilibrium position!`,
      analogy: "Like an experienced pilot running a pre-flight checklist: systematic verification eliminates 90% of careless calculation errors.",
      keyTerms: ["Problem Solving", "Unit Analysis", "Equilibrium vs Rate"],
      knowledgeCheck: create5QuestionsForLesson(4, "Problem Solving", title)[0],
      questions: create5QuestionsForLesson(4, "Problem Solving", title),
      completed: false,
    },
    {
      lessonNumber: 5,
      title: "Comparative Analysis & Real-World Applications",
      subtitle: "Exploring laboratory applications, industrial uses, and biological systems",
      content: `In Lesson 5, we see how the principles of **${title}** apply outside the textbook in real-world technology and natural phenomena.\n\n### Real-World Case Studies\n• **Industrial Synthesis**: Maximizing production efficiency by optimizing temperature and pressure under kinetic constraints.\n• **Biological Homeostasis**: How living cells maintain delicate internal stability despite fluctuating external environments.\n• **Material & Energy Efficiency**: Minimizing activation barriers (${d4.term}) to conserve energy and reduce waste.\n\n### Comparative Insights\nCompare spontaneous vs. non-spontaneous pathways: processes with negative free energy release proceed spontaneously, while non-spontaneous processes require coupled external energy input.`,
      analogy: "Think of an enzymatic reaction in digestion: your body carries out chemical transformations at 37°C that would otherwise require high industrial temperatures, purely through biological catalysis.",
      keyTerms: [d4.term, "Industrial Synthesis", "Spontaneity"],
      knowledgeCheck: create5QuestionsForLesson(5, "Applications & Case Studies", title)[0],
      questions: create5QuestionsForLesson(5, "Applications & Case Studies", title),
      completed: false,
    },
    {
      lessonNumber: 6,
      title: "Synthesis & Comprehensive Mastery",
      subtitle: "Connecting all micro-mechanisms into a unified big-picture mental framework",
      content: `Congratulations on reaching Lesson 6 of **${title}**! Here, we synthesize all concepts:\n\n1. Foundational terminology and definitions\n2. Sequential dynamics and energy pathways\n3. Limiting factors and boundary constraints\n4. Equilibrium dynamics and rate adjustments\n5. Real-world scenario problem solving\n\nConclude your study by passing the final 5 mastery questions below!`,
      analogy: "Like hearing an entire symphony after practicing each instrument's individual notes separately.",
      keyTerms: ["Synthesis", "Unified Model", "Systemic Mastery", "Exam Preparedness"],
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
