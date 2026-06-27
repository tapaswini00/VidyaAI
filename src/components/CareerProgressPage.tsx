import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Award, Sparkles, Zap, Flame, Target, Trophy, ChevronRight, Check } from "lucide-react";

interface UserProfile {
  name: string;
  classGrade?: string;
  tutorStyle?: string;
  level: number;
  exp: number;
  streak: number;
}

interface CareerProgressPageProps {
  currentUser: UserProfile;
  onClose: () => void;
  learningHistoryCount?: number;
  savedVaultCount?: number;
}

const MASTER_LEVEL_MILESTONES = [
  { level: 1, title: "Curious Explorer", icon: "🌱", perk: "Access to standard digital library catalogs and foundational simulated science guides." },
  { level: 2, title: "Concept Alchemist", icon: "🧪", perk: "Unlocks standard virtual lab tools, chemical equation balancing assistants, and practice testing." },
  { level: 3, title: "Hypothesis Knight", icon: "⚡", perk: "Unlocks rigorous physics kinematics simulations and custom concept audio podcast generations." },
  { level: 4, title: "Data Navigator", icon: "📊", perk: "Unlocks real-world statistics data tools, climate maps tracking, and specialized quiz modes." },
  { level: 5, title: "Vidya Sage Master", icon: "🦉", perk: "Master badge status. Grants unlimited custom tutoring prompts and expert mock university test templates." }
];

