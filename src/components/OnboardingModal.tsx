import React, { useState, useEffect } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Users2,
  Phone,
  Mail,
  School,
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";

export const OnboardingModal: React.FC = () => {
  const {
    user,
    updateUser,
    isOnboarded,
    completeOnboarding,
    isProfileSetupOpen,
    setIsProfileSetupOpen,
    triggerConfetti,
  } = useStudy();

  const isOpen = !isOnboarded || isProfileSetupOpen;

  const [fullName, setFullName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [localPhone, setLocalPhone] = useState("");
  const [institution, setInstitution] = useState(user.institution || "");
  const [educationLevel, setEducationLevel] = useState(
    user.educationLevel || "Undergraduate (Year 1-4)"
  );

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.name || "Alex Chen");
      setEmail(user.email || "alex.chen@university.edu");
      setInstitution(user.institution || "Stanford University");
      setEducationLevel(user.educationLevel || "Undergraduate (Year 1-4)");
      if (user.phoneNumber) {
        const parts = user.phoneNumber.split(" ");
        if (parts.length > 1 && parts[0].startsWith("+")) {
          setPhoneCountryCode(parts[0]);
          setLocalPhone(parts.slice(1).join(" "));
        } else {
          setLocalPhone(user.phoneNumber);
        }
      } else {
        setLocalPhone("(555) 438-9201");
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = localPhone.trim()
      ? `${phoneCountryCode} ${localPhone.trim()}`
      : `${phoneCountryCode} (555) 438-9201`;

    const profileUpdates = {
      name: fullName.trim() || "Alex Chen",
      email: email.trim() || "alex.chen@university.edu",
      phoneNumber: cleanPhone,
      institution: institution.trim() || "Stanford University",
      educationLevel,
    };

    if (!isOnboarded) {
      completeOnboarding(profileUpdates);
    } else {
      updateUser(profileUpdates);
    }

    setIsProfileSetupOpen(false);
    triggerConfetti();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A1931]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-[#0A1931] space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Title & Close button if already onboarded */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0A1931] text-white flex items-center justify-center shadow-xs shrink-0">
              <Users2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#0A1931] tracking-tight">
                  StudyMate Profile Front
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
                Set up your student identity to connect with peers and find study groups.
              </p>
            </div>
          </div>

          {isOnboarded && (
            <button
              onClick={() => setIsProfileSetupOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Informational Callout regarding Phone Number & Discovery */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
          <Phone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 leading-relaxed">
            <span className="font-bold">Phone-Based Peer Discovery:</span> Your verified phone
            number allows classmates who have signed in to StudyMate to find you, add you as a
            friend, and invite you to collaborative study groups.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#0A1931] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0A1931]" />
              <span>Full Name</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#0A1931] mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0A1931]" />
              <span>Email Address</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.morgan@stanford.edu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-[#0A1931] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0A1931]" />
                <span>Phone Number</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Used to find friends & groups
              </span>
            </label>
            <div className="flex gap-2">
              <select
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
              >
                <option value="+1">+1 (US/CA)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+234">+234 (NG)</option>
                <option value="+91">+91 (IN)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+49">+49 (DE)</option>
                <option value="+33">+33 (FR)</option>
                <option value="+27">+27 (ZA)</option>
                <option value="+81">+81 (JP)</option>
              </select>
              <input
                type="tel"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="e.g. 555-438-9201"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
                required
              />
            </div>
            <p className="text-[11px] text-[#1B2A4A]/60 mt-1">
              Your number allows other signed-in StudyMate students to find and add you to study circles.
            </p>
          </div>

          {/* Institution / School */}
          <div>
            <label className="block text-xs font-bold text-[#0A1931] mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-[#0A1931]" />
              <span>Institution / School</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Stanford University, MIT, University of Oxford"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
              required
            />
          </div>

          {/* Education Level */}
          <div>
            <label className="block text-xs font-bold text-[#0A1931] mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#0A1931]" />
              <span>Education Level</span>
            </label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
            >
              <option value="High School">High School</option>
              <option value="Undergraduate (Year 1-4)">Undergraduate (Year 1-4)</option>
              <option value="Graduate / Medical / Law">Graduate / Medical / Law</option>
              <option value="Professional & Lifelong Learner">Professional & Lifelong Learner</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            {isOnboarded && (
              <button
                type="button"
                onClick={() => setIsProfileSetupOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#0A1931] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Save Profile & Confirm Phone</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
