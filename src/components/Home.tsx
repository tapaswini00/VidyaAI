import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Zap, 
  Mic, 
  Brain, 
  Sun, 
  Moon, 
  Scan, 
  Award, 
  Flame, 
  Clock 
} from 'lucide-react';
import { useTranslation } from '../lib/LanguageContext';
import { UserProfile, SavedContent, ProgressHistory, ChatSession } from '../types';

interface HomeProps {
  currentUser: UserProfile;
  learningHistory: ProgressHistory[];
  savedVaultItems: SavedContent[];
  chatSessions: ChatSession[];
  onUpdateProfile: (updatedFields: Partial<UserProfile>) => Promise<void>;
  onTriggerTabChange: (tab: "home" | "scan" | "saved" | "profile" | "voice" | "timetable", autoStartCamera?: boolean) => void;
  onSignOut?: () => void;
  onScanComplete: (payload: {
    fileContent: string;
    fileType: string;
    fileName: string;
    customQuery?: string;
  }) => void;
  isScanLoading: boolean;
  onLoadChatSession: (session: ChatSession) => void;
  onDeleteChatSession: (sessionId: string) => Promise<void>;
  onRenameChatSession: (sessionId: string, newTitle: string) => Promise<void>;
  onOpenAITeacher?: () => void;
}

