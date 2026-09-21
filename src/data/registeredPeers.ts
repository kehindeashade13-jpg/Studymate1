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
  bio?: string;
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
    bio: "Pre-med junior studying biochemistry and physiology.",
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
    bio: "CS sophomore passionate about distributed systems and AI.",
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
    bio: "Reading Modern History at Oxford. Love collaborative quiz battles.",
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
    bio: "Bioengineering student preparing for spring finals.",
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
    bio: "Final year student exploring fintech and data science.",
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
    bio: "Pharmacy student who studies with active recall and mnemonics.",
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
    bio: "Cognitive science researcher & spaced repetition enthusiast.",
  },
  {
    id: "peer-emmanuel",
    name: "Emmanuel Adeyemi",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    email: "emmanuel.ade@covenant.edu.ng",
    phoneNumber: "+234 812 345 6789",
    school: "Covenant University",
    subjects: ["Computer Science", "Mathematics", "Physics"],
    goals: "Full Stack Engineering & Advanced Algorithms",
    interests: ["problem sets", "spaced repetition", "study circles"],
    studyStreak: 24,
    bio: "Software engineering enthusiast and math tutor.",
  },
  {
    id: "peer-elena",
    name: "Elena Rossi",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    email: "elena.rossi@polimi.it",
    phoneNumber: "+39 340 123 4567",
    school: "Politecnico di Milano",
    subjects: ["Physics", "Mathematics", "Computer Science"],
    goals: "Quantum Mechanics & Differential Equations",
    interests: ["physics problems", "active flashcards", "peer review"],
    studyStreak: 11,
    bio: "Applied Physics student building interactive simulations.",
  },
  {
    id: "peer-aaron",
    name: "Aaron Chen",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    email: "aaron.chen@utoronto.ca",
    phoneNumber: "+1 (416) 555-0199",
    school: "University of Toronto",
    subjects: ["Business", "Economics", "Mathematics"],
    goals: "Microeconomics & Financial Accounting Exam",
    interests: ["case studies", "spaced recall", "peer challenges"],
    studyStreak: 16,
    bio: "Rotman Commerce student focusing on financial markets.",
  },
];

export const registeredPeers = REGISTERED_STUDYMATE_USERS;

// Helper to normalize phone numbers for comparison
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

// Search registered peers by phone number (matches digits, country code, or name)
export function searchPeersByPhone(query: string, additionalPeers: RegisteredPeer[] = []): RegisteredPeer[] {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = normalizePhone(query);
  const rawQuery = query.toLowerCase().trim();
  const allPool = [...REGISTERED_STUDYMATE_USERS, ...additionalPeers];

  const results: RegisteredPeer[] = [];
  const seenIds = new Set<string>();

  for (const peer of allPool) {
    if (seenIds.has(peer.id)) continue;
    const peerClean = normalizePhone(peer.phoneNumber);
    const peerRaw = peer.phoneNumber.toLowerCase();

    // Check if clean digits match or raw text matches
    const isPhoneMatch =
      cleanQuery.length >= 2 &&
      (peerClean.includes(cleanQuery) ||
        cleanQuery.includes(peerClean.replace(/^\+/, "")) ||
        peerClean.endsWith(cleanQuery) ||
        cleanQuery.endsWith(peerClean.replace(/^\+\d{1,3}/, "")));

    const isNameMatch = peer.name.toLowerCase().includes(rawQuery);
    const isSchoolMatch = peer.school.toLowerCase().includes(rawQuery);

    if (isPhoneMatch || isNameMatch || isSchoolMatch) {
      seenIds.add(peer.id);
      results.push(peer);
    }
  }

  return results;
}
