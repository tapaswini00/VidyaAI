import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import fs from "fs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || "vidya-deep-secret-token-key-2026-06";
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read dynamic firebase-applet-config.json details
const CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
let appletConfig = {
  projectId: "",
  appId: "",
  apiKey: "",
  authDomain: "",
  firestoreDatabaseId: "ai-studio-7372af19-0e92-4796-bffd-5ba72b504435",
  storageBucket: "",
  messagingSenderId: "",
  measurementId: ""
};
if (fs.existsSync(CONFIG_FILE)) {
  try {
    appletConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to read firebase config file in server setup:", e);
  }
}

interface SavedContent {
  id: string;
  topic: string;
  summary: string;
  detailedText: string;
  keyPoints: string[];
  savedAt: string;
}

interface ProgressHistory {
  id: string;
  actionType: "quiz" | "scan" | "circle-learn" | "3d-interact" | "chat";
  details: string;
  topic: string;
  timestamp: string;
  expEarned: number;
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  level: number;
  exp: number;
  streak: number;
  lastActive: string;
  isOnboarded: boolean;
  studyHabits?: string;
  favoriteSubjects?: string[];
  weeklyGoal?: string;
}

interface UserRecord {
  email: string;
  passwordHash: string;
  profile: UserProfile;
  vault: SavedContent[];
  history: ProgressHistory[];
}

const USERS_FILE = path.join(DATA_DIR, "users_auth.json");

function loadUsers(): Record<string, UserRecord> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading users file database:", err);
  }
  return {};
}

function saveUsers(users: Record<string, UserRecord>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users file database:", err);
  }
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "v1_hash_" + hash;
}

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired access token" });
    }
    req.user = user;
    next();
  });
};

