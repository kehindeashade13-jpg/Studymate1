import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Edit3,
  Phone,
} from "lucide-react";

export const ProfileView: React.FC = () => {
  const { user, updateUser, triggerConfetti, setIsProfileSetupOpen } = useStudy();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || "student@studymate.ai");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "+1 (555) 438-9201");
  const [institution, setInstitution] = useState(user.institution || "Stanford University");
  const [educationLevel, setEducationLevel] = useState(user.educationLevel);
  const [bio, setBio] = useState(user.bio || "");
  const [studyGoals, setStudyGoals] = useState(user.studyGoals || "");
  const [studyPreference, setStudyPreference] = useState(user.studyPreference);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      email,
      phoneNumber,
      institution,
      educationLevel,
      bio,
      studyGoals,
      studyPreference,
    });
    setIsEditing(false);
    triggerConfetti();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 bg-white text-[#0A1931]">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || "/studymate_logo.jpg"}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#0A1931]/10 border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-[#0A1931] border border-slate-200">
                {user.educationLevel}
              </span>
              <span className="text-xs text-[#1B2A4A]/70">{user.institution}</span>
            </div>
            <h1 className="text-2xl font-black text-[#0A1931]">{user.name}</h1>
            <p className="text-xs text-[#1B2A4A]/70 mt-0.5">{user.email}</p>
            <p className="text-xs text-[#1B2A4A]/80 mt-1 flex items-center gap-1.5 font-medium">
              <Phone className="w-3 h-3 text-[#0A1931]" />
              <span>{user.phoneNumber || "+1 (555) 438-9201"}</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Group Discoverable
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsProfileSetupOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-[#0A1931] transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-[#0A1931]" />
            <span>Open Profile Front</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-xs font-semibold text-white transition flex items-center gap-2 self-start sm:self-center cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-white" />
            <span>{isEditing ? "Cancel Editing" : "Edit Profile"}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Form / Display */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0A1931]" />
                  <span>Phone Number (For Group Invites)</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                  required
                />
                <p className="text-[11px] text-[#1B2A4A]/70 mt-1">
                  Enables peers and study partners to find you and invite you to groups.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Institution / School
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate (Year 1-2)">Undergraduate (Year 1-2)</option>
                  <option value="Undergraduate (Year 3-4)">Undergraduate (Year 3-4)</option>
                  <option value="Graduate / Medical / Law">Graduate / Medical / Law</option>
                  <option value="Lifelong Learner">Lifelong Learner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Study Preference
                </label>
                <select
                  value={studyPreference}
                  onChange={(e) => setStudyPreference(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                >
                  <option value="alone">Study Alone</option>
                  <option value="group">Study in Groups</option>
                  <option value="both">Both (Flexible)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A1931] mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A1931] mb-1">
                Study & Academic Goals
              </label>
              <textarea
                value={studyGoals}
                onChange={(e) => setStudyGoals(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-[#0A1931] uppercase tracking-wider mb-1">
                About Me & Bio
              </h3>
              <p className="text-sm text-[#1B2A4A]/80 leading-relaxed">
                {user.bio || "No biography added yet."}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#0A1931] uppercase tracking-wider mb-1">
                Academic & Exam Goals
              </h3>
              <p className="text-sm text-[#1B2A4A]/80 leading-relaxed">
                {user.studyGoals || "Master daily concepts and score top percentile."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-[#1B2A4A]/70">
              <span>Account Status: Active Scholar</span>
              <span className="text-emerald-700 font-bold">Verified Student</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
