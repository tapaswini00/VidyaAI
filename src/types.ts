export interface TimetableSlot {
  id: string;
  day: string; // "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
  time: string; // e.g. "17:30"
  duration: number; // e.g. 45 or 60 minutes
  subject: string;
  topic?: string;
  completed?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  level: number;
  exp: number;
  streak: number;
  lastActive: string | null;
  classGrade?: string; // e.g. "Class 10"
  appLanguage?: string; // e.g. "en"
  tutorStyle?: string; // e.g. "strict"
  isOnboarded?: boolean;
  favoriteSubjects?: string[];
  weeklyGoal?: string; // e.g. "Casual"
  timetableSlots?: TimetableSlot[];
}

export interface ModelPart {
  name: string;
  label: string;
  description: string;
  function: string;
  coord: { x: number; y: number; z: number }; // Relative 3D coordinate space [ -100 to 100 ]
  highlightColor?: string;
  relatedQuizQuestion?: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}

export interface Interactive3DModel {
  id: string; // e.g. human-heart, solar-system, volcano, cell-structure, dna, brain, electric-circuit
  name: string;
  category: string;
  description: string;
  parts: ModelPart[];
  cameraSettings?: {
    defaultRotation: { x: number; y: number; z: number };
    defaultZoom: number;
  };
}

export interface ChatMessage {
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

export interface AIContentResponse {
  topic: string;
  detectedSuccessfully: boolean;
  modelSuggestions: string[]; // Matching visual 3D model recommendations
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  suggestedQuizzes: MCQ[];
  chatHistory?: ChatMessage[];
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface CircleActionResponse {
  selectedText: string;
  action: "explain" | "simplify" | "notes" | "quiz";
  result: string;
}

export interface SavedContent {
  id: string;
  type: "concept" | "3d-model" | "quiz" | "circle-note" | "explanation" | "notes" | "quiz-result" | "image" | "diagram" | "learning-session" | "teach-back";
  topic: string;
  timestamp: string;
  summary?: string;
  detailedExplanation?: string;
  keyPoints?: string[];
  modelId?: string; // Pointing to model ID
  quizQuestions?: MCQ[];
  notes?: string;
  highlightedText?: string;
  chatHistory?: ChatMessage[];
  imageUrl?: string;
  score?: number;
  totalQuestions?: number;
  evaluation?: string;
  category?: "notes" | "explanations" | "quizzes" | "images" | "learning-sessions"; // Explict category mapping for search/browse
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  lastMessagePreview: string;
  messages: ChatMessage[];
}

export interface ProgressHistory {
  id: string;
  timestamp: string;
  topic: string;
  actionType: "scan" | "explore_3d" | "quiz_score" | "circle_query" | "timetable" | "timetable_complete";
  details: string;
  expGained: number;
}