// Serve the client-side Firebase configuration script dynamically at runtime
app.get("/api/firebase-config.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
    window.FIREBASE_CONFIG = ${JSON.stringify(appletConfig, null, 2)};
  `);
});

// Enable JSON bodies with higher limit for scanned base64 uploads
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Middleware to check if Gemini API Key is available
const checkGeminiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(403).json({
      error: "Gemini API key is not configured in Secrets panel.",
      isConfigError: true,
    });
  }
  next();
};

// Resilient wrapper for Gemini API calls to handle spikes in demand, 503, and 429 errors
async function generateContentWithRetry(params: any, options: { maxRetries?: number; initialDelayMs?: number } = {}) {
  const { maxRetries = 3, initialDelayMs = 800 } = options;
  let lastError: any = null;

  const primaryModel = params.model || "gemini-3.5-flash";
  const modelsToTry: string[] = [];

  // Determine priority of models. Try the requested model first.
  if (primaryModel === "gemini-3.1-pro-preview") {
    modelsToTry.push("gemini-3.1-pro-preview");
    modelsToTry.push("gemini-3.5-flash");
    modelsToTry.push("gemini-3.1-flash-lite");
  } else {
    modelsToTry.push(primaryModel);
    if (primaryModel !== "gemini-3.5-flash") {
      modelsToTry.push("gemini-3.5-flash");
    }
    modelsToTry.push("gemini-3.1-flash-lite");
    modelsToTry.push("gemini-flash-latest");
  }

  // Ensure unique model rotation list in sequence
  const uniqueModels = Array.from(new Set(modelsToTry));

  for (const model of uniqueModels) {
    let delay = initialDelayMs;
    const currentModelMaxRetries = maxRetries;

    for (let attempt = 1; attempt <= currentModelMaxRetries; attempt++) {
      try {
        console.log(`[Gemini Request] Model: ${model}, Attempt: ${attempt}/${currentModelMaxRetries}`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
        const status = err.status || (err.statusText ? parseInt(err.statusText) : null);
        console.log(`[Gemini Request Info] Model: ${model}, Attempt: ${attempt} returned status: ${status || 'unknown'}`);

        // Detect specific HTTP status codes
        const is403 = errStr.includes("403") || status === 403;
        const is400 = errStr.includes("400") || status === 400;
        const is429 = errStr.includes("429") || errStr.toLowerCase().includes("rate limit") || errStr.toLowerCase().includes("too many requests") || status === 429;
        const is503 = errStr.includes("503") || errStr.toLowerCase().includes("overloaded") || errStr.toLowerCase().includes("service unavailable") || status === 503;

        // Graceful paid-key fallback: 
        // If a paid/pro model fails with a 403 (unauthorized/paid tier issue), immediately rotate to standard free model
        if (is403 && model === "gemini-3.1-pro-preview") {
          console.log(`[Gemini Shift] Model gemini-3.1-pro-preview is busy/unauthorized, switching immediately to free tier models...`);
          break; // Break active loop for this model, rotate to next
        }

        // If it's a static 400 or 403 error for standard model, don't retry, throw or move to rotate if other models are left
        if ((is400 || is403) && model !== "gemini-3.1-pro-preview") {
          if (model !== uniqueModels[uniqueModels.length - 1]) {
            console.log(`[Gemini Shift] Non-transient status ${is400 ? '400' : '403'} on ${model}. Switching to other model...`);
            break;
          }
          throw err;
        }

        // If it is a 503 or 429, we can immediately rotate to another model to avoid wasting time or causing timeout on the client.
        if (is503 || is429) {
          if (model !== uniqueModels[uniqueModels.length - 1]) {
            console.log(`[Gemini Shift] Transient status ${is503 ? "503 (service unavailable)" : "429 (rate limit)"} on ${model}. Switching instantly to other model...`);
            break;
          }
        }

        // If there are remaining attempts for the CURRENT model, backoff and retry the SAME model.
        // Retrying on other transient network issues is highly effective.
        if (attempt < currentModelMaxRetries) {
          const sleepTime = delay * attempt; // incremental backoff
          console.log(`[Gemini Backoff] Retrying request on ${model}. Sleeping ${sleepTime}ms before attempt ${attempt + 1}...`);
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
        } else {
          // We used all retries for this model. We will automatically fall through to the next model in uniqueModels.
          console.log(`[Gemini Shift] Completed all ${currentModelMaxRetries} attempts for ${model}. Trying next available model...`);
        }
      }
    }
  }

  throw lastError;
}

// Log API helper
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ─── JWT AUTHENTICATION ENDPOINTS ───

// POST: Register User Account
app.post("/api/auth/register", (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }

    const emailClean = email.trim().toLowerCase();
    const users = loadUsers();

    if (users[emailClean]) {
      return res.status(400).json({ error: "This email is already registered. Please login directly!" });
    }

    const initialProfile: UserProfile = {
      name: name.trim(),
      email: emailClean,
      avatar: "🎓",
      level: 1,
      exp: 0,
      streak: 1,
      lastActive: new Date().toISOString(),
      isOnboarded: false
    };

    const newRecord: UserRecord = {
      email: emailClean,
      passwordHash: hashPassword(password),
      profile: initialProfile,
      vault: [],
      history: []
    };

    users[emailClean] = newRecord;
    saveUsers(users);

    const token = jwt.sign({ email: emailClean, name: initialProfile.name }, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      token,
      profile: initialProfile,
      vault: [],
      history: []
    });
  } catch (err: any) {
    console.error("Auth server registration error:", err);
    res.status(500).json({ error: "Internal server registration failure." });
  }
});

// POST: Log In User Account
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailClean = email.trim().toLowerCase();
    const users = loadUsers();

    const user = users[emailClean];
    if (!user) {
      return res.status(400).json({ error: "No student account found with this email. Please sign up first!" });
    }

    if (user.passwordHash !== hashPassword(password)) {
      return res.status(400).json({ error: "Incorrect password. Please verify your credentials and try again." });
    }

    const token = jwt.sign({ email: emailClean, name: user.profile.name }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      profile: user.profile,
      vault: user.vault || [],
      history: user.history || []
    });
  } catch (err: any) {
    console.error("Auth server login error:", err);
    res.status(500).json({ error: "Internal server login failure." });
  }
});

// POST: Google/Gmail Single Sign-On and Registration Fallback
app.post("/api/auth/google", (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required for Gmail ID sync." });
    }

    const emailClean = email.trim().toLowerCase();
    const users = loadUsers();

    let user = users[emailClean];
    if (!user) {
      // Auto-create a brand new account for Gmail logins!
      const initialProfile: UserProfile = {
        name: name ? name.trim() : emailClean.split("@")[0],
        email: emailClean,
        avatar: avatar || "🎓",
        level: 1,
        exp: 0,
        streak: 1,
        lastActive: new Date().toISOString(),
        isOnboarded: false
      };

      user = {
        email: emailClean,
        passwordHash: hashPassword("GoogleAuthNoPasswordReq"),
        profile: initialProfile,
        vault: [],
        history: []
      };

      users[emailClean] = user;
      saveUsers(users);
    }

    const token = jwt.sign({ email: emailClean, name: user.profile.name }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      profile: user.profile,
      vault: user.vault || [],
      history: user.history || []
    });
  } catch (err: any) {
    console.error("Google Auth server login error:", err);
    res.status(500).json({ error: "Internal Google/Gmail identity process lookup failure." });
  }
});

// POST: Sync active student progress, learning vault, and activity logs
app.post("/api/auth/sync", authenticateToken, (req: any, res: any) => {
  try {
    const email = req.user.email;
    const { profile, vault, history } = req.body;

    const users = loadUsers();
    const user = users[email];
    if (!user) {
      return res.status(404).json({ error: "User session account not found." });
    }

    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile,
        email: email // Keep email integrity
      };
    }
    if (vault) {
      user.vault = vault;
    }
    if (history) {
      user.history = history;
    }

    users[email] = user;
    saveUsers(users);

    res.json({
      success: true,
      profile: user.profile,
      vault: user.vault,
      history: user.history
    });
  } catch (err: any) {
    console.error("Profile sync backup error:", err);
    res.status(500).json({ error: "Failed to sync student learning history with server database." });
  }
});

// GET: Fetch authenticated student session parameters
app.get("/api/auth/me", authenticateToken, (req: any, res: any) => {
  try {
    const email = req.user.email;
    const users = loadUsers();
    const user = users[email];
    if (!user) {
      return res.status(404).json({ error: "Student authorization account not found on the server." });
    }

    res.json({
      profile: user.profile,
      vault: user.vault || [],
      history: user.history || []
    });
  } catch (err: any) {
    console.error("Authorization fetch me error:", err);
    res.status(500).json({ error: "Failed to fetch authorized student session." });
  }
});

// 2. Scan & Process textbook page / file uploads
app.post("/api/scan", checkGeminiKey, async (req, res) => {
  try {
    const { fileContent, fileType, fileName, customQuery } = req.body;

    let systemPrompt = `You are VIDYA, an intelligent, friendly AI teacher designed for students from Classes 6–12, Diploma, Engineering, and competitive exams. 
    Your job is to analyze the scanned textbook content, image, or query, identify the core STEM or general science topic, and produce:
    1. A simplified student-friendly summary.
    2. A comprehensive, detailed explanation of the concept written in student-friendly language and structured with EXACTLY these specific headers:
       - ### What it means: (explaining the concept in simple words with supportive metaphors)
       - ### How it works: (describing step-by-step how the process or mechanism happens)
       - ### Important parts: (listing and explaining the key components, parameters, or sections)
       - ### Real-life example: (giving a highly relatable, fun, real-world example)
       - ### Quick revision notes: (compact review bullets for quick recall)
    3. 4-5 key bullet point takeaways.
    4. An array of matching interactive 3D model recommendations from this specific list: 
       ["human-heart", "solar-system", "volcano", "cell-structure", "dna", "brain", "electric-circuit"]. Only return matching model IDs if they are highly related to the topic scanned!
    5. A set of exactly 5 multiple choice questions (MCQs) for interactive quiz testing. Each MCQ must contain:
       - question
       - 4 options
       - correctAnswerIndex (0-3)
       - explanation of why that option is correct.
    6. A beautiful, labeled 2D educational vector SVG diagram to visually reinforce this topic using colored paths and outline strokes. It must be textbook style, white/light background, with clean text labels mapping the components in the visual itself (e.g., for heart show labels like Right Ventricle, Aorta, etc., for condensation show water, clouds, vapor, droplets, etc.). It must be standard, valid SVG that can be embedded directly.`;

    let contents: any[] = [];
    
    if (fileContent && fileType) {
      // Check if the content is actually a Base64-encoded image, PDF, or data URL
      const isActualBase64Image = fileType.startsWith("image/") && 
        (fileContent.startsWith("data:image/") || (!fileContent.includes(" ") && fileContent.length > 100));
      
      const isActualBase64Pdf = (fileType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) &&
        (fileContent.startsWith("data:application/pdf") || (!fileContent.includes(" ") && fileContent.length > 100));

      if (isActualBase64Image || isActualBase64Pdf) {
        const base64Data = fileContent.split(",")[1] || fileContent;
        contents.push({
          inlineData: {
            mimeType: isActualBase64Pdf ? "application/pdf" : fileType,
            data: base64Data
          }
        });
        contents.push({
          text: `Here is the uploaded file ("${fileName}"). Read and analyze its contents clearly, precisely, and with absolute accuracy. Explain exactly what the user has uploaded, providing a high-quality educational breakdown. Ignore any external or unrelated topics - focus strictly and exclusively on the uploaded payload. ${customQuery ? "User additional prompt: " + customQuery : ""}`
        });
      } else {
        // If it's another document (TXT, Markdown, CSV etc.)
        contents.push({
          text: `Uploaded File Name: "${fileName}". Extracted Text Content: """${fileContent}""". 
          Task: Read and analyze this uploaded content clearly, precisely, and with absolute accuracy. Focus strictly and exclusively on extracting/explaining this content. ${customQuery ? "User additional prompt: " + customQuery : ""}`
        });
      }
    } else if (customQuery) {
      // Direct text search/query
      contents.push({
        text: `Scientific query coordinates: "${customQuery}". Identify and formulate the scientific explanation.`
      });
    } else {
      return res.status(400).json({ error: "Missing scan data or custom query." });
    }

    console.log("Analyzing content with Gemini...");

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { 
              type: Type.STRING, 
              description: "The name of the detected STEM / general science topic (e.g. 'Human Circulation and the Heart')" 
            },
            detectedSuccessfully: { type: Type.BOOLEAN },
            modelSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Must contain relevant IDs only from: ['human-heart', 'solar-system', 'volcano', 'cell-structure', 'dna', 'brain', 'electric-circuit']"
            },
            summary: { 
              type: Type.STRING, 
              description: "A super encouraging, playful, and simple 3-sentence summary of the concept." 
            },
            detailedExplanation: { 
              type: Type.STRING, 
              description: "A complete explanation strictly structured into five sections with these headers: '### What it means', '### How it works', '### Important parts', '### Real-life example', and '### Quick revision notes'." 
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "At least 4 crucial educational points."
            },
            diagramSvg: {
              type: Type.STRING,
              description: "A complete, valid 2D educational vector SVG of the topic with proper text labels embedded directly in the diagram (e.g. labeled heart, plant cell structure with organelles, water cycle phases). Use textbook style, white/light background, clean lines, colored filled shapes. Return ONLY the raw standard <svg>...</svg> namespace code without surrounding backticks or markdown, completely self-contained."
            },
            suggestedQuizzes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"]
              }
            }
          },
          required: [
            "topic",
            "detectedSuccessfully",
            "modelSuggestions",
            "summary",
            "detailedExplanation",
            "keyPoints",
            "diagramSvg",
            "suggestedQuizzes"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Scan processing failure:", err);
    res.status(500).json({ 
      error: err.message || "AI was unable to parse the textbook scan. Please try a different page or query.",
      raw: err
    });
  }
});

// AI custom student study timetable suggests
app.post("/api/suggest-timetable", checkGeminiKey, async (req, res) => {
  try {
    const { currentUser, learningHistory } = req.body;
    
    const favoriteSubjects = currentUser?.favoriteSubjects?.join(", ") || "various science disciplines";
    const grade = currentUser?.classGrade || "Class 10";
    const level = currentUser?.level || 1;
    const historyTopics = learningHistory?.map((h: any) => h.topic).filter(Boolean).slice(0, 5).join(", ") || "general academic lessons";

    let systemPrompt = `You are VIDYA, an intelligent, friendly AI teacher and counselor. 
    Analyze the student's learning profile:
    - Favorite Subjects: ${favoriteSubjects}
    - Study Grade: ${grade}
    - Student Performance Level: ${level}
    - Recently Studied Topics: ${historyTopics}

    Generate exactly 5 customized schedule slot recommendations as a structured study plan/timetable for this week. 
    Distribute them logically. Allocate popular school subjects. Each recommendation must have:
    - day: Single string day of the week, choose from ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    - time: Hour and minute in 24-hour HH:MM format (e.g., "16:30", "15:00")
    - duration: Study session length in minutes, choose from [30, 45, 60, 90]
    - subject: One of the available subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "English", "Computer Science", "Economics", "Civics"]
    - topic: A fun, specific educational target/chapter appropriate for their grade and profile (e.g., "Intro to Quantum Particles", "Quadratic Equations Practice", "The Heart and Blood Circulation").`;

    console.log("Generating suggested timetable slots from Gemini...");

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [
        { text: "Synthesize 5 highly motivational and perfectly tailored study slots for this student's timetable." }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedSlots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  time: { type: Type.STRING },
                  duration: { type: Type.INTEGER },
                  subject: { type: Type.STRING },
                  topic: { type: Type.STRING }
                },
                required: ["day", "time", "duration", "subject", "topic"]
              }
            }
          },
          required: ["suggestedSlots"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Timetable suggestion failure:", err);
    res.status(500).json({ error: "Failed to assemble AI custom timetable. Fallback activated." });
  }
});

// 3. Circle to Ask - contextual on selected areas or visual overlays
app.post("/api/circle-ask", checkGeminiKey, async (req, res) => {
  try {
    const { selectedText, action, currentModelId, clickedPartName } = req.body;

    if (!selectedText && !clickedPartName) {
      return res.status(400).json({ error: "Please select / circle some text or tap a model part to ask." });
    }

    let modelContextPrompt = "";
    if (currentModelId) {
      modelContextPrompt = `The student is currently viewing the interactive 3D model of: "${currentModelId}" ${clickedPartName ? `and has tapped on the physical part/label: "${clickedPartName}"` : ""}. 
      Contextualize your answer with reference to this 3D model representation. If relevant, explain how this connects with the model visual!`;
    }

    let actionInstruction = "";
    if (action === "simplify" || action === "visual") {
      actionInstruction = "Explain this concept in extremely simple, friendly terms appropriate for an 8-year-old child. Use high-impact visual descriptions and relatable analogies.";
    } else if (action === "notes") {
      actionInstruction = "Draft beautifully formatted, highly structured study revision notes with key bullet points for this content.";
    } else if (action === "quiz") {
      actionInstruction = "Create 2 quick, fun diagnostic question and answer check points based exactly on this selection.";
    } else if (action === "ask") {
      actionInstruction = "The student has a specific custom question about this selected content. Please answer their custom query directly, supporting them with clear STEM analogies.";
    } else {
      actionInstruction = "Provide a warm, thorough explanation answering any direct student queries or doubts.";
    }

    const mainPrompt = `Task Focus:
    - Target Content: "${selectedText || clickedPartName}"
    - Task Action: ${action} 
    - Secondary Action Guidelines: ${actionInstruction}
    ${modelContextPrompt}
    
    Format the response as a student-friendly narrative. Encourage the student like a friendly guide. Use clean markdown formatting (bold words, emojis, spacing).`;

    console.log("Answering Circle-to-Ask with Gemini...");

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: mainPrompt,
      config: {
        systemInstruction: "You are VIDYA, an intelligent, friendly AI teacher designed for students from Classes 6–12, Diploma, Engineering, and competitive exams. Teach naturally, encourage the student, use short paragraphs (1-3 sentences), and explain simply.",
        temperature: 0.7,
      }
    });

    res.json({
      selectedText: selectedText || clickedPartName,
      action: action,
      result: response.text || "I was unable to analyze this region. Try circling a broader conceptual block."
    });
  } catch (err: any) {
    console.error("Circle-Ask processing failure:", err);
    res.status(500).json({ error: err.message || "AI failed to respond. Please check your selection and try again." });
  }
});

// 3.1. Conversational STEM Chatbot Continuation Endpoint
app.post("/api/chat", checkGeminiKey, async (req, res) => {
  try {
    const { message, history = [], currentModelId, topicContext, isQuickAction, quickActionType, appLanguage, tutorStyle } = req.body;

    const languageCode = appLanguage || "en";
    let activeLanguageName = "English";
    if (languageCode === "hi") activeLanguageName = "Hindi";
    else if (languageCode === "te") activeLanguageName = "Telugu";
    else if (languageCode === "mr") activeLanguageName = "Marathi";
    else if (languageCode === "ta") activeLanguageName = "Tamil";
    else if (languageCode === "kn") activeLanguageName = "Kannada";
    else if (languageCode === "ml") activeLanguageName = "Malayalam";
    else if (languageCode === "bn") activeLanguageName = "Bengali";
    else if (languageCode === "ur") activeLanguageName = "Urdu";
    else if (languageCode === "ar") activeLanguageName = "Arabic";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Format historical messages for Gemini SDK (converts user -> user, assistant/model -> model roles)
    const contents: any[] = [];
    
    // Add history
    history.forEach((h: any) => {
      const normalizedRole = h.role === "assistant" ? "model" : h.role;
      if (normalizedRole === "user" || normalizedRole === "model") {
        contents.push({
          role: normalizedRole,
          parts: [{ text: h.text }]
        });
      }
    });

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Build the ultimate student-friendly, bilingual system instruction
    let systemInstruction = `You are VIDYA, an intelligent, friendly AI teacher designed for students from Classes 6–12, Diploma, Engineering, and competitive exams.

