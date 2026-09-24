import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  StudySubject,
  StudyMaterial,
  StudyNotes,
  MemorisePack,
  Quiz,
  StepLesson,
  StudyPlan,
  StudyGroup,
  GroupMember,
  GroupMessage,
  StudyFriend,
  NotificationItem,
  Achievement,
  UserProgressStats,
  RepetitionRating,
  SourceType,
} from "../types";
import { cleanTitle, sanitizeMaterial, isGarbledText, generateDiagnosticQuestions } from "../utils/studyTransformer";
import {
  deleteMaterialFromDatabase,
  isSupabaseConfigured,
  fetchFullStudyDataFromSupabase,
  saveMaterialToDatabase,
  saveNotesToDatabase,
  saveFlashcardsToDatabase,
  saveQuizToDatabase,
  saveLessonToDatabase,
  saveMemorisePackToDatabase,
  saveFullStudyPackageToSupabase,
} from "../supabase";
import {
  initialUser,
  initialMaterials,
  initialNotes,
  initialMemorise,
  initialQuizzes,
  initialLessons,
  initialStudyGroups,
  initialGroupMessages,
  initialFriends,
  initialNotifications,
  initialAchievements,
  initialProgress,
  initialStudyPlan,
} from "../data/mockData";

export type ActiveTab =
  | "dashboard"
  | "library"
  | "learn"
  | "memorise"
  | "quizzes"
  | "groups"
  | "friends"
  | "plan"
  | "progress"
  | "profile"
  | "history"
  | "landing";

interface StudyContextType {
  // User & Onboarding
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateUser: (updates: Partial<UserProfile>) => void;
  isOnboarded: boolean;
  completeOnboarding: (answers: Partial<UserProfile>) => void;

  // Active navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedSubject: StudySubject | "All";
  setSelectedSubject: (subj: StudySubject | "All") => void;

  // Materials
  materials: StudyMaterial[];
  activeMaterial: StudyMaterial | null;
  setActiveMaterial: (mat: StudyMaterial | null) => void;
  addMaterial: (material: StudyMaterial) => void;
  deleteMaterial: (id: string) => void;
  updateMaterialProgress: (id: string, progress: number) => void;

  // Notes
  notes: Record<string, StudyNotes>;
  activeNotes: StudyNotes | null;
  updateNotes: (materialId: string, updates: Partial<StudyNotes>) => void;
  saveGeneratedNotes: (materialId: string, data: Partial<StudyNotes>) => void;

  // Memorise (Flashcards)
  memorisePacks: Record<string, MemorisePack>;
  activeMemorisePack: MemorisePack | null;
  reviewFlashcard: (materialId: string, cardId: string, rating: RepetitionRating) => void;
  saveGeneratedMemorise: (materialId: string, data: any) => void;

  // Quizzes
  quizzes: Record<string, Quiz>;
  activeQuiz: Quiz | null;
  submitQuizAttempt: (materialId: string, score: number, total: number, wrongIds: string[], weakTopics: string[]) => void;
  saveGeneratedQuiz: (materialId: string, data: any) => void;
  studyWeakAreasQuiz: (materialId: string, wrongQuestionIds: string[]) => void;
  isWeakAreaMode: boolean;
  setIsWeakAreaMode: (val: boolean) => void;

  // Step-by-Step Lessons
  lessons: Record<string, StepLesson>;
  activeLesson: StepLesson | null;
  completeLessonStep: (materialId: string, stepIndex: number) => void;
  saveGeneratedLesson: (materialId: string, data: any) => void;

  // Study Groups
  studyGroups: StudyGroup[];
  activeGroup: StudyGroup | null;
  setActiveGroup: (group: StudyGroup | null) => void;
  createStudyGroup: (groupData: Partial<StudyGroup>) => void;
  addMemberToGroup: (groupId: string, member: GroupMember) => void;
  removeMemberFromGroup: (groupId: string, memberId: string) => void;
  groupMessages: Record<string, GroupMessage[]>;
  sendGroupMessage: (
    groupId: string,
    text: string,
    isAi?: boolean,
    attachments?: GroupMessage["attachments"],
    senderOverride?: { id: string; name: string; avatar: string }
  ) => void;
  shareMaterialWithGroup: (groupId: string, materialId: string) => void;
  togglePinMessage: (groupId: string, messageId: string) => void;
  reactToMessage: (groupId: string, messageId: string, emoji: string) => void;

  // Friends
  friends: StudyFriend[];
  sendFriendRequest: (friendId: string) => void;
  addFriend: (friendData: Omit<StudyFriend, "id"> | Partial<StudyFriend>) => void;
  removeFriend: (friendId: string) => void;
  startDirectChatWithFriend: (friend: {
    id: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    school?: string;
    subjects?: StudySubject[];
  }) => void;
  updatePrivacySettings: (settings: { isProfilePublic: boolean; allowFriendRequests: boolean; allowGroupInvites: boolean }) => void;