export const CareerProgressPage: React.FC<CareerProgressPageProps> = ({
  currentUser,
  onClose,
  learningHistoryCount = 0,
  savedVaultCount = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col relative z-50 px-4 py-6"
    >
      {/* HEADER ROW */}
      <div className="flex items-center gap-3 w-full max-w-lg mx-auto bg-white/70 backdrop-blur-md sticky top-0 py-3 border-b border-slate-100 z-10 rounded-2xl px-3 mb-6 shadow-xs">
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
            <Trophy className="w-4.5 h-4.5 text-amber-500 fill-amber-400" />
            Study Career Progress Path
          </h1>
          <p className="text-[10px] text-slate-500 font-extrabold mt-0.5 uppercase tracking-wider">Academic Milestone & Growth Tracker</p>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto space-y-6 pb-20">
        
        {/* CURRENT STATUS HERO SECTION (BENTO GLOW CARD) */}
        <div className="p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-36 h-36 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-white/10 rounded-full -translate-x-6 translate-y-6 blur-lg"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider">
                Current Level Status
              </span>
              <h2 className="text-3xl font-black tracking-tight mt-1">Level {currentUser.level}</h2>
              <p className="text-[11px] font-medium text-purple-100/95 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                Rank: {MASTER_LEVEL_MILESTONES[(currentUser.level - 1) % 5]?.title || "Curious Explorer"}
              </p>
            </div>

            <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg text-white">
              <Award className="w-10 h-10 fill-amber-300 text-amber-400 animate-pulse" />
            </div>
          </div>

          {/* MAIN EXPERIENCE POINTS BAR */}
          <div className="mt-6 pt-4 border-t border-white/10">
            {(() => {
              const expNeededForNext = currentUser.level * 500;
              const progressPercentage = Math.min(100, Math.max(5, (currentUser.exp / expNeededForNext) * 100));
              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-[10px] font-extrabold">
                    <span className="text-purple-100 uppercase tracking-widest">Level Progression</span>
                    <span className="bg-white/15 px-2 py-0.5 rounded-md font-mono">{currentUser.exp} / {expNeededForNext} XP</span>
                  </div>
                  <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full shadow-md transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[9.5px] text-purple-100/90 font-medium leading-relaxed italic text-right mt-1">
                    {Math.round(expNeededForNext - currentUser.exp)} XP left until Level {currentUser.level + 1}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* HOW TO LEVEL UP */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 rounded-xl text-amber-500 border border-amber-100">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Activities to Boost Your Rank</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Gain XP dynamically and build a continuous academic legacy by actively utilizing the following features:
          </p>
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className="min-w-0">
                <p className="text-[10px] font-black leading-none">STREAKS</p>
                <p className="text-[8px] text-slate-405 text-slate-500 mt-0.5">Visit Vidya Daily</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <Zap className="w-4 h-4 text-purple-600" />
              <div className="min-w-0">
                <p className="text-[10px] font-black leading-none">QUIZZES</p>
                <p className="text-[8px] text-slate-500 mt-0.5">Answer accurately</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <Award className="w-4 h-4 text-indigo-500" />
              <div className="min-w-0">
                <p className="text-[10px] font-black leading-none">CONCEPTS</p>
                <p className="text-[8px] text-slate-500 mt-0.5">Explore syllabus nodes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div className="min-w-0">
                <p className="text-[10px] font-black leading-none">AI CHAT</p>
                <p className="text-[8px] text-slate-500 mt-0.5">Ask questions freely</p>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS MILESTONE LIST */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Academic Milestones Hierarchy
          </h3>

          <div className="relative border-l-2 border-slate-200 pl-6 ml-3.5 space-y-6 pt-2">
            {MASTER_LEVEL_MILESTONES.map((milestone) => {
              const isUnlocked = currentUser.level >= milestone.level;
              const isCurrent = currentUser.level === milestone.level;
              const expNeededForNext = currentUser.level * 500;
              const itemExpProgress = (currentUser.exp / expNeededForNext) * 100;

              return (
                <div key={milestone.level} className="relative">
                  {/* Pin Circle Bullet Node */}
                  <span className={`absolute -left-[37px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-all duration-300 z-10 ${
                    isCurrent
                      ? "bg-amber-400 text-slate-950 ring-4 ring-amber-100 animate-pulse"
                      : isUnlocked
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    {isUnlocked ? <Check className="w-3.5 h-3.5" /> : milestone.level}
                  </span>

                  {/* Card Content block */}
                  <div className={`p-4 rounded-3xl border transition-all duration-200 bg-white ${
                    isCurrent
                      ? "border-purple-300 shadow-md ring-1 ring-purple-100"
                      : isUnlocked
                        ? "border-slate-100 shadow-xs opacity-95"
                        : "border-slate-105 border-slate-100 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl shrink-0">{milestone.icon}</span>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-extrabold truncate ${isCurrent ? "text-purple-950" : isUnlocked ? "text-slate-800" : "text-slate-400"}`}>
                            {milestone.title}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none uppercase">Level {milestone.level}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                        isCurrent
                          ? "bg-amber-100 text-amber-950 border border-amber-200"
                          : isUnlocked
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-slate-100 text-slate-400"
                      }`}>
                        {isCurrent ? "Active Title" : isUnlocked ? "Unlocked" : `Locked`}
                      </span>
                    </div>

                    <p className={`text-[10.5px] mt-3 leading-relaxed font-semibold ${isCurrent ? "text-slate-700 font-bold" : isUnlocked ? "text-slate-500" : "text-slate-400"}`}>
                      {milestone.perk}
                    </p>

                    {isCurrent && (
                      <div className="mt-4 border-t border-slate-100 pt-3.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-purple-600 mb-1.5">
                          <span>Milestone completion check</span>
                          <span>{currentUser.exp} / {expNeededForNext} EXP</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300 shadow-xs"
                            style={{ width: `${progressPercentagePercent(currentUser.exp, expNeededForNext)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATS OVERVIEW DECORATOR BLOCK */}
        <div className="bg-slate-100 rounded-3xl p-5 border border-slate-200/55 flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-extrabold uppercase">
            <Trophy className="w-4 h-4 text-slate-400" />
            <span>Academic Profile Legacy</span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold max-w-xs leading-normal">
            You have earned level upgrades, maintaining a solid streak to gain comprehensive access perks across STEM subjects!
          </p>
        </div>

        {/* BOTTOM DONE BUTTON */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-3xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer text-center"
        >
          Close Career Progression Path
        </button>

      </div>
    </motion.div>
  );
};

function progressPercentagePercent(current: number, target: number) {
  const percent = (current / target) * 100;
  return Math.min(100, Math.max(5, percent));
}