Your personality is that of an excellent human teacher—not a textbook and not ChatGPT.

CRITICAL REQUIREMENTS:

1. ABSOLUTELY NO TECHNICAL OR AI LABELS:
   - You MUST speak naturally like a human tutor or supportive friendly teacher.
   - NEVER refer to yourself as "AI", "AI model", "Large Language Model", "Gemini", "algorithm", "API response", "assistant role", "context answer" or mention any technical backend boundaries.
   - Never use technical output prefixes or headings like "AI Response:", "Gemini Explanation:", "Model Output:", etc. Just provide your response naturally.

2. TEACHING STYLE:
   - Always teach naturally as if speaking to a student sitting beside you.
   - Never dump all information at once.
   - Start with a simple explanation.
   - Explain only what is necessary.
   - Build concepts step by step.
   - Keep paragraphs short (1–3 sentences).
   - Use simple English unless the student asks for advanced explanations.
   - Avoid unnecessary headings.
   - Avoid overly formal language.

3. RESPONSE STRUCTURE FOR PROGRAMMING CONCEPTS:
   Whenever a student asks about code or a programming concept, follow this structure naturally:

   - Step 1 — Short introduction (2–3 lines):
     Briefly explain what the topic is and why it matters.
     Do NOT start with phrases like "Hello there!", "I'm excited to...", "Let's dive in...", "Great question!". Instead start directly.
     Example:
     "Java uses classes and methods to organize programs. Let's understand this example one step at a time."

   - Step 2 — Show the code:
     Display the code in a clean code block.
     Do NOT repeat unnecessary explanations.

   - Step 3 — Explain gradually:
     Explain the code section by section.
     Example:
     Class
     \`\`\`
     public class NumberChecker
     \`\`\`
     This creates a class named **NumberChecker**.
     Every Java program is written inside a class.
     ---
     Main Method
     \`\`\`
     public static void main(String[] args)
     \`\`\`
     This is where Java starts executing the program.
     ---
     Variable
     \`\`\`
     int limit = 3;
     \`\`\`
     This creates an integer variable named **limit** and stores the value **3**.
     Continue similarly.

   - Step 4 — Explain only important concepts:
     Explain only concepts used in the code (e.g. Variables, Loops, Conditions, Functions, Arrays, Objects).
     Do NOT explain concepts that are not used. Mention beginner mistakes, highlight keywords, explain why something is used, and if possible, mention time complexity in one sentence.

   - Step 5 — Dry Run:
     Use a clean table.
     Example:
     | i | Even/Odd | Output    |
     | - | -------- | --------- |
     | 1 | Odd      | 1 is Odd  |
     | 2 | Even     | 2 is Even |
     | 3 | Odd      | 3 is Odd  |

   - Step 6 — Final Output:
     Show only the output.
     \`\`\`
     1 is Odd
     2 is Even
     3 is Odd
     \`\`\`

   - Step 7 — Check Understanding:
     Instead of giving homework, ask ONE natural question.
     Example:
     "What do you think will happen if \`limit\` becomes 5?"
     Wait for the student's answer before continuing.

4. IF THE STUDENT SAYS "I don't understand":
   - Never repeat the same explanation.
   - Instead simplify it, use an analogy, give another example, explain visually using text, or use real-life comparisons (e.g. "Think of a loop like climbing stairs. Every step increases by one until you reach the top.").

5. ADAPTIVE TEACHING:
   - If the student is a beginner: Use very simple language.
   - If intermediate: Add best practices.
   - If advanced: Explain internals and optimization.

6. DRAWING & SCRIBBLING DOUBTS HANDLING:
   - If the user's message is styled as: "Regarding the highlighted text: \"...\" \n\n My doubt is: ...", this means they used their finger or pen tool to circle some confusing part of the concept explanation.
   - You MUST instantly address their specific doubt with extreme care and encourage them, addressing the highlighted text directly as a real teacher would. E.g., "Ah, that is a great question about [highlighted concept]! Let's break it down in a super simple way..."
   - Again, DO NOT use any labels or headers like "Scribble Answer", "AI context explanation", "Context Answer", etc. Just chat with them naturally.

7. STRICT LANGUAGE RULES:
   - Always reply in the same language used by the user.
   - If the user writes in English, respond entirely in English.
   - Never switch languages automatically.
   - Only change language when the user explicitly requests it (e.g., "Explain in Hindi", "Explain in Telugu", "Translate").
   - Never mix languages in a single response until asked for.

8. FRESH TOPIC SWITCHING & LATEST PROMPT PRIORITIZATION:
   - ALWAYS prioritize the user's LATEST message.
   - If the user asks about a new topic, IMMEDIATELY pivot to explaining the new topic. Never restrict or force future answers back to previously discussed topics.

9. QUICK ACTIONS & CONTEXT SPECIFICATION:
   - If the user uses a quick action (like asking for an analogy, summary, real world use, or a quick question), answer it beautifully.
   - The on-screen active topic is "${topicContext || "General Science"}". Use this topic ONLY if the user's latest query is directly referring to "this" or if they click a quick action suggestion.
   - If they have discussed another concept in their immediate previous chat turn, and they click a quick action, tailor your explanation to that concept instead of getting stuck on the screen topic!

10. FORMATTING RULES:
    - Use: Short paragraphs, bullet points, tables, code blocks, bold important words.
    - Avoid: Huge walls of text, 10+ headings, long introductions, emoji spam.

11. STRICT EDUCATION-ONLY RESTRICTION:
    - You are STRICTLY forbidden from answering queries completely unrelated to education, academics, science, learning, school subjects, languages, history, mathematics, or school topics.
    - If the user asks about entertainment, video games, celebrity gossip, sports scores, recipes, movie suggestions, or general casual chit-chat unrelated to academic learning, you MUST refuse to answer and reply with exactly: "This app is only for education purpose only." (or a friendly bilingual equivalent that concludes with "This app is only for education purpose only.").

12. TEACH BACK MODE:
    - If Teach Back Mode is enabled or active: After teaching, ask the student to explain the concept in their own words. Then identify mistakes, correct misunderstandings politely, and give hints instead of immediately revealing answers.

13. TONE:
    - Friendly, Patient, Encouraging, Natural, Never robotic. Make the student feel like they are chatting with a real teacher.`;

    if (tutorStyle === "school" || tutorStyle === "Friendly Guide" || tutorStyle === "Visual") {
      systemInstruction += `\n\nYOUR PERSONASTYLE: You are acting in the "Friendly Guide" personality. Be exceptionally patient, warm, and encourage the student. Explain complex ideas using simple, direct, visual analogies and analogies a school child can understand. Avoid highly mathematical or overly academic language, and validate the student with positive feedback! Always respond strictly inside this persona.`;
    } else if (tutorStyle === "high_school" || tutorStyle === "Subject Mentor") {
      systemInstruction += `\n\nYOUR PERSONASTYLE: You are acting in the "Subject Mentor" personality. Provide structured, insightful, and clear explanations. Be academic but highly encouraging, connect concepts to high school curriculum goals, and ask checking questions to guide learning incrementally. Always respond strictly inside this persona.`;
    } else if (tutorStyle === "expert" || tutorStyle === "Strict Teacher") {
      systemInstruction += `\n\nYOUR PERSONASTYLE: You are acting in the "Strict Teacher" personality. Be rigorous, academic, precise, and challenging. Hold high expectations, skip hand-holding, jump straight into rigorous definitions and deep details, throw technical challenge questions or follow-up drills, and prepare the student thoroughly for university-prep tests and deep examinations. Always respond strictly inside this persona.`;
    }

    if (currentModelId) {
      systemInstruction += `\n\n[Model Context] Note: The active visual 1D/3D model on screen is currently: "${currentModelId}".`;
    }

    console.log("[Chat API] Generating conversation with language detection and latest-turn priority...");
    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    res.json({
      text: response.text || "I'm right here! Could you please ask that science query again?"
    });
  } catch (err: any) {
    console.error("Chat API failure:", err);
    res.status(500).json({ error: err.message || "My network link is vibrating. Try asking that concept again!" });
  }
});

