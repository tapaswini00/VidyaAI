import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, ShieldCheck, Star, HelpCircle, GraduationCap } from "lucide-react";

interface VoiceTutorProps {
  readingText: string;
  expression?: "happy" | "thinking" | "excited" | "proud";
  mascotTip?: string;
}

export default function VoiceTutor({
  readingText,
  expression = "happy",
  mascotTip,
}: VoiceTutorProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSynth(window.speechSynthesis);
    }
  }, []);

  const toggleNarrator = () => {
    if (!speechSynth) return;

    if (isPlaying) {
      speechSynth.cancel();
      setIsPlaying(false);
    } else {
      speechSynth.cancel(); // Stop pre-existing loops
      
      const textToRead = readingText || "Point, scan, and select layers to begin interactive visual training!";
      const nextUtterance = new SpeechSynthesisUtterance(textToRead.slice(0, 300)); // limit preview size
      
      const speedPref = localStorage.getItem("voice_speed") || "1.0";
      const pitchPref = localStorage.getItem("voice_pitch") || "1.1";
      
      nextUtterance.rate = parseFloat(speedPref) * 1.05; // Adjusted to conversational template
      nextUtterance.pitch = parseFloat(pitchPref); // Interactive setting pitch
      
      nextUtterance.onend = () => {
        setIsPlaying(false);
      };
      nextUtterance.onerror = () => {
        setIsPlaying(false);
      };

      setUtterance(nextUtterance);
      setIsPlaying(true);
      speechSynth.speak(nextUtterance);
    }
  };

  // Halt speech Synth if unmounted
  useEffect(() => {
    return () => {
      if (speechSynth) {
        speechSynth.cancel();
      }
    };
  }, [speechSynth]);

  // Determine avatar icon animation rate based on speech playing
  const avatarBlinkClass = isPlaying ? "animate-bounce" : "animate-bounce-slow";

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-4 shadow-sm flex items-start gap-3.5 relative overflow-hidden">
      
      {/* 🦉 Mascot representation */}
      <div className="relative flex-shrink-0">
        <div className={`w-14 h-14 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-md ${avatarBlinkClass} relative overflow-hidden border-2 border-white`}>
          {expression === "happy" && "🤖"}
          {expression === "thinking" && "🔬"}
          {expression === "excited" && "🌟"}
          {expression === "proud" && "🏆"}
          
          {/* Audio active indicator */}
          {isPlaying && (
            <span className="absolute bottom-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>
        
        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full text-[9px] font-black border border-white flex items-center justify-center">
          <GraduationCap className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Narrative Dialogue */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-purple-700">
            Vidya • AI Tutor Guide
          </span>

          <button
            onClick={toggleNarrator}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-black font-mono select-none ${
              isPlaying
                ? "bg-purple-100 border-purple-300 text-purple-700 font-extrabold"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-purple-600" />
                <span>Mute Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Read Aloud</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-purple-950 font-bold leading-relaxed mt-1.5 line-clamp-3">
          {mascotTip ||
            "Hello scientist! Try rotating the model in 3D, tapping labels to view internal chambers, or sketch circles around pages to ask contextual questions!"}
        </p>

        {isPlaying && (
          <div className="mt-2 text-[9px] text-indigo-700 font-semibold animate-pulse flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-indigo-500" />
            <span>Streaming friendly synthesis narration...</span>
          </div>
        )}
      </div>
    </div>
  );
}
