import React, { useState } from "react";
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Globe, 
  MessageSquare, 
  Compass, 
  Award,
  Flame
} from "lucide-react";

interface OnboardingWizardProps {
  initialName: string;
  onComplete: (data: {
    avatar: string;
    classGrade: string;
    appLanguage: string;
    tutorStyle: string;
    favoriteSubjects: string[];
    weeklyGoal: string;
  }) => void;
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "ur", name: "اردو", flag: "🇵🇰" },
  { code: "ar", name: "العربية", flag: "🇸🇦" }
];

const AVATARS = [
  { char: "🎓", label: "Scholar" },
  { char: "🔍", label: "Explorer" },
  { char: "🚀", label: "Astronaut" },
  { char: "🦉", label: "Sage Owl" },
  { char: "💡", label: "Innovator" },
  { char: "🤖", label: "Tech Geek" }
];

const TUTOR_STYLES = [
  { id: "school", name: "Friendly Guide", desc: "Patient, warm, and explains with direct, visual analogies." },
  { id: "high_school", name: "Subject Mentor", desc: "Structured, insightful, and guides with clear explanations." },
  { id: "expert", name: "Strict Teacher", desc: "Rigorous, challenging, and prepares you for university tests." }
];

const SUBJECTS = [
  { name: "Mathematics 📐", id: "math" },
  { name: "Science 🧪", id: "science" },
  { name: "History 📜", id: "history" },
  { name: "Geography 🌍", id: "geography" },
  { name: "Coding 💻", id: "coding" },
  { name: "Languages 📚", id: "languages" }
];

const GOALS = [
  { key: "Casual", label: "Casual Explorer", min: "15 min/day" },
  { key: "Regular", label: "Active Student", min: "30 min/day" },
  { key: "Serious", label: "Serious Scholar", min: "60 min/day" },
  { key: "Insane", label: "Knowledge Devotee", min: "120 min/day" }
];

export default function OnboardingWizard({ initialName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [avatar, setAvatar] = useState<string>("🎓");
  const [classGrade, setClassGrade] = useState<string>("Class 10");
  const [appLanguage, setAppLanguage] = useState<string>("en");
  const [tutorStyle, setTutorStyle] = useState<string>("high_school");
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>(["math", "science"]);
  const [weeklyGoal, setWeeklyGoal] = useState<string>("Regular");

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Find the userSelected tutor label
      const matchedStyle = TUTOR_STYLES.find(t => t.id === tutorStyle)?.name || "Subject Mentor";
      onComplete({
        avatar,
        classGrade,
        appLanguage,
        tutorStyle: matchedStyle,
        favoriteSubjects,
        weeklyGoal
      });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleSubject = (sub: string) => {
    if (favoriteSubjects.includes(sub)) {
      setFavoriteSubjects(favoriteSubjects.filter((s) => s !== sub));
    } else {
      setFavoriteSubjects([...favoriteSubjects, sub]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6fc] flex flex-col items-center justify-center p-4">
      
      {/* Container Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Colorful high-light beam top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />

        {/* Progress header dots */}
        <div className="flex justify-between items-center mb-8 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Profile Setup &bull; Step {step} of {totalSteps}
            </span>
          </div>
          
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? "w-6 bg-purple-600" : "w-1.5 bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP CONTENT SWITCHER */}
        <div className="min-h-[295px]">
          
          {/* STEP 1: WELCOME & AVATAR CHOICE */}
          {step === 1 && (
            <div className="space-y-6 animate-scale-up">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                  Welcome to VIDYA, {initialName}!
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Let's personalize your active learning journey. First, pick your explorer badge!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {AVATARS.map((av) => (
                  <button
                    key={av.label}
                    onClick={() => setAvatar(av.char)}
                    className={`p-4 rounded-2xl border transition-all duration-200 text-center active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                      avatar === av.char
                        ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="text-4xl filter drop-shadow-sm mb-2">{av.char}</span>
                    <span className="text-[10px] font-black uppercase tracking-wide">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION GRADE AND FA_VORITE TOPICS */}
          {step === 2 && (
            <div className="space-y-6 animate-scale-up">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  Your Education Level
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Select your current syllabus grade and focus interests.
                </p>
              </div>

              {/* Grade options dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Current Grade Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergrad"].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setClassGrade(grade)}
                      className={`py-3.5 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                        classGrade === grade
                          ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject check list */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Favorite Subjects
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((sub) => {
                    const isFav = favoriteSubjects.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleSubject(sub.id)}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all duration-150 cursor-pointer ${
                          isFav
                            ? "bg-violet-100 text-violet-700 border-violet-300 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONVERSATIONAL TUTOR PERSONALITY STYLE & LANGUAGE */}
          {step === 3 && (
            <div className="space-y-6 animate-scale-up">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  Your AI Mentor Style
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Choose a reading language and the conversational vibe of your virtual tutor.
                </p>
              </div>

              {/* Language selection scroll */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  App Explanation Language
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setAppLanguage(lang.code)}
                      className={`flex-none py-2 px-3.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
                        appLanguage === lang.code
                          ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality cards */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  AI Personality Style
                </label>
                <div className="space-y-2">
                  {TUTOR_STYLES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTutorStyle(t.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-start gap-3 ${
                        tutorStyle === t.id
                          ? "bg-purple-50/50 border-purple-500 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        tutorStyle === t.id ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-400"
                      }`}>
                        {t.id === "school" ? "😊" : t.id === "high_school" ? "🧠" : "👨‍🏫"}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 leading-tight">{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-snug">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: STUDY GOAL COMMITTMENT */}
          {step === 4 && (
            <div className="space-y-6 animate-scale-up">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  Choose a Study Goal!
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Set your target daily learning commitment level to unlock new medals.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setWeeklyGoal(g.key)}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer active:scale-95 ${
                      weeklyGoal === g.key
                        ? "bg-purple-50 border-purple-500 shadow-sm"
                        : "bg-white hover:bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                        <Flame className={`w-4.5 h-4.5 ${weeklyGoal === g.key ? "fill-orange-400" : ""}`} />
                      </div>
                      <div className="text-xs font-black text-slate-800">{g.label}</div>
                    </div>
                    <div className="text-[10px] text-indigo-600 font-bold mt-2">{g.min}</div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100 flex items-center gap-2.5">
                <Award className="w-5 h-5 text-purple-600 shrink-0" />
                <p className="text-[10px] text-purple-950 font-bold leading-tight">
                  You can always customize your goal, interface language, or tutor speech pitch from the profile dashboard later!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION ACTIONS */}
        <div className="border-t border-slate-100 pt-6 mt-6 flex justify-between items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-4 py-2.5 rounded-xl text-neutral-600 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              step === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer active:scale-95"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-purple-100"
          >
            <span>{step === totalSteps ? "Start Learning" : "Next"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