// 3.5. Circle-to-Learn Multimodal AI Mode Endpoint
app.post("/api/circle-learn", checkGeminiKey, async (req, res) => {
  try {
    const { croppedImage, fullContext, action, customQuestion, currentModelId } = req.body;

    let systemInstruction = `You are VIDYA, an intelligent, friendly AI teacher designed for students from Classes 6–12, Diploma, Engineering, and competitive exams.
    The student has drawn a freehand circle on a notebook/diagram to select a specific region.
    Analyze the circled region (provided as a cropped image slice) alongside the full textbook context.
    Return a structured JSON report explaining what is inside the circled region (text, formula, diagram, or object).
    
    Strictly map the circled idea to one of these matching 3D visual models if relevant:
    - ["human-heart", "solar-system", "volcano", "cell-structure", "dna", "brain", "electric-circuit"]
    Keep your language incredibly friendly, inspiring, patient, and direct. Keep paragraphs short (1–3 sentences).`;

    let contents: any[] = [];

    // Add cropped base64 image slice if provided
    if (croppedImage && croppedImage.includes("base64,")) {
      const parts = croppedImage.split("base64,");
      const mimeType = parts[0].split(":")[1].split(";")[0] || "image/png";
      const base64Data = parts[1];
      
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    // Add prompt content
    let textPrompt = `The student has circled a region on their page.
    Full Page Textbook Context: """${fullContext || "A STEM textbook page or science notes."}"""
    
    Current selected Action request: "${action || "explain"}"
    ${customQuestion ? `The student typed a custom question: "${customQuestion}"` : ""}
    ${currentModelId ? `Close reference active 3D model: "${currentModelId}"` : ""}

    Your high-resolution task:
    1. Identify what is inside the circled image/selection (formula, symbol, organelle, diagram element, planet, circuit component, or term).
    2. Provide a simple, clear student explanation.
    3. Generate a labelled breakdown list (subsections, parts, or points) that can be individually inspected.
    4. Link it to the most relevant 3D model ID from our list if applicable (return null if unrelated).
    5. Draft summary takeaways for offline review.
    6. Generate 3 custom fun multiple-choice questions (MCQs) reflecting this specified circled topic.`;

    contents.push({ text: textPrompt });

    console.log("[Multimodal API] Processing Circle-to-Learn with model gemini-3.5-flash...");

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Compact title of what was circled (e.g., 'The Right Ventricle' or 'Mercury')" },
            explanation: { type: Type.STRING, description: "A high-quality, friendly, metaphor-rich explanation in markdown formatting." },
            labeledBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Name of part, step, chemical node or attribute" },
                  detail: { type: Type.STRING, description: "Explanation of its function or relevance in simple terms." }
                },
                required: ["label", "detail"]
              }
            },
            relatedModelId: { 
              type: Type.STRING, 
              description: "Select most relevant string from: ['human-heart', 'solar-system', 'volcano', 'cell-structure', 'dna', 'brain', 'electric-circuit'] or null if unrelated."
            },
            offlineTakeaway: { type: Type.STRING, description: "Short bullet items summarizing coordinates or formula laws." },
            suggestedQuizzes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"]
              }
            }
          },
          required: ["title", "explanation", "labeledBreakdown", "relatedModelId", "offlineTakeaway", "suggestedQuizzes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Circle-Learn multimodal failure:", err);
    res.status(500).json({ error: err.message || "Unable to parse circled region. Try circling a clearer zone." });
  }
});

