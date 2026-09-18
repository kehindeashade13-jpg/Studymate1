import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  UserPlus,
  Search,
  School,
  Shield,
  Check,
  Clock,
  Trash2,
  X,
  Plus,
  Users2,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { StudySubject } from "../types";
import { registeredPeers, searchPeersByPhone } from "../data/registeredPeers";

export const FriendsView: React.FC = () => {
  const {
    user,
    friends,
    addFriend,
    removeFriend,
    updatePrivacySettings,
    setActiveTab,
    triggerConfetti,
    setIsProfileSetupOpen,
    createStudyGroup,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Phone search state
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);

  // Form State for Adding a New Friend
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [goals, setGoals] = useState("");
  const [interests, setInterests] = useState("");

  const handleCreateFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addFriend({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@school.edu`,
      phoneNumber: phone.trim() || "+1 (555) 234-5678",
      institution: school.trim() || "StudyMate Peer",
      avatar: "/studymate_logo.jpg",
      subjects: [subject.trim() || "General Studies"],
      status: "connected",
      goals: goals.trim() || "Study sessions & active recall practice",
      interests: interests
        ? interests.split(",").map((s) => s.trim()).filter(Boolean)
        : ["exam prep", "flashcards"],
      school: school.trim() || "StudyMate Peer",
      mutualSubjectsCount: 1,
    });

    // Reset Form
    setName("");
    setEmail("");
    setPhone("");
    setSchool("");
    setGoals("");
    setInterests("");
    setIsAddModalOpen(false);
    triggerConfetti();
  };

  const handleAddRegisteredPeer = (peer: typeof registeredPeers[0]) => {
    const isAlreadyFriend = friends.some((f) => f.name.toLowerCase() === peer.name.toLowerCase());
    if (isAlreadyFriend) {
      setPhoneFeedback(`${peer.name} is already in your friends list!`);
      setTimeout(() => setPhoneFeedback(null), 3000);
      return;
    }

    addFriend({
      name: peer.name,
      email: peer.email,
      phoneNumber: peer.phoneNumber,
      institution: peer.school,
      school: peer.school,
      avatar: peer.avatar,
      subjects: peer.subjects,
      status: "connected",
      goals: `Study collaboration in ${peer.subjects.join(", ")}`,
      interests: ["group study", "flashcards", "active recall"],
      mutualSubjectsCount: 1,
    });

    setPhoneFeedback(`Added ${peer.name} (${peer.phoneNumber}) to your study friends!`);
    triggerConfetti();
    setTimeout(() => setPhoneFeedback(null), 4000);
  };

  const handleCreateGroupWithPeer = (peer: { name: string; phoneNumber: string; school: string; avatar: string; subjects?: string[] }) => {
    createStudyGroup({
      name: `Study Circle with ${peer.name}`,
      subject: (peer.subjects && peer.subjects[0] ? peer.subjects[0] : "Biology") as StudySubject,
      description: `Peer study circle with ${peer.name} (${peer.phoneNumber}) from ${peer.school}.`,
      isPrivate: true,
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
          id: `peer-${Date.now()}`,
          name: peer.name,
          avatar: peer.avatar,
          role: "member",
          isOnline: true,
          studyStreak: 4,
          phoneNumber: peer.phoneNumber,
          institution: peer.school,
        },
      ],
    });

    setActiveTab("groups");
    triggerConfetti();
  };

  const phoneSearchResults = phoneSearchQuery.trim()
    ? searchPeersByPhone(phoneSearchQuery.trim())
    : [];

  const filteredFriends = friends.filter((f) => {
    const matchSubj =
      filterSubject === "All" ||
      f.subjects.some((s) => s.toLowerCase() === filterSubject.toLowerCase());
    const matchQuery =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.school && f.school.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.phoneNumber && f.phoneNumber.includes(searchQuery)) ||
      (f.email && f.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubj && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 text-[#0A1931]">
      {/* User Profile Front Notice */}
      <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0A1931] text-white flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0A1931]">{user.name}</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Phone Discoverable
              </span>
            </div>
            <p className="text-xs text-[#1B2A4A]/70 mt-0.5 flex flex-wrap items-center gap-x-2">
              <span><b>Number:</b> {user.phoneNumber || "+1 (555) 438-9201"}</span>
              <span>•</span>
              <span><b>School:</b> {user.institution || "Stanford University"}</span>
              <span>•</span>
              <span><b>Email:</b> {user.email || "student@studymate.ai"}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileSetupOpen(true)}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0A1931] text-xs font-bold text-[#0A1931] transition shadow-2xs cursor-pointer shrink-0"
        >
          Edit Profile Front
        </button>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Study Network & Phone Discovery
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0A1931] tracking-tight">
            Find Friends & Study Partners
          </h1>
          <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
            Find peers by their correct phone number, create study groups together, and manage your circle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="add-friend-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Friend Manually</span>
          </button>
        </div>
      </div>

      {/* Phone Discovery Box */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0A1931]">
                Find Friends with Phone Number
              </h2>
              <p className="text-[11px] text-[#1B2A4A]/70">
                Search students signed in to StudyMate using their correct phone number or digits
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Try searching: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0A1931]">555</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0A1931]">234</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0A1931]">7911</code>, or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0A1931]">803</code>
          </span>
        </div>

        {phoneFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{phoneFeedback}</span>
          </div>
        )}

        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={phoneSearchQuery}
            onChange={(e) => setPhoneSearchQuery(e.target.value)}
            placeholder="Enter friend's phone number (e.g. +1 (555) 234-5678, +44 7911, or partial digits)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] focus:bg-white transition"
          />
          {phoneSearchQuery && (
            <button
              onClick={() => setPhoneSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results of Phone Search */}
        {phoneSearchQuery.trim() && (
          <div className="pt-2">
            {phoneSearchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {phoneSearchResults.map((peer) => {
                  const isAlreadyFriend = friends.some(
                    (f) => f.name.toLowerCase() === peer.name.toLowerCase()
                  );
                  return (
                    <div
                      key={peer.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0A1931]/30 transition shadow-2xs space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={peer.avatar}
                          alt={peer.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-extrabold text-[#0A1931] truncate">
                            {peer.name}
                          </h4>
                          <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{peer.phoneNumber}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <School className="w-3 h-3" />
                            <span>{peer.school}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {isAlreadyFriend ? (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 flex-1">
                            <Check className="w-3 h-3" /> Connected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddRegisteredPeer(peer)}
                            className="px-3 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer flex-1 justify-center shadow-2xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Friend</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCreateGroupWithPeer(peer)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-[11px] font-bold text-[#0A1931] transition flex items-center gap-1 cursor-pointer"
                          title="Create study group with this peer"
                        >
                          <Users2 className="w-3 h-3" />
                          <span>Create Group</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1">
                <p className="text-xs font-bold text-[#0A1931]">No registered student with this phone number</p>
                <p className="text-[11px] text-slate-500">
                  Ensure the phone number includes the correct digits or invite them via "Add Friend Manually".
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Friends List + Directory & Privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Study Friends Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends by name, phone, school, or topic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["All", "Biology", "Mathematics", "Chemistry", "Physics", "Computer Science"].map(
                (sub) => (
                  <button
                    key={sub}
                    onClick={() => setFilterSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                      filterSubject === sub
                        ? "bg-[#0A1931] text-white border-[#0A1931] shadow-2xs"
                        : "bg-white text-[#0A1931] border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {sub}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Friends List or Empty State */}
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 text-[#0A1931]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.avatar || "/studymate_logo.jpg"}
                          alt={friend.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <h3 className="text-sm font-extrabold text-[#0A1931]">{friend.name}</h3>
                          <p className="text-[11px] text-[#1B2A4A]/70 flex items-center gap-1 mt-0.5 font-medium">
                            <School className="w-3 h-3 text-slate-400" />
                            <span>{friend.school || "Classmate"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Delete Friend Button */}
                      <button
                        onClick={() => {
                          removeFriend(friend.id);
                          setPhoneFeedback(`Deleted ${friend.name} from friends.`);
                          setTimeout(() => setPhoneFeedback(null), 3000);
                        }}
                        className="px-2 py-1 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Delete friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {/* Phone & Email Info */}
                    <div className="space-y-1 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{friend.phoneNumber || "+1 (555) 234-5678"}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold ml-auto">
                          Verified
                        </span>
                      </div>
                      {friend.email && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{friend.email}</span>
                        </div>
                      )}
                    </div>

                    {friend.goals && (
                      <p className="text-xs text-[#1B2A4A]/80 mb-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                        🎯 <span className="font-bold text-[#0A1931]">Goal:</span> {friend.goals}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {friend.subjects.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {friend.interests && friend.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-[#1B2A4A]/60">
                        {friend.interests.map((int) => (
                          <span key={int} className="font-medium">#{int}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Connected
                    </span>
                    <button
                      onClick={() => {
                        handleCreateGroupWithPeer({
                          name: friend.name,
                          phoneNumber: friend.phoneNumber || "+1 (555) 234-5678",
                          school: friend.school || "Study Partner",
                          avatar: friend.avatar || "/studymate_logo.jpg",
                          subjects: friend.subjects,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-xs font-bold text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Users2 className="w-3 h-3" />
                      <span>Create Group</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                <Users2 className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-extrabold text-base text-[#0A1931]">No Friends Added Yet</h3>
                <p className="text-xs text-[#1B2A4A]/70">
                  You have not added any study partners yet. Search by phone number above or add your classmates to practice active recall together!
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Your First Study Friend</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Registered StudyMate Students Directory + Privacy Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Connect Directory */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#0A1931]">Signed-In StudyMate Peers</h3>
                <p className="text-[10px] text-slate-500">Discoverable by phone number</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {registeredPeers.slice(0, 4).map((peer) => {
                const isAlready = friends.some((f) => f.name.toLowerCase() === peer.name.toLowerCase());
                return (
                  <div key={peer.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={peer.avatar} alt={peer.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0A1931] truncate">{peer.name}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{peer.phoneNumber}</p>
                      </div>
                    </div>
                    {isAlready ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddRegisteredPeer(peer)}
                        className="px-2 py-1 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0A1931] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0A1931]">Student Privacy Controls</h3>
                <p className="text-[11px] text-[#1B2A4A]/70">Control visibility to your classmates</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1931]">Phone Discoverability</p>
                  <p className="text-[11px] text-[#1B2A4A]/60">Allow peers to find you via your phone number</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.isProfilePublic}
                  onChange={(e) => updatePrivacySettings({ isProfilePublic: e.target.checked })}
                  className="w-4 h-4 accent-[#0A1931] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1931]">Allow Friend Requests</p>
                  <p className="text-[11px] text-[#1B2A4A]/60">Classmates can send study requests</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.allowFriendRequests}
                  onChange={(e) => updatePrivacySettings({ allowFriendRequests: e.target.checked })}
                  className="w-4 h-4 accent-[#0A1931] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1931]">Allow Group Invites</p>
                  <p className="text-[11px] text-[#1B2A4A]/60">Friends can add you to study circles</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.allowGroupInvites}
                  onChange={(e) => updatePrivacySettings({ allowGroupInvites: e.target.checked })}
                  className="w-4 h-4 accent-[#0A1931] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Friend */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-[#0A1931]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0A1931]">Add Study Partner</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Record their profile & contact info</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0A1931] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFriend} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@school.edu"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    School / Institution
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Columbia Univ"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Biology, Calc"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Study Goal / Exam
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Finals revision & flashcards"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0A1931] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Partner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

      {/* Main Grid: Matchmaking List + Privacy Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Study Friends Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends by name, school, or topic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["All", "Biology", "Mathematics", "Chemistry", "Physics", "Computer Science"].map(
                (sub) => (
                  <button
                    key={sub}
                    onClick={() => setFilterSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                      filterSubject === sub
                        ? "bg-[#0A1931] text-white border-[#0A1931] shadow-2xs"
                        : "bg-white text-[#0A1931] border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {sub}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Friends List or Empty State */}
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 text-[#0A1931]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.avatar || "/studymate_logo.jpg"}
                          alt={friend.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <h3 className="text-sm font-extrabold text-[#0A1931]">{friend.name}</h3>
                          <p className="text-[11px] text-[#1B2A4A]/70 flex items-center gap-1 mt-0.5 font-medium">
                            <School className="w-3 h-3 text-slate-400" />
                            <span>{friend.school || "Classmate"}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Remove friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {friend.goals && (
                      <p className="text-xs text-[#1B2A4A]/80 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        🎯 <span className="font-bold text-[#0A1931]">Goal:</span> {friend.goals}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {friend.subjects.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {friend.interests && friend.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-[#1B2A4A]/60">
                        {friend.interests.map((int) => (
                          <span key={int} className="font-medium">#{int}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Connected
                    </span>
                    <button
                      onClick={() => setActiveTab("groups")}
                      className="px-3 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-xs font-bold text-white transition shadow-2xs cursor-pointer"
                    >
                      Invite to Group
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                <Users2 className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-extrabold text-base text-[#0A1931]">No Friends Added Yet</h3>
                <p className="text-xs text-[#1B2A4A]/70">
                  You have not added any study partners yet. Add your classmates to exchange study materials, compare quiz scores, and practice together!
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Your First Study Friend</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Student Privacy & Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0A1931] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0A1931]">Student Privacy Controls</h3>
                <p className="text-[11px] text-[#1B2A4A]/70">Control visibility to your classmates</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1931]">Profile Visibility</p>
                  <p className="text-[11px] text-[#1B2A4A]/70">Allow classmates to find your profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.isProfilePublic}
                  onChange={(e) =>
                    updatePrivacySettings({
                      isProfilePublic: e.target.checked,
                      allowFriendRequests: user.allowFriendRequests,
                      allowGroupInvites: user.allowGroupInvites,
                    })
                  }
                  className="rounded border-slate-300 text-[#0A1931] focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1931]">Study Partner Requests</p>
                  <p className="text-[11px] text-[#1B2A4A]/70">Receive connection requests</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.allowFriendRequests}
                  onChange={(e) =>
                    updatePrivacySettings({
                      isProfilePublic: user.isProfilePublic,
                      allowFriendRequests: e.target.checked,
                      allowGroupInvites: user.allowGroupInvites,
                    })
                  }
                  className="rounded border-slate-300 text-[#0A1931] focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1931]">Study Group Invites</p>
                  <p className="text-[11px] text-[#1B2A4A]/70">Allow invites to peer groups</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.allowGroupInvites}
                  onChange={(e) =>
                    updatePrivacySettings({
                      isProfilePublic: user.isProfilePublic,
                      allowFriendRequests: user.allowFriendRequests,
                      allowGroupInvites: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-[#0A1931] focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-[11px] text-[#0A1931] leading-relaxed">
              🔒 <strong>Private by default:</strong> Your study materials and notes are never shared publicly unless you explicitly share them to a specific study group.
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Friend */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-[#0A1931]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0A1931]">Add Study Partner</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Connect a friend or classmate</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0A1931] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFriend} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Friend's Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    School / University
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Columbia Univ"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Course / Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Biology, Calc"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Study Goal / Exam
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Finals revision & flashcards"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Interests (comma separated)
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. mcats, active-recall, quizzes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A1931]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0A1931] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Partner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