export default function HomeDashboard({
  currentUser,
  learningHistory = [],
  savedVaultItems = [],
  chatSessions = [],
  onUpdateProfile,
  onTriggerTabChange,
  onSignOut,
  onOpenAITeacher
}: HomeProps) {
  const navigate = useNavigate();
  const t = useTranslation();
  const [greeting, setGreeting] = useState('Welcome');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      return localStorage.getItem("theme") === "dark" || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (typeof document !== "undefined") {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem("theme", "light");
      }
    }
  };

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning');
    else if (hr < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Safe metrics calculation
  const currentStreak = currentUser.streak || 0;
  const currentConcepts = learningHistory.length || 0;
  const currentQuizzes = savedVaultItems.length || 0;
  const currentStudyMin = Math.max(0, (currentUser.level - 1) * 30 + Math.floor(currentUser.exp / 10));

  return (
    <div className="space-y-6 animate-scale-up select-none pb-4">
      {/* ─── WELCOME GREETING HEADER CARD ─── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            {t(greeting)} 👋
          </span>
          <h2 className="font-heading font-black text-2xl text-slate-800 mt-0.5 leading-none tracking-tight">
            {currentUser.name === "Guest Explorer" ? t("Guest Explorer") : currentUser.name}
          </h2>
          <div className="mt-1.5 flex gap-1.5">
            <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider">
              {t(currentUser.classGrade || "Class 10")}
            </span>
            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider">
              {t("Level")} {currentUser.level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <button
            onClick={toggleDark}
            className="w-10 h-10 rounded-full border border-slate-100 bg-white flex items-center justify-center text-slate-505 text-slate-500 hover:text-purple-600 hover:border-purple-200 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <span className="text-amber-500 text-base">☀️</span> : <span className="text-purple-650 text-base">🌙</span>}
          </button>

          {/* Simple sign out / Start fresh option */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100/60 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center"
              title="Sign out of student session"
            >
              {t("Start Fresh")}
            </button>
          )}
        </div>
      </div>

      {/* ─── LEARNING METRICS STATS COLUMN ─── */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 select-none">
        {/* Streak */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-3xs text-center flex flex-col items-center justify-center min-h-[110px]">
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-1.5 shadow-3xs border border-orange-100/50">
            <Flame className="w-5 h-5 fill-orange-400 text-orange-550 text-orange-500" />
          </div>
          <span className="text-[17px] font-black text-slate-800 leading-none">{currentStreak}d</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-tight">{t("Streak")}</p>
        </div>

        {/* Concepts */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-3xs text-center flex flex-col items-center justify-center min-h-[110px]">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-1.5 shadow-3xs border border-purple-100/50">
            <Brain className="w-5 h-5 fill-purple-300 text-purple-600" />
          </div>
          <span className="text-[17px] font-black text-slate-800 leading-none">{currentConcepts}</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-tight">{t("Concepts")}</p>
        </div>

        {/* Quizzes */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-3xs text-center flex flex-col items-center justify-center min-h-[110px]">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-1.5 shadow-3xs border border-amber-100/50">
            <Zap className="w-5 h-5 fill-amber-300 text-amber-500" />
          </div>
          <span className="text-[17px] font-black text-slate-805 text-slate-800 leading-none">{currentQuizzes}</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-tight">{t("Quizzes")}</p>
        </div>

        {/* Study hours/minutes */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-3xs text-center flex flex-col items-center justify-center min-h-[110px]">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-1.5 shadow-3xs border border-emerald-100/50">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[17px] font-black text-slate-800 leading-none">{currentStudyMin}m</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-tight">{t("Minutes")}</p>
        </div>
      </div>

      {/* ─── CENTRAL PRINCIPAL BENTO GRID ACTIONS HUB ─── */}
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-2">
        {t("Principal Study Systems")}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Core Option 1: Ask AI Teacher */}
        <button
          onClick={() => {
            if (onOpenAITeacher) {
              onOpenAITeacher();
            } else {
              onTriggerTabChange("scan");
            }
          }}
          className="p-5 bg-gradient-to-br from-purple-500/5 to-purple-600/10 hover:from-purple-500 hover:to-indigo-650 bg-white border border-slate-100 hover:border-purple-300 rounded-3xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-[135px] group active:scale-[0.97] cursor-pointer"
        >
          <div className="w-11 h-11 bg-purple-100/80 group-hover:bg-white/15 text-purple-700 group-hover:text-white rounded-2xl flex items-center justify-center text-lg shadow-3xs transition-all">
            <Brain className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-white text-xs transition-colors">{t("Ask AI Teacher")}</h3>
            <p className="text-[9px] text-slate-400 group-hover:text-purple-100 mt-1.5 leading-tight transition-colors">{t("Instant voice/chat doubts solver & simulation explorer")}</p>
          </div>
        </button>

        {/* Core Option 2: Quick Quiz Adventure */}
        <button
          onClick={() => {
            navigate("/quiz");
          }}
          className="p-5 bg-gradient-to-br from-amber-500/5 to-orange-600/10 hover:from-amber-500 hover:to-orange-600 bg-white border border-slate-100 hover:border-amber-300 rounded-3xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-[135px] group active:scale-[0.97] cursor-pointer"
        >
          <div className="w-11 h-11 bg-amber-100/80 group-hover:bg-white/15 text-amber-600 group-hover:text-white rounded-2xl flex items-center justify-center text-lg shadow-3xs transition-all">
            <Zap className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-white text-xs transition-colors">{t("Quick Quiz")}</h3>
            <p className="text-[9px] text-slate-400 group-hover:text-amber-100 mt-1.5 leading-tight transition-colors">{t("Custom topic MCQ generator & diagnostic reward leveler")}</p>
          </div>
        </button>

        {/* Core Option 3: Voice Tutor Companion */}
        <button
          onClick={() => {
            onTriggerTabChange("voice");
          }}
          className="p-5 bg-gradient-to-br from-rose-500/5 to-pink-600/10 hover:from-rose-500 hover:to-pink-600 bg-white border border-slate-100 hover:border-rose-300 rounded-3xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-[135px] group active:scale-[0.97] cursor-pointer"
        >
          <div className="w-11 h-11 bg-rose-100/80 group-hover:bg-white/15 text-rose-600 group-hover:text-white rounded-2xl flex items-center justify-center text-lg shadow-3xs transition-all">
            <Mic className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-white text-xs transition-colors">{t("Voice Tutor")}</h3>
            <p className="text-[9px] text-slate-400 group-hover:text-rose-150 group-hover:text-rose-100 mt-1.5 leading-tight transition-colors">{t("Listen & talk to Mascot summaries, flashcards & fun tips")}</p>
          </div>
        </button>

        {/* Core Option 4: Scan Textbook (Instant open live camera) */}
        <button
          onClick={() => {
            onTriggerTabChange("scan", true);
          }}
          className="p-5 bg-gradient-to-br from-indigo-500/5 to-indigo-600/10 hover:from-indigo-500 hover:to-indigo-650 bg-white border border-slate-100 hover:border-indigo-300 rounded-3xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-[135px] group active:scale-[0.97] cursor-pointer"
        >
          <div className="w-11 h-11 bg-indigo-100/80 group-hover:bg-white/15 text-indigo-605 text-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center text-lg shadow-3xs transition-all">
            <Scan className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 group-hover:text-white text-xs transition-colors">{t("Scan Textbook")}</h3>
            <p className="text-[9px] text-slate-400 group-hover:text-indigo-100 mt-1.5 leading-tight transition-colors">{t("Click to launch the live camera instantly to analyze chapters")}</p>
          </div>
        </button>
      </div>

    </div>
  );
}
