import React, { useState, useRef } from "react";
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export default function AudioRecorder({
  onTranscriptionComplete,
  className = "",
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      // Ask for microphone permissions on first use
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAndTranscribe(audioBlob);
        
        // Stop all track streams so that permission lights shut down
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage(
          "Microphone permission denied! Please enable microphone access in your browser or device settings."
        );
      } else {
        setErrorMessage("Unable to open audio channel: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Read binaryblob as base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audioData: base64Data,
            mimeType: "audio/webm",
          }),
        });

        if (!response.ok) {
          throw new Error("Auditory query conversion failed.");
        }

        const data = await response.json();
        if (data.text) {
          onTranscriptionComplete(data.text);
        } else {
          setErrorMessage("No clear spoken words detected. Try talking closer to your microphone!");
        }
      };
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed parsing dictation stream.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        {!isRecording ? (
          <button
            type="button"
            disabled={isTranscribing}
            onClick={startRecording}
            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 rounded-xl transition-all flex items-center gap-1 active:scale-95 border border-purple-100 shadow-sm"
            title="Dictate message with Voice"
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <Mic className="w-4 h-4 text-purple-600" />
            )}
            <span className="text-[10px] font-extrabold uppercase tracking-wider pr-1">Dictate</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all flex items-center gap-1.5 active:scale-95 border border-rose-600 animate-pulse"
            title="Stop recording and transcribe"
          >
            <MicOff className="w-4 h-4 text-white" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider pr-1">Stop Rec</span>
            {/* waveform indicator */}
            <span className="flex gap-0.5 items-center">
              <span className="w-1.5 h-3 bg-white/70 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-5 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1.5 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            </span>
          </button>
        )}

        {isTranscribing && (
          <div className="text-[10px] text-purple-600 font-bold animate-pulse flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI transcribing voice...</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] p-2.5 rounded-xl flex items-start gap-1.5 font-bold mt-1 max-w-sm animate-fade-in shadow-sm leading-normal">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{errorMessage}</span>
            <span className="block text-[8px] text-rose-500 font-medium underline mt-1">
              Configuration: Settings &gt; Site Settings &gt; Microphone and permit access
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
