import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Brain, Sparkles, X, Edit3, HelpCircle, FileText, Zap, ChevronDown, ChevronUp, Check, Award, Plus, Loader2, Image as ImageIcon, Copy, Volume2, Square, Download, Mic, MicOff, Paperclip, ArrowLeft, Play, Pause, VolumeX, Languages } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { getFallbackDiagramSvg } from "../lib/diagramFallback";
import { useAndroidPermissions } from "../context/AndroidPermissionContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  fileInfo?: {














    
    fileName: string;
    fileType: string;
    fileContent: string;
  };
}

interface AIContentResponse {
  topic: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  chatHistory?: ChatMessage[];
  diagramSvg?: string;
  suggestedQuizzes?: any[];
}

function cleanSvgContent(rawSvg: string | undefined): string {
  if (!rawSvg) return "";
  let cleaned = rawSvg.trim();
  // Remove markdown fences
  cleaned = cleaned.replace(/^```[a-z]*\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  cleaned = cleaned.trim();
  
  if (cleaned.includes("<svg") && cleaned.includes("</svg>")) {
    return cleaned;
  }
  return "";
}

interface STEMChatbotProps {
  topicName: string;
  currentModelId?: string;
  onEarnXP?: (xp: number, detailsMsg: string, topicName: string, actionKey: any) => void;
  scannedResult?: AIContentResponse | null;
  uploadedFile?: { fileName: string; fileType: string; fileContent: string } | null;
  onBackToUploader?: () => void;
  onScanComplete?: (payload: {
    fileContent: string;
    fileType: string;
    fileName: string;
    customQuery?: string;
  }) => void;
  isScanLoading?: boolean;
  onSaveOffline?: (messageText: string, chatHistory?: ChatMessage[]) => void;
  onBackToDashboard?: () => void;
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export default function STEMChatbot({
  topicName,
  currentModelId,
  onEarnXP,
  scannedResult,
  uploadedFile,
  onBackToUploader,
  onScanComplete,
  isScanLoading,
  onSaveOffline,
  onBackToDashboard,
  onMessagesChange,
}: STEMChatbotProps) {
  const { requestPermission } = useAndroidPermissions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeConcept, setActiveConcept] = useState<string>(topicName);

  // Sync messages back to parent for persistent storage
  useEffect(() => {
    if (onMessagesChange && messages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Layout states
  const [showNotes, setShowNotes] = useState(false);
  const [isScribbleMode, setIsScribbleMode] = useState(false);

  // Attachment states
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scribble state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threadContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  // Scribble input and parsed doubt query states
  interface PendingScribble {
    selectedText: string;
    menuPos: { x: number; y: number };
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    points: { x: number; y: number }[];
  }
  const [pendingScribble, setPendingScribble] = useState<PendingScribble | null>(null);
  const [customAskQuery, setCustomAskQuery] = useState("");

  // Premium voice interaction state (TTS & Speech-to-Text)
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Teach-Back States
  const [isTeachBackOpen, setIsTeachBackOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecordingTeachBack, setIsRecordingTeachBack] = useState(false);
  const [teachBackScore, setTeachBackScore] = useState<number | null>(null);
  const [teachBackResult, setTeachBackResult] = useState<any | null>(null);
  const [isEvaluatingTeachBack, setIsEvaluatingTeachBack] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  
  // Quiz states inside Teach-Back
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizExplanations, setShowQuizExplanations] = useState<Record<number, boolean>>({});

  // Voice playback states
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const teachBackRecognitionRef = useRef<any>(null);

  // Accurate microphone, hardware support, & recognition states
  const [micHardwareSupported, setMicHardwareSupported] = useState<boolean>(false);
  const [speechRecSupported, setSpeechRecSupported] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<"Granted" | "Denied" | "Not Requested" | "Listening">("Not Requested");
  const [micPermissionDeniedMsg, setMicPermissionDeniedMsg] = useState<string | null>(null);

  // Teach back language & low confidence warning states
  const [teachBackLang, setTeachBackLang] = useState<"en-IN" | "hi-IN" | "te-IN" | "hinglish">("en-IN");
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState<boolean>(false);

  // Interactive Topic Lesson Quiz states
  const [isLessonQuizActive, setIsLessonQuizActive] = useState(false);
  const [currentLessonQuizIndex, setCurrentLessonQuizIndex] = useState(0);
  const [selectedLessonQuizOption, setSelectedLessonQuizOption] = useState<number | null>(null);
  const [isLessonQuizSubmitted, setIsLessonQuizSubmitted] = useState(false);
  const [lessonQuizCorrectCount, setLessonQuizCorrectCount] = useState(0);
  const [isLessonQuizFinished, setIsLessonQuizFinished] = useState(false);

  const handleStartLessonQuiz = () => {
    setIsLessonQuizActive(true);
    setCurrentLessonQuizIndex(0);
    setSelectedLessonQuizOption(null);
    setIsLessonQuizSubmitted(false);
    setLessonQuizCorrectCount(0);
    setIsLessonQuizFinished(false);
    if (onEarnXP && scannedResult) {
      onEarnXP(25, `Launched review test prep on topic: ${scannedResult.topic}`, scannedResult.topic, "lesson-quiz-launched");
    }
  };

  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      // 1. Initialize primary chat recognition
      if (!recognitionRef.current) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setMicStatus("Listening");
          setMicPermissionDeniedMsg(null);
          setEvaluationError(null);
        };

        rec.onresult = (event: any) => {
          const transcriptResult = event.results[0][0].transcript;
          if (transcriptResult) {
            setInputValue((prev) => (prev ? prev + " " + transcriptResult : transcriptResult));
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
          setIsListening(false);
          if (e.error === "not-allowed" || e.error === "permission-denied") {
            setMicStatus("Denied");
            setMicPermissionDeniedMsg("Microphone access is required for voice explanations.");
          } else if (e.error === "no-speech") {
            // Silence is normal; keep granted state without forcing error message
            setMicStatus("Granted");
          } else {
            setMicPermissionDeniedMsg("Microphone connected. Speech recognition could not start.");
            setMicStatus("Granted");
          }
        };

        rec.onend = () => {
          setIsListening(false);
          setMicStatus((prev) => (prev === "Listening" ? "Granted" : prev));
        };

        recognitionRef.current = rec;
      }

      // 2. Initialize teach-back continuous recognition
      if (!teachBackRecognitionRef.current) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        
        // Dynamic active language selection
        const mappedLang = teachBackLang === "hinglish" ? "en-IN" : teachBackLang;
        rec.lang = mappedLang;

        rec.onstart = () => {
          setIsRecordingTeachBack(true);
          setMicStatus("Listening");
          setMicPermissionDeniedMsg(null);
          setEvaluationError(null);
        };

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";
          let lowConfidenceFound = false;

          for (let i = 0; i < event.results.length; ++i) {
            const alternative = event.results[i][0];
            const segment = alternative.transcript;
            const confidence = alternative.confidence ?? 1.0;

            if (event.results[i].isFinal) {
              finalTranscript += segment + " ";
              if (confidence > 0 && confidence < 0.82) {
                lowConfidenceFound = true;
              }
            } else {
              interimTranscript += segment;
            }
          }
          const liveText = (finalTranscript + interimTranscript).replace(/\s+/g, " ").trim();
          if (liveText) {
            setTranscript(liveText);
          }
          setLowConfidenceWarning(lowConfidenceFound);
        };

        rec.onerror = (e: any) => {
          console.warn("Teach-back speech recognition error:", e.error);
          setIsRecordingTeachBack(false);
          if (e.error === "not-allowed" || e.error === "permission-denied") {
            setMicStatus("Denied");
            setEvaluationError("Microphone access is required for voice explanations.");
          } else if (e.error === "no-speech") {
            // Silence is normal; keep granted state without forcing error message
            setMicStatus("Granted");
          } else {
            setEvaluationError("Microphone connected. Speech recognition could not start.");
            setMicStatus("Granted");
          }
        };

        rec.onend = () => {
          setIsRecordingTeachBack(false);
          setMicStatus((prev) => (prev === "Listening" ? "Granted" : prev));
        };

        teachBackRecognitionRef.current = rec;
      }
    }
  };

  useEffect(() => {
    // Check speech recognition and mediaDevices on page load
    const hasMicHardware = !!(
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
    setMicHardwareSupported(hasMicHardware);

    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const isSpeechSupported = !!SpeechRecognition;
    setSpeechRecSupported(isSpeechSupported);

    if (isSpeechSupported) {
      initSpeechRecognition();
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const requestMicAccess = async (): Promise<boolean> => {
    const isGranted = await requestPermission("microphone");
    if (!isGranted) {
      setMicStatus("Denied");
      setMicPermissionDeniedMsg("Microphone access is required for voice explanations.");
      setEvaluationError("Microphone access is required for voice explanations.");
      return false;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermissionDeniedMsg("Speech recognition is not supported in this browser.");
      setEvaluationError("Speech recognition is not supported in this browser.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setMicStatus("Granted");
      setMicPermissionDeniedMsg(null);
      setEvaluationError(null);
      return true;
    } catch (err: any) {
      console.warn("getUserMedia query error or user rejected mic access:", err);
      setMicStatus("Denied");
      setMicPermissionDeniedMsg("Microphone access is required for voice explanations.");
      setEvaluationError("Microphone access is required for voice explanations.");
      return false;
    }
  };

  // --- Teach-Back Mode Handlers ---
  const getMessageTitle = (text: string) => {
    const lines = text.split("\n");
    for (const line of lines) {
      const clean = line.replace(/[#*_\-]/g, "").trim();
      if (clean && clean.length > 3 && clean.length < 60) return clean;
    }
    return activeConcept || topicName || "Selected Concept";
  };

  const cleanSpeechText = (rawText: string): string => {
    if (!rawText) return "";

    // 1. Remove markdown links, keep only text
    let t = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // 2. Remove typical markdown symbols (*, _, #, -, `, etc.)
    t = t.replace(/[*_#`~=\-+>]/g, " ");

    // 3. Remove all emojis (using the standard unicode emoji ranges)
    t = t.replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, " ");

    // 4. Remove UI symbols/characters such as tick, cross, arrows, circles, stars, etc.
    t = t.replace(/[✓✕✗●▶■✖➕➖✔●💡🎓⚠️⭐✨🎉🏆🏁🚀🌍💻📚🔎🧠🎒🤔🧬🎈📝🧪🎨]/g, " ");

    // 5. Remove UI-centric prefixes, labels, or buttons
    t = t.replace(/\bQ\d+:/gi, " ");
    t = t.replace(/Question \d+:/gi, " ");
    t = t.replace(/Option [A-D]:/gi, " ");
    t = t.replace(/\bSCORE:/gi, " ");
    t = t.replace(/Understanding Score:/gi, " ");
    t = t.replace(/Tutor's Evaluation Result/gi, " ");
    t = t.replace(/What You Explained Great/gi, " ");
    t = t.replace(/Missing Points to Lock In/gi, " ");
    t = t.replace(/Scientific Accuracy Confirmed/gi, " ");
    t = t.replace(/Misconceptions & Corrections/gi, " ");
    t = t.replace(/Master Conceptual Summary/gi, " ");
    t = t.replace(/Recommended Roadmap/gi, " ");
    t = t.replace(/Solidify Progress Check/gi, " ");

    // 6. Remove repeated punctuation (like ... or !!! or ??? or ,,,) and reduce them to single occurrences
    t = t.replace(/\.{2,}/g, ".");
    t = t.replace(/!{2,}/g, "!");
    t = t.replace(/\?{2,}/g, "?");
    t = t.replace(/,{2,}/g, ",");

    // 7. Remove double spaces
    t = t.replace(/\s+/g, " ").trim();

    // 8. If empty or ending with no sentence punctuation, append period
    if (t && !/[.!?]$/.test(t)) {
      t += ".";
    }

    return t;
  };

  const startTeachBackRecording = async () => {
    // If Web Speech API not supported:
    if (!speechRecSupported) {
      setEvaluationError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecordingTeachBack) {
      stopTeachBackRecording();
      return;
    }

    // Begin microphone request using getUserMedia
    const gotAccess = await requestMicAccess();
    if (gotAccess) {
      initSpeechRecognition();
      if (teachBackRecognitionRef.current) {
        try {
          setTranscript(""); // Clear transcript on new record session
          setLowConfidenceWarning(false);
          
          // Re-evaluate correct active language selector preference
          const mappedLang = teachBackLang === "hinglish" ? "en-IN" : teachBackLang;
          teachBackRecognitionRef.current.lang = mappedLang;
          
          teachBackRecognitionRef.current.start();
          setMicStatus("Listening");
        } catch (err) {
          console.error("Teach-back speech recognition failed to start:", err);
          setEvaluationError("Microphone connected. Speech recognition could not start.");
          setMicStatus("Granted");
        }
      } else {
        setEvaluationError("Microphone connected. Speech recognition could not start.");
      }
    }
  };

  const stopTeachBackRecording = () => {
    if (teachBackRecognitionRef.current) {
      try {
        teachBackRecognitionRef.current.stop();
      } catch (e) {
        console.warn("Teach-back stop error:", e);
      }
    }
    setIsRecordingTeachBack(false);
    setMicStatus("Granted");
  };

  const handleOpenTeachBack = (msg: ChatMessage) => {
    setSelectedMessage(msg);
    setTranscript("");
    setTeachBackResult(null);
    setTeachBackScore(null);
    setEvaluationError(null);
    setIsRecordingTeachBack(false);
    setIsTeachBackOpen(true);
  };

  const handleCloseTeachBack = () => {
    stopTeachBackRecording();
    stopFeedbackSpeech();
    setIsTeachBackOpen(false);
    setSelectedMessage(null);
  };

  const handleEvaluateTeachBack = async () => {
    if (!transcript.trim() || !selectedMessage) return;

    setIsEvaluatingTeachBack(true);
    setEvaluationError(null);
    setTeachBackResult(null);
    setSelectedQuizAnswers({});
    setShowQuizExplanations({});
    stopFeedbackSpeech();

    const conceptTitle = getMessageTitle(selectedMessage.text);
    const originalExplanation = selectedMessage.text;
    const studentExplanation = transcript.trim();

    // 1. Log the student transcript being sent (Req 2 and Req 5)
    console.log("Teach Back Transcript:", transcript);

    // 2. Log full Gemini request payload containing original content and concept details (Req 2)
    console.log("Sending to Gemini...");
    console.log("Gemini request payload:", {
      conceptTitle,
      originalExplanation,
      studentExplanation
    });

    try {
      let response: Response;
      try {
        response = await fetch("/api/teach-back/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conceptTitle,
            originalExplanation,
            studentExplanation
          })
        });
      } catch (networkFetchError) {
        // Let's print the specific connection failure error to the console (Req 1 and Req 7)
        console.error("Fetch implementation failed due to direct client network error:", networkFetchError);
        throw new Error("Network error");
      }

      // 3. Log the Gemini response object directly as requested (Req 2 and Req 5)
      console.log("Gemini Response:", response);

      if (!response.ok) {
        let errorBody: any = null;
        try {
          const bodyTxt = await response.clone().text();
          try {
            errorBody = JSON.parse(bodyTxt);
          } catch (e) {
            errorBody = { error: bodyTxt };
          }
        } catch (e) {
          // ignore
        }

        const fallbackDetail = errorBody?.error || errorBody?.message || "";
        console.error("Gemini API Error details returned from Backend Server:", response.status, fallbackDetail);

        // Classify the response failure status to specific required error classification strings (Req 3)
        if (response.status === 403 || fallbackDetail.toLowerCase().includes("api key missing") || fallbackDetail.toLowerCase().includes("not configured") || fallbackDetail.toLowerCase().includes("api_key")) {
          throw new Error("API key missing");
        } else if (response.status === 429 || fallbackDetail.toLowerCase().includes("rate limit") || fallbackDetail.toLowerCase().includes("quota") || fallbackDetail.toLowerCase().includes("exhausted")) {
          throw new Error("Rate limit exceeded");
        } else if (response.status === 504 || response.status === 502 || response.status === 503 || fallbackDetail.toLowerCase().includes("network error") || fallbackDetail.toLowerCase().includes("timeout")) {
          throw new Error("Network error");
        } else {
          throw new Error(fallbackDetail || `Server request failed with code ${response.status}`);
        }
      }

      // Get internal raw text content to verify empty responses (Req 3)
      const rawText = await response.text();
      console.log("Gemini Response Text Content:", rawText);

      if (!rawText || rawText.trim() === "") {
        throw new Error("Empty response");
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (jsonParseErr) {
        throw new Error("Invalid JSON response");
      }

      setTeachBackResult(data);
      setTeachBackScore(data.score);

      if (onEarnXP) {
        onEarnXP(100, `Completed Teach-Back for "${conceptTitle}"`, topicName, "teach_back");
      }

      if (voiceReplyEnabled && data) {
        const misconceptionsText = data.misconceptions && data.misconceptions.length > 0
          ? ". Let's review the mistakes or misconceptions detected: " + data.misconceptions.slice(0, 2).join(". ")
          : ". Splendid job, we found no critical mistakes or misconceptions in your explanation.";

        const speechText = `Feedback on your understanding: You scored ${data.score} out of 100. ${
          data.correctPoints && data.correctPoints.length > 0 
            ? "Here is what you did great: " + data.correctPoints.slice(0, 2).join(". ") 
            : ""
        }${misconceptionsText} ${
          data.correctedExplanation ? "Remember this key summary: " + data.correctedExplanation : ""
        }`;
        
        setTimeout(() => {
          speakFeedbackSpeech(speechText);
        }, 800);
      }

    } catch (err: any) {
      // 4. Do not silently catch errors, print exact error context to console (Req 1, 2, 6, 7)
      console.error("Teach-Back evaluation failure! Caught exception:", err);

      const errMsg = err.message || "";
      if (errMsg === "API key missing") {
        setEvaluationError("API key missing. Please configure your GEMINI_API_KEY inside the Secrets panel.");
      } else if (errMsg === "Network error") {
        setEvaluationError("Network error. The tutor server or external gateway is temporarily unreachable.");
      } else if (errMsg === "Rate limit exceeded") {
        setEvaluationError("Rate limit exceeded. Too many requests, please wait a moment before trying again.");
      } else if (errMsg === "Empty response") {
        setEvaluationError("Empty response. The application did not receive any text back from the AI model.");
      } else if (errMsg === "Invalid JSON response") {
        setEvaluationError("Invalid JSON response. The model returned a malformed payload pattern.");
      } else {
        setEvaluationError(errMsg || "Our AI tutor went offline momentarily. Please check your transcript and submit again!");
      }
    } finally {
      setIsEvaluatingTeachBack(false);
    }
  };

  const speakFeedbackSpeech = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsVoicePaused(false);

    const cleanText = cleanSpeechText(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setIsPlayingVoice(false);
      setIsVoicePaused(false);
    };
    utterance.onerror = () => {
      setIsPlayingVoice(false);
      setIsVoicePaused(false);
    };

    currentUtteranceRef.current = utterance;
    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  const pauseFeedbackSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsVoicePaused(true);
    }
  };

  const resumeFeedbackSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsVoicePaused(false);
    }
  };

  const stopFeedbackSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      setIsVoicePaused(false);
    }
  };

  const getFullSpeechText = () => {
    if (!teachBackResult) return "";
    return `Your understanding score is ${teachBackResult.score} out of 100. ${
      teachBackResult.correctPoints?.length ? "What you explained correctly: " + teachBackResult.correctPoints.join(". ") : ""
    } ${
      teachBackResult.missingPoints?.length ? "Points we can lock in: " + teachBackResult.missingPoints.join(". ") : ""
    } Corrected Summary: ${teachBackResult.correctedExplanation || ""}`;
  };

  const toggleListening = async () => {
    // If Web Speech API not supported:
    if (!speechRecSupported) {
      setMicPermissionDeniedMsg("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping speech recognition:", e);
        }
      }
      setIsListening(false);
      setMicStatus("Granted");
    } else {
      // Begin microphone request using getUserMedia
      const gotAccess = await requestMicAccess();
      if (gotAccess) {
        initSpeechRecognition();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setMicStatus("Listening");
          } catch (err) {
            console.warn("Speech recognition fail to start:", err);
            setMicPermissionDeniedMsg("Microphone connected. Speech recognition could not start.");
            setMicStatus("Granted");
          }
        } else {
          setMicPermissionDeniedMsg("Microphone connected. Speech recognition could not start.");
        }
      }
    }
  };

  const handleReadAloud = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingText) {
      window.speechSynthesis.cancel();
      if (speakingText === text) {
        setSpeakingText(null);
        return;
      }
    }

    const cleanText = cleanSpeechText(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setSpeakingText(null);
    };
    utterance.onerror = () => {
      setSpeakingText(null);
    };

    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  // Helper file logic
  const compressImage = (base64Str: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        callback(compressedDataUrl);
      } else {
        callback(base64Str);
      }
    };
    img.onerror = () => {
      callback(base64Str);
    };
  };

  const sanitizeTextContent = (rawText: string): string => {
    const printableText = rawText.replace(/[^\x20-\x7E\t\n\r]/g, " ");
    const cleanStream = printableText.replace(/\s+/g, " ").trim();
    if (cleanStream.length > 20000) {
      return cleanStream.slice(0, 20000) + "\n... [Content Truncated for AI snappiness] ...";
    }
    return cleanStream;
  };

  const processFile = (file: File) => {
    if (!onScanComplete) return;
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const resultBytes = e.target?.result as string;
        compressImage(resultBytes, (compressedBytes) => {
          onScanComplete({
            fileContent: compressedBytes,
            fileType: "image/jpeg",
            fileName: file.name
          });
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const resultText = e.target?.result as string;
        const cleanText = sanitizeTextContent(resultText);
        onScanComplete({
          fileContent: cleanText,
          fileType: file.type,
          fileName: file.name
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelection = (acceptStr: string, captureCamera = false) => {
    setAttachmentMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptStr;
      if (captureCamera) {
        fileInputRef.current.setAttribute("capture", "environment");
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  // Initialize with a friendly welcome query from VIDYA
  useEffect(() => {
    setActiveConcept(topicName || "General Topics");

    if (scannedResult) {
      if (scannedResult.chatHistory && scannedResult.chatHistory.length > 0) {
        setMessages(scannedResult.chatHistory);
        return;
      }

      const explainText = `# ${scannedResult.topic}

### Quick Summary
${scannedResult.summary}

### Key Points
${scannedResult.keyPoints?.map((p) => `• ${p}`).join("\n") || ""}

### Detailed Explanation
${scannedResult.detailedExplanation}

### Real-Life Example
This concept can be seen in action everywhere around us! An interactive simulation matching this topic has been loaded.

### Quick Revision Notes
• Review each item closely to prepare for checkpoint questions.
• Try asking specific questions below if any point is unclear!
• You can circle any text with the Scribble Lens at any time.`;

      setMessages((prev) => {
        const list = [...prev];
        const filtered = list.filter((m) => m.id !== "welcome");

        const uploadId = uploadedFile ? `upload-${uploadedFile.fileName}` : "";
        const scanId = `scanned-${scannedResult.topic}`;

        // Ensure upload message is in the list
        if (uploadedFile && !filtered.some((m) => m.id === uploadId)) {
          filtered.push({
            id: uploadId,
            role: "user",
            text: `[File Uploaded] ${uploadedFile.fileName}`,
            timestamp: new Date().toISOString(),
            fileInfo: {
              fileName: uploadedFile.fileName,
              fileType: uploadedFile.fileType,
              fileContent: uploadedFile.fileContent
            }
          });
        }

        // Ensure AI scanned response is in the list
        if (!filtered.some((m) => m.id === scanId)) {
          filtered.push({
            id: scanId,
            role: "assistant",
            text: explainText,
            timestamp: new Date().toISOString()
          });
        }

        return filtered;
      });
    } else if (uploadedFile) {
      setMessages((prev) => {
        const list = [...prev];
        const filtered = list.filter((m) => m.id !== "welcome");
        const uploadId = `upload-${uploadedFile.fileName}`;

        if (!filtered.some((m) => m.id === uploadId)) {
          filtered.push({
            id: uploadId,
            role: "user",
            text: `[File Uploaded] ${uploadedFile.fileName}`,
            timestamp: new Date().toISOString(),
            fileInfo: {
              fileName: uploadedFile.fileName,
              fileType: uploadedFile.fileType,
              fileContent: uploadedFile.fileContent
            }
          });
        }

        return filtered;
      });
    } else {
      setMessages((prev) => {
        if (prev.length === 0 || (prev.length === 1 && prev[0].id === "welcome")) {
          return [
            {
              id: "welcome",
              role: "assistant",
              text: `Hi! I'm your Friendly AI teacher 😊. What would you like to learn today?`,
              timestamp: new Date().toISOString()
            }
          ];
        }
        return prev;
      });
    }
  }, [topicName, scannedResult, uploadedFile]);

  // Scroll to bottom on new message
  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "end" });
    }
    const thread = threadContainerRef.current;
    if (thread) {
      thread.scrollTo({
        top: thread.scrollHeight,
        behavior: instant ? "auto" : "smooth",
      });
    }
  };

  useEffect(() => {
    if (!isScribbleMode && messages.length > 0) {
      scrollToBottom();
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, isScribbleMode]);

  // Adjust canvas bounds to exactly match the scrolling thread container
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const thread = threadContainerRef.current;
    if (!canvas || !thread) return;

    const targetWidth = thread.clientWidth;
    const targetHeight = Math.max(thread.clientHeight, thread.scrollHeight);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    redrawScribbles();
  };

  useEffect(() => {
    if (isScribbleMode) {
      resizeCanvas();
      // Wait a tiny bit for layout changes (like expanding accordion) to commit
      const timer = setTimeout(resizeCanvas, 100);
      
      const thread = threadContainerRef.current;
      let resizeObserver: ResizeObserver | null = null;
      if (thread) {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        resizeObserver.observe(thread);
      }

      window.addEventListener("resize", resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", resizeCanvas);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [isScribbleMode, messages, showNotes]);

  // Redraw the completed or current drawing strokes
  const redrawScribbles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isDrawing && points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "#a855f7"; // Glowing Purple
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(168, 85, 247, 0.7)";
      ctx.shadowBlur = 10;

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    if (pendingScribble && pendingScribble.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(192, 132, 252, 0.5)";
      ctx.shadowBlur = 12;

      ctx.moveTo(pendingScribble.points[0].x, pendingScribble.points[0].y);
      for (let i = 1; i < pendingScribble.points.length; i++) {
        ctx.lineTo(pendingScribble.points[i].x, pendingScribble.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Translucent highlight fill
      ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
      ctx.fill();
    }
  };

  // Drawing event Handlers
  const handleStartDraw = (clientX: number, clientY: number, e?: any) => {
    if (e) {
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const thread = threadContainerRef.current;
    if (!thread) return;

    setPendingScribble(null);
    setIsDrawing(true);

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setPoints([{ x, y }]);
  };

  const handleMoveDraw = (clientX: number, clientY: number, e?: any) => {
    if (e) {
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
    }
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setPoints((prev) => [...prev, { x, y }]);
    redrawScribbles();
  };

  const handleEndDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (points.length < 5) {
      setPoints([]);
      redrawScribbles();
      return;
    }

    // Determine bounds
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Viewport-relative coordinates for document.elementFromPoint
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    const cx = canvasRect.left + (minX + maxX) / 2;
    const cy = canvasRect.top + (minY + maxY) / 2;

    // Temporarily deactivate pointer-events on the canvas so document.elementFromPoint can pierce through it
    const originalPointerEvents = canvas.style.pointerEvents;
    canvas.style.pointerEvents = "none";

    // Retrieve element at the center coordinate
    let detectedText = "";
    try {
      const el = document.elementFromPoint(cx, cy);
      if (el) {
        let cur: HTMLElement | null = el as HTMLElement;
        while (cur && cur !== document.body && !cur.classList.contains("sidebar")) {
          const text = cur.innerText?.trim() || "";
          if (text && text.length > 0 && text.length < 400 && !cur.tagName.toLowerCase().includes("button")) {
            detectedText = text;
            break;
          }
          cur = cur.parentElement;
        }
      }

      if (!detectedText) {
        // Fallback: try to sample a few points in a circle
        const sampleOffsets = [
          { dx: -20, dy: -20 },
          { dx: 20, dy: -20 },
          { dx: -20, dy: 20 },
          { dx: 20, dy: 20 }
        ];
        for (const off of sampleOffsets) {
          const sampleEl = document.elementFromPoint(cx + off.dx, cy + off.dy);
          if (sampleEl) {
            const text = (sampleEl as HTMLElement).innerText?.trim() || "";
            if (text && text.length > 2 && text.length < 355) {
              detectedText = text;
              break;
            }
          }
        }
      }
    } finally {
      // Restore pointer-events
      canvas.style.pointerEvents = originalPointerEvents;
    }

    // Default concept if no text captured
    if (!detectedText) {
      detectedText = activeConcept;
    }

    // Floating menu placement relative to scroll container
    // We position the menu and popups absolutely on the scrollport container
    const menuX = Math.max(10, Math.min(canvas.width - 240, minX));
    const menuY = maxY + 12;

    setPendingScribble({
      selectedText: detectedText,
      menuPos: { x: menuX, y: menuY },
      bounds: { minX, maxX, minY, maxY },
      points: [...points],
    });
    setPoints([]);
    redrawScribbles();
  };

  const clearCurrentScribble = () => {
    setPendingScribble(null);
    setPoints([]);
    setCustomAskQuery("");
    redrawScribbles();
  };

  const handleSendMessage = async (textToSend: string, isFromQuickAction = false, quickActionType?: string) => {
    if (!textToSend.trim() || isTyping) return;

    if (!isFromQuickAction) {
      setActiveConcept(textToSend.trim());
    }

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const formattedHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const appLanguage = (() => {
        try {
          const stored = localStorage.getItem("vidya_active_user");
          if (stored) {
            return JSON.parse(stored).appLanguage || "en";
          }
        } catch {}
        return "en";
      })();

      const tutorStyle = (() => {
        try {
          const stored = localStorage.getItem("vidya_active_user");
          if (stored) {
            return JSON.parse(stored).tutorStyle || "expert";
          }
        } catch {}
        return "expert";
      })();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: formattedHistory,
          currentModelId: currentModelId,
          topicContext: activeConcept,
          isQuickAction: isFromQuickAction,
          quickActionType: quickActionType,
          appLanguage,
          tutorStyle,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: "msg-ai-" + Date.now(),
        role: "assistant",
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (onEarnXP) {
        onEarnXP(60, `Conversing with VIDYA: "${textToSend.substring(0, 30)}..."`, topicName, "circle_query");
      }
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: "error-" + Date.now(),
        role: "assistant",
        text: "Oops! My neural links are vibrating a bit too fast right now. 🪐 Could you please try asking your question again?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleQuickActionClick = (type: "analogy" | "summary" | "usage" | "question") => {
    let actionText = "";
    if (type === "analogy") {
      actionText = `Explain the concept of ${activeConcept} using a simple, relatable life analogy!`;
    } else if (type === "summary") {
      actionText = `Provide a brief, high-yield summary of ${activeConcept} with the most important takeaways.`;
    } else if (type === "usage") {
      actionText = `How is ${activeConcept} used in real life or various academic fields?`;
    } else if (type === "question") {
      actionText = `Ask me a fun, short multiple-choice or conceptual question about ${activeConcept} to test my understanding!`;
    }
    handleSendMessage(actionText, true, type);
  };

  const promptSuggestions = [
    { label: "Give me an analogy 💡", type: "analogy" as const },
    { label: "Brief summary 📝", type: "summary" as const },
    { label: "Real-world uses 🌍", type: "usage" as const },
    { label: "Ask me a question 🧠", type: "question" as const },
  ];

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-slate-50 relative select-text">
      
      {/* 🔮 TOP HEADER (VIDYA.AI Logo and Subject / Navigation) */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-3xs shrink-0 select-none z-30 font-sans">
        <div className="flex items-center gap-3">
          {/* Simple back arrow on the left */}
          {(onBackToDashboard || onBackToUploader) && (
            <button
              onClick={() => {
                if (onBackToDashboard) {
                  onBackToDashboard();
                } else if (onBackToUploader) {
                  onBackToUploader();
                }
              }}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-700 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          <div>
            <span className="text-[10px] uppercase font-black text-purple-600 tracking-widest block leading-none">VIDYA•AI</span>
            <h3 className="text-xs font-black text-slate-800 tracking-tight leading-none block max-w-[180px] sm:max-w-xs truncate mt-1">
              {topicName || "General Topics"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans">
          {scannedResult && onSaveOffline && (
            <button
              onClick={() => {
                onSaveOffline(scannedResult.detailedExplanation, messages);
                if (onEarnXP) {
                  onEarnXP(30, "Preserved study course content offline", topicName, "offline_save");
                }
              }}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-150 text-purple-700 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs"
            >
              Preserve Offline
            </button>
          )}
        </div>
      </div>

      {isScribbleMode && (
        <div className="bg-purple-900 border-b border-purple-950 text-white px-3 py-1.5 text-[9.5px] font-black tracking-wider text-center uppercase select-none animate-pulse shrink-0 z-30 shadow-sm flex items-center justify-center gap-1.5 font-sans">
          <span>🎯 Scribble Mode Active! Draw a circle loop directly over any word, sentence, diagram, or image below!</span>
          <button 
            type="button"
            onClick={() => setIsScribbleMode(false)}
            className="px-2 py-0.5 bg-purple-800 hover:bg-purple-750 text-white rounded-md border border-purple-700 cursor-pointer text-[9px] font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 💬 MIDDLE AREA: LARGE SCROLLABLE LEARNING PORT (occupies most of screen height) */}
      <div 
        ref={threadContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 relative scrollbar-thin pb-6 animate-fade-in"
      >
        {/* C. Conversation Stream Starts */}
        <div className="max-w-3xl mx-auto space-y-5">
          {scannedResult && (
            <div className="space-y-6 pt-2 mb-8 text-left">
              {/* [Text Explanation Card] */}
              <div id="text-explanation-card" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden select-text text-slate-800">
                {/* Side ornament accent representing STEM core */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8b5cf6]" />
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="p-2.5 bg-purple-50 rounded-2xl text-[#8b5cf6]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{scannedResult.topic}</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Concept Study Sheet</p>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="mb-6 p-4 bg-purple-50/40 rounded-2xl border border-purple-100 text-slate-700 text-sm leading-relaxed font-sans italic select-text">
                  <p className="font-bold text-purple-900 not-italic text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                    Quick Overview
                  </p>
                  "{scannedResult.summary}"
                </div>

                {/* Key Learnings */}
                {scannedResult.keyPoints && scannedResult.keyPoints.length > 0 && (
                  <div className="mb-6 border-b border-slate-100 pb-5">
                    <p className="font-extrabold text-slate-600 text-[10px] uppercase tracking-wider mb-3">Key Learnings</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scannedResult.keyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-bold text-slate-700 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 select-text">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed content with headers */}
                <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4">
                  <MarkdownRenderer content={scannedResult.detailedExplanation} />
                </div>
              </div>

              {/* [Visual Explanation Card] */}
              <div id="visual-explanation-card" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden text-slate-800">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Visual Explanation</h3>
                    <p className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider">Concept 2D Illustration</p>
                  </div>
                </div>

                {/* SVG Render viewport */}
                <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-3xs">
                  {(() => {
                    const rawSvg = scannedResult.diagramSvg;
                    const fallbackSvg = getFallbackDiagramSvg(scannedResult.topic);
                    const resolvedSvg = cleanSvgContent(rawSvg) || cleanSvgContent(fallbackSvg);

                    if (!resolvedSvg) {
                      return (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 w-full min-h-[200px]">
                          <ImageIcon className="w-9 h-9 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600">Visual explanation unavailable</p>
                          <p className="text-[10px] text-slate-400 mt-1">Unable to construct 2D diagram for this topic.</p>
                        </div>
                      );
                    }

                    return (
                      <div 
                        className="w-full flex justify-center bg-white p-2 md:p-4 rounded-xl"
                        dangerouslySetInnerHTML={{ __html: resolvedSvg }}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* [Generate Quiz Button] or Interactive Lesson Quiz */}
              {isLessonQuizActive ? (
                <div id="lesson-quiz-panel" className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 scroll-mt-24">
                  {isLessonQuizFinished ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center space-y-4 py-4"
                    >
                      <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-yellow-500/20">
                        <Award className="w-8 h-8 text-yellow-400 animate-bounce" />
                      </div>
                      <h4 className="text-xl font-bold tracking-tight text-white mb-1">Knowledge Challenge Complete!</h4>
                      <p className="text-xs text-slate-300">
                        Awesome effort learning <span className="font-extrabold text-white">"{scannedResult.topic}"</span>!
                      </p>
                      
                      <div className="bg-white/5 border border-slate-800 p-4 rounded-2xl max-w-sm mx-auto grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Score Achieved</span>
                          <span className="text-2xl font-black text-white">{lessonQuizCorrectCount} / 5</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">XP Earned</span>
                          <span className="text-2xl font-black text-emerald-400">+{lessonQuizCorrectCount * 15 + 25} XP</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentLessonQuizIndex(0);
                            setSelectedLessonQuizOption(null);
                            setIsLessonQuizSubmitted(false);
                            setLessonQuizCorrectCount(0);
                            setIsLessonQuizFinished(false);
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-650 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                        >
                          Retry Review Quiz
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsLessonQuizActive(false)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Dismiss Quiz
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    (() => {
                      const questions = scannedResult.suggestedQuizzes || [];
                      if (questions.length === 0) {
                        return (
                          <div className="text-center py-4 text-slate-400 text-xs">
                            No quiz questions available for this topic.
                          </div>
                        );
                      }
                      const qIndex = currentLessonQuizIndex;
                      const q = questions[qIndex] || questions[0];

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Progress: Question {qIndex + 1} of {questions.length}
                            </span>
                            <span className="bg-purple-950 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-purple-200">
                              Lesson Test Prep
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white select-text mb-4 text-left">
                            {q?.question}
                          </h4>

                          <div className="space-y-2.5 py-1">
                            {q?.options?.map((opt: string, optI: number) => {
                              const isSelected = selectedLessonQuizOption === optI;
                              const isCorrect = optI === q.correctAnswerIndex;
                              let btnClass = "w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer select-text flex items-center justify-between ";

                              if (isLessonQuizSubmitted) {
                                if (isCorrect) {
                                  btnClass += "bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold ";
                                } else if (isSelected) {
                                  btnClass += "bg-rose-950/70 border-rose-500 text-rose-200 ";
                                } else {
                                  btnClass += "bg-white/5 border-white/5 text-slate-500 opacity-60 ";
                                }
                              } else if (isSelected) {
                                btnClass += "bg-purple-600 border-purple-400 text-white scale-[1.01] shadow-md ";
                              } else {
                                btnClass += "bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600 ";
                              }

                              return (
                                <button
                                  key={optI}
                                  type="button"
                                  disabled={isLessonQuizSubmitted}
                                  onClick={() => setSelectedLessonQuizOption(optI)}
                                  className={btnClass}
                                >
                                  <span>{opt}</span>
                                  {isLessonQuizSubmitted && (
                                    <span>
                                      {isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                      {!isCorrect && isSelected && <span className="text-rose-400 font-extrabold shrink-0">✕</span>}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isLessonQuizSubmitted && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 mt-2 select-text font-medium leading-relaxed"
                            >
                              <span className="font-extrabold text-emerald-400 block mb-1">Answer Explanation:</span>
                              {q?.explanation}
                            </motion.div>
                          )}

                          <div className="flex justify-end pt-3">
                            {!isLessonQuizSubmitted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedLessonQuizOption === null) return;
                                  setIsLessonQuizSubmitted(true);
                                  const isCorrect = selectedLessonQuizOption === q.correctAnswerIndex;
                                  if (isCorrect) {
                                    setLessonQuizCorrectCount(c => c + 1);
                                  }
                                }}
                                disabled={selectedLessonQuizOption === null}
                                className={`px-4 py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                                  selectedLessonQuizOption === null
                                    ? "bg-slate-800 border-slate-750 text-slate-600 pointer-events-none"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 active:scale-95"
                                }`}
                              >
                                Check My Answer
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (qIndex + 1 < questions.length) {
                                    setCurrentLessonQuizIndex(qIndex + 1);
                                    setSelectedLessonQuizOption(null);
                                    setIsLessonQuizSubmitted(false);
                                  } else {
                                    setIsLessonQuizFinished(true);
                                    if (onEarnXP) {
                                      const scoreXp = lessonQuizCorrectCount * 15 + 25;
                                      onEarnXP(scoreXp, `Completed concept checkup on "${scannedResult.topic}" score ${lessonQuizCorrectCount}/5`, scannedResult.topic, "lesson-quiz-score");
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-550 text-white font-bold text-xs rounded-xl border border-purple-500 transition-all cursor-pointer active:scale-95"
                              >
                                {qIndex + 1 < questions.length ? "Proceed Next Question" : "View Final Score"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="flex justify-center pt-1 scroll-mt-24">
                  <button
                    type="button"
                    onClick={handleStartLessonQuiz}
                    className="w-full max-w-xs py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-2xl shadow-md cursor-pointer transition-all active:scale-[0.98] border border-purple-500 hover:border-purple-600 flex items-center justify-center gap-2 group"
                  >
                    <Zap className="w-4 h-4 group-hover:scale-110 transition-all text-yellow-300 animate-pulse" />
                    <span>Generate Review Quiz</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (scannedResult && msg.id === `scanned-${scannedResult.topic}`) {
                return null; // Skip duplicate plain text message, since we show it as gorgeous cards above!
              }
              const isUser = msg.role === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-start gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (() => {
                  const storedStyle = (() => {
                    try {
                      const stored = localStorage.getItem("vidya_active_user");
                      if (stored) {
                        return JSON.parse(stored).tutorStyle || "expert";
                      }
                    } catch {}
                    return "expert";
                  })();
                  let avatarEmoji = "🦉"; // Default "Strict Teacher"
                  if (storedStyle === "school" || storedStyle === "Friendly Guide" || storedStyle === "Visual") {
                    avatarEmoji = "🎓";
                  } else if (storedStyle === "high_school" || storedStyle === "Subject Mentor") {
                    avatarEmoji = "🧠";
                  }
                  return (
                    <div className="w-11 h-11 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center text-xl shadow-xs select-none shrink-0 border border-purple-100">
                      {avatarEmoji}
                    </div>
                  );
                })()}

                <div className={`flex flex-col max-w-[82%] ${isUser ? "items-end" : "items-start gap-2.5"}`}>
                  <div
                    className={`p-4 border text-[13.5px] font-medium leading-relaxed relative ${
                      isUser
                        ? "bg-purple-600 text-white border-purple-700 rounded-[1.5rem] tracking-wide text-left shadow-xs"
                        : "bg-white text-slate-950 border-purple-100 rounded-[1.5rem] text-left shadow-[0_2px_12px_rgba(139,92,246,0.02)] w-full text-justify select-text"
                    }`}
                  >
                    {isUser ? (
                      msg.text.startsWith("[File Uploaded]") ? (
                        (() => {
                          const fileMatch = msg.fileInfo || uploadedFile;
                          return (
                            <div className="flex flex-col gap-2 p-1 min-w-[220px]">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl select-none bg-white p-1.5 rounded-xl text-purple-600 shadow-3xs">
                                  {fileMatch?.fileType?.startsWith("image/") ? "🖼️" : "📄"}
                                </span>
                                <div className="text-left font-sans text-xs">
                                  <p className="font-bold text-white leading-tight truncate max-w-[170px]">
                                    {fileMatch?.fileName || msg.text.replace("[File Uploaded] ", "")}
                                  </p>
                                  <span className="text-[9px] font-extrabold text-purple-200 block mt-0.5 uppercase tracking-wider">
                                    {fileMatch?.fileType?.replace("application/", "") || "Reference Study Tool"}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Dynamic visual preview if file content is loaded */}
                              {fileMatch && (fileMatch.fileType?.startsWith("image/") || fileMatch.fileContent?.startsWith("data:image/")) && (
                                <div className="mt-1.5 rounded-xl overflow-hidden border border-purple-450 bg-white/5 p-1 flex items-center justify-center max-h-36">
                                  <img 
                                    src={fileMatch.fileContent} 
                                    alt={fileMatch.fileName}
                                    className="max-h-32 object-contain rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}

                              {fileMatch && !fileMatch.fileType?.startsWith("image/") && fileMatch.fileContent && (
                                <div className="mt-1.5 text-[10px] text-purple-100 line-clamp-3 bg-purple-700/50 p-2 rounded-lg border border-purple-500/30 max-h-20 overflow-hidden leading-tight font-sans">
                                  {fileMatch.fileContent}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : msg.text.includes("Regarding the highlighted text:") && msg.text.includes("\n\nMy doubt is:") ? (
                        (() => {
                          const parts = msg.text.split("Regarding the highlighted text:");
                          if (parts.length > 1) {
                            const subParts = parts[1].split("\n\nMy doubt is:");
                            const highlightedPart = subParts[0].trim().replace(/^"/, "").replace(/"$/, "");
                            const doubtPart = subParts[1]?.trim();
                            return (
                              <div className="flex flex-col gap-2 p-1 text-left min-w-[220px]">
                                <div className="text-[9px] font-extrabold uppercase text-purple-200 tracking-wider leading-none">Circled Explanation</div>
                                <div className="bg-purple-800/40 p-2.5 rounded-xl border border-purple-500/30 text-[11.5px] italic text-purple-100 line-clamp-3 leading-snug">
                                  “{highlightedPart}”
                                </div>
                                <div className="text-[10px] font-extrabold uppercase text-purple-200 tracking-wider mt-1 leading-none">My Doubt</div>
                                <div className="text-xs font-bold text-white max-w-[285px]">
                                  {doubtPart}
                                </div>
                              </div>
                            );
                          }
                          return <p className="whitespace-pre-wrap select-text">{msg.text}</p>;
                        })()
                      ) : (
                        <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                      )
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.text} theme="light" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsScribbleMode(!isScribbleMode);
                            setPendingScribble(null);
                          }}
                          className={`absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-white border flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95 z-25 hover:scale-110 ${
                            isScribbleMode
                              ? "border-purple-600 text-purple-600 animate-pulse bg-purple-50"
                              : "border-purple-200 text-[#8b5cf6] hover:bg-purple-50/50"
                          }`}
                          title={isScribbleMode ? "Turn off Scribble Lens" : "Turn on Scribble Lens"}
                        >
                          <Edit3 className="w-5 h-5 shrink-0 text-[#8b5cf6]" strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* ⚡ MINIMAL ICON ACTIONS DIRECTLY BELOW THE MESSAGE BUBBLE */}
                  {!isUser && (
                    <div className="flex gap-3.5 select-none items-center mt-1 ml-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(msg.text);
                          }
                        }}
                        className="text-slate-400 hover:text-[#8b5cf6] cursor-pointer transition-colors p-1"
                        title="Copy text"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReadAloud(msg.text)}
                        className="text-slate-400 hover:text-[#8b5cf6] cursor-pointer transition-colors p-1"
                        title="Speak text"
                      >
                        {speakingText === msg.text ? (
                          <Square className="w-4 h-4 fill-purple-600 text-purple-600 animate-pulse" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSaveOffline) {
                            onSaveOffline(msg.text, messages);
                          }
                        }}
                        className="text-slate-400 hover:text-[#8b5cf6] cursor-pointer transition-colors p-1"
                        title="Preserve course material offline"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenTeachBack(msg)}
                        className="text-[10.5px] font-extrabold tracking-wide text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-150 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none shadow-3xs"
                        title="Explain this concept in your own voice to check understanding!"
                        id={`teach-back-btn-${msg.id}`}
                      >
                        <Brain className="w-3.5 h-3.5 text-purple-600" />
                        <span>Teach Back</span>
                      </button>
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400 font-extrabold block mt-0.5 select-none px-1 uppercase tracking-wide">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-sm shadow-xs font-black shrink-0 select-none border border-purple-500">
                    👤
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <div className="flex items-center gap-3 max-w-[85%] mr-auto select-none">
            <div className="w-11 h-11 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center text-xl shadow-xs select-none shrink-0 border border-purple-100">
              😊
            </div>
            <div className="bg-white rounded-[1.5rem] p-4 border border-purple-100 shadow-[0_2px_12px_rgba(139,92,246,0.02)]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* 🖊️ SCRIBBLE DRAWING INTERACTION CANVAS */}
        {isScribbleMode && (
          <canvas
            ref={canvasRef}
            onMouseDown={(e) => handleStartDraw(e.clientX, e.clientY, e)}
            onMouseMove={(e) => handleMoveDraw(e.clientX, e.clientY, e)}
            onMouseUp={handleEndDraw}
            onTouchStart={(e) => handleStartDraw(e.touches[0].clientX, e.touches[0].clientY, e)}
            onTouchMove={(e) => handleMoveDraw(e.touches[0].clientX, e.touches[0].clientY, e)}
            onTouchEnd={handleEndDraw}
            className="absolute top-0 left-0 w-full h-full block cursor-crosshair z-20 bg-transparent"
          />
        )}

        {/* 📋 SMALL FLOATING DOUBT INPUT BOX NEAR HIGHLIGHTED AREA */}
        {pendingScribble && (
          <div
            style={{
              left: Math.max(10, Math.min(threadContainerRef.current?.clientWidth ? threadContainerRef.current.clientWidth - 310 : 10, pendingScribble.menuPos.x)),
              top: pendingScribble.menuPos.y,
            }}
            className="absolute z-30 w-72 bg-white border border-purple-200/60 rounded-2xl p-4 shadow-[0_12px_36px_rgba(139,92,246,0.18)] animate-scale-up text-left select-none font-sans"
          >
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-purple-50">
              <span className="text-[10px] font-extrabold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded tracking-wide">
                💡 Mini Doubt Solver
              </span>
              <button
                type="button"
                onClick={clearCurrentScribble}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear scribble highlight"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-bold select-none line-clamp-2 italic mb-3 leading-snug">
              Circled: "{pendingScribble.selectedText}"
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!customAskQuery.trim()) return;
                const doubtText = customAskQuery.trim();
                const selectedText = pendingScribble.selectedText;
                
                // Clear the scribble overlay/state before showing answer
                clearCurrentScribble();
                setIsScribbleMode(false);

                // Format the user query message beautifully
                const formattedText = `Regarding the highlighted text: "${selectedText}"\n\nMy doubt is: ${doubtText}`;
                
                await handleSendMessage(formattedText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={customAskQuery}
                onChange={(e) => setCustomAskQuery(e.target.value)}
                placeholder="Ask about this..."
                autoFocus
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-purple-400 focus:outline-none p-2 rounded-xl text-xs font-semibold text-slate-800 shadow-inner"
              />
              <button
                type="submit"
                disabled={!customAskQuery.trim() || isTyping}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-750 disabled:bg-purple-200 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 🔮 FIXED BOTTOM CHAT KEYBOARD INPUT BAR (ChatGPT mobile styling with attachments) */}
      <div className="bg-white border-t border-slate-100 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-3 pt-2 pb-3.5 flex flex-col gap-2 shrink-0">
        


        {/* 📄 COMPACT ATTACHMENT CARD OR SCANNING INDICATOR */}
        {isScanLoading && (
          <div className="px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin shrink-0" />
              <span className="text-[10px] font-bold text-purple-900 truncate">VIDYA is parsing and scanning document details...</span>
            </div>
          </div>
        )}

        {!isScanLoading && uploadedFile && !scannedResult && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0 select-none">
                {uploadedFile.fileType.startsWith("image/") ? "🖼️" : "📄"}
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-black text-indigo-950 truncate max-w-[200px] sm:max-w-xs leading-none">
                  {uploadedFile.fileName}
                </p>
                <span className="text-[9px] font-bold text-emerald-600 block mt-0.5 leading-none">✓ Uploaded Successfully</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (onBackToUploader) {
                  onBackToUploader(); // Clears uploaded file logic
                }
              }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer transition-colors shrink-0"
              title="Remove document notes"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {micPermissionDeniedMsg && (
          <div className="px-3 py-1.5 bg-red-50 rounded-xl border border-red-150 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0 select-none">⚠️</span>
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-red-700">{micPermissionDeniedMsg}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMicPermissionDeniedMsg(null);
                    setMicStatus("Not Requested");
                    toggleListening();
                  }}
                  className="px-2 py-0.5 bg-red-100/70 hover:bg-red-200/90 text-red-800 text-[9px] font-black rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                >
                  Try Again
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMicPermissionDeniedMsg(null);
                setMicStatus("Not Requested");
              }}
              className="text-red-400 hover:text-red-650 p-1 rounded-full hover:bg-red-100 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input Text Box Row */}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2.5 relative"
        >
          {/* Hidden HTML File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 📎 DIRECT UPLOAD BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*,.pdf,.txt,.doc,.docx,.ppt,.pptx";
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
              }
            }}
            className="w-12 h-12 shrink-0 bg-white border border-slate-200 hover:border-purple-300 text-slate-500 hover:text-purple-700 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-3xs active:scale-95"
            title="Upload notes, document or image"
          >
            <Paperclip className="w-5 h-5 text-slate-500" />
          </button>

          {/* 💬 MAIN CHAT INPUT BAR WITH INTEGRATED SPEAKER/MIC */}
          <div className="flex-1 relative flex items-center bg-[#f5f3ff] border border-purple-100/40 rounded-3xl shadow-3xs overflow-hidden">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your teacher anything..."
              disabled={isTyping}
              className="flex-1 bg-transparent border-none pl-5 pr-11 py-3 text-xs text-slate-800 focus:outline-none focus:ring-0 placeholder-purple-300 font-semibold"
            />
            
            {/* Mic Dictation Trigger inside input box on the right */}
            <button
              type="button"
              onClick={toggleListening}
              className="absolute right-4 p-1.5 rounded-full hover:bg-purple-100/50 text-slate-400 hover:text-purple-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={isListening ? "Listening... click to pause" : "Transcribe question with Voice Notes"}
            >
              <Mic className={`w-4 h-4 transition-all duration-200 ${isListening ? "text-red-500 animate-pulse scale-125" : "text-slate-400"}`} />
            </button>
          </div>

          {/* ✈️ CIRCULAR SEND BUTTON */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-3xs shrink-0 active:scale-95 ${
              inputValue.trim() && !isTyping
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-purple-100 text-purple-300 cursor-not-allowed"
            }`}
            title="Send Inquiry to AI Tutor"
          >
            <Send className="w-5 h-5 shrink-0" />
          </button>
        </form>
      </div>

      {/* 🎓 TEACH-BACK MODE MODAL PANEL OVERLAY */}
      <AnimatePresence>
        {isTeachBackOpen && selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto"
            id="teach-back-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl border border-purple-100 shadow-[0_30px_70px_rgba(109,40,217,0.22)] flex flex-col max-h-[90vh] overflow-hidden text-left"
              id="teach-back-content-card"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50/50 border-b border-purple-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                    <Brain className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Teach-Back Mode</h3>
                    <p className="text-[11px] text-slate-500 font-bold max-w-sm truncate">
                      Concept: {getMessageTitle(selectedMessage.text)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* AI Voice Reply Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-purple-100 shadow-3xs active:scale-95 transition-all text-[11px] font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={voiceReplyEnabled}
                      onChange={(e) => {
                        setVoiceReplyEnabled(e.target.checked);
                        if (!e.target.checked) {
                          stopFeedbackSpeech();
                        }
                      }}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-400 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Voice Feedback</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleCloseTeachBack}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-extrabold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/20">
                
                {/* original concept card / Tutor prompt */}
                <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/60 flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">💡</span>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-purple-950">
                      Explain back what you learned!
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                      In your own words, speak or type your explanation of <strong className="text-purple-700 font-black">"{getMessageTitle(selectedMessage.text)}"</strong>.
                      Our supportive science tutor is here to check your accuracy and reward your progress check!
                    </p>
                  </div>
                </div>

                {/* Main interactions stage */}
                <div className="space-y-4">
                  
                  {/* Voice recording console */}
                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-3xs flex flex-col items-center justify-center text-center space-y-4">
                    
                    {/* Language Selector Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs select-none">
                      <span className="text-slate-500 font-extrabold flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5 text-purple-600" />
                        Speech Language:
                      </span>
                      <select
                        id="teachbackLanguageDropdown"
                        value={teachBackLang}
                        onChange={(e) => {
                          const newLang = e.target.value as any;
                          setTeachBackLang(newLang);
                          if (teachBackRecognitionRef.current) {
                            teachBackRecognitionRef.current.lang = newLang === "hinglish" ? "en-IN" : newLang;
                          }
                        }}
                        className="bg-transparent font-black text-slate-800 outline-none cursor-pointer focus:ring-0 text-[11px] border-none pr-1 py-0"
                      >
                        <option value="en-IN">🇮🇳 English</option>
                        <option value="hinglish">🗣️ Hinglish</option>
                        <option value="hi-IN">🇮🇳 Hindi</option>
                        <option value="te-IN">🇮🇳 Telugu</option>
                      </select>
                    </div>

                    {/* Visual Mic Ripple Sphere */}
                    <div className="relative flex items-center justify-center">
                      <AnimatePresence>
                        {isRecordingTeachBack && (
                          <>
                            <motion.span
                              initial={{ scale: 0.8, opacity: 0.5 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              exit={{ scale: 0.8, opacity: 0.5 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                              className="absolute w-20 h-20 bg-purple-400 rounded-full"
                            />
                            <motion.span
                              initial={{ scale: 0.8, opacity: 0.3 }}
                              animate={{ scale: 2.3, opacity: 0 }}
                              exit={{ scale: 0.8, opacity: 0.3 }}
                              transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                              className="absolute w-20 h-20 bg-purple-300 rounded-full"
                            />
                          </>
                        )}
                      </AnimatePresence>
                      
                      <button
                        type="button"
                        id="teachbackPulseMicButton"
                        onClick={isRecordingTeachBack ? stopTeachBackRecording : startTeachBackRecording}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 duration-200 cursor-pointer ${
                          isRecordingTeachBack 
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-350" 
                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-350"
                        }`}
                      >
                        {isRecordingTeachBack ? (
                          <Square className="w-7 h-7 fill-white text-white animate-pulse" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Live Status Indicators */}
                    <div className="flex flex-col items-center space-y-1.5 w-full select-none">
                      {isRecordingTeachBack ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold animate-pulse">
                            🎤 Listening...
                          </span>
                        </div>
                      ) : transcript.trim() ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">
                          ✅ Transcript Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-xs font-bold">
                          🎙️ Ready to record
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800">
                        {isRecordingTeachBack ? "Tutor is listening..." : "Microphone Audio Explanation"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-sm leading-normal">
                        Explain verbally in your chosen language. Click "Start Recording" or toggle the central mic button to begin.
                      </p>
                    </div>

                    {/* Recording controls deck conforming to Requirement 4 */}
                    <div className="flex flex-wrap gap-2.5 justify-center w-full pt-1">
                      <button
                        type="button"
                        id="startTeachBackRecordControl"
                        onClick={startTeachBackRecording}
                        disabled={isRecordingTeachBack}
                        className={`px-3.5 py-2 rounded-xl text-[10.5px] font-black tracking-wide transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border ${
                          isRecordingTeachBack
                            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-sm"
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        Start Recording
                      </button>

                      <button
                        type="button"
                        id="stopTeachBackRecordControl"
                        onClick={stopTeachBackRecording}
                        disabled={!isRecordingTeachBack}
                        className={`px-3.5 py-2 rounded-xl text-[10.5px] font-black tracking-wide transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border ${
                          !isRecordingTeachBack
                            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-650 text-white border-red-600 shadow-sm"
                        }`}
                      >
                        <Square className="w-3.5 h-3.5 fill-white text-white" />
                        Stop Recording
                      </button>

                      <button
                        type="button"
                        id="clearTeachBackRecordControl"
                        onClick={() => {
                          setTranscript("");
                          setLowConfidenceWarning(false);
                          setEvaluationError(null);
                        }}
                        disabled={!transcript.trim() || isRecordingTeachBack}
                        className="px-3.5 py-2 rounded-xl text-[10.5px] font-black tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </div>

                  </div>

                  {/* Transcript box with manual correction enabled */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest pl-1">
                      Your Transcript / Explanation
                    </label>
                    <textarea
                      id="teachbackEditableTranscriptInput"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="Your spoken words will appear here. Or start typing your explanation right away... ✍️"
                      className="w-full text-xs font-semibold p-4 border border-slate-200 rounded-2xl min-h-[110px] bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 leading-relaxed font-sans shadow-3xs"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold pl-1">
                      <span>{transcript.trim().split(/\s+/).filter(Boolean).length} words</span>
                      <span>Microphone failing? Just type to correct manually & submit!</span>
                    </div>
                  </div>

                  {/* Low confidence warning prompt */}
                  {lowConfidenceWarning && transcript.trim() && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[10.5px] font-semibold flex items-start gap-2 select-none animate-pulse">
                      <span className="text-amber-600 text-xs mt-0.5">⚠️</span>
                      <p className="leading-relaxed font-bold">
                        Voice detection may not be perfect. Please edit your transcript before submitting.
                      </p>
                    </div>
                  )}

                  {/* Submit CTA */}
                  <div className="pt-1 select-none">
                    <button
                      type="button"
                      id="teachbackSubmitFinalTranscript"
                      disabled={isEvaluatingTeachBack || !transcript.trim() || isRecordingTeachBack}
                      onClick={handleEvaluateTeachBack}
                      className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black select-none tracking-wide transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isEvaluatingTeachBack ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Tutor is analyzing your explanation...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-200 fill-purple-300" />
                          <span>Submit Transcript</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Error Notification */}
                  {evaluationError && (
                    <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs shrink-0 select-none">⚠️</span>
                        <p className="line-clamp-2">{evaluationError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEvaluationError(null);
                          setMicStatus("Not Requested");
                          startTeachBackRecording();
                        }}
                        className="px-2.5 py-1 bg-rose-200/50 hover:bg-rose-200/90 text-rose-800 text-[10px] font-black rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                </div>

                {/* AI Response Report Screen */}
                {isEvaluatingTeachBack && (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                    </div>
                    <p className="text-xs font-extrabold text-slate-700 animate-pulse">
                      Analyzing science content & evaluating misconceptions...
                    </p>
                  </div>
                )}

                {teachBackResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 pt-4 border-t border-slate-100"
                    id="teach-back-report-results"
                  >
                    
                    {/* Visual Score Ring Widget */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md">
                      
                      <div className="flex flex-col items-center justify-center text-center p-2 border-r border-purple-500/20">
                        <div className="relative w-24 h-24 flex items-center justify-center bg-white/5 rounded-full border-4 border-purple-400">
                          <span className="text-3xl font-black font-mono tracking-tight text-purple-200">
                            {teachBackScore}
                          </span>
                          <span className="text-[10px] absolute bottom-2 font-bold opacity-75">
                            SCORE
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 space-y-1.5 pl-2 text-justify">
                        <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider">
                          Tutor's Evaluation Result
                        </h4>
                        <p className="text-[12.5px] font-extrabold leading-snug">
                          {teachBackScore && teachBackScore >= 85 
                            ? "Magnificent job! You are a master explainer." 
                            : teachBackScore && teachBackScore >= 60 
                            ? "Great progress. You covered the foundational points."
                            : "Let's work together to clear up some minor points!"}
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-200 font-medium font-semibold">
                          Check out your direct feedback lists below, practice with customized check questions, or listen to voice feedback.
                        </p>
                      </div>

                    </div>

                    {/* Text-to-Speech Control Console panel */}
                    <div className="p-3 bg-white border border-purple-100 rounded-2xl flex items-center justify-between shadow-3xs">
                      <div className="flex items-center gap-2 pl-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-extrabold text-slate-700">Tutor Voice Explanation</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPlayingVoice && !isVoicePaused ? (
                          <button
                            type="button"
                            onClick={pauseFeedbackSpeech}
                            className="p-1 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Voice</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isVoicePaused) {
                                resumeFeedbackSpeech();
                              } else {
                                speakFeedbackSpeech(getFullSpeechText());
                              }
                            }}
                            className="p-1 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{isVoicePaused ? "Resume voice" : "Play Voice"}</span>
                          </button>
                        )}

                        {(isPlayingVoice || isVoicePaused) && (
                          <button
                            type="button"
                            onClick={stopFeedbackSpeech}
                            className="p-1 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop voice</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* bento feedback points cards */}
                    <div className="grid grid-cols-1 gap-4 font-sans text-xs">
                      
                      {/* What they did well */}
                      {teachBackResult.correctPoints && teachBackResult.correctPoints.length > 0 && (
                        <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-3xl space-y-2 text-justify">
                          <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                            <span className="w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black leading-none">✓</span>
                            What You Explained Great
                          </h4>
                          <ul className="space-y-1.5 pl-1">
                            {teachBackResult.correctPoints.map((pt: string, i: number) => (
                              <li key={i} className="text-slate-700 font-medium leading-relaxed text-left flex items-start gap-1.5 pl-1">
                                <span className="text-emerald-500 font-black mt-0.5">•</span>
                                <div>{pt}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Points */}
                      {teachBackResult.missingPoints && teachBackResult.missingPoints.length > 0 && (
                        <div className="bg-purple-50/40 p-4 border border-purple-100 rounded-3xl space-y-2 text-justify">
                          <h4 className="font-extrabold text-purple-950 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                            <span className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black leading-none">?</span>
                            Missing Points to Lock In
                          </h4>
                          <ul className="space-y-1.5 pl-1">
                            {teachBackResult.missingPoints.map((pt: string, i: number) => (
                              <li key={i} className="text-slate-700 font-medium leading-relaxed text-left flex items-start gap-1.5 pl-1">
                                <span className="text-purple-500 font-black mt-0.2">•</span>
                                <div>{pt}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Misconceptions OR Perfect indicator */}
                      <div className={`p-4 rounded-3xl space-y-2 border text-justify ${
                        teachBackResult.misconceptions && teachBackResult.misconceptions.length > 0
                          ? "bg-rose-50/40 border-rose-100 text-rose-950"
                          : "bg-teal-50/30 border-teal-100 text-teal-950"
                      }`}>
                        <h4 className="font-extrabold flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                          {teachBackResult.misconceptions && teachBackResult.misconceptions.length > 0 ? (
                            <>
                              <span className="w-5 h-5 bg-rose-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black leading-none">!</span>
                              Misconceptions & Corrections
                            </>
                          ) : (
                            <>
                              <span className="w-5 h-5 bg-teal-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black leading-none">✓</span>
                              Scientific Accuracy Confirmed
                            </>
                          )}
                        </h4>
                        
                        {teachBackResult.misconceptions && teachBackResult.misconceptions.length > 0 ? (
                          <ul className="space-y-1.5 pl-1 text-left">
                            {teachBackResult.misconceptions.map((pt: string, i: number) => (
                              <li key={i} className="text-slate-700 font-medium leading-relaxed text-left flex items-start gap-1.5 pl-1">
                                <span className="text-rose-500 font-bold mt-0.2">•</span>
                                <div>{pt}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-600 font-medium pl-1.5">
                            No scientific discrepancies or misconceptions detected! Excellent focus on details!
                          </p>
                        )}
                      </div>

                      {/* Corrected explanation textbooks summary */}
                      {teachBackResult.correctedExplanation && (
                        <div className="bg-slate-50/80 p-4 border border-slate-150 rounded-3xl space-y-2 bg-gradient-to-br from-indigo-50/20 to-purple-50/20 text-justify">
                          <h4 className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px]">
                            📖 Master Conceptual Summary
                          </h4>
                          <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                            {teachBackResult.correctedExplanation}
                          </p>
                        </div>
                      )}

                      {/* What to revise next */}
                      {teachBackResult.whatToRevise && teachBackResult.whatToRevise.length > 0 && (
                        <div className="bg-indigo-50/30 p-4 border border-indigo-100 rounded-3xl space-y-2 text-justify">
                          <h4 className="font-extrabold text-indigo-950 uppercase tracking-wide text-[10px]">
                            🗺️ Recommended Roadmap
                          </h4>
                          <ul className="space-y-1.5 pl-1 text-left">
                            {teachBackResult.whatToRevise.map((pt: string, i: number) => (
                              <li key={i} className="text-slate-600 font-medium leading-relaxed flex items-start gap-1.5 pl-1">
                                <span className="text-indigo-400 font-black">•</span>
                                <div>{pt}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* SOLIDIFY PROGRESS CHECK - Interactive MCQ */}
                      {teachBackResult.practiceQuestions && teachBackResult.practiceQuestions.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-100 font-sans">
                          <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5 leading-none">
                            <Award className="w-4 h-4 text-purple-600 animate-bounce" />
                            Solidify Progress Check
                          </h4>
                          <p className="text-[11.5px] text-slate-500 font-medium">
                            Answer these 3 custom practice checkpoint questions to lock in your correct understanding:
                          </p>

                          <div className="space-y-4 text-left">
                            {teachBackResult.practiceQuestions.map((q: any, idx: number) => {
                              const isAnswered = selectedQuizAnswers[idx] !== undefined;
                              const selectedOptionIdx = selectedQuizAnswers[idx];
                              return (
                                <div key={idx} className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl text-xs space-y-3">
                                  <p className="font-extrabold text-slate-800 leading-normal">
                                    Q{idx+1}: {q.question}
                                  </p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {q.options.map((opt: string, optIdx: number) => {
                                      const isSelected = selectedOptionIdx === optIdx;
                                      const isCorrect = q.correctAnswerIndex === optIdx;
                                      let btnStyle = "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold";
                                      if (isAnswered) {
                                        if (isCorrect) {
                                           btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                                        } else if (isSelected) {
                                           btnStyle = "bg-rose-50 border-rose-300 text-rose-800 font-bold";
                                        } else {
                                           btnStyle = "bg-white border-slate-100 text-slate-400 font-medium opacity-60";
                                        }
                                      }
                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          onClick={() => {
                                            if (!isAnswered) {
                                              setSelectedQuizAnswers(prev => ({ ...prev, [idx]: optIdx }));
                                              setShowQuizExplanations(prev => ({ ...prev, [idx]: true }));
                                              
                                              if (optIdx === q.correctAnswerIndex) {
                                                if (typeof window !== "undefined" && window.speechSynthesis) {
                                                  const bonusUtterance = new SpeechSynthesisUtterance("Splendid! That is correct.");
                                                  window.speechSynthesis.speak(bonusUtterance);
                                                }
                                              }
                                            }
                                          }}
                                          disabled={isAnswered}
                                          className={`w-full text-left p-3 border rounded-xl text-xs transition-all text-justify transition-all cursor-pointer ${btnStyle}`}
                                        >
                                          <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 rounded-lg w-5 h-5 text-center leading-5 text-[10px] font-black mr-2 font-mono uppercase bg-opacity-70">
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  
                                  {isAnswered && (
                                    <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl space-y-1.5 text-[11px] leading-relaxed">
                                      <p className="font-extrabold text-indigo-950 flex items-center gap-1">
                                        {selectedOptionIdx === q.correctAnswerIndex ? "🎉 Splendidly Correct!" : "💡 Learning Insight!"}
                                      </p>
                                      <p className="text-slate-600 font-medium">
                                        {q.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>

                  </motion.div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0 select-none">
                <button
                  type="button"
                  onClick={handleCloseTeachBack}
                  className="px-5 py-2 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold cursor-pointer transition-colors"
                >
                  Close Teach-Back
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
