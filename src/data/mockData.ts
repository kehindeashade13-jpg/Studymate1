import {
  UserProfile,
  StudyMaterial,
  StudyNotes,
  MemorisePack,
  Quiz,
  StepLesson,
  StudyPlan,
  StudyGroup,
  GroupMessage,
  StudyFriend,
  NotificationItem,
  Achievement,
  UserProgressStats,
} from "../types";

export const initialUser: UserProfile = {
  id: "user-me",
  name: "Student",
  email: "student@studymate.ai",
  phoneNumber: "+1 (555) 438-9201",
  avatar: "/studymate_logo.jpg",
  bio: "Passionate about active recall, spaced repetition, and turning study materials into understanding!",
  educationLevel: "Undergraduate",
  institution: "University",
  enrolledSubjects: ["Biology", "Mathematics", "Chemistry", "Computer Science", "History", "Business"],
  studyGoals: "Maintain a daily study habit and test understanding with active recall.",
  studyPreference: "both",
  xp: 298,
  streakDays: 0,
  lastActiveDate: new Date().toISOString(),
  isProfilePublic: true,
  allowFriendRequests: true,
  allowGroupInvites: true,
};

// Start with empty materials - the app works purely with whatever the user uploads!
export const initialMaterials: StudyMaterial[] = [];

export const initialNotes: Record<string, StudyNotes> = {};

export const initialMemorise: Record<string, MemorisePack> = {};

export const initialQuizzes: Record<string, Quiz> = {};

export const initialLessons: Record<string, StepLesson> = {};

export const initialStudyGroups: StudyGroup[] = [];

export const initialGroupMessages: Record<string, GroupMessage[]> = {};

export const initialFriends: StudyFriend[] = [];

export const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "reminder",
    title: "Ready to study?",
    message: "Import your first notes or slides to generate instant flashcards and practice quizzes!",
    timestamp: "10m ago",
    isRead: false,
  },
];

export const initialAchievements: Achievement[] = [
  {
    id: "ach-1",
    title: "First Upload",
    description: "Import your first study material to activate your AI study toolkit.",
    icon: "🎯",
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "ach-2",
    title: "3-Day Study Streak",
    description: "Review study materials for 3 consecutive days.",
    icon: "🔥",
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: "ach-3",
    title: "20 Flashcards Mastered",
    description: "Mark 20 flashcards as 'Easy' or 'Good' in spaced recall mode.",
    icon: "🧠",
    unlocked: false,
    progress: 0,
    maxProgress: 20,
  },
  {
    id: "ach-4",
    title: "Quiz Champion",
    description: "Score 80%+ on your first AI-generated quiz.",
    icon: "🏆",
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
];

export const initialProgress: UserProgressStats = {
  studyMinutesToday: 0,
  totalStudyMinutes: 0,
  lessonsCompleted: 0,
  flashcardsReviewed: 0,
  flashcardsMastered: 0,
  quizzesCompleted: 0,
  averageQuizScore: 0,
  streakDays: 0,
  subjectMastery: {
    Biology: 0,
    Mathematics: 0,
    Chemistry: 0,
    Physics: 0,
    History: 0,
    "Computer Science": 0,
    English: 0,
    Business: 0,
    Psychology: 0,
    Other: 0,
  },
  weakAreas: [],
};

export const initialStudyPlan: StudyPlan | null = null;
