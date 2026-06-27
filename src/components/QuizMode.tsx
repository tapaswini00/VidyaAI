import React, { useState } from "react";
import { MCQ } from "../types";
import { CheckCircle2, AlertCircle, Award, Trophy, ArrowRight, ArrowLeft, RefreshCw, Zap, Medal } from "lucide-react";

interface QuizModeProps {
  topicName: string;
  questions: MCQ[];
  onComplete: (score: number) => void;
  onRestart: () => void;
}

export default function QuizMode({
  topicName,
  questions,
  onComplete,
  onRestart,
}: QuizModeProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Guard against empty questions
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Trophy className="w-12 h-12 text-yellow-500 mb-2 animate-bounce" />
        <p className="text-slate-800 font-bold">No active quizzes generated</p>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Scan a textbook page or search for a science topic to generate an interactive quiz session!
        </p>
        <button
          onClick={onRestart}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-bold shadow-sm"
        >
          Reset Session
        </button>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAns(optIdx);
  };

  const handleSubmit = () => {
    if (selectedAns === null || isSubmitted) return;
    
    setIsSubmitted(true);
    const correct = selectedAns === activeQuestion.correctAnswerIndex;
    if (correct) {
      setScore((prev) => prev + 1);
    }
    
    const nextAnswers = [...userAnswers];
    nextAnswers[currentIdx] = selectedAns;
    setUserAnswers(nextAnswers);
  };

  const handleNext = () => {
    setSelectedAns(null);
    setIsSubmitted(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      onComplete(score);
    }
  };

  const progressPercent = ((currentIdx + (isSubmitted ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 relative">
      
      {/* 🏁 HEADER AND PROGRESS BAR */}
      {!quizFinished && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold mb-2 uppercase tracking-wide">
            <span>Progress Loop</span>
            <span className="text-purple-600">Question {currentIdx + 1} of {questions.length}</span>
          </div>
          
          {/* Friendly standard progress bar */}
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 🎮 QUIZ BODY LOOP */}
      {!quizFinished ? (
        <div className="flex-1 flex flex-col justify-between">
          <div className="animate-fade-in">
            {/* Topic label tag */}
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-3 border border-purple-100">
              <Zap className="w-3" /> {topicName}
            </span>

            {/* MCQ Question Display */}
            <h3 className="text-base font-extrabold text-slate-800 leading-snug mt-1 text-slate-900">
              {activeQuestion.question}
            </h3>

            {/* Interactive Answer card options with robust bottom borders (Duolingo style) */}
            <div className="grid grid-cols-1 gap-3.5 mt-6">
              {activeQuestion.options.map((option, idx) => {
                let btnStyle = "border-slate-200 text-slate-800 bg-white shadow-[0_4px_0_0_#E2E8F0]";
                if (selectedAns === idx) {
                  btnStyle = "border-purple-400 bg-purple-50/40 text-purple-900 shadow-[0_4px_0_0_#C084FC]";
                }

                if (isSubmitted) {
                  if (idx === activeQuestion.correctAnswerIndex) {
                    btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-[0_4px_0_0_#10B981] font-bold";
                  } else if (selectedAns === idx) {
                    btnStyle = "border-rose-500 bg-rose-50 text-rose-950 shadow-[0_4px_0_0_#F43F5E]";
                  } else {
                    btnStyle = "border-slate-100 bg-white text-slate-300 shadow-[0_4px_0_0_#F1F5F9] opacity-45";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(idx)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-150 text-sm font-semibold active:translate-y-1 active:shadow-none select-none disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_#E2E8F0] ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        selectedAns === idx ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📬 SUBMIT / FEEDBACK BOTTOM COMPONET */}
          <div className="mt-8">
            {isSubmitted ? (
              <div className={`p-4 rounded-2xl border mb-4 animate-scale-up ${
                selectedAns === activeQuestion.correctAnswerIndex
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : "bg-rose-50 border-rose-200 text-rose-950"
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {selectedAns === activeQuestion.correctAnswerIndex ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <span className="text-xs font-black uppercase tracking-wide">
                    {selectedAns === activeQuestion.correctAnswerIndex ? "Spot On! Correct" : "Keep Learning!"}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed italic">
                  {activeQuestion.explanation}
                </p>
              </div>
            ) : null}

            {isSubmitted ? (
              <button
                onClick={handleNext}
                className="w-full py-4 text-sm font-black tracking-wide text-white bg-gradient-to-r from-purple-600 to-indigo-700 shadow-[0_5px_0_0_#581C87] hover:brightness-110 active:translate-y-1 active:shadow-none rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                Continue Adventure <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={selectedAns === null}
                onClick={handleSubmit}
                className={`w-full py-4 text-sm font-black tracking-wide text-white rounded-2xl transition-all flex items-center justify-center gap-2 border-b-4 ${
                  selectedAns !== null
                    ? "bg-purple-600 hover:brightness-110 shadow-[0_4px_0_0_#581C87] border-purple-800 active:translate-y-1 active:shadow-none"
                    : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                }`}
              >
                Confirm Choice
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 🎉 QUIZ FINISHED COMPLETED SCREEN */
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-up py-4">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-100 rounded-full blur-2xl opacity-60"></div>
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto drop-shadow-md relative animate-pulse-slow" />
          </div>

          <h2 className="text-xl font-black text-slate-800 mt-6 tracking-tight">
            Session Completed!
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Excellent work! You've audited your scientific understanding of the <strong>{topicName}</strong> topic.
          </p>

          {/* Gamified metric values */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center justify-center border-r border-slate-200">
              <Award className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-black text-slate-800 mt-1">{score}/{questions.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Correct Answers</span>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
              <span className="text-lg font-black text-slate-800 mt-1">+{score * 20}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">EXP Points</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs mt-8">
            <button
              onClick={onRestart}
              className="w-full py-3.5 text-xs font-black tracking-wide text-white bg-gradient-to-r from-purple-600 to-indigo-700 shadow-[0_4px_0_0_#581C87] hover:brightness-110 active:translate-y-1 active:shadow-none rounded-2xl transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Restart Quiz
            </button>
            
            <button
              onClick={onRestart}
              className="w-full py-3.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-2xl border border-purple-200/50 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