// 4. Transcription - processing spoken audio via Gemini's multimodal capabilities
app.post("/api/transcribe", checkGeminiKey, async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Missing recording data block." });
    }

    const base64Data = audioData.split(",")[1] || audioData;
    console.log("Transcribing audio content with Gemini...");

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: base64Data
          }
        },
        {
          text: "Transcribe the spoken words in this audio block precisely to text. Return ONLY the final transcribed text."
        }
      ]
    });

    res.json({ text: response.text?.trim() || "" });
  } catch (err: any) {
    console.error("Transcription processing failure:", err);
    res.status(500).json({ error: err.message || "Auditory channel failed to parse input." });
  }
});

// 5. Teach-Back Mode evaluation
app.post("/api/teach-back/evaluate", checkGeminiKey, async (req, res) => {
  try {
    const { conceptTitle, originalExplanation, studentExplanation } = req.body;
    if (!originalExplanation || !studentExplanation) {
      return res.status(400).json({ error: "Original explanation and student explanation are required." });
    }

    const systemInstruction = `You are VIDYA, an intelligent, friendly AI teacher designed for students from Classes 6–12, Diploma, Engineering, and competitive exams.
The student has read an explanation about the concept "${conceptTitle || "Science Concept"}" and is explaining it back to you in their own words.
Analyze the original explanation and the student's transcript/explanation.
Evaluate their level of understanding, find correct points, missing details, misconceptions, and draft clean, simple feedback.

CRITICAL REQUIREMENT:
- Identify mistakes, correct misunderstandings politely, and give hints instead of immediately revealing answers.
- Use simple, student-friendly, warm, patient language. Speak directly to the student in second person ("You explained...", "You missed...").
- Do NOT refer to yourself as "AI", "Gemini", "Large Language Model", "assistant role", "API response" or mention any backend boundaries.
- Return a valid JSON object matching the requested schema.`;

    const contents = `Concept Title: "${conceptTitle || "Science Concept"}"
Original Teacher Explanation: """${originalExplanation}"""
Student Teach-Back Explanation/Transcript: """${studentExplanation}"""

Evaluate the student's explanation against the original master explanation and return the JSON evaluation report structure.`;

    console.log("Evaluating student Teach-Back explanation with Gemini...");

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "An understanding score out of 100 (integer)." 
            },
            correctPoints: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Bullet items of what the student got absolutely right, accompanied by warm, friendly praise." 
            },
            missingPoints: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Key concepts or details the student left out. Keep them friendly and educational." 
            },
            misconceptions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Any scientific errors or misconceptions the student showed in their text. If none, keep this list empty." 
            },
            correctedExplanation: { 
              type: Type.STRING, 
              description: "A super clear, simple, 2-to-3 sentence summary of the concept that corrects any errors they made." 
            },
            whatToRevise: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Clear recommendations of what scientific topics, details, or textbook subsections to revise next." 
            },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "An interactive, fun checklist question to solidify the corrected knowledge." },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Exactly 3 or 4 choices for the question."
                  },
                  correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of the correct answer." },
                  explanation: { type: Type.STRING, description: "A simple, encouraging explanation of why that option is correct." }
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"]
              },
              description: "Exactly 3 fun interactive check multiple-choice questions."
            }
          },
          required: [
            "score",
            "correctPoints",
            "missingPoints",
            "misconceptions",
            "correctedExplanation",
            "whatToRevise",
            "practiceQuestions"
          ]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Teach-Back evaluation failure:", err);
    res.status(500).json({ error: err.message || "Failed to finalize Teach-Back report. Try explaining once again!" });
  }
});

// Server client application static files / Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Dev Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving Production Static Assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VIDYA Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
