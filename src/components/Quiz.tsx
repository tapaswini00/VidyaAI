import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Zap, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, Save } from 'lucide-react';
import { useLanguage, LANGUAGE_NAMES_FOR_AI } from '../lib/LanguageContext';

const SUBJECTS = [
  { id: "math", name: "Mathematics", icon: "📐", color: "#6C63FF" },
  { id: "physics", name: "Physics", icon: "⚡", color: "#FF6B6B" },
  { id: "chemistry", name: "Chemistry", icon: "🧪", color: "#4ECDC4" },
  { id: "biology", name: "Biology", icon: "🧬", color: "#45B7D1" },
  { id: "history", name: "History", icon: "📜", color: "#96CEB4" },
  { id: "geography", name: "Geography", icon: "🌍", color: "#FFEAA7" },
  { id: "english", name: "English", icon: "📚", color: "#DDA0DD" },
  { id: "computer", name: "Computer Science", icon: "💻", color: "#98D8C8" },
  { id: "economics", name: "Economics", icon: "📊", color: "#F7DC6F" },
  { id: "civics", name: "Civics", icon: "🏛️", color: "#85C1E9" },
];

const MODES = [
  { id: 'practice', label: 'Practice Mode', icon: '📝', desc: 'No timer · See answers immediately' },
  { id: 'test', label: 'Test Mode', icon: '📋', desc: 'Timed · Results at end' },
  { id: 'challenge', label: 'Challenge Mode', icon: '🏆', desc: 'Strict timer · No hints' },
];

interface QuizProps {
  onBackToHome?: () => void;
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-slate-905 bg-black/90 text-white text-xs px-4 py-2.5 rounded-full shadow-lg">
      {msg}
    </div>
  );
}

