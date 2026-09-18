import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Sparkles,
  BookOpen,
  School,
  GraduationCap,
  Users2,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { StudySubject } from "../types";

const ALL_SUBJECTS: StudySubject[] = [
  "Biology",
  "Mathematics",
  "Chemistry",
  "Physics",
  "History",
  "Computer Science",
  "English",
  "Business",
  "Psychology",
];

export const OnboardingModal: React.FC = () => {
  const { user, updateUser, isOnboarding, setIsOnboarding, triggerConfetti } = useStudy();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user.name || "Alex Chen");
  const [institution, setInstitution] = useState(user.institution || "Stanford University");
  const [educationLevel, setEducationLevel] = useState(user.educationLevel || "Undergraduate (Year 3-4)");
  const [selectedSubjects, setSelectedSubjects] = useState<StudySubject[]>(
    user.enrolledSubjects || ["Biology", "Chemistry"]
  );
  const [studyPreference, setStudyPreference] = useState<"alone" | "group" | "both">("both");
  const [studyGoals, setStudyGoals] = useState("Score top percentile on upcoming MCAT & Finals");

  if (!isOnboarding) return null;

  const toggleSubject = (s: StudySubject) => {
    if (selectedSubjects.includes(s)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((x) => x !== s));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const handleComplete = () => {
    updateUser({
      name,
      institution,
      educationLevel,
      enrolledSubjects: selectedSubjects,
      studyPreference,
      studyGoals,
    });
    setIsOnboarding(false);
    triggerConfetti();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white space-y-6">
        {/* Top Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Welcome to StudyMate</h2>
              <p className="text-[11px] text-slate-400">Step {step} of 3 • Personalized Learning Setup</p>
            </div>
          </div>

          <span className="text-xs font-bold text-blue-400">+100 Welcome XP</span>
        </div>

        {/* STEP 1: Name, School & Level */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-white">Tell us about your studies</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                We'll tailor your AI lessons, quiz difficulty, and peer study circles.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  School / College / University
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate (Year 1-2)">Undergraduate (Year 1-2)</option>
                  <option value="Undergraduate (Year 3-4)">Undergraduate (Year 3-4)</option>
                  <option value="Graduate / Medical / Law">Graduate / Medical / Law</option>
                  <option value="Lifelong Learner">Lifelong Learner</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Enrolled Subjects */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-white">What subjects are you studying?</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your core classes to organize materials and find peer study partners.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
              {ALL_SUBJECTS.map((s) => {
                const isSelected = selectedSubjects.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`p-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-600/30 border-blue-500 text-white shadow-sm"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>{s}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Study Preference & Goals */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-white">How do you prefer to study?</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your study dashboard and collaborative notifications.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "alone", label: "Solo Focus", desc: "Private active recall & AI lessons" },
                { id: "group", label: "Study Circles", desc: "Collaborate in study groups" },
                { id: "both", label: "Both (Hybrid)", desc: "Deep solo work + peer sessions" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setStudyPreference(p.id as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    studyPreference === p.id
                      ? "bg-blue-600/30 border-blue-500 text-white shadow-sm"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <p className="text-xs font-bold">{p.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Goal / Exam Focus
              </label>
              <input
                type="text"
                value={studyGoals}
                onChange={(e) => setStudyGoals(e.target.value)}
                placeholder="e.g. Master AP Biology or MCAT 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch My StudyMate Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
