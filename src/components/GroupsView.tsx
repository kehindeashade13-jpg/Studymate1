import React, { useState } from "react";
import { useStudy } from "../context/StudyContext";
import {
  Users2,
  Plus,
  Send,
  Sparkles,
  Pin,
  Flame,
  Shield,
  Lock,
  Globe,
  MessageSquare,
  Phone,
  Search,
  Check,
  UserPlus,
  ArrowRight,
  Trash2,
  UserMinus,
} from "lucide-react";
import { StudySubject, GroupMember } from "../types";
import { searchPeersByPhone } from "../data/registeredPeers";

export const GroupsView: React.FC = () => {
  const {
    studyGroups,
    activeGroup,
    setActiveGroup,
    createStudyGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    friends,
    groupMessages,
    sendGroupMessage,
    reactToMessage,
    materials,
    setActiveMaterial,
    setActiveTab,
    user,
    triggerConfetti,
  } = useStudy();

  const [messageInput, setMessageInput] = useState("");
  const [activeTabSub, setActiveTabSub] = useState<"chat" | "materials" | "members">("chat");

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
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [showAddMemberByPhone, setShowAddMemberByPhone] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchResult, setSearchResult] = useState<{
    name: string;
    phone: string;
    avatar: string;
    school?: string;
    isExisting: boolean;
  } | null>(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [addedMemberSuccess, setAddedMemberSuccess] = useState<string | null>(null);

  const currentGroup = activeGroup || (studyGroups.length > 0 ? studyGroups[0] : null);
  const messages = currentGroup ? groupMessages[currentGroup.id] || [] : [];

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

    // If custom phone was entered, also add them
    if (customPhoneInvite.trim()) {
      const matched = searchPeersByPhone(customPhoneInvite.trim())[0];
      initialMembers.push({
        id: `phone-invite-${Date.now()}`,
        name: matched ? matched.name : "Invited Peer",
        avatar: matched ? matched.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
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
    triggerConfetti();
  };

  const handleSearchPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSearchingPhone(true);
    setTimeout(() => {
      setIsSearchingPhone(false);
      const matches = searchPeersByPhone(phoneNumber.trim());
      if (matches.length > 0) {
        const peer = matches[0];
        setSearchResult({
          name: peer.name,
          phone: peer.phoneNumber,
          avatar: peer.avatar,
          school: peer.school,
          isExisting: true,
        });
      } else {
        const cleanPhone = `${phoneCountryCode} ${phoneNumber.trim()}`;
        setSearchResult({
          name: "StudyMate Classmate",
          phone: cleanPhone,
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          school: "Verified Student",
          isExisting: true,
        });
      }
    }, 250);
  };

  const handleStartChatWithFriend = () => {
    if (!searchResult) return;

    createStudyGroup({
      name: `Study Circle with ${searchResult.name}`,
      subject: "Other",
      description: `Direct collaborative group connected via ${searchResult.phone}`,
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
          id: `friend-phone-${Date.now()}`,
          name: searchResult.name,
          avatar: searchResult.avatar,
          role: "member",
          isOnline: true,
          studyStreak: 5,
          phoneNumber: searchResult.phone,
          institution: searchResult.school || "StudyMate Peer",
        },
      ],
    });

    setSearchResult(null);
    setPhoneNumber("");
    setShowFindFriends(false);
    triggerConfetti();
  };

  const handleAddFoundMemberToCurrentGroup = () => {
    if (!searchResult || !currentGroup) return;

    addMemberToGroup(currentGroup.id, {
      id: `member-phone-${Date.now()}`,
      name: searchResult.name,
      avatar: searchResult.avatar,
      role: "member",
      isOnline: true,
      studyStreak: 5,
      phoneNumber: searchResult.phone,
      institution: searchResult.school || "StudyMate Peer",
    });

    setAddedMemberSuccess(`Added ${searchResult.name} (${searchResult.phone}) to "${currentGroup.name}"!`);
    setSearchResult(null);
    setPhoneNumber("");
    setShowAddMemberByPhone(false);
    setShowFindFriends(false);
    triggerConfetti();

    setTimeout(() => {
      setAddedMemberSuccess(null);
    }, 4000);
  };

  const handleDeleteMemberFromGroup = (memberId: string, memberName: string) => {
    if (!currentGroup) return;
    removeMemberFromGroup(currentGroup.id, memberId);
    setAddedMemberSuccess(`Deleted ${memberName} from "${currentGroup.name}".`);
    setTimeout(() => {
      setAddedMemberSuccess(null);
    }, 3500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 bg-white text-[#0A1931]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A1931] tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-[#0A1931]" />
            <span>Study Groups</span>
          </h1>
          <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
            Connect with peers, study together, and collaborate on shared materials.
          </p>
        </div>

        {/* User request: "Under Group, it should be " Create group that should be written in bold" */}
        <button
          id="create-group-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs transition shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <b className="font-bold tracking-wide">Create group</b>
        </button>
      </div>

      {/* When user has NOT started using it as a group yet (Empty State) */}
      {studyGroups.length === 0 ? (
        <div className="w-full min-h-[460px] flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-lg w-full text-center space-y-5 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs">
            {/* Main Bold Prompt Requested by User */}
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#0A1931] flex items-center justify-center mx-auto border border-slate-200">
                <MessageSquare className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#0A1931] tracking-tight pt-2">
                <b>Start a chat</b>
              </h2>

              <p className="text-xs sm:text-sm text-[#1B2A4A]/70 max-w-sm mx-auto">
                Connect with classmates or create a private study room to review flashcards and notes together.
              </p>
            </div>

            {/* "Find friends" Button / Trigger Requested by User */}
            {!showFindFriends ? (
              <div className="pt-2 space-y-3">
                <button
                  id="find-friends-btn"
                  onClick={() => setShowFindFriends(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-sm font-bold shadow transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.2]" />
                  <span>Find friends</span>
                </button>

                <div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-xs text-[#0A1931] font-semibold hover:underline cursor-pointer"
                  >
                    Or <b className="font-bold">Create group</b>
                  </button>
                </div>
              </div>
            ) : (
              /* "Find friend with phone number" Section Revealed on Click */
              <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0A1931]">
                    <Phone className="w-4 h-4 text-[#0A1931]" />
                    <h3 className="text-sm font-extrabold text-[#0A1931]">
                      Find friend with phone number
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowFindFriends(false);
                      setSearchResult(null);
                    }}
                    className="text-xs text-[#1B2A4A]/60 hover:text-[#0A1931] font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-[#1B2A4A]/70">
                  Enter your friend's phone number to find their account and start a study chat.
                </p>

                <form onSubmit={handleSearchPhone} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
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
                      id="friend-phone-input"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 555-019-2834"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSearchingPhone}
                    className="w-full py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearchingPhone ? "Searching..." : "Search Phone Number"}</span>
                  </button>
                </form>

                {/* Friend Search Result Card */}
                {searchResult && (
                  <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={searchResult.avatar}
                          alt={searchResult.name}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#0A1931]">{searchResult.name}</p>
                          <p className="text-[11px] text-[#1B2A4A]/70">{searchResult.phone}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {currentGroup && (
                        <button
                          id="add-friend-to-current-group-btn"
                          onClick={handleAddFoundMemberToCurrentGroup}
                          className="flex-1 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add to {currentGroup.name}</span>
                        </button>
                      )}
                      <button
                        id="start-chat-with-friend-btn"
                        onClick={handleStartChatWithFriend}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1931] border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Start Direct Chat</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* When user has groups created (Active Group Workspace) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left: Study Groups List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-extrabold text-[#0A1931] tracking-wider uppercase">
                My Study Groups ({studyGroups.length})
              </div>
              <button
                onClick={() => setShowFindFriends(true)}
                className="text-[11px] font-bold text-[#0A1931] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>Find with phone</span>
              </button>
            </div>

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

                  <h3 className="text-sm font-extrabold text-[#0A1931] mb-1 line-clamp-1">{group.name}</h3>
                  <p className="text-xs text-[#1B2A4A]/70 line-clamp-2 mb-3">{group.description}</p>

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
                      Target Exam: {currentGroup.examDate || "Finals 2026"}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-[#0A1931]">{currentGroup.name}</h2>
                </div>

                {/* Sub-navigation tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setActiveTabSub("chat")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTabSub === "chat" ? "bg-[#0A1931] text-white" : "text-[#0A1931] hover:bg-white"
                    }`}
                  >
                    Group Chat
                  </button>
                  <button
                    onClick={() => setActiveTabSub("materials")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTabSub === "materials" ? "bg-[#0A1931] text-white" : "text-[#0A1931] hover:bg-white"
                    }`}
                  >
                    Shared Materials
                  </button>
                  <button
                    onClick={() => setActiveTabSub("members")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTabSub === "members" ? "bg-[#0A1931] text-white" : "text-[#0A1931] hover:bg-white"
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

              {/* TAB: GROUP CHAT */}
              {activeTabSub === "chat" && (
                <div className="flex-1 flex flex-col justify-between min-h-[440px] bg-white">
                  {/* Message stream */}
                  <div className="p-4 space-y-3.5 overflow-y-auto max-h-[420px]">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                        <MessageSquare className="w-8 h-8 text-[#0A1931]/40 mx-auto" />
                        <p className="text-xs font-bold text-[#0A1931]">No messages yet</p>
                        <p className="text-[11px] text-[#1B2A4A]/60">
                          Send the first message to start the study discussion!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSelf = msg.senderId === user.id;
                        const isAi = msg.isAi;

                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 text-xs ${
                              isSelf ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <img
                              src={msg.senderAvatar}
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 border border-slate-200"
                            />

                            <div
                              className={`max-w-[80%] p-3.5 rounded-2xl ${
                                isAi
                                  ? "bg-slate-50 border border-slate-300 text-[#0A1931]"
                                  : isSelf
                                  ? "bg-[#0A1931] text-white"
                                  : "bg-white text-[#0A1931] border border-slate-200 shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span
                                  className={`font-bold text-[11px] ${
                                    isAi ? "text-[#0A1931] flex items-center gap-1" : isSelf ? "text-white" : "text-[#0A1931]"
                                  }`}
                                >
                                  {isAi && <Sparkles className="w-3 h-3 text-amber-500" />}
                                  {msg.senderName}
                                </span>
                                <span className={`text-[10px] ${isSelf ? "text-slate-300" : "text-slate-400"}`}>{msg.timestamp}</span>
                              </div>

                              <p className="leading-relaxed whitespace-pre-line font-medium">{msg.text}</p>

                              {/* Emoji Reactions */}
                              <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-200/40">
                                {["👍", "🧠", "🔥", "💡"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => reactToMessage(currentGroup.id, msg.id, emoji)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                                      isSelf ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-100 hover:bg-slate-200 text-[#0A1931]"
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
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message, discuss an exam question, or ask StudyMate AI..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB: SHARED MATERIALS */}
              {activeTabSub === "materials" && (
                <div className="p-6 space-y-4 flex-1 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0A1931]">Materials Shared with Group</h3>
                    <span className="text-xs text-[#1B2A4A]/60">Collaborative Review</span>
                  </div>

                  {materials.length === 0 ? (
                    <div className="p-8 text-center text-[#1B2A4A]/60 text-xs border border-dashed border-slate-200 rounded-xl">
                      No materials uploaded yet. Upload a deck or PDF to share it with your group!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {materials.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4 shadow-2xs"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0A1931] border border-slate-200">
                              {m.subject}
                            </span>
                            <h4 className="text-xs font-bold text-[#0A1931] mt-1">{m.title}</h4>
                            <p className="text-[11px] text-[#1B2A4A]/70 line-clamp-1">{m.summary}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setActiveMaterial(m);
                                setActiveTab("learn");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition cursor-pointer"
                            >
                              Study Lesson
                            </button>
                            <button
                              onClick={() => {
                                setActiveMaterial(m);
                                setActiveTab("quizzes");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0A1931] text-xs font-bold border border-slate-200 transition cursor-pointer"
                            >
                              Group Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: MEMBERS */}
              {activeTabSub === "members" && (
                <div className="p-6 space-y-4 flex-1 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0A1931]">Group Members</h3>
                      <p className="text-xs text-[#1B2A4A]/60">
                        {currentGroup.members.length} Active Students in this study circle
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowAddMemberByPhone(!showAddMemberByPhone);
                        setSearchResult(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showAddMemberByPhone ? "Close Phone Search" : "Add Member by Phone"}</span>
                    </button>
                  </div>

                  {/* Success Alert Banner */}
                  {addedMemberSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{addedMemberSuccess}</span>
                    </div>
                  )}

                  {/* Add Member by Phone Number Panel */}
                  {showAddMemberByPhone && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-[#0A1931]">
                        <Phone className="w-4 h-4 text-[#0A1931]" />
                        <h4 className="text-xs font-bold text-[#0A1931]">
                          Find & Add Member via Profile Phone Number
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#1B2A4A]/70">
                        Search any student's phone number to find their account and add them to{" "}
                        <span className="font-semibold text-[#0A1931]">"{currentGroup.name}"</span>.
                      </p>

                      <form onSubmit={handleSearchPhone} className="space-y-2.5">
                        <div className="flex gap-2">
                          <select
                            value={phoneCountryCode}
                            onChange={(e) => setPhoneCountryCode(e.target.value)}
                            className="px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
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
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g. 555-438-9201"
                            className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931]"
                            required
                          />

                          <button
                            type="submit"
                            disabled={isSearchingPhone}
                            className="px-4 py-2 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>{isSearchingPhone ? "Finding..." : "Find"}</span>
                          </button>
                        </div>
                      </form>

                      {/* Phone Search Match Result */}
                      {searchResult && (
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={searchResult.avatar}
                                alt={searchResult.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                              />
                              <div>
                                <p className="text-xs font-bold text-[#0A1931]">{searchResult.name}</p>
                                <p className="text-[10px] text-[#1B2A4A]/60">
                                  Matched phone: {searchResult.phone}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Registered Student
                            </span>
                          </div>

                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSearchResult(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#0A1931]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddFoundMemberToCurrentGroup}
                              className="px-4 py-1.5 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add to "{currentGroup.name}"</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {currentGroup.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
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
                                  <span className="flex items-center gap-0.5 text-slate-600">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{member.phoneNumber}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-orange-600 font-bold">
                            <Flame className="w-4 h-4 fill-orange-500" />
                            <span>{member.studyStreak}d</span>
                          </div>

                          {/* Delete friend from group button */}
                          {member.role !== "admin" && member.id !== user.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMemberFromGroup(member.id, member.name)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title={`Delete ${member.name} from group`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
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

      {/* CREATE STUDY GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-[#0A1931] space-y-4">
            <h3 className="text-lg font-black text-[#0A1931]">Create a New Study Group</h3>

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
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                />
              </div>

              {/* Add Friends by Phone or Network */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-[#0A1931] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#0A1931]" />
                  <span>Add Friends & Peers to Group</span>
                </label>

                {friends.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    <p className="text-[11px] text-slate-500 font-medium">Select from your friends:</p>
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
                                <p className="text-[10px] text-slate-500 font-normal">{f.phoneNumber}</p>
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
                )}

                {/* Or invite peer by phone number */}
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
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter their registered phone number to automatically add them to the group.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="private-toggle"
                  checked={newGroupIsPrivate}
                  onChange={(e) => setNewGroupIsPrivate(e.target.checked)}
                  className="rounded border-slate-300 text-[#0A1931] focus:ring-0"
                />
                <label htmlFor="private-toggle" className="text-xs text-[#0A1931] font-medium cursor-pointer">
                  Private Group (Requires invite to join)
                </label>
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
    </div>
  );
};