export default function Quiz({ onBackToHome }: QuizProps) {
  const navigate = useNavigate();
  const { language: appLang } = useLanguage();
  const [phase, setPhase] = useState<string>('subject'); // subject | topics | options | quiz | results | quiz_loading
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [mode, setMode] = useState<string>('practice');
  const [timePerQ, setTimePerQ] = useState<number>(60);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(false);
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<any>(null);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [toast, setToast] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const timerRef = useRef<any>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // Parse subject search parameter to auto-select subject track if navigated from dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subId = params.get('subject');
    if (subId) {
      const found = SUBJECTS.find(s => s.id === subId);
      if (found) {
        fetchTopics(found);
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (phase === 'quiz' && (mode === 'test' || mode === 'challenge')) {
      setTimeLeft(timePerQ);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleNext(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentQ, phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const callAI = async (prompt: string) => {
    const appLanguage = (() => {
      try {
        const stored = localStorage.getItem("vidya_active_user");
        if (stored) {
          return JSON.parse(stored).appLanguage || "en";
        }
      } catch {}
      return "en";
    })();

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, appLanguage })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  };

  const fetchTopics = async (subject: any) => {
    setLoadingTopics(true);
    setSelectedSubject(subject);
    setSelectedTopics([]);
    try {
      const langName = LANGUAGE_NAMES_FOR_AI[appLang] || 'English';
      const prompt = `List exactly 12 important topics for ${subject.name} that a student would study in school/college. 
Return ONLY a valid JSON array of strings comprising topic names in ${langName}, nothing else, no markdown formatting starting with ticks, just structural json:
["Topic 1", "Topic 2", ...]`;
      const res = await callAI(prompt);
      const cleaned = res.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setTopics(parsed);
      setPhase('topics');
    } catch (e) {
      // fallback topics
      setTopics(['Introduction', 'Basic Concepts', 'Core Principles', 'Applications', 'Advanced Topics',
        'Problem Solving', 'Theory', 'Practice', 'Formulas', 'Examples', 'History', 'Modern Uses']);
      setPhase('topics');
    }
    setLoadingTopics(false);
  };

  const generateQuiz = async () => {
    setLoadingQuiz(true);
    setPhase('quiz_loading');
    setAnswers({});
    setSkipped({});
    setCurrentQ(0);
    setShowAnswer(false);
    try {
      const langName = LANGUAGE_NAMES_FOR_AI[appLang] || 'English';
      const prompt = `Generate exactly ${numQuestions} multiple-choice quiz questions about these topics: ${selectedTopics.join(', ')} (subject context: ${selectedSubject.name}).
Respond in ${langName} translation.
Return ONLY a valid JSON array, no markdown wrappers, containing elements matching this exact schema:
[
  {
    "question": "Question text?",
    "options": ["A) Option text...", "B) ...", "C) ...", "D) ..."],
    "correct_answer": "A) Correct Option here",
    "explanation": "Brief explanation details"
  }
]`;
      const res = await callAI(prompt);
      const cleaned = res.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setQuestions(parsed);
      setStartTime(Date.now());
      setPhase('quiz');
    } catch (e) {
      showToast('Failed to generate quiz. Please try again.');
      setPhase('options');
    }
    setLoadingQuiz(false);
  };

  const handleAnswer = (opt: string) => {
    if (answers[currentQ] !== undefined) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setAnswers(prev => ({ ...prev, [currentQ]: opt }));
    if (mode === 'practice') setShowAnswer(true);
  };

  const handleNext = (timedOut = false) => {
    if (timedOut && answers[currentQ] === undefined) {
      setSkipped(prev => ({ ...prev, [currentQ]: true }));
    }
    setShowAnswer(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTotalTime(Math.round((Date.now() - startTime) / 1000));
    setPhase('results');
  };

  const getScore = () => {
    return questions.filter((q, i) => answers[i] === q.correct_answer).length;
  };

  const saveQuiz = () => {
    try {
      const item = {
        id: "cached-quiz-" + Date.now(),
        type: 'quiz',
        title: `${selectedSubject.name} - ${selectedTopics.slice(0, 2).join(', ')}`,
        subject: selectedSubject.name,
        topics: selectedTopics,
        questions,
        userAnswers: answers,
        score: getScore(),
        totalQuestions: questions.length,
        timeTaken: totalTime,
        mode,
        savedAt: new Date().toISOString(),
        isOffline: true,
      };
      const existing = JSON.parse(localStorage.getItem('offline_library') || '[]');
      existing.unshift(item);
      localStorage.setItem('offline_library', JSON.stringify(existing));
      showToast('Quiz saved to Library ✓');
    } catch (e) { showToast('Failed to save.'); }
  };

  const score = getScore();
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const q = questions[currentQ];
  const skipCount = Object.keys(skipped).length;

  const getPerformanceBadge = () => {
    if (pct >= 90) return '🏆 Excellent!';
    if (pct >= 70) return '⭐ Good Job!';
    if (pct >= 50) return '📚 Keep Practicing!';
    return '💪 Don\'t Give Up!';
  };

  return (
    <div className="flex flex-col min-h-[500px] bg-background px-4 py-4 max-w-md mx-auto w-full">
      <Toast msg={toast} />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => {
          if (phase === 'subject') {
            if (onBackToHome) onBackToHome();
            else navigate(-1);
          }
          else if (phase === 'topics') setPhase('subject');
          else if (phase === 'options') setPhase('topics');
          else if (phase === 'quiz_loading' || phase === 'quiz') {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase('options');
          }
          else setPhase('subject');
        }} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-lg text-slate-800">Adaptive Quiz Portal</h1>
          <p className="text-xs text-slate-500 font-bold">
            {phase === 'subject' && 'Choose a subject'}
            {phase === 'topics' && `${selectedSubject?.name} · Choose topics`}
            {phase === 'options' && 'Configure quiz'}
            {(phase === 'quiz' || phase === 'quiz_loading') && `${selectedSubject?.name}`}
            {phase === 'results' && 'Quiz Results'}
          </p>
        </div>
        <Zap className="w-6 h-6 text-purple-600 animate-pulse" />
      </div>

      <AnimatePresence mode="wait">

        {/* SCREEN 1: Subject Selection */}
        {phase === 'subject' && (
          <motion.div key="subject" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map(sub => (
                <button key={sub.id} onClick={() => fetchTopics(sub)}
                  disabled={loadingTopics}
                  className="p-5 rounded-3xl border-2 border-slate-100 bg-white hover:border-purple-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center gap-2 disabled:opacity-50 cursor-pointer text-slate-800">
                  <span className="text-4xl">{sub.icon}</span>
                  <span className="font-extrabold text-xs text-center">{sub.name}</span>
                </button>
              ))}
            </div>
            {loadingTopics && (
              <div className="flex items-center justify-center gap-2 mt-6 text-slate-400 text-xs font-bold uppercase tracking-wide">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                Querying topics for {selectedSubject?.name}...
              </div>
            )}
          </motion.div>
        )}

        {/* SCREEN 2: Topic Selection */}
        {phase === 'topics' && (
          <motion.div key="topics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Topic Preferences</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                {selectedTopics.length} of {topics.length} Selected
              </span>
              <button onClick={() => setSelectedTopics(selectedTopics.length === topics.length ? [] : [...topics])}
                className="text-xs font-black text-purple-600 cursor-pointer">
                {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6 max-h-[220px] overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50/30">
              {topics.map((topic, i) => {
                const sel = selectedTopics.includes(topic);
                return (
                  <button key={i} onClick={() => setSelectedTopics(prev =>
                    sel ? prev.filter(t => t !== topic) : [...prev, topic]
                  )}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      sel ? 'border-purple-650 bg-purple-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200'
                    }`}>
                    {sel && "✓"} {topic}
                  </button>
                );
              })}
            </div>

            {/* Custom Topic Chatbox/Input */}
            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-widest">
                ✏️ Want a specific topic? Enter here:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. DNA replication, Quantum mechanics..."
                  className="flex-1 bg-white border border-slate-200 focus:border-purple-400 text-xs px-3.5 py-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customTopic.trim()) {
                        const top = customTopic.trim();
                        setSelectedTopics(prev => prev.includes(top) ? prev : [...prev, top]);
                        setTopics(prev => prev.includes(top) ? prev : [top, ...prev]);
                        setCustomTopic('');
                        showToast(`Custom topic "${top}" added!`);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTopic.trim()) {
                      const top = customTopic.trim();
                      setSelectedTopics(prev => prev.includes(top) ? prev : [...prev, top]);
                      setTopics(prev => prev.includes(top) ? prev : [top, ...prev]);
                      setCustomTopic('');
                      showToast(`Custom topic "${top}" added!`);
                    }
                  }}
                  className="bg-purple-650 hover:bg-purple-700 bg-purple-600 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <button onClick={() => setPhase('options')} disabled={selectedTopics.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-extrabold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              Configure Adventure <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* SCREEN 3: Quiz Options */}
        {phase === 'options' && (
          <motion.div key="options" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-4 w-full">
            {/* Number of questions */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <h3 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-3">Number of Questions</h3>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15].map(n => (
                  <button key={n} onClick={() => setNumQuestions(n)}
                    className={`px-4 py-2 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                      numQuestions === n ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-100 bg-slate-50 text-slate-600'
                    }`}>{n}</button>
                ))}
              </div>
            </div>

            {/* Exam mode */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <h3 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-3">Adventure Mode</h3>
              <div className="space-y-2.5">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`w-full p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left ${
                      mode === m.id ? 'border-purple-600 bg-purple-50/50' : 'border-slate-100 bg-slate-50'
                    }`}>
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-xs text-slate-800">{m.label}</div>
                      <div className="text-[10px] text-slate-400 font-bold leading-tight mt-0.5">{m.desc}</div>
                    </div>
                    {mode === m.id && <CheckCircle2 className="w-5 h-5 text-purple-600 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Time per question */}
            {mode !== 'practice' && (
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                <h3 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-3">Strict Timer</h3>
                <div className="flex gap-2 flex-wrap">
                  {[30, 45, 60].map(t => (
                    <button key={t} onClick={() => setTimePerQ(t)}
                      className={`px-4 py-2 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                        timePerQ === t ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-100 bg-slate-50 text-slate-600'
                      }`}>{t}s</button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={generateQuiz}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              Initiate Practice Quiz ⚡
            </button>
          </motion.div>
        )}

        {/* Loading quiz */}
        {phase === 'quiz_loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-700 flex items-center justify-center text-3xl animate-bounce text-white shadow-lg">⚡</div>
            <h2 className="font-heading font-black text-base text-slate-800 uppercase tracking-wider">Forming MCQ Checkpoints</h2>
            <p className="text-slate-400 text-xs font-bold text-center max-w-[240px] leading-relaxed">VIDYA.AI is compiling custom quizzes based on your {selectedTopics.length} chosen concepts.</p>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* SCREEN 4: Quiz Taking */}
        {phase === 'quiz' && q && (
          <motion.div key={`q-${currentQ}`} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="w-full">
            {/* Progress + timer */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 bg-slate-100 rounded-full h-3 p-0.5 border border-slate-200/50">
                <div className="bg-purple-600 h-full rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
              </div>
              <span className="text-[10px] font-black tracking-wider text-slate-400">{currentQ + 1} OF {questions.length}</span>
              {(mode === 'test' || mode === 'challenge') && (
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs shrink-0 ${timeLeft <= 10 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-purple-600 text-purple-600'}`}>
                  {timeLeft}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-4">
              <p className="font-heading font-extrabold text-slate-800 text-sm leading-normal">{q.question}</p>
            </div>

            <div className="space-y-3 mb-5">
              {q.options?.map((opt: string, oi: number) => {
                const selected = answers[currentQ] === opt;
                const isCorrect = opt === q.correct_answer;
                const revealed = showAnswer && (selected || isCorrect);
                return (
                  <button key={oi} onClick={() => handleAnswer(opt)}
                    className={`w-full p-4 rounded-2xl border-2 text-left text-xs font-extrabold transition-all cursor-pointer flex items-center ${
                      revealed && isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
                      revealed && selected && !isCorrect ? 'border-rose-500 bg-rose-50 text-rose-800' :
                      selected && !showAnswer ? 'border-purple-600 bg-purple-50/50 text-purple-900' :
                      'border-slate-100 bg-white hover:border-purple-200'
                    }`}>
                    <span className={`inline-flex w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 text-[10px] font-black shrink-0 ${
                      selected ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300 text-slate-500"
                    }`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {revealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-2" />}
                    {revealed && selected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation in practice mode */}
            {showAnswer && mode === 'practice' && q.explanation && (
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 mb-5 text-xs text-slate-600 leading-relaxed">
                💡 <strong>Explanation:</strong> {q.explanation}
              </div>
            )}

            <div className="flex gap-2">
              {mode === 'practice' && (
                <button onClick={() => handleNext()} className="px-5 py-3 rounded-2xl border border-slate-200 font-extrabold text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">
                  Skip
                </button>
              )}
              <button onClick={() => handleNext()} disabled={answers[currentQ] === undefined && mode !== 'practice'}
                className="flex-1 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                {currentQ < questions.length - 1 ? 'Next Challenge' : 'Finish Adventure'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 5: Results */}
        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            {/* Score hero */}
            <div className={`rounded-3xl p-6 mb-5 text-center text-white shadow-xl ${
              pct >= 90 ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
              pct >= 70 ? 'bg-gradient-to-br from-purple-600 to-indigo-700' :
              pct >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
              'bg-gradient-to-br from-rose-500 to-red-600'
            }`}>
              <div className="text-5xl mb-2">{pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '📚' : '💪'}</div>
              <div className="text-6xl font-heading font-black mb-1">{score}/{questions.length}</div>
              <div className="text-sm font-black uppercase tracking-widest opacity-95">{getPerformanceBadge()}</div>
              <div className="text-[10px] font-bold opacity-80 mt-1.5">{pct}% Completion Rate · Time Taken: {Math.floor(totalTime/60)}m {totalTime%60}s</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-center">
                <div className="text-xl font-black text-emerald-600">{score}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-extrabold">Correct</div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 text-center">
                <div className="text-xl font-black text-rose-500">{questions.length - score - skipCount}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-extrabold font-extrabold">Failed</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                <div className="text-xl font-black text-slate-400">{skipCount}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-extrabold font-extrabold">Skipped</div>
              </div>
            </div>

            {/* Review */}
            <div className="space-y-2.5 mb-5 max-h-[190px] overflow-y-auto pr-1">
              {questions.map((qq: any, i: number) => {
                const ua = answers[i];
                const correct = qq.correct_answer;
                const isRight = ua === correct;
                return (
                  <div key={i} className={`p-4 rounded-2xl border text-[11px] font-semibold leading-relaxed ${
                    isRight 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-950' 
                      : 'bg-rose-50 border-rose-100 text-rose-950'
                  }`}>
                    <div className="flex gap-2 mb-1.5">
                      {isRight 
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> 
                        : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                      <span className="font-extrabold text-slate-800">{qq.question}</span>
                    </div>
                    {!isRight && <p className="ml-6 text-slate-400">Your Answer: <span className="text-rose-600 font-bold">{ua || 'Skipped'}</span></p>}
                    <p className="ml-6 text-slate-400 font-extrabold">Correct: <span className="text-emerald-600 font-extrabold">{correct}</span></p>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => setPhase('subject')} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer">
                  New Quiz
                </button>
                <button onClick={saveQuiz} className="flex-1 py-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200/40 text-purple-700 font-black text-xs flex items-center justify-center gap-1 cursor-pointer">
                  <Save className="w-4 h-4" /> Save to Vault
                </button>
              </div>
              <button onClick={() => { setAnswers({}); setSkipped({}); setCurrentQ(0); setShowAnswer(false); setStartTime(Date.now()); setPhase('quiz'); }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                <RotateCcw className="w-4 h-4" /> Replay Current Checklist
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
