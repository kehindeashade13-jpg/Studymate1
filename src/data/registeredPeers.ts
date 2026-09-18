import { StudyFriend } from "../types";

export interface RegisteredPeer {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phoneNumber: string;
  school: string;
  subjects: string[];
  goals: string;
  interests: string[];
  studyStreak: number;
}

export const REGISTERED_STUDYMATE_USERS: RegisteredPeer[] = [
  {
    id: "peer-sophia",
    name: "Sophia Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    email: "sophia.patel@stanford.edu",
    phoneNumber: "+1 (555) 234-5678",
    school: "Stanford University",
    subjects: ["Biology", "Chemistry", "Psychology"],
    goals: "Top percentile on MCAT & Cellular Biology finals",
    interests: ["spaced repetition", "active recall", "diagram flashcards"],
    studyStreak: 14,
  },
  {
    id: "peer-marcus",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    email: "marcus.v@mit.edu",
    phoneNumber: "+1 (555) 345-6789",
    school: "Massachusetts Institute of Technology (MIT)",
    subjects: ["Computer Science", "Mathematics", "Physics"],
    goals: "Acing Algorithms, Systems Architecture & Calculus III",
    interests: ["code review", "problem sets", "spaced flashcards"],
    studyStreak: 9,
  },
  {
    id: "peer-chloe",
    name: "Chloe Bennett",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    email: "chloe.bennett@oxford.ac.uk",
    phoneNumber: "+44 7911 123456",
    school: "University of Oxford",
    subjects: ["History", "English", "Psychology"],
    goals: "Mastering European History & Cognitive Science essays",
    interests: ["essay blueprints", "mnemonic anchors", "group quizzes"],
    studyStreak: 21,
  },
  {
    id: "peer-daniel",
    name: "Daniel Kim",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    email: "daniel.kim@berkeley.edu",
    phoneNumber: "+1 (555) 456-7890",
    school: "UC Berkeley",
    subjects: ["Biology", "Mathematics", "Chemistry"],
    goals: "Organic Chemistry Reaction Pathways & Biophysics",
    interests: ["flashcards", "timed quizzes", "peer study circles"],
    studyStreak: 12,
  },
  {
    id: "peer-amara",
    name: "Amara Okonjo",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    email: "amara.okonjo@unilag.edu.ng",
    phoneNumber: "+234 803 123 4567",
    school: "University of Lagos",
    subjects: ["Business", "Computer Science", "Mathematics"],
    goals: "Quantitative Finance & Machine Learning Fundamentals",
    interests: ["case studies", "daily streak", "group quizzes"],
    studyStreak: 18,
  },
  {
    id: "peer-liam",
    name: "Liam O'Connor",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    email: "liam.oc@sydney.edu.au",
    phoneNumber: "+61 412 345 678",
    school: "University of Sydney",
    subjects: ["Chemistry", "Biology", "Physics"],
    goals: "Pharmacology Board Exam prep & Organic Mechanisms",
    interests: ["active recall", "fill in the blanks", "exam drills"],
    studyStreak: 7,
  },
  {
    id: "peer-zara",
    name: "Zara Al-Mansoor",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    email: "zara.m@harvard.edu",
    phoneNumber: "+1 (555) 678-9012",
    school: "Harvard University",
    subjects: ["Psychology", "Biology", "English"],
    goals: "Cognitive Neuroscience & Behavioral Genetics Exam",
    interests: ["concept maps", "mnemonics", "peer study sessions"],
    studyStreak: 15,
  },
];

// Helper to normalize phone numbers for loose and exact comparisons
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

// Search registered peers by phone number (matches country code, local digits, or full string)
export function searchPeersByPhone(query: string): RegisteredPeer[] {
  if (!query || query.trim().length < 3) return [];
  const cleanQuery = normalizePhone(query);
  const rawQuery = query.toLowerCase().trim();

  return REGISTERED_STUDYMATE_USERS.filter((peer) => {
    const peerClean = normalizePhone(peer.phoneNumber);
    const peerRaw = peer.phoneNumber.toLowerCase();
    return (
      peerClean.includes(cleanQuery) ||
      peerRaw.includes(rawQuery) ||
      peer.name.toLowerCase().includes(rawQuery) ||
      peer.school.toLowerCase().includes(rawQuery)
    );
  });
}
