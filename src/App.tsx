import React from "react";
import { StudyProvider, useStudy } from "./context/StudyContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { BottomNavDock } from "./components/BottomNavDock";
import { DashboardView } from "./components/DashboardView";
import { LibraryView } from "./components/LibraryView";
import { LearnView } from "./components/LearnView";
import { MemoriseView } from "./components/MemoriseView";
import { QuizzesView } from "./components/QuizzesView";
import { GroupsView } from "./components/GroupsView";
import { FriendsView } from "./components/FriendsView";
import { StudyPlanView } from "./components/StudyPlanView";
import { ProgressView } from "./components/ProgressView";
import { ProfileView } from "./components/ProfileView";
import { HistoryView } from "./components/HistoryView";
import { LandingView } from "./components/LandingView";
import { AddMaterialModal } from "./components/AddMaterialModal";
import { AssistantDrawer } from "./components/AssistantDrawer";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { PracticeStationModal } from "./components/PracticeStationModal";
import { MessageSquare } from "lucide-react";

const MainLayout: React.FC = () => {
  const { activeTab, isAssistantOpen, setIsAssistantOpen } = useStudy();

  const renderActiveView = () => {
    switch (activeTab) {
      case "landing":
        return <LandingView />;
      case "dashboard":
        return <DashboardView />;
      case "library":
        return <LibraryView />;
      case "learn":
        return <LearnView />;
      case "memorise":
        return <MemoriseView />;
      case "quizzes":
        return <QuizzesView />;
      case "groups":
        return <GroupsView />;
      case "friends":
        return <FriendsView />;
      case "plan":
        return <StudyPlanView />;
      case "progress":
        return <ProgressView />;
      case "profile":
        return <ProfileView />;
      case "history":
        return <HistoryView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0A1931] flex flex-col font-sans selection:bg-[#0A1931] selection:text-white relative overflow-x-hidden">
      {/* Top Navbar (renders for non-dashboard tabs) */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Slide-out Menu Drawer */}
        <Sidebar />

        {/* Main Content Stage */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-white text-[#0A1931]">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating AI StudyMate Assistant Trigger */}
      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-24 right-5 z-40 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
          title="Ask StudyMate AI"
        >
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      )}

      {/* Persistent Bottom Navigation Dock (Matching IMG_8794.jpeg) */}
      <BottomNavDock />

      {/* Global Modals & Drawers */}
      <AddMaterialModal />
      <AssistantDrawer />
      <PracticeStationModal />
      <GlobalSearchModal />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <MainLayout />
    </StudyProvider>
  );
}