  // Study Plan
  studyPlan: StudyPlan | null;
  setStudyPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>;
  togglePlanTask: (dayNumber: number, taskId: string) => void;
  saveGeneratedPlan: (data: any) => void;

  // Progress & Gamification
  progress: UserProgressStats;
  achievements: Achievement[];
  addXP: (amount: number, reason?: string) => void;
  triggerConfetti: () => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // UI Modals & Navigation Helpers
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  initialImportType: SourceType;
  setInitialImportType: (type: SourceType) => void;
  initialImportQuery: string;
  setInitialImportQuery: (query: string) => void;
  openAddMaterialModal: (type?: SourceType, query?: string) => void;
  clearAllCourses: () => void;
  isAddMaterialModalOpen: boolean;
  setIsAddMaterialModalOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isPracticeStationModalOpen: boolean;
  setIsPracticeStationModalOpen: (open: boolean) => void;
  isProfileSetupOpen: boolean;
  setIsProfileSetupOpen: (open: boolean) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

// Ghost / legacy demo material filter (purges unexpected GST, CHM, MCB files)
const isGhostOrLegacyMaterial = (m: any): boolean => {
  if (!m || !m.id || !m.title) return true;
  const t = (m.title + " " + (m.courseCode || "") + " " + (m.subject || "")).toUpperCase();
  if (
    t.includes("GST") ||
    t.includes("CHM") ||
    t.includes("MCB") ||
    t.includes("ASEPTIC") ||
    t.includes("CHAPTERS 5")
  ) {
    return true;
  }
  return false;
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or mock
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("studymate_user");
      if (saved && saved.includes("Sarah Chen")) {
        localStorage.removeItem("studymate_user");
        return { ...initialUser, xp: 0, streakDays: 0 };
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.avatar || parsed.avatar.includes("images.unsplash.com")) {
          parsed.avatar = "/studymate_logo.jpg";
        }
        return { ...parsed, xp: 0, streakDays: 0 };
      }
      return { ...initialUser, xp: 0, streakDays: 0 };
    } catch {
      return { ...initialUser, xp: 0, streakDays: 0 };
    }
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("studymate_onboarded") === "true";
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedSubject, setSelectedSubject] = useState<StudySubject | "All">("All");

  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    try {
      const saved = localStorage.getItem("studymate_materials");
      if (saved) {
        // If localStorage contains legacy ghost files (GST, CHM, MCB), clean them out
        if (
          saved.includes("GST") ||
          saved.includes("MCB") ||
          saved.includes("CHM") ||
          saved.includes("ASEPTIC") ||
          saved.includes("Chapters 5")
        ) {
          localStorage.removeItem("studymate_materials");
          localStorage.removeItem("studymate_notes");
          localStorage.removeItem("studymate_memorise");
          localStorage.removeItem("studymate_quizzes");
          localStorage.removeItem("studymate_lessons");
          return initialMaterials;
        }
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed
            .filter((m: any) => !isGhostOrLegacyMaterial(m))
            .map((m: StudyMaterial) => sanitizeMaterial(m));
          return valid;
        }
      }
      return initialMaterials;
    } catch {
      return initialMaterials;
    }
  });

  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(() => materials[0] || null);

  const [notes, setNotes] = useState<Record<string, StudyNotes>>(() => {
    try {
      const saved = localStorage.getItem("studymate_notes");
      if (saved) {
        const parsed: Record<string, StudyNotes> = JSON.parse(saved);
        const cleaned: Record<string, StudyNotes> = {};
        for (const [id, n] of Object.entries(parsed)) {
          if (n) {
            cleaned[id] = {
              ...n,
              topicTitle: cleanTitle(n.topicTitle || id),
            };
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : initialNotes;
      }
      return initialNotes;
    } catch {
      return initialNotes;
    }
  });

  const [memorisePacks, setMemorisePacks] = useState<Record<string, MemorisePack>>(() => {
    try {
      const saved = localStorage.getItem("studymate_memorise");
      return saved ? JSON.parse(saved) : initialMemorise;
    } catch {
      return initialMemorise;
    }
  });

  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>(() => {
    try {
      const saved = localStorage.getItem("studymate_quizzes");
      return saved ? JSON.parse(saved) : initialQuizzes;
    } catch {
      return initialQuizzes;
    }
  });

  const [lessons, setLessons] = useState<Record<string, StepLesson>>(() => {
    try {
      const saved = localStorage.getItem("studymate_lessons");
      return saved ? JSON.parse(saved) : initialLessons;
    } catch {
      return initialLessons;
    }
  });

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() => {
    try {
      const saved = localStorage.getItem("studymate_groups");
      if (saved && (saved.includes("group-1") || saved.includes("Biology & Health") || saved.includes("Calculus &"))) {
        localStorage.removeItem("studymate_groups");
        return [];
      }
      return saved ? JSON.parse(saved) : initialStudyGroups;
    } catch {
      return initialStudyGroups;
    }
  });

  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(studyGroups[0] || null);

  const [groupMessages, setGroupMessages] = useState<Record<string, GroupMessage[]>>(() => {
    try {
      const saved = localStorage.getItem("studymate_messages");
      if (saved && (saved.includes("group-1") || saved.includes("msg-1"))) {
        localStorage.removeItem("studymate_messages");
        return {};
      }
      return saved ? JSON.parse(saved) : initialGroupMessages;
    } catch {
      return initialGroupMessages;
    }
  });

  const [friends, setFriends] = useState<StudyFriend[]>(() => {
    try {
      const saved = localStorage.getItem("studymate_friends");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (f: any) =>
              !["John Miller", "Aisha Patel", "Liam O'Connor", "Liam o' Connor"].includes(f?.name) &&
              !["friend-1", "friend-2", "friend-3"].includes(f?.id)
          );
        }
      }
      return initialFriends;
    } catch {
      return initialFriends;
    }
  });

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(() => {
    try {
      const saved = localStorage.getItem("studymate_plan");
      if (saved && saved.includes("plan-bio-14d")) {
        localStorage.removeItem("studymate_plan");
        return null;
      }
      return saved ? JSON.parse(saved) : initialStudyPlan;
    } catch {
      return initialStudyPlan;
    }
  });

  const [progress, setProgress] = useState<UserProgressStats>(() => {
    try {
      const saved = localStorage.getItem("studymate_progress");
      return saved ? JSON.parse(saved) : initialProgress;
    } catch {
      return initialProgress;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem("studymate_achievements");
      return saved ? JSON.parse(saved) : initialAchievements;
    } catch {
      return initialAchievements;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("studymate_notifications");
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [isWeakAreaMode, setIsWeakAreaMode] = useState<boolean>(false);

  // Modals & Navigation state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initialImportType, setInitialImportType] = useState<SourceType>("upload");
  const [initialImportQuery, setInitialImportQuery] = useState("");
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPracticeStationModalOpen, setIsPracticeStationModalOpen] = useState(false);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);

  const openAddMaterialModal = (type: SourceType = "upload", query = "") => {
    setInitialImportType(type);
    setInitialImportQuery(query);
    setIsAddMaterialModalOpen(true);
  };

  const clearAllCourses = () => {
    setMaterials([]);
    setActiveMaterial(null);
    setNotes({});
    setMemorisePacks({});
    setQuizzes({});
    setLessons({});
    setStudyPlan(null);
    localStorage.removeItem("studymate_materials");
    localStorage.removeItem("studymate_notes");
    localStorage.removeItem("studymate_memorise");
    localStorage.removeItem("studymate_quizzes");
    localStorage.removeItem("studymate_lessons");
    localStorage.removeItem("studymate_plan");
  };

  // ========================================================
  // PERSISTENT ACCOUNT STORAGE: FILES SAVED PERMANENTLY
  // ========================================================
  const isServerLoaded = useRef(false);

  // 1. Load persistent user data from Supabase & server on startup
  useEffect(() => {
    let isMounted = true;
    async function loadPersistentStorage() {
      try {
        // A. If Supabase is configured, fetch directly from Supabase Database tables
        if (isSupabaseConfigured()) {
          console.info("[Supabase DB] Fetching persistent study materials & data on load...");
          try {
            const sbRes = await fetchFullStudyDataFromSupabase();
            if (isMounted && sbRes && sbRes.success && sbRes.data) {
              const d = sbRes.data;
              if (Array.isArray(d.materials) && d.materials.length > 0) {
                const valid = d.materials
                  .filter((m: any) => !isGhostOrLegacyMaterial(m))
                  .map((m: StudyMaterial) => sanitizeMaterial({ ...m, title: cleanTitle(m.title) }));
                if (valid.length > 0) {
                  setMaterials(valid);
                  setActiveMaterial((prev) => prev || valid[0]);
                }
              }
              if (d.notes && Object.keys(d.notes).length > 0) {
                setNotes((prev) => ({ ...prev, ...d.notes }));
              }
              if (d.memorisePacks && Object.keys(d.memorisePacks).length > 0) {
                setMemorisePacks((prev) => ({ ...prev, ...d.memorisePacks }));
              }
              if (d.quizzes && Object.keys(d.quizzes).length > 0) {
                setQuizzes((prev) => ({ ...prev, ...d.quizzes }));
              }
              if (d.lessons && Object.keys(d.lessons).length > 0) {
                setLessons((prev) => ({ ...prev, ...d.lessons }));
              }
              if (d.studyPlan) {
                setStudyPlan(d.studyPlan);
              }
            }
          } catch (sbErr) {
            console.warn("[Supabase DB] Startup load notice:", sbErr);
          }
        }

        // B. Also fetch from /api/storage/load (for hybrid / server storage sync)
        const userId = user?.id || "default_user";
        const res = await fetch(`/api/storage/load?userId=${encodeURIComponent(userId)}`);
        const json = await res.json().catch(() => null);
        if (isMounted && json?.success && json?.data) {
          const d = json.data;
          if (Array.isArray(d.materials) && d.materials.length > 0) {
            const valid = d.materials
              .filter((m: any) => !isGhostOrLegacyMaterial(m))
              .map((m: StudyMaterial) => sanitizeMaterial({ ...m, title: cleanTitle(m.title) }));
            setMaterials((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const merged = [...prev];
              valid.forEach((m) => {
                if (!existingIds.has(m.id)) {
                  merged.push(m);
                  existingIds.add(m.id);
                }
              });
              return merged;
            });
          }
          if (d.notes) setNotes((prev) => ({ ...prev, ...d.notes }));
          if (d.memorisePacks) setMemorisePacks((prev) => ({ ...prev, ...d.memorisePacks }));
          if (d.quizzes) setQuizzes((prev) => ({ ...prev, ...d.quizzes }));
          if (d.lessons) setLessons((prev) => ({ ...prev, ...d.lessons }));
          if (Array.isArray(d.studyGroups) && d.studyGroups.length > 0) setStudyGroups(d.studyGroups);
          if (d.groupMessages && Object.keys(d.groupMessages).length > 0) setGroupMessages((prev) => ({ ...prev, ...d.groupMessages }));
          if (Array.isArray(d.friends) && d.friends.length > 0) setFriends(d.friends);
          if (d.studyPlan) setStudyPlan((prev) => prev || d.studyPlan);
          if (d.progress) setProgress((prev) => prev || d.progress);
          if (Array.isArray(d.achievements) && d.achievements.length > 0) setAchievements(d.achievements);
          if (d.user) {
            setUser((prev) => ({
              ...prev,
              ...d.user,
              id: prev.id || d.user.id,
              xp: 0,
              streakDays: 0,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load persistent data from storage:", err);
      } finally {
        if (isMounted) {
          isServerLoaded.current = true;
        }
      }
    }
    loadPersistentStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounced background sync to server permanent storage
  useEffect(() => {
    if (!isServerLoaded.current) return;
    const syncTimer = setTimeout(() => {
      fetch("/api/storage/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "default_user",
          data: {
            materials,
            notes,
            memorisePacks,
            quizzes,
            lessons,
            studyGroups,
            groupMessages,
            friends,
            studyPlan,
            progress,
            achievements,
            user,
          },
        }),
      }).catch((err) => console.warn("Background server storage sync failed:", err));
    }, 800);

    return () => clearTimeout(syncTimer);
  }, [
    materials,
    notes,
    memorisePacks,
    quizzes,
    lessons,
    studyGroups,
    groupMessages,
    friends,
    studyPlan,
    progress,
    achievements,
    user,
  ]);

  // Sync to local storage with safe error handling
  useEffect(() => {
    try {
      localStorage.setItem("studymate_user", JSON.stringify(user));
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_materials", JSON.stringify(materials));
    } catch {}
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_notes", JSON.stringify(notes));
    } catch {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_memorise", JSON.stringify(memorisePacks));
    } catch {}
  }, [memorisePacks]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_quizzes", JSON.stringify(quizzes));
    } catch {}
  }, [quizzes]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_lessons", JSON.stringify(lessons));
    } catch {}
  }, [lessons]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_groups", JSON.stringify(studyGroups));
    } catch {}
  }, [studyGroups]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_messages", JSON.stringify(groupMessages));
    } catch {}
  }, [groupMessages]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_friends", JSON.stringify(friends));
    } catch {}
  }, [friends]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_plan", JSON.stringify(studyPlan));
    } catch {}
  }, [studyPlan]);

  useEffect(() => {
    try {
      localStorage.setItem("studymate_progress", JSON.stringify(progress));
    } catch {}
  }, [progress]);

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#7c3aed", "#10b981", "#f59e0b"],
      });
    } catch {
      // ignore
    }
  };

  const addXP = (_amount: number, _reason?: string) => {
    // XP and streaks removed across application per user specification
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (answers: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...answers }));
    setIsOnboarded(true);
    localStorage.setItem("studymate_onboarded", "true");
    triggerConfetti();
  };

  const addMaterial = (material: StudyMaterial) => {
    const cleaned = sanitizeMaterial(material);
    setMaterials((prev) => [cleaned, ...prev.filter((m) => m.id !== cleaned.id)]);
    setActiveMaterial(cleaned);
    addXP(50, "Material Imported");

    // Add notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: "system",
        title: "Material Ready",
        message: `"${cleaned.title}" has been structured into notes, flashcards, lessons, and quizzes!`,
        timestamp: "Just now",
        isRead: false,
      },
      ...prev,
    ]);
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMemorisePacks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setQuizzes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setLessons((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeMaterial?.id === id) {
      setActiveMaterial(materials.find((m) => m.id !== id) || null);
    }
    // Delete from Supabase Database (if configured)
    deleteMaterialFromDatabase(id).catch((err) => console.warn("Supabase delete failed:", err));

    // Delete from permanent server storage
    fetch("/api/storage/delete-material", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id || "default_user",
        materialId: id,
      }),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .catch((err) => console.warn("Failed to delete from server storage:", err));
  };

  const updateMaterialProgress = (id: string, progressVal: number) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, progressPercent: progressVal } : m))
    );
  };

  const updateNotes = (materialId: string, updates: Partial<StudyNotes>) => {
    setNotes((prev) => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {}),
        ...updates,
      } as StudyNotes,
    }));
  };

  const saveGeneratedNotes = (materialId: string, data: Partial<StudyNotes>) => {
    const mat = materials.find((m) => m.id === materialId);
    const newNotes: StudyNotes = {
      id: `notes-${materialId}`,
      materialId,
      topicTitle: data.topicTitle || mat?.title || "Study Notes",
      subject: mat?.subject || "Other",
      shortOverview: data.shortOverview || "",
      keyConcepts: data.keyConcepts || [],
      definitions: data.definitions || [],
      importantDetails: data.importantDetails || [],
      examples: data.examples || [],
      formulas: data.formulas || [],
      commonMistakes: data.commonMistakes || [],
      quickRecap: data.quickRecap || [],
      userHighlights: [],
      personalNotes: "",
      isBookmarked: false,
    };
    setNotes((prev) => ({ ...prev, [materialId]: newNotes }));
    if (isSupabaseConfigured()) {
      saveNotesToDatabase(materialId, newNotes).catch((err) =>
        console.warn("[Supabase DB] background saveNotes notice:", err)
      );
    }
  };

  const reviewFlashcard = (materialId: string, cardId: string, rating: RepetitionRating) => {
    setMemorisePacks((prev) => {
      const pack = prev[materialId];
      if (!pack) return prev;
      const updatedCards = pack.flashcards.map((card) => {
        if (card.id === cardId) {
          const isMastered = rating === "easy" || rating === "good";
          return {
            ...card,
            reviewCount: card.reviewCount + 1,
            lastRating: rating,
            mastered: isMastered,
          };
        }
        return card;
      });

      const updatedPack = { ...pack, flashcards: updatedCards };
      if (isSupabaseConfigured()) {
        saveMemorisePackToDatabase(materialId, updatedPack).catch((err) =>
          console.warn("[Supabase DB] background saveFlashcards notice:", err)
        );
      }

      return {
        ...prev,
        [materialId]: updatedPack,
      };
    });

    setProgress((prev) => ({
      ...prev,
      flashcardsReviewed: prev.flashcardsReviewed + 1,
      flashcardsMastered: rating === "easy" || rating === "good" ? prev.flashcardsMastered + 1 : prev.flashcardsMastered,
    }));

    addXP(10, "Card Reviewed");
  };

  const saveGeneratedMemorise = (materialId: string, data: any) => {
    const pack: MemorisePack = {
      materialId,
      flashcards: data.flashcards || [],
      mnemonics: data.mnemonics || [],
      fillInTheBlanks: data.fillInTheBlanks || [],
      recallQuestions: data.recallQuestions || [],
    };
    setMemorisePacks((prev) => ({ ...prev, [materialId]: pack }));
    if (isSupabaseConfigured()) {
      saveMemorisePackToDatabase(materialId, pack).catch((err) =>
        console.warn("[Supabase DB] background saveMemorisePack notice:", err)
      );
    }
  };

  const submitQuizAttempt = (
    materialId: string,
    score: number,
    total: number,
    wrongIds: string[],
    weakTopics: string[]
  ) => {
    const pct = Math.round((score / total) * 100);
    setQuizzes((prev) => {
      const existing = prev[materialId];
      if (!existing) return prev;
      const updatedQuiz = {
        ...existing,
        bestScore: Math.max(existing.bestScore || 0, pct),
        attemptsCount: existing.attemptsCount + 1,
      };
      if (isSupabaseConfigured()) {
        saveQuizToDatabase(materialId, updatedQuiz).catch((err) =>
          console.warn("[Supabase DB] background saveQuiz notice:", err)
        );
      }
      return {
        ...prev,
        [materialId]: updatedQuiz,
      };
    });

    setProgress((prev) => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1,
      averageQuizScore: Math.round((prev.averageQuizScore * prev.quizzesCompleted + pct) / (prev.quizzesCompleted + 1)),
      weakAreas: [
        ...prev.weakAreas,
        ...weakTopics.map((t) => ({
          topic: t,
          subject: activeMaterial?.subject || "Biology",
          missCount: 1,
        })),
      ],
    }));

    addXP(score * 15, "Quiz Attempt Completed");
    if (pct >= 80) {
      triggerConfetti();
    }
  };

  const saveGeneratedQuiz = (materialId: string, data: any) => {
    const mat = materials.find((m) => m.id === materialId);
    const quiz: Quiz = {
      id: `quiz-${materialId}`,
      materialId,
      quizTitle: data.quizTitle || `${mat?.title || "Topic"} Diagnostic`,
      subject: mat?.subject || "Biology",
      questions: data.questions || [],
      attemptsCount: 0,
    };
    setQuizzes((prev) => ({ ...prev, [materialId]: quiz }));
    if (isSupabaseConfigured()) {
      saveQuizToDatabase(materialId, quiz).catch((err) =>
        console.warn("[Supabase DB] background saveQuiz notice:", err)
      );
    }
  };

  const studyWeakAreasQuiz = (materialId: string, wrongQuestionIds: string[]) => {
    setIsWeakAreaMode(true);
    setActiveTab("quizzes");
  };

  const completeLessonStep = (materialId: string, stepIndex: number) => {
    setLessons((prev) => {
      const existing = prev[materialId];
      if (!existing) return prev;
      const updatedSteps = existing.lessons.map((s, idx) =>
        idx === stepIndex ? { ...s, completed: true } : s
      );
      const isFin = stepIndex >= existing.lessons.length - 1;
      const updatedLesson = {
        ...existing,
        currentStepIndex: Math.min(stepIndex + 1, existing.lessons.length - 1),
        lessons: updatedSteps,
        isFinished: isFin,
      };
      if (isSupabaseConfigured()) {
        saveLessonToDatabase(materialId, updatedLesson).catch((err) =>
          console.warn("[Supabase DB] background saveLesson notice:", err)
        );
      }
      return {
        ...prev,
        [materialId]: updatedLesson,
      };
    });

    setProgress((prev) => ({
      ...prev,
      lessonsCompleted: prev.lessonsCompleted + 1,
    }));

    addXP(25, "Lesson Step Mastered");
  };

  const saveGeneratedLesson = (materialId: string, data: any) => {
    const mat = materials.find((m) => m.id === materialId);
    const lesson: StepLesson = {
      id: `lesson-${materialId}`,
      materialId,
      subject: mat?.subject || "Biology",
      title: data.subject ? `Step-by-Step AI Tutor: ${data.subject}` : `Interactive AI Tutor`,
      totalLessons: data.totalLessons || data.lessons?.length || 6,
      currentStepIndex: 0,
      lessons: data.lessons || [],
      isFinished: false,
    };
    setLessons((prev) => ({ ...prev, [materialId]: lesson }));
    if (isSupabaseConfigured()) {
      saveLessonToDatabase(materialId, lesson).catch((err) =>
        console.warn("[Supabase DB] background saveLesson notice:", err)
      );
    }
  };

  const createStudyGroup = (groupData: Partial<StudyGroup>) => {
    const creatorMember: GroupMember = {
      id: user.id,
      name: `${user.name} (Admin)`,
      avatar: user.avatar,
      role: "admin",
      isOnline: true,
      studyStreak: user.streakDays || 0,
      phoneNumber: user.phoneNumber,
      institution: user.institution,
    };

    const initialMembers =
      groupData.members && groupData.members.length > 0
        ? groupData.members
        : [creatorMember];

    const newGroup: StudyGroup = {
      id: `group-${Date.now()}`,
      name: groupData.name || "New Study Group",
      subject: groupData.subject || "Biology",
      description: groupData.description || "Collaborative study circle.",
      isPrivate: !!groupData.isPrivate,
      examDate: groupData.examDate || "Finals 2026",
      progressPercent: 0,
      sharedMaterialIds: groupData.sharedMaterialIds || [],
      pinnedMessage: "Welcome to our study group! Let's conquer our exams together.",
      members: initialMembers,
    };

    setStudyGroups((prev) => [newGroup, ...prev]);
    setActiveGroup(newGroup);
    addXP(100, "Study Group Created");
    triggerConfetti();
  };

  const addMemberToGroup = (groupId: string, member: GroupMember) => {
    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          if (g.members.some((m) => m.id === member.id)) return g;
          return {
            ...g,
            members: [...g.members, member],
          };
        }
        return g;
      })
    );

    setActiveGroup((prev) => {
      if (!prev || prev.id !== groupId) return prev;
      if (prev.members.some((m) => m.id === member.id)) return prev;
      return {
        ...prev,
        members: [...prev.members, member],
      };
    });

    addXP(25, "Added Member to Study Group");
    triggerConfetti();

    // The newly added friend sends an introductory greeting
    setTimeout(() => {
      sendGroupMessage(
        groupId,
        `Hey everyone! Excited to join this study group. Looking forward to reviewing notes and practicing together! 📚✨`,
        false,
        undefined,
        {
          id: member.id,
          name: member.name,
          avatar: member.avatar,
        }
      );
    }, 1200);
  };

  const removeMemberFromGroup = (groupId: string, memberId: string) => {
    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.id !== memberId),
          };
        }
        return g;
      })
    );

    setActiveGroup((prev) => {
      if (!prev || prev.id !== groupId) return prev;
      return {
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
      };
    });
  };

  const sendGroupMessage = (
    groupId: string,
    text: string,
    isAi = false,
    attachments?: GroupMessage["attachments"],
    senderOverride?: { id: string; name: string; avatar: string }
  ) => {
    const senderId = senderOverride ? senderOverride.id : user.id;
    const senderName = senderOverride ? senderOverride.name : user.name;
    const senderAvatar = senderOverride ? senderOverride.avatar : user.avatar;

    const newMsg: GroupMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      groupId,
      senderId,
      senderName,
      senderAvatar,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
      isAi: false,
      reactions: {},
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };

    setGroupMessages((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), newMsg],
    }));
  };

  const shareMaterialWithGroup = (groupId: string, materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;

    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const already = g.sharedMaterialIds || [];
          if (already.includes(materialId)) return g;
          return {
            ...g,
            sharedMaterialIds: [...already, materialId],
          };
        }
        return g;
      })
    );

    setActiveGroup((prev) => {
      if (!prev || prev.id !== groupId) return prev;
      const already = prev.sharedMaterialIds || [];
      if (already.includes(materialId)) return prev;
      return {
        ...prev,
        sharedMaterialIds: [...already, materialId],
      };
    });

    // Post an announcement in group chat with attachment
    sendGroupMessage(
      groupId,
      `Shared study deck: **${mat.title}** (${mat.subject}). Ready to review flashcards, notes, or quiz questions!`,
      false,
      [
        {
          type: "material",
          title: mat.title,
          linkId: mat.id,
        },
      ]
    );

    addXP(30, "Shared Material with Group");
    triggerConfetti();
  };

  const togglePinMessage = (groupId: string, messageId: string) => {
    setGroupMessages((prev) => {
      const msgs = prev[groupId] || [];
      return {
        ...prev,
        [groupId]: msgs.map((m) => (m.id === messageId ? { ...m, isPinned: !m.isPinned } : m)),
      };
    });
  };

  const reactToMessage = (groupId: string, messageId: string, emoji: string) => {
    setGroupMessages((prev) => {
      const msgs = prev[groupId] || [];
      return {
        ...prev,
        [groupId]: msgs.map((m) => {
          if (m.id === messageId) {
            const currentCount = m.reactions?.[emoji] || 0;
            return {
              ...m,
              reactions: {
                ...(m.reactions || {}),
                [emoji]: currentCount + 1,
              },
            };
          }
          return m;
        }),
      };
    });
  };

  const sendFriendRequest = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, status: "pending" } : f))
    );
    addXP(15, "Connected with study partner");
  };

  const addFriend = (friendData: Omit<StudyFriend, "id"> | Partial<StudyFriend>) => {
    // Avoid duplicate friends
    if (friendData.name && friends.some((f) => f.name.toLowerCase() === friendData.name!.toLowerCase())) {
      return;
    }
    const newFriend: StudyFriend = {
      id: `friend-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: friendData.name || "Study Partner",
      avatar: friendData.avatar || "/studymate_logo.jpg",
      subjects: friendData.subjects || ["General Studies"],
      school: friendData.school || "University",
      interests: friendData.interests || ["Active Recall", "Study Sessions"],
      goals: friendData.goals || "Collaborating on coursework and exam preparation.",
      mutualSubjectsCount: 1,
      status: "connected",
      phoneNumber: friendData.phoneNumber || "+1 (555) 234-5678",
      email: friendData.email,
    };
    setFriends((prev) => [newFriend, ...prev]);
    addXP(25, "Added study partner");
    triggerConfetti();
  };

  const removeFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const startDirectChatWithFriend = (friend: {
    id: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    school?: string;
    subjects?: StudySubject[];
  }) => {
    // Check if a direct chat group with this friend already exists
    const existing = studyGroups.find(
      (g) =>
        g.members.some(
          (m) =>
            m.id === friend.id ||
            (friend.phoneNumber && m.phoneNumber === friend.phoneNumber) ||
            m.name.toLowerCase().includes(friend.name.toLowerCase())
        ) && g.members.length <= 2
    );

    if (existing) {
      setActiveGroup(existing);
      setActiveTab("groups");
      return;
    }

    const newGroup: StudyGroup = {
      id: `direct-chat-${Date.now()}`,
      name: `Study Circle with ${friend.name}`,
      subject: (friend.subjects && friend.subjects[0]) || "Biology",
      description: `Direct 1-on-1 study circle with ${friend.name} (${friend.phoneNumber || "StudyMate Peer"}).`,
      isPrivate: true,
      examDate: "Collaborative Study",
      progressPercent: 0,
      members: [
        {
          id: user.id,
          name: `${user.name} (Admin)`,
          avatar: user.avatar,
          role: "admin",
          isOnline: true,
          studyStreak: user.streakDays || 0,
          phoneNumber: user.phoneNumber,
          institution: user.institution,
        },
        {
          id: friend.id || `peer-${Date.now()}`,
          name: friend.name,
          avatar: friend.avatar || "/studymate_logo.jpg",
          role: "member",
          isOnline: true,
          studyStreak: 4,
          phoneNumber: friend.phoneNumber,
          institution: friend.school || "StudyMate Student",
        },
      ],
      sharedMaterialIds: materials.length > 0 ? [materials[0].id] : [],
    };

    setStudyGroups((prev) => [newGroup, ...prev]);
    setActiveGroup(newGroup);
    setActiveTab("groups");
    triggerConfetti();
  };

  const updatePrivacySettings = (settings: {
    isProfilePublic: boolean;
    allowFriendRequests: boolean;
    allowGroupInvites: boolean;
  }) => {
    setUser((prev) => ({ ...prev, ...settings }));
  };

  const togglePlanTask = (dayNumber: number, taskId: string) => {
    setStudyPlan((prev) => {
      if (!prev) return null;
      const updatedDays = prev.days.map((day) => {
        if (day.dayNumber === dayNumber) {
          const updatedTasks = day.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          const allDone = updatedTasks.every((t) => t.completed);
          return { ...day, tasks: updatedTasks, completed: allDone };
        }
        return day;
      });

      const totalTasks = updatedDays.reduce((acc, d) => acc + d.tasks.length, 0);
      const doneTasks = updatedDays.reduce(
        (acc, d) => acc + d.tasks.filter((t) => t.completed).length,
        0
      );
      const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      return {
        ...prev,
        days: updatedDays,
        progressPercent: pct,
      };
    });

    addXP(20, "Study Plan Task Completed");
  };

  const saveGeneratedPlan = (data: any) => {
    const newPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      subject: activeMaterial?.subject || "Biology",
      planTitle: data.planTitle || "Personalized AI Study Plan",
      examDate: data.examDate || "In 2 Weeks",
      dailyTargetHours: data.dailyTargetHours || 2,
      strategySummary: data.strategySummary || "Targeted spaced active recall roadmap.",
      days: (data.days || []).map((d: any, idx: number) => ({
        dayNumber: d.dayNumber || idx + 1,
        dateLabel: d.dateLabel || `Day ${idx + 1}`,
        topic: d.topic || "Core Subject Concepts",
        focus: d.focus || "Concept mastery and practice questions.",
        milestone: d.milestone || "Day target achieved",
        completed: false,
        tasks: (d.tasks || []).map((t: any, tIdx: number) => ({
          id: `task-${idx}-${tIdx}`,
          title: t.title || "Study Session",
          durationMinutes: t.durationMinutes || 30,
          mode: t.mode || "notes",
          completed: false,
        })),
      })),
      progressPercent: 0,
    };
    setStudyPlan(newPlan);
    setActiveTab("plan");
    triggerConfetti();
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Active sub-objects based on activeMaterial
  const activeNotes = activeMaterial ? notes[activeMaterial.id] || null : null;
  const activeMemorisePack = activeMaterial ? memorisePacks[activeMaterial.id] || null : null;
  const activeQuiz = activeMaterial ? quizzes[activeMaterial.id] || null : null;
  const activeLesson = activeMaterial ? lessons[activeMaterial.id] || null : null;

  return (
    <StudyContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        isOnboarded,
        completeOnboarding,
        activeTab,
        setActiveTab,
        selectedSubject,
        setSelectedSubject,
        materials,
        activeMaterial,
        setActiveMaterial,
        addMaterial,
        deleteMaterial,
        updateMaterialProgress,
        notes,
        activeNotes,
        updateNotes,
        saveGeneratedNotes,
        memorisePacks,
        activeMemorisePack,
        reviewFlashcard,
        saveGeneratedMemorise,
        quizzes,
        activeQuiz,
        submitQuizAttempt,
        saveGeneratedQuiz,
        studyWeakAreasQuiz,
        isWeakAreaMode,
        setIsWeakAreaMode,
        lessons,
        activeLesson,
        completeLessonStep,
        saveGeneratedLesson,
        studyGroups,
        activeGroup,
        setActiveGroup,
        createStudyGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        groupMessages,
        sendGroupMessage,
        shareMaterialWithGroup,
        togglePinMessage,
        reactToMessage,
        friends,
        sendFriendRequest,
        addFriend,
        removeFriend,
        startDirectChatWithFriend,
        updatePrivacySettings,
        studyPlan,
        setStudyPlan,
        togglePlanTask,
        saveGeneratedPlan,
        progress,
        achievements,
        addXP,
        triggerConfetti,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        isSidebarOpen,
        setIsSidebarOpen,
        initialImportType,
        setInitialImportType,
        initialImportQuery,
        setInitialImportQuery,
        openAddMaterialModal,
        clearAllCourses,
        isAddMaterialModalOpen,
        setIsAddMaterialModalOpen,
        isAssistantOpen,
        setIsAssistantOpen,
        isSearchOpen,
        setIsSearchOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPracticeStationModalOpen,
        setIsPracticeStationModalOpen,
        isProfileSetupOpen,
        setIsProfileSetupOpen,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
};

// Re-export sequential Supabase persistence handlers for direct access
export {
  saveMaterialToDatabase,
  saveNotesToDatabase,
  saveFullStudyPackageToSupabase,
  fetchFullStudyDataFromSupabase,
};

