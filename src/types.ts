export type StudySubject =
  | "Biology"
  | "Mathematics"
  | "Chemistry"
  | "Physics"
  | "History"
  | "Computer Science"
  | "English"
  | "Business"
  | "Psychology"
  | "Other"
  | (string & {});

export type SourceType =
  | "upload"
  | "photo"
  | "youtube"
  | "deck"
  | "paste"
  | "record"
  | "quizlet";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar: string;
  bio: string;
  educationLevel: string;
  institution: string;
  enrolledSubjects: StudySubject[];
  studyGoals: string;
  studyPreference: "solo" | "group" | "both";
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  isProfilePublic: boolean;
  allowFriendRequests: boolean;
  allowGroupInvites: boolean;
}

export interface MaterialChunk {
  chunkId: string;
  title: string;
  sourceReference: string;
  summary: string;
  content: string;
  keyTerms: string[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: StudySubject;
  sourceType: SourceType;
  sourceUrl?: string;
  fileUrl?: string;
  storagePath?: string;
  rawText: string;
  summary: string;
  dateAdded: string;
  mainTopics: string[];
  subtopics: string[];
  keyConcepts: { concept: string; explanation: string; importance: "high" | "medium" }[];
  definitions: { term: string; definition: string }[];
  importantFacts: string[];
  relationships: { itemA: string; itemB: string; relationship: string }[];
  examples: { title: string; description: string }[];
  formulas: { name: string; formula: string; explanation: string }[];
  importantDates: { date: string; event: string }[];
  potentialExamQuestions: { question: string; type: string; keyPoint: string }[];
  chunks: MaterialChunk[];
  progressPercent: number;
}

export interface StudyNotes {
  id: string;
  materialId: string;
  topicTitle: string;
  subject: StudySubject;
  shortOverview: string;
  keyConcepts: { title: string; description: string; keyTakeaway: string }[];
  definitions: { term: string; definition: string; context: string }[];
  importantDetails: string[];
  examples: { scenario: string; explanation: string }[];
  formulas: { name: string; formula: string; explanation: string }[];
  commonMistakes: { mistake: string; correction: string; whyItHappens: string }[];
  quickRecap: string[];
  userHighlights?: string[];
  personalNotes?: string;
  isBookmarked?: boolean;
}

export type RepetitionRating = "again" | "hard" | "good" | "easy";

export interface Flashcard {
  id: string;
  materialId: string;
  front: string;
  back: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  reviewCount: number;
  lastRating?: RepetitionRating;
  nextReviewDate?: string;
  mastered?: boolean;
}

export interface Mnemonic {
  concept: string;
  phrase: string;
  explanation: string;
}

export interface FillInTheBlank {
  sentence: string;
  answer: string;
  hint: string;
}

export interface RecallQuestion {
  question: string;
  idealAnswer: string;
  keyTerms: string[];
}

export interface MemorisePack {
  materialId: string;
  flashcards: Flashcard[];
  mnemonics: Mnemonic[];
  fillInTheBlanks: FillInTheBlank[];
  recallQuestions: RecallQuestion[];
}

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "scenario";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topicTag: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  id: string;
  materialId: string;
  quizTitle: string;
  subject: StudySubject;
  questions: QuizQuestion[];
  bestScore?: number;
  attemptsCount: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  date: string;
  score: number;
  totalQuestions: number;
  userAnswers: Record<string, string>; // questionId -> answer
  wrongQuestionIds: string[];
  weakTopics: string[];
}

export interface LessonStep {
  lessonNumber: number;
  title: string;
  subtitle: string;
  content: string;
  analogy: string;
  keyTerms: string[];
  knowledgeCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    hint: string;
    reinforcement: string;
    struggleExplanation: string;
  };
  completed?: boolean;
}

export interface StepLesson {
  id: string;
  materialId: string;
  subject: StudySubject;
  title: string;
  totalLessons: number;
  currentStepIndex: number;
  lessons: LessonStep[];
  isFinished: boolean;
}

export interface StudyPlanDay {
  dayNumber: number;
  dateLabel: string;
  topic: string;
  focus: string;
  tasks: {
    id: string;
    title: string;
    durationMinutes: number;
    mode: "notes" | "memorise" | "lesson" | "quiz" | "review";
    completed: boolean;
  }[];
  milestone: string;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  subject: StudySubject;
  planTitle: string;
  examDate: string;
  dailyTargetHours: number;
  strategySummary: string;
  days: StudyPlanDay[];
  progressPercent: number;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  isOnline: boolean;
  studyStreak: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: string;
  text: string;
  isAi?: boolean;
  replyToId?: string;
  reactions?: Record<string, number>; // emoji -> count
  attachments?: {
    type: "material" | "note" | "quiz" | "voice";
    title: string;
    linkId?: string;
  }[];
  isPinned?: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: StudySubject;
  description: string;
  isPrivate: boolean;
  examDate: string;
  progressPercent: number;
  members: GroupMember[];
  sharedMaterialIds: string[];
  pinnedMessage?: string;
}

export interface StudyFriend {
  id: string;
  name: string;
  avatar: string;
  subjects: StudySubject[];
  school: string;
  interests: string[];
  goals: string;
  mutualSubjectsCount: number;
  status: "connected" | "pending" | "none";
}

export interface NotificationItem {
  id: string;
  type: "reminder" | "group_message" | "friend_request" | "quiz_result" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
}

export interface UserProgressStats {
  studyMinutesToday: number;
  totalStudyMinutes: number;
  lessonsCompleted: number;
  flashcardsReviewed: number;
  flashcardsMastered: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  streakDays: number;
  subjectMastery: Record<StudySubject, number>; // percent 0-100
  weakAreas: { topic: string; subject: StudySubject; missCount: number }[];
}
