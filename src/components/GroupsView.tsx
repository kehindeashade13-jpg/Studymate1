import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Users2,
  Plus,
  Send,
  Pin,
  Shield,
  Lock,
  Globe,
  MessageSquare,
  Phone,
  Search,
  Check,
  UserPlus,
  Trash2,
  Paperclip,
  BookOpen,
  FileText,
  X,
  School,
  Sparkles,
  ExternalLink,
  Smile,
  Mail,
  HelpCircle,
} from "lucide-react";
import { StudySubject, GroupMember, StudyFriend } from "../types";
import { searchPeersByPhone, RegisteredPeer } from "../data/registeredPeers";

type TopViewMode = "groups" | "friends" | "find_phone";

export const GroupsView: React.FC = () => {
  const {
    studyGroups,
    activeGroup,
    setActiveGroup,
    createStudyGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    friends,
    addFriend,
    removeFriend,
    startDirectChatWithFriend,
    groupMessages,
    sendGroupMessage,
    reactToMessage,
    materials,
    setActiveMaterial,
    setActiveTab,
    shareMaterialWithGroup,
    user,
    triggerConfetti,
  } = useStudy();

  const [topMode, setTopMode] = useState<TopViewMode>("groups");
  const [messageInput, setMessageInput] = useState("");
  const [activeTabSub, setActiveTabSub] = useState<"chat" | "materials" | "members">("chat");
  const [showShareMaterialModal, setShowShareMaterialModal] = useState(false);
  const [selectedFriendToShare, setSelectedFriendToShare] = useState<StudyFriend | null>(null);

  // Create group modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSubject, setNewGroupSubject] = useState<StudySubject>("Biology");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupExam, setNewGroupExam] = useState("Finals 2026");
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [customPhoneInvite, setCustomPhoneInvite] = useState("");

  // Find friend with phone number state
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);
  const [addedMemberSuccess, setAddedMemberSuccess] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Added Friends local search
  const [friendSearchText, setFriendSearchText] = useState("");

  const currentGroup = activeGroup || (studyGroups.length > 0 ? studyGroups[0] : null);
  const messages = currentGroup ? groupMessages[currentGroup.id] || [] : [];

  // Search registered peers by input
  const phoneSearchResults = phoneSearchQuery.trim()
    ? searchPeersByPhone(phoneSearchQuery.trim())
    : phoneNumberInput.trim()
    ? searchPeersByPhone(phoneNumberInput.trim())
    : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentGroup) return;

    sendGroupMessage(currentGroup.id, messageInput.trim(), false);
    setMessageInput("");
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const initialMembers: GroupMember[] = [
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
    ];

    // Add selected friends from network
    selectedFriendIds.forEach((fId) => {
      const fr = friends.find((f) => f.id === fId);
      if (fr) {
        initialMembers.push({
          id: fr.id,
          name: fr.name,
          avatar: fr.avatar || "/studymate_logo.jpg",
          role: "member",
          isOnline: true,
          studyStreak: 4,
          phoneNumber: fr.phoneNumber || "+1 (555) 234-5678",
          institution: fr.school,
        });
      }
    });

    // If custom phone was entered, lookup and add them
    if (customPhoneInvite.trim()) {
      const matched = searchPeersByPhone(customPhoneInvite.trim())[0];
      initialMembers.push({
        id: `phone-invite-${Date.now()}`,
        name: matched ? matched.name : "Invited Peer",
        avatar:
          matched?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role: "member",
        isOnline: true,
        studyStreak: matched ? matched.studyStreak : 3,
        phoneNumber: matched ? matched.phoneNumber : customPhoneInvite.trim(),
        institution: matched ? matched.school : "StudyMate Peer",
      });
    }

    createStudyGroup({
      name: newGroupName.trim(),
      subject: newGroupSubject,
      description: newGroupDesc.trim() || "Collaborative peer study circle.",
      examDate: newGroupExam.trim(),
      isPrivate: newGroupIsPrivate,
      sharedMaterialIds: materials.length > 0 ? [materials[0].id] : [],
      members: initialMembers,
    });

    setIsCreateModalOpen(false);
    setNewGroupName("");
    setNewGroupDesc("");
    setSelectedFriendIds([]);
    setCustomPhoneInvite("");
    setTopMode("groups");
    triggerConfetti();
  };

  const handleAddRegisteredPeerToFriends = (peer: RegisteredPeer) => {
    addFriend({
      name: peer.name,
      phoneNumber: peer.phoneNumber,
      school: peer.school,
      avatar: peer.avatar,
      email: peer.email,
      subjects: peer.subjects as StudySubject[],
      goals: peer.goals,
      interests: peer.interests,
      status: "connected",
    });

    setPhoneFeedback(`Added ${peer.name} (${peer.phoneNumber}) to your Added Friends!`);
    triggerConfetti();
    setTimeout(() => setPhoneFeedback(null), 3500);
  };

  const handleAddPeerToCurrentGroup = (peer: RegisteredPeer) => {
    if (!currentGroup) return;

    addMemberToGroup(currentGroup.id, {
      id: `member-${peer.id}-${Date.now()}`,
      name: peer.name,
      avatar: peer.avatar,
      role: "member",
      isOnline: true,
      studyStreak: peer.studyStreak,
      phoneNumber: peer.phoneNumber,
      institution: peer.school,
    });

    setAddedMemberSuccess(`Added ${peer.name} to "${currentGroup.name}"!`);
    setShowAddMemberModal(false);
    triggerConfetti();
    setTimeout(() => setAddedMemberSuccess(null), 3500);
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (!currentGroup) return;
    removeMemberFromGroup(currentGroup.id, memberId);
    setAddedMemberSuccess(`Removed ${memberName} from "${currentGroup.name}".`);
    setTimeout(() => setAddedMemberSuccess(null), 3500);
  };

  const filteredFriends = friends.filter((f) => {
    const q = friendSearchText.toLowerCase().trim();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.phoneNumber && f.phoneNumber.includes(q)) ||
      (f.school && f.school.toLowerCase().includes(q)) ||
      f.subjects.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 bg-white text-[#0A1931]">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A1931] tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-[#0A1931]" />
            <span>Community & Study Groups</span>
          </h1>
          <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
            Find friends with their registered phone number, locate added friends, and collaborate on study materials.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="find-friends-top-btn"
            onClick={() => setTopMode(topMode === "find_phone" ? "groups" : "find_phone")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              topMode === "find_phone"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Find by Phone</span>
          </button>

          <button
            id="locate-friends-btn"
            onClick={() => setTopMode(topMode === "friends" ? "groups" : "friends")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              topMode === "friends"
                ? "bg-[#0A1931] text-white border-[#0A1931] shadow-2xs"
                : "bg-white text-[#0A1931] border-slate-300 hover:bg-slate-50"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Added Friends ({friends.length})</span>
          </button>

          {/* User request: Bold "Create group" */}
          <button
            id="create-group-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs transition shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <b className="font-bold tracking-wide">Create group</b>
          </button>
        </div>
      </div>

      {/* Primary Top View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTopMode("groups")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            topMode === "groups"
              ? "bg-[#0A1931] text-white shadow-2xs"
              : "bg-slate-100 text-[#0A1931] hover:bg-slate-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Study Circles & Chats ({studyGroups.length})</span>
        </button>

        <button
          onClick={() => setTopMode("friends")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            topMode === "friends"
              ? "bg-[#0A1931] text-white shadow-2xs"
              : "bg-slate-100 text-[#0A1931] hover:bg-slate-200"
          }`}
        >
          <Users2 className="w-3.5 h-3.5" />
          <span>Locate Added Friends ({friends.length})</span>
        </button>

        <button
          onClick={() => setTopMode("find_phone")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            topMode === "find_phone"
              ? "bg-[#0A1931] text-white shadow-2xs"
              : "bg-slate-100 text-[#0A1931] hover:bg-slate-200"
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Find Friends by Phone Number</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {phoneFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{phoneFeedback}</span>
          </div>
          <button
            onClick={() => setPhoneFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: FIND FRIENDS WITH PHONE NUMBER */}
      {topMode === "find_phone" && (
        <div className="p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-[#0A1931]">
                  Find Friends by Registered Phone Number
                </h2>
              </div>
              <p className="text-xs text-[#1B2A4A]/70">
                Type the phone number registered on StudyMate to find your friend's profile and add them.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="phone-search-input"
              value={phoneSearchQuery}
              onChange={(e) => setPhoneSearchQuery(e.target.value)}
              placeholder="Enter friend's phone number (e.g. 09047562871)..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] focus:bg-white transition shadow-2xs font-medium"
            />
            {phoneSearchQuery && (
              <button
                onClick={() => setPhoneSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Display */}
          {phoneSearchQuery.trim() ? (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0A1931] uppercase tracking-wider">
                Search Results ({phoneSearchResults.length})
              </h3>

              {phoneSearchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phoneSearchResults.map((peer) => {
                    const isAlreadyFriend = friends.some(
                      (f) =>
                        f.name.toLowerCase() === peer.name.toLowerCase() ||
                        (f.phoneNumber && f.phoneNumber === peer.phoneNumber)
                    );

                    return (
                      <div
                        key={peer.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#0A1931]/40 transition shadow-2xs flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={peer.avatar}
                              alt={peer.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              {/* Registered Name Pop-up */}
                              <h4 className="text-sm font-black text-[#0A1931] truncate">
                                {peer.name}
                              </h4>
                              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{peer.phoneNumber}</span>
                              </p>
                              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <School className="w-3 h-3 text-slate-400" />
                                <span>{peer.school}</span>
                              </p>
                            </div>
                          </div>

                          {peer.bio && (
                            <p className="text-xs text-[#1B2A4A]/70 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                              {peer.bio}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {peer.subjects.map((sub) => (
                              <span
                                key={sub}
                                className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                          {isAlreadyFriend ? (
                            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200 flex-1">
                              <Check className="w-3.5 h-3.5" /> Added Friend
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddRegisteredPeerToFriends(peer)}
                              className="px-3 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 shadow-2xs"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add Friend</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              handleAddRegisteredPeerToFriends(peer);
                              startDirectChatWithFriend({
                                id: peer.id,
                                name: peer.name,
                                avatar: peer.avatar,
                                phoneNumber: peer.phoneNumber,
                                school: peer.school,
                                subjects: peer.subjects as StudySubject[],
                              });
                              setTopMode("groups");
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs font-bold text-[#0A1931]">
                    No registered user matching "{phoneSearchQuery}"
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Please check the number (e.g. 09047562871) or verify your friend's registered phone number.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Clean Empty State Prompt */
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                <Phone className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-extrabold text-[#0A1931]">
                  Find Classmates by Phone Number
                </h3>
                <p className="text-xs text-[#1B2A4A]/70 leading-relaxed">
                  Type your friend's registered phone number (like <span className="font-mono font-bold text-[#0A1931]">09047562871</span>) in the search box above to look up their StudyMate profile and add them to your study circle.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LOCATE ADDED FRIENDS */}
      {topMode === "friends" && (
        <div className="p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Users2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-[#0A1931]">
                  Locate Added Friends ({friends.length})
                </h2>
              </div>
              <p className="text-xs text-[#1B2A4A]/70">
                Browse your added classmates, see their registered numbers, share study materials, or initiate a 1-on-1 chat.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTopMode("find_phone")}
                className="px-3 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Find More by Phone</span>
              </button>
            </div>
          </div>

          {/* Search Added Friends Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={friendSearchText}
              onChange={(e) => setFriendSearchText(e.target.value)}
              placeholder="Filter added friends by name, registered phone number, or university..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] focus:bg-white transition"
            />
          </div>

          {/* Friends Cards Grid */}
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#0A1931]/30 transition shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.avatar || "/studymate_logo.jpg"}
                          alt={friend.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="text-sm font-black text-[#0A1931]">{friend.name}</h4>
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{friend.phoneNumber || "+1 (555) 234-5678"}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <School className="w-3 h-3 text-slate-400" />
                            <span>{friend.school || "University"}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          removeFriend(friend.id);
                          setPhoneFeedback(`Removed ${friend.name} from added friends.`);
                          setTimeout(() => setPhoneFeedback(null), 3000);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                        title="Remove friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {friend.goals && (
                      <p className="text-xs text-[#1B2A4A]/70 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                        🎯 {friend.goals}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {friend.subjects.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions for this friend */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        startDirectChatWithFriend(friend);
                        setTopMode("groups");
                      }}
                      className="px-3 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Start Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFriendToShare(friend);
                        setShowShareMaterialModal(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Share Deck</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
              <Users2 className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-black text-sm text-[#0A1931]">No Added Friends Found</h3>
              <p className="text-xs text-[#1B2A4A]/70 max-w-sm mx-auto">
                Use the "Find Friends by Phone" tab to search registered classmates on StudyMate and add them to your study circle!
              </p>
              <button
                onClick={() => setTopMode("find_phone")}
                className="px-4 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Find Friends by Phone
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: STUDY GROUPS & ACTIVE CHAT WORKSPACE */}
      {topMode === "groups" && (
        <>
          {studyGroups.length === 0 ? (
            /* Empty State */
            <div className="w-full min-h-[460px] flex items-center justify-center p-4 sm:p-8">
              <div className="max-w-lg w-full text-center space-y-5 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs">
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#0A1931] flex items-center justify-center mx-auto border border-slate-200">
                    <MessageSquare className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0A1931] tracking-tight pt-2">
                    <b>Start a study chat</b>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#1B2A4A]/70 max-w-sm mx-auto">
                    Connect with classmates or create a study circle to review flashcards and notes together.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="find-friends-btn"
                    onClick={() => setTopMode("find_phone")}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-sm font-bold shadow transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Find friends by phone</span>
                  </button>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] border border-slate-300 text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <b className="font-bold">Create group</b>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Group Workspace */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
              {/* Left: Study Groups List (4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="text-xs font-extrabold text-[#0A1931] tracking-wider uppercase">
                    My Study Circles ({studyGroups.length})
                  </div>
                  <button
                    onClick={() => setTopMode("find_phone")}
                    className="text-[11px] font-bold text-[#0A1931] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Find with phone</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                  {studyGroups.map((group) => {
                    const isSelected = currentGroup?.id === group.id;
                    const onlineCount = group.members.filter((m) => m.isOnline).length;

                    return (
                      <div
                        key={group.id}
                        onClick={() => setActiveGroup(group)}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-slate-50 border-[#0A1931] shadow-xs ring-1 ring-[#0A1931]/30"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0A1931] border border-slate-200">
                            {group.subject}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-[#1B2A4A]/60 font-medium">
                            {group.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            <span>{group.isPrivate ? "Private" : "Public"}</span>
                          </div>
                        </div>

                        <h3 className="text-sm font-extrabold text-[#0A1931] mb-1 line-clamp-1">
                          {group.name}
                        </h3>
                        <p className="text-xs text-[#1B2A4A]/70 line-clamp-2 mb-3">
                          {group.description}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                          <span className="text-[11px] text-[#1B2A4A]/70 font-semibold">
                            {group.members.length} members
                          </span>
                          <span className="text-[11px] text-emerald-700 font-bold">
                            {onlineCount} online
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Active Group Chat & Workspace (8 cols) */}
              {currentGroup ? (
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
                  {/* Group Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0A1931] border border-slate-200">
                          {currentGroup.subject}
                        </span>
                        <span className="text-xs text-[#1B2A4A]/70 font-medium">
                          {currentGroup.examDate || "Study Circle"}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-[#0A1931]">{currentGroup.name}</h2>
                    </div>

                    {/* Sub-navigation tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setActiveTabSub("chat")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeTabSub === "chat"
                            ? "bg-[#0A1931] text-white"
                            : "text-[#0A1931] hover:bg-white"
                        }`}
                      >
                        Chat Stream
                      </button>
                      <button
                        onClick={() => setActiveTabSub("materials")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeTabSub === "materials"
                            ? "bg-[#0A1931] text-white"
                            : "text-[#0A1931] hover:bg-white"
                        }`}
                      >
                        Shared Decks ({currentGroup.sharedMaterialIds?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTabSub("members")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeTabSub === "members"
                            ? "bg-[#0A1931] text-white"
                            : "text-[#0A1931] hover:bg-white"
                        }`}
                      >
                        Members ({currentGroup.members.length})
                      </button>
                    </div>
                  </div>

                  {/* Pinned Announcement */}
                  {currentGroup.pinnedMessage && (
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-[#0A1931] flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        <Pin className="w-3.5 h-3.5 text-[#0A1931] shrink-0" />
                        <span className="line-clamp-1">{currentGroup.pinnedMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: GROUP CHAT STREAM */}
                  {activeTabSub === "chat" && (
                    <div className="flex-1 flex flex-col justify-between min-h-[460px] bg-white">
                      {/* Message stream */}
                      <div className="p-4 space-y-3.5 overflow-y-auto max-h-[460px]">
                        {messages.length === 0 ? (
                          <div className="text-center py-12 space-y-2">
                            <MessageSquare className="w-8 h-8 text-[#0A1931]/40 mx-auto" />
                            <p className="text-xs font-bold text-[#0A1931]">No messages yet</p>
                            <p className="text-[11px] text-[#1B2A4A]/60">
                              Send the first message or share a study deck to start studying together!
                            </p>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isSelf = msg.senderId === user.id;

                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-3 text-xs ${
                                  isSelf ? "flex-row-reverse" : "flex-row"
                                }`}
                              >
                                <img
                                  src={msg.senderAvatar || "/studymate_logo.jpg"}
                                  alt={msg.senderName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 border border-slate-200"
                                />

                                <div
                                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl ${
                                    isSelf
                                      ? "bg-[#0A1931] text-white"
                                      : "bg-white text-[#0A1931] border border-slate-200 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <span
                                      className={`font-bold text-[11px] ${
                                        isSelf ? "text-white" : "text-[#0A1931]"
                                      }`}
                                    >
                                      {msg.senderName}
                                    </span>
                                    <span
                                      className={`text-[10px] ${
                                        isSelf ? "text-slate-300" : "text-slate-400"
                                      }`}
                                    >
                                      {msg.timestamp}
                                    </span>
                                  </div>

                                  <p className="leading-relaxed whitespace-pre-line font-medium text-xs">
                                    {msg.text}
                                  </p>

                                  {/* Attachments: Shared study materials, decks, lessons */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2.5 space-y-2">
                                      {msg.attachments.map((att, idx) => {
                                        const linkedMat = materials.find((m) => m.id === att.linkId);
                                        return (
                                          <div
                                            key={idx}
                                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                              isSelf
                                                ? "bg-white/10 border-white/20 text-white"
                                                : "bg-slate-50 border-slate-200 text-[#0A1931]"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div
                                                className={`p-2 rounded-lg shrink-0 ${
                                                  isSelf ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                                                }`}
                                              >
                                                <BookOpen className="w-4 h-4" />
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-extrabold text-xs truncate">
                                                  {att.title}
                                                </p>
                                                <p
                                                  className={`text-[10px] ${
                                                    isSelf ? "text-slate-200" : "text-slate-500"
                                                  }`}
                                                >
                                                  Study Material • Interactive Practice
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (linkedMat) {
                                                    setActiveMaterial(linkedMat);
                                                    setActiveTab("learn");
                                                  } else {
                                                    setActiveTab("library");
                                                  }
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                                  isSelf
                                                    ? "bg-white text-[#0A1931] hover:bg-slate-100 shadow-2xs"
                                                    : "bg-[#0A1931] text-white hover:bg-[#1B2A4A] shadow-2xs"
                                                }`}
                                              >
                                                Study Lesson
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (linkedMat) {
                                                    setActiveMaterial(linkedMat);
                                                    setActiveTab("memorise");
                                                  } else {
                                                    setActiveTab("library");
                                                  }
                                                }}
                                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                                  isSelf
                                                    ? "border-white/30 text-white hover:bg-white/10"
                                                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                                                }`}
                                              >
                                                Flashcards
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Emoji Reactions */}
                                  <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-200/40">
                                    {["👍", "🧠", "🔥", "💡"].map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => reactToMessage(currentGroup.id, msg.id, emoji)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                                          isSelf
                                            ? "bg-white/20 hover:bg-white/30 text-white"
                                            : "bg-slate-100 hover:bg-slate-200 text-[#0A1931]"
                                        }`}
                                      >
                                        {emoji} {msg.reactions?.[emoji] ? msg.reactions[emoji] : ""}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat Input Bar */}
                      <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => setShowShareMaterialModal(true)}
                          className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#0A1931] transition cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold"
                          title="Share a study deck or material with this group"
                        >
                          <Paperclip className="w-4 h-4 text-[#0A1931]" />
                          <span className="hidden sm:inline">Share Deck</span>
                        </button>
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message or discuss study topics..."
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
                        />
                        <button
                          type="submit"
                          className="p-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white transition shadow-xs cursor-pointer shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 2: SHARED MATERIALS */}
                  {activeTabSub === "materials" && (
                    <div className="p-6 space-y-4 flex-1 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#0A1931]">
                            Materials Shared in "{currentGroup.name}"
                          </h3>
                          <p className="text-xs text-[#1B2A4A]/60">
                            Collaborative study decks, lecture notes, and flashcard sets
                          </p>
                        </div>

                        <button
                          onClick={() => setShowShareMaterialModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Share Material to Group</span>
                        </button>
                      </div>

                      {(!currentGroup.sharedMaterialIds || currentGroup.sharedMaterialIds.length === 0) ? (
                        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-[#0A1931]">No materials shared yet</p>
                          <button
                            onClick={() => setShowShareMaterialModal(true)}
                            className="px-4 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition cursor-pointer"
                          >
                            Share Deck Now
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentGroup.sharedMaterialIds.map((matId) => {
                            const mat = materials.find((m) => m.id === matId);
                            if (!mat) return null;
                            return (
                              <div
                                key={mat.id}
                                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 flex flex-col justify-between"
                              >
                                <div>
                                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                    {mat.subject}
                                  </span>
                                  <h4 className="text-xs font-extrabold text-[#0A1931] mt-1 line-clamp-1">
                                    {mat.title}
                                  </h4>
                                  <p className="text-[11px] text-[#1B2A4A]/70 line-clamp-2 mt-0.5">
                                    {mat.summary}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => {
                                      setActiveMaterial(mat);
                                      setActiveTab("learn");
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-[11px] font-bold transition flex-1 text-center cursor-pointer"
                                  >
                                    Study Lesson
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMaterial(mat);
                                      setActiveTab("memorise");
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[#0A1931] text-[11px] font-bold transition flex-1 text-center cursor-pointer"
                                  >
                                    Flashcards
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: MEMBERS */}
                  {activeTabSub === "members" && (
                    <div className="p-6 space-y-4 flex-1 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#0A1931]">Group Members</h3>
                          <p className="text-xs text-[#1B2A4A]/60">
                            {currentGroup.members.length} Active Students in this circle
                          </p>
                        </div>

                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Member by Phone</span>
                        </button>
                      </div>

                      {addedMemberSuccess && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{addedMemberSuccess}</span>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        {currentGroup.members.map((member) => (
                          <div
                            key={member.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={member.avatar || "/studymate_logo.jpg"}
                                  alt={member.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                />
                                {member.isOnline && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#0A1931] flex items-center gap-1.5">
                                  <span>{member.name}</span>
                                  {member.role === "admin" && (
                                    <Shield className="w-3 h-3 text-[#0A1931]" />
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#1B2A4A]/60 font-medium">
                                  <span>{member.isOnline ? "Online now" : "Offline"}</span>
                                  {member.phoneNumber && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
                                        <Phone className="w-2.5 h-2.5" />
                                        <span>{member.phoneNumber}</span>
                                      </span>
                                    </>
                                  )}
                                  {member.institution && (
                                    <>
                                      <span>•</span>
                                      <span>{member.institution}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {member.id !== user.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member.id, member.name)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title={`Remove ${member.name} from group`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD MEMBER BY PHONE */}
      {showAddMemberModal && currentGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-[#0A1931] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0A1931]">
                    Add Member to "{currentGroup.name}"
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Search registered classmate by phone number
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phoneNumberInput}
                onChange={(e) => setPhoneNumberInput(e.target.value)}
                placeholder="Enter phone number or digits (e.g. 555, 234, 7911)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {phoneSearchResults.map((peer) => {
                const isAlreadyInGroup = currentGroup.members.some(
                  (m) =>
                    m.name.toLowerCase() === peer.name.toLowerCase() ||
                    (m.phoneNumber && m.phoneNumber === peer.phoneNumber)
                );

                return (
                  <div
                    key={peer.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={peer.avatar}
                        alt={peer.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0A1931] truncate">{peer.name}</p>
                        <p className="text-[10px] text-emerald-700 font-bold">{peer.phoneNumber}</p>
                      </div>
                    </div>

                    {isAlreadyInGroup ? (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> In Group
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddPeerToCurrentGroup(peer)}
                        className="px-3 py-1.5 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STUDY GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-[#0A1931] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#0A1931]">Create a New Study Group</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Organic Chemistry Study Group"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Subject
                </label>
                <select
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value as StudySubject)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                >
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Physics">Physics</option>
                  <option value="History">History</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="English">English</option>
                  <option value="Business">Business</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Target Exam Date
                </label>
                <input
                  type="text"
                  value={newGroupExam}
                  onChange={(e) => setNewGroupExam(e.target.value)}
                  placeholder="e.g., June 15, 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1931] mb-1">
                  Description / Study Goals
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What will your study group focus on?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                />
              </div>

              {/* Add Friends to Group */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-[#0A1931] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#0A1931]" />
                  <span>Select Friends to Add:</span>
                </label>

                {friends.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {friends.map((f) => {
                      const isSelected = selectedFriendIds.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedFriendIds(selectedFriendIds.filter((id) => id !== f.id));
                            } else {
                              setSelectedFriendIds([...selectedFriendIds, f.id]);
                            }
                          }}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? "bg-slate-50 border-[#0A1931] font-bold text-[#0A1931]"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={f.avatar || "/studymate_logo.jpg"}
                              alt={f.name}
                              className="w-6 h-6 rounded-lg object-cover"
                            />
                            <div>
                              <p className="leading-tight">{f.name}</p>
                              {f.phoneNumber && (
                                <p className="text-[10px] text-emerald-700 font-semibold">{f.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] border ${
                              isSelected
                                ? "bg-[#0A1931] text-white border-[#0A1931]"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    No friends added yet. You can also add peers by phone number below.
                  </p>
                )}

                {/* Invite by phone number */}
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Or add friend by phone number:</span>
                  </label>
                  <input
                    type="tel"
                    value={customPhoneInvite}
                    onChange={(e) => setCustomPhoneInvite(e.target.value)}
                    placeholder="e.g., +1 (555) 234-5678 or 555"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-[#0A1931] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow cursor-pointer"
                >
                  <b className="font-bold">Create group</b>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MATERIAL MODAL */}
      {showShareMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-black text-[#0A1931] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>
                    Share Study Material{" "}
                    {selectedFriendToShare
                      ? `with ${selectedFriendToShare.name}`
                      : currentGroup
                      ? `with "${currentGroup.name}"`
                      : ""}
                  </span>
                </h3>
                <p className="text-[11px] text-[#1B2A4A]/70 mt-0.5">
                  Pick a deck or notes from your library to share for collaborative review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowShareMaterialModal(false);
                  setSelectedFriendToShare(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-[#0A1931]">No study materials in your library yet</p>
                <button
                  onClick={() => {
                    setShowShareMaterialModal(false);
                    setActiveTab("library");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  Go to Library
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#0A1931]/30 transition bg-slate-50/50 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {m.subject}
                      </span>
                      <h4 className="text-xs font-bold text-[#0A1931] truncate mt-1">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {m.summary}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFriendToShare) {
                          startDirectChatWithFriend(selectedFriendToShare);
                          // find target group or wait a tick
                          setTimeout(() => {
                            if (currentGroup) {
                              shareMaterialWithGroup(currentGroup.id, m.id);
                            }
                          }, 100);
                        } else if (currentGroup) {
                          shareMaterialWithGroup(currentGroup.id, m.id);
                        }
                        setShowShareMaterialModal(false);
                        setSelectedFriendToShare(null);
                        setTopMode("groups");
                        setActiveTabSub("chat");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Share Deck</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowShareMaterialModal(false);
                  setSelectedFriendToShare(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
