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
} from "../types";

// Clean course or subject prefixes from material titles
export function cleanTitle(raw: string): string {
  if (!raw) return "Study Material";
  return raw
    .replace(/^\[[^\]]+\]\s*[:-]?\s*/i, "")
    .replace(/^(biology|mathematics|chemistry|physics|history|computer science|english|business|course\s*\d+|bio|chem|math|cs|subject)\s*[:-]\s*/i, "")
    .trim() || raw.trim();
}

// Helper to clean text into natural readable English prose
export function cleanToNaturalEnglish(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // If text looks like JSON, try parsing and extracting readable content
  if (cleaned.trim().startsWith("{") && cleaned.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      const parts: string[] = [];
      if (parsed.title) parts.push(parsed.title);
      if (parsed.summary) parts.push(parsed.summary);
      if (Array.isArray(parsed.keyConcepts)) {
        parts.push(parsed.keyConcepts.map((k: any) => typeof k === "string" ? k : `${k.title || k.term}: ${k.description || k.definition}`).join("\n"));
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
      // Not strictly JSON, proceed with regex cleaning
    }
  }

  return cleaned
    .replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, "$1") // remove code fences
    .replace(/`([^`]+)`/g, "$1") // remove backticks
    .replace(/\[Study material image loaded[^\]]*\]/gi, "")
    .replace(/\[Audio Lecture Transcription[^\]]*\]/gi, "")
    .replace(/"[a-zA-Z0-9_-]+"\s*:\s*"/g, "")
    .replace(/[{}[\]]/g, "")
    .replace(/^#+\s+/gm, "") // remove heading marks
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // unbold
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Exportable helper to generate 5 robust questions for any lesson
export function create5QuestionsForLesson(lessonNum: number, lessonTitle: string, mainTopic = "Study Material"): LessonQuestion[] {
  return [
    {
      question: `[Lesson ${lessonNum} - Question 1] What is the primary conceptual principle of ${lessonTitle}?`,
      options: [
        `Understanding the core principles and operational framework of ${mainTopic}.`,
        "Ignoring all conceptual models and scientific terminology.",
        "Memorizing random phrases without understanding their relationships.",
        "Assuming natural or theoretical systems operate with zero constraints.",
      ],
      correctIndex: 0,
      hint: "Reflect on the main theme introduced at the beginning of this lesson.",
      reinforcement: "Excellent! Grasping the foundational overview makes subsequent mechanisms intuitive.",
      struggleExplanation: "Review the introductory section of the lesson to see the core premise.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 2] In this phase of ${mainTopic}, how do interacting components maintain balance?`,
      options: [
        "Through feedback mechanisms that adjust rates in response to state changes.",
        "By completely stopping all internal motion and energetic transformations.",
        "By allowing unrestricted runaway growth without regulatory limits.",
        "Components operate in absolute isolation with zero causal influence.",
      ],
      correctIndex: 0,
      hint: "Think about homeostatic balance and regulatory feedback loops.",
      reinforcement: "Spot on! Feedback loops prevent deviation and preserve stability.",
      struggleExplanation: "Systems rely on feedback loops to throttle inputs when operational thresholds are reached.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 3] What is the most critical constraint or limiting factor highlighted in ${lessonTitle}?`,
      options: [
        "The resource, energy threshold, or boundary parameter with lowest availability.",
        "An infinite abundance of unconstrained free energy.",
        "The total absence of any mathematical or physical boundaries.",
        "A variable that fluctuates arbitrarily with no predictive pattern.",
      ],
      correctIndex: 0,
      hint: "Recall how bottlenecks restrict overall throughput or yield.",
      reinforcement: "Correct! The bottleneck or limiting factor caps maximum capacity.",
      struggleExplanation: "A limiting factor acts as the bottleneck dictating overall system yield.",
    },
    {
      question: `[Lesson ${lessonNum} - Question 4] How should a student approach an exam problem testing ${lessonTitle}?`,
      options: [
        "Identify known boundary conditions and verify assumptions before calculating.",
        "Guess an option without reading the problem constraints carefully.",
        "Assume standard conservation and equilibrium laws do not apply here.",
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
        "Relating abstract terminology to intuitive physical analogies and active recall drills.",
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

// Extract rich features, terms, facts, and sentences from raw text
export function extractTextFeatures(rawText: string, title: string) {
  const clean = cleanToNaturalEnglish(rawText);
  const rawLines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  const definitions: { term: string; definition: string }[] = [];
  const importantFacts: string[] = [];
  const keySentences: string[] = [];

  for (const line of rawLines) {
    if (line.length < 10) continue;

    // Colon or dash definitions
    if (line.includes(":") && definitions.length < 20) {
      const [term, ...defParts] = line.split(":");
      const def = defParts.join(":").trim();
      const cleanTerm = term.replace(/^[-*•\d.]+\s*/, "").trim();
      if (cleanTerm.length > 2 && cleanTerm.length < 45 && def.length > 8) {
        definitions.push({ term: cleanTerm, definition: def });
      }
    } else if (line.includes(" - ") && definitions.length < 20) {
      const [term, ...defParts] = line.split(" - ");
      const def = defParts.join(" - ").trim();
      const cleanTerm = term.replace(/^[-*•\d.]+\s*/, "").trim();
      if (cleanTerm.length > 2 && cleanTerm.length < 45 && def.length > 8) {
        definitions.push({ term: cleanTerm, definition: def });
      }
    }

    if (line.length > 25 && line.length < 250) {
      const cleanedLine = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (!importantFacts.includes(cleanedLine) && importantFacts.length < 25) {
        importantFacts.push(cleanedLine);
      }
    }

    // Split paragraphs into individual sentences
    const sents = line.split(/(?<=[.?!])\s+/).filter((s) => s.length > 25 && s.length < 200);
    for (const s of sents) {
      const cleanedSent = s.replace(/^[-*•\d.]+\s*/, "").trim();
      if (!keySentences.includes(cleanedSent)) {
        keySentences.push(cleanedSent);
      }
    }
  }

  // Academic seed bank based on subject or topic words to ensure exactly 15+ rich items
  const titleWords = title.split(/[\s,–—\-]+/).filter((w) => w.length > 3);
  const primaryTopic = titleWords[0] || "Foundational Concept";
  const secondaryTopic = titleWords[1] || "Core Dynamics";

  const baselineDefinitions = [
    {
      term: primaryTopic,
      definition: `The primary theoretical framework governing processes and properties in ${title}.`,
    },
    {
      term: secondaryTopic,
      definition: `The operational mechanism by which components interact to produce stable outcomes.`,
    },
    {
      term: "Dynamic Equilibrium",
      definition: "A state where opposing physical, chemical, or systemic forces operate at equal rates.",
    },
    {
      term: "Limiting Factor",
      definition: "The primary boundary constraint that limits maximum velocity, output, or overall yield.",
    },
    {
      term: "Feedback Regulation",
      definition: "A control mechanism where the output of a system alters subsequent input activity to preserve stability.",
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
      definition: "The verification of hypotheses through reproducible experimental measurement and sensory observation.",
    },
    {
      term: "Kinetic Throughput",
      definition: "The volumetric rate at which reactants or data move through successive processing stages.",
    },
    {
      term: "Catalytic Facilitation",
      definition: "The acceleration of a transition pathway achieved by reducing the energy barrier without being consumed.",
    },
    {
      term: "Systemic Homogeneity",
      definition: "The uniform spatial distribution of properties and constituents throughout a given phase or medium.",
    },
    {
      term: "Boundary Constraint",
      definition: "External parameters (such as temperature, pressure, or volume) that dictate operational validity.",
    },
    {
      term: "Conservation Law",
      definition: "The fundamental axiom stating that total mass-energy remains constant within an isolated domain.",
    },
    {
      term: "Steady State",
      definition: "A condition in an open system where internal properties remain constant despite continuous throughput.",
    },
    {
      term: "Perturbation Response",
      definition: "How a balanced system counteracts external disturbances according to regulatory principles.",
    },
    {
      term: "Qualitative Gradient",
      definition: "A directional change in concentration, potential, or intensity across a spatial continuum.",
    },
  ];

  for (const bd of baselineDefinitions) {
    if (definitions.length < 18 && !definitions.some((d) => d.term.toLowerCase() === bd.term.toLowerCase())) {
      definitions.push(bd);
    }
  }

  // Baseline sentences for fill-in-the-blanks
  const baselineSentences = [
    `In any stable system studying ${title}, opposing forces continuously strive to maintain dynamic equilibrium.`,
    `The overall velocity of the transformation is dictated by the primary limiting factor.`,
    `Negative feedback regulation prevents runaway deviations and stabilizes internal states.`,
    `A process cannot begin until energetic inputs satisfy the activation threshold.`,
    `According to the second law of thermodynamics, total system entropy increases over time.`,
    `Scientific validity requires rigorous empirical validation under controlled test conditions.`,
    `Adding an appropriate catalyst boosts kinetic throughput without altering the final equilibrium constant.`,
    `When boundary constraints are violated, compensatory feedback loops are immediately engaged.`,
    `Under standard operational assumptions, total energy adheres to the fundamental conservation law.`,
    `Unlike static arrest, an open steady state requires continuous circulation of matter and energy.`,
    `The system responds to external stress by shifting equilibrium to counteract the perturbation response.`,
    `Molecules or signals diffuse down their qualitative gradient until concentrations equalize.`,
    `Detailed diagnostic assessment helps differentiate correlation from direct causal relationships in ${title}.`,
    `Experimental error is mitigated by increasing sample sizes and maintaining systemic homogeneity.`,
    `Mastering active recall strengthens long-term memory retrieval pathways far more effectively than passive rereading.`,
  ];

  for (const s of baselineSentences) {
    if (keySentences.length < 20) {
      keySentences.push(s);
    }
  }

  return { definitions, importantFacts, keySentences };
}

// Generate complete study deck package reliably
export function generateFallbackStudyPackage(
  materialId: string,
  rawTitle: string,
  rawContent: string,
  subject: StudySubject,
  sourceType: SourceType,
  sourceUrl?: string,
  fileUrl?: string
): {
  material: StudyMaterial;
  notes: StudyNotes;
  flashcards: MemorisePack;
  quiz: Quiz;
  lesson: StepLesson;
} {
  const title = cleanTitle(rawTitle);
  const cleanText = cleanToNaturalEnglish(rawContent);
  const { definitions, importantFacts, keySentences } = extractTextFeatures(cleanText, title);

  // 1. Material
  const material: StudyMaterial = {
    id: materialId,
    title,
    subject,
    sourceType,
    sourceUrl,
    fileUrl,
    rawText: cleanText,
    summary: `Comprehensive academic breakdown of ${title}, synthesizing core theoretical foundations, procedural mechanisms, key definitions, and high-yield examination focus points.`,
    dateAdded: new Date().toISOString(),
    mainTopics: [
      "Foundational Principles & Big Picture",
      "Process Mechanics & Step Dynamics",
      "Applied Systems & Real-World Scenarios",
      "Diagnostic Checks & Exam Traps",
    ],
    subtopics: [
      "Core Foundations",
      "Underlying Mechanisms",
      "Governing Formulas & Laws",
      "Test Scenarios & Edge Cases",
    ],
    keyConcepts: definitions.slice(0, 5).map((d) => ({
      concept: d.term,
      explanation: d.definition,
      importance: "high",
    })),
    definitions: definitions.map((d) => ({
      term: d.term,
      definition: d.definition,
    })),
    importantFacts: [
      `Mastering the foundational principles of ${title} provides the basis for solving complex applied questions.`,
      "Dynamic equilibrium requires forward and reverse processes to continue at identical rates.",
      "The rate-limiting factor dictates total systemic throughput and capacity under constrained conditions.",
      "Conservation laws guarantee that total mass and energy remain balanced across steady-state boundaries.",
    ],
    relationships: [
      {
        itemA: "Input Stimulus",
        itemB: "Activation Threshold",
        relationship: "Input energy must exceed the threshold before spontaneous forward propagation begins.",
      },
      {
        itemA: "Temperature",
        itemB: "Kinetic Velocity",
        relationship: "Higher thermal energy elevates particle kinetics and increases collision frequency.",
      },
    ],
    examples: [
      {
        title: "Standard Case Study",
        description: `Observation of ${title} under baseline laboratory control conditions.`,
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
        keyPoint: "Discuss Le Chatelier principle, negative feedback loops, and dynamic steady state restoration.",
      },
    ],
    chunks: [
      {
        chunkId: `chunk-${materialId}-1`,
        title: `${title} - Foundation & Overview`,
        sourceReference: "Uploaded Study Material",
        summary: cleanText.slice(0, 250),
        content: cleanText.slice(0, 2000),
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
    keyConcepts: definitions.slice(0, 5).map((d) => ({
      title: d.term,
      description: d.definition,
      keyTakeaway: `Master this concept to understand how ${title} operates in practical problem sets.`,
    })),
    definitions: definitions.slice(0, 10).map((d) => ({
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
      "2. Understand how negative feedback loops maintain homeostatic equilibrium.",
      "3. Practice active recall flashcards to cement retrieval pathways.",
    ],
  };

  // 3. FLASHCARDS (Exactly 15 flashcards, each with detailed explanation of the question asked)
  const flashcardList: Flashcard[] = [];
  const targetCardsCount = 15;

  for (let i = 0; i < targetCardsCount; i++) {
    const def = definitions[i % definitions.length];
    const cardId = `fc-${materialId}-${i + 1}`;

    const questionVariants = [
      `What is the exact definition and functional role of "${def.term}" in ${title}?`,
      `How does "${def.term}" influence the overall mechanism of ${title}?`,
      `In the context of ${title}, why is "${def.term}" considered a pivotal concept?`,
      `What happens to this system when "${def.term}" is altered or constrained?`,
      `Which fundamental principle governs the behavior of "${def.term}"?`,
    ];

    const frontQuestion = questionVariants[i % questionVariants.length];
    const backAnswer = def.definition;
    const detailedExplanation = `Detailed Explanation of Question:\n"${frontQuestion}"\n\nThis question evaluates your grasp of ${def.term}. Specifically, ${def.definition.toLowerCase()} In ${title}, this concept serves as an essential regulatory anchor. If you alter or remove this parameter, the balance of the entire mechanism shifts. Understanding this causal relationship allows you to solve both theoretical multiple-choice questions and complex scenario-based exam problems without confusion.`;

    flashcardList.push({
      id: cardId,
      materialId,
      front: frontQuestion,
      back: backAnswer,
      explanation: detailedExplanation,
      hint: `Recall how ${def.term} connects to the primary mechanisms of ${title}.`,
      difficulty: i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy",
      category: i < 5 ? "Foundational Terms" : i < 10 ? "Mechanisms & Dynamics" : "Exam Applications",
      reviewCount: 0,
      mastered: false,
    });
  }

  // 4. FILL IN THE BLANKS (Exactly 15 objective questions with options)
  const blanksList: FillInTheBlank[] = [];
  const targetBlanksCount = 15;

  for (let i = 0; i < targetBlanksCount; i++) {
    const def = definitions[i % definitions.length];
    const otherDefs = definitions.filter((_, idx) => idx !== i % definitions.length);
    const distractors = [
      otherDefs[0]?.term || "Static Inertia",
      otherDefs[1]?.term || "Arbitrary Variance",
      otherDefs[2]?.term || "Catastrophic Failure",
    ];

    // Shuffle options so correct answer isn't always in same position
    const options = [def.term, ...distractors].sort(() => 0.5 - Math.random());

    const sentenceTemplates = [
      `In ${title}, the term "_______" refers to: ${def.definition}`,
      `A process cannot reach steady state without satisfying the requirements of _______.`,
      `When analyzing system stability, _______ serves as the primary boundary constraint.`,
      `Examiners frequently test whether candidates can correctly identify _______ within complex experimental setups.`,
      `To ensure homeostatic balance, the system relies heavily on _______.`,
    ];

    const sentence = sentenceTemplates[i % sentenceTemplates.length];
    const explanation = `The correct answer is "${def.term}". In ${title}, ${def.definition.toLowerCase()} The other options represent different systemic parameters or distractor terms.`;

    blanksList.push({
      sentence,
      answer: def.term,
      options,
      hint: `Starts with "${def.term.charAt(0)}" — closely connected to ${title}.`,
      explanation,
    });
  }

  // 5. AI MNEMONICS (At least 10 mnemonics)
  const mnemonicsList: Mnemonic[] = [
    {
      concept: "Systematic 5-Step Problem Solving",
      phrase: "G - U - E - S - S",
      explanation: "Given, Unknown, Equation, Substitute, Solve — ensures you never overlook variables or skip calculation steps in exams.",
    },
    {
      concept: "Homeostatic Regulatory Loop",
      phrase: "S - R - C - E - F",
      explanation: "Stimulus, Receptor, Control center, Effector, Feedback — standard sequence of all physiological and mechanical self-regulation.",
    },
    {
      concept: "Thermodynamic State Conditions",
      phrase: "P - V - T - N",
      explanation: "Pressure, Volume, Temperature, Moles — the universal state variables defining gas and system equilibria.",
    },
    {
      concept: "Diagnostic Revision Framework",
      phrase: "O - R - D - E - R",
      explanation: "Observe, Relate, Define, Evaluate, Review — rapid recall checklist for structuring long-form essay answers.",
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
      concept: "Scientific Mechanism Breakdown",
      phrase: "I - T - R",
      explanation: "Initialization, Transition, Resolution — 3-act structure for breaking any complex chemical, biological, or physical pathway into manageable steps.",
    },
    {
      concept: "Critical Thinking & Causal Analysis",
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

  // 3. Memorise Pack
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

  // 4. Quiz
  const quiz: Quiz = {
    id: `quiz-${materialId}`,
    materialId,
    quizTitle: `${title} Mastery Quiz`,
    subject,
    attemptsCount: 0,
    questions: definitions.slice(0, 5).map((d, idx) => ({
      id: `q-${materialId}-${idx + 1}`,
      type: "multiple_choice",
      question: `Which of the following best defines "${d.term}" in the context of ${title}?`,
      options: [
        d.definition,
        "An arbitrary variable with zero causal influence on systemic equilibrium.",
        "A static condition where all matter, energy, and information flows terminate completely.",
        "A random statistical anomaly that cannot be quantified or predicted.",
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: d.definition,
      explanation: `This is the precise operational definition established for ${d.term} in ${title}.`,
      topicTag: idx % 2 === 0 ? "Core Definitions" : "Mechanisms",
      difficulty: idx % 2 === 0 ? "easy" : "medium",
    })),
  };

  // 5. Step Lesson (Every lesson has 5 questions under it!)
  const stepLessons: LessonStep[] = [
    {
      lessonNumber: 1,
      title: "Introduction & Big Picture Overview",
      subtitle: `Unpacking why ${title} matters, core principles, and foundational terminology`,
      content: `Welcome to Lesson 1 of **${title}**.\n\nEvery subject has a few anchor ideas that make everything else click. Here, we start with the primary concept:\n\n> **${definitions[0]?.term || "Foundational Concept"}**: ${definitions[0]?.definition || "The fundamental mechanism."}\n\nUnderstanding this foundational principle allows us to see how microscopic interactions aggregate into macroscopic outcomes. Take a moment to review this core definition before tackling the 5 lesson questions below.`,
      analogy: "Think of this foundation like the rules of gravity in physics—once you grasp the fundamental rule, the motion of every planet makes intuitive sense.",
      keyTerms: definitions.slice(0, 3).map((d) => d.term),
      knowledgeCheck: create5QuestionsForLesson(1, "Introduction & Foundations")[0],
      questions: create5QuestionsForLesson(1, "Introduction & Foundations"),
      completed: false,
    },
    {
      lessonNumber: 2,
      title: "Process Mechanics & Sequential Dynamics",
      subtitle: "Tracing step-by-step pathways, energy transitions, and regulatory feedback loops",
      content: `Now that we understand the baseline vocabulary, let's explore how the system operates over time.\n\n1. **Initialization**: The system receives input energy, reactants, or signals.\n2. **Transition**: Regulatory agents, enzymes, or forces process the inputs along defined pathways.\n3. **Resolution**: Outputs are generated, and feedback loops signal whether to continue or dampen activity.\n\nNotice how each step depends strictly on the successful completion of the preceding phase. Review these interactions and complete the 5 check questions below.`,
      analogy: "Like an automated assembly line, a delay or bottleneck at station one naturally throttles the speed and capacity of station three.",
      keyTerms: ["Transition State", "Feedback Loop", "Throughput", "Limiting Factor"],
      knowledgeCheck: create5QuestionsForLesson(2, "Process Mechanics")[0],
      questions: create5QuestionsForLesson(2, "Process Mechanics"),
      completed: false,
    },
    {
      lessonNumber: 3,
      title: "Real-World Applications & Exam Problem-Solving",
      subtitle: "How to tackle tricky boundary conditions, avoid common traps, and achieve mastery",
      content: `Examiners love testing boundary conditions, limiting factors, and rate constraints on **${title}**.\n\nWhen faced with an exam problem:\n\n- **First**: Identify the given constraints (temperature, pressure, time, assumptions).\n- **Second**: Check if any component acts as a limiting factor or rate-limiting step.\n- **Third**: Formulate your response using precise academic terminology.\n\nTest your mastery by answering the 5 comprehensive questions below.`,
      analogy: "Like a pilot running a pre-flight checklist, checking assumptions and constraints first guarantees safe, accurate problem solving.",
      keyTerms: ["Boundary Conditions", "Empirical Proof", "Error Margin", "Steady State"],
      knowledgeCheck: create5QuestionsForLesson(3, "Exam Problem-Solving", title)[0],
      questions: create5QuestionsForLesson(3, "Exam Problem-Solving", title),
      completed: false,
    },
    {
      lessonNumber: 4,
      title: "Equilibrium Dynamics & Rate Controls",
      subtitle: "Understanding thermodynamic balance, flux rates, and perturbation resistance",
      content: `In Lesson 4 of **${title}**, we study how systems maintain internal stability despite ongoing external fluctuations.\n\nKey aspects:\n- **Dynamic Equilibrium**: Rates of forward and reverse reactions or flows equalize.\n- **Perturbation Damping**: Negative feedback quickly mitigates sudden spikes or drops.\n- **Energy Dissipation**: Every cyclic transformation accounts for natural entropy and efficiency losses.\n\nComplete the 5 questions below to verify your conceptual grasp.`,
      analogy: "Think of a cruise control system that gently accelerates or brakes to keep speed constant up and down steep hills.",
      keyTerms: ["Dynamic Equilibrium", "Flux Rate", "Perturbation", "Entropy"],
      knowledgeCheck: create5QuestionsForLesson(4, "Equilibrium Dynamics", title)[0],
      questions: create5QuestionsForLesson(4, "Equilibrium Dynamics", title),
      completed: false,
    },
    {
      lessonNumber: 5,
      title: "Comparative Case Studies & Variances",
      subtitle: "Comparing standard conditions against edge cases and aberrant anomalies",
      content: `Comparing standard performance against edge cases deepens mental clarity on **${title}**.\n\n- **Case A (Baseline)**: Operates within normal stoichiometric or physiological thresholds.\n- **Case B (Stress / Inhibited)**: A key factor is depleted, shifting the rate-limiting bottleneck.\n- **Case C (Hyper-active)**: Excess input saturates regulatory pathways.\n\nAnswer the 5 multiple-choice questions below to test your diagnosis skills.`,
      analogy: "Like stress-testing a bridge with heavy winds to find exactly where load limits are reached.",
      keyTerms: ["Case Analysis", "Saturation Point", "Inhibition", "Threshold"],
      knowledgeCheck: create5QuestionsForLesson(5, "Case Studies & Variances", title)[0],
      questions: create5QuestionsForLesson(5, "Case Studies & Variances", title),
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

// Resilient fetch helper with timeout
export async function safeFetchJson<T = any>(
  url: string,
  body: any,
  timeoutMs = 12000
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
