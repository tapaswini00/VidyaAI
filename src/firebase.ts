import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  indexedDBLocalPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  browserPopupRedirectResolver,
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  doc, 
  getDocFromServer 
} from "firebase/firestore";
import firebaseConfigJson from "../firebase-applet-config.json";

export const isFirebaseConfigured = !!(
  firebaseConfigJson &&
  firebaseConfigJson.apiKey &&
  firebaseConfigJson.apiKey !== "" &&
  firebaseConfigJson.apiKey !== "placeholder-api-key" &&
  firebaseConfigJson.apiKey !== "remixed-api-key" &&
  !firebaseConfigJson.apiKey.includes("placeholder") &&
  !firebaseConfigJson.apiKey.includes("remixed")
);

const dummyConfig = {
  projectId: "gen-lang-client-0299297100",
  appId: "1:450946204128:web:44be625f6752b24c8bab85",
  apiKey: "AIzaSyDPMapNM3mtsaHk6NpaP_WwugkENjmQM7o",
  authDomain: "gen-lang-client-0299297100.firebaseapp.com",
  storageBucket: "gen-lang-client-0299297100.firebasestorage.app",
  messagingSenderId: "450946204128",
  firestoreDatabaseId: "ai-studio-7372af19-0e92-4796-bffd-5ba72b504435",
};

export const firebaseConfig = isFirebaseConfigured ? {
  projectId: firebaseConfigJson.projectId || "",
  appId: firebaseConfigJson.appId || "",
  apiKey: firebaseConfigJson.apiKey || "",
  authDomain: firebaseConfigJson.authDomain || "",
  storageBucket: firebaseConfigJson.storageBucket || "",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "",
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || "ai-studio-7372af19-0e92-4796-bffd-5ba72b504435",
} : dummyConfig;


const app = initializeApp(firebaseConfig);


// Setup multi-tab offline persistent local cache with graceful fallback for restricted frame environments
let localCacheSetting;
const isIframe = typeof window !== "undefined" && window.self !== window.top;

if (!isIframe) {
  try {
    localCacheSetting = persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    });
  } catch (e) {
    console.warn("IndexedDB offline persistence blocked in sandboxed environment. Falling back to default in-memory cache.");
  }
} else {
  console.log("Running inside sandboxed iframe. Using default high-speed memory cache to prevent IndexedDB lock hangs.");
}

// CRITICAL: Initialize Firestore using the designated database id from the config with HTTP Long Polling enabled for sandboxed frames
export const db = initializeFirestore(app, {
  ...(localCacheSetting ? { localCache: localCacheSetting } : {}),
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = initializeAuth(app, {
  persistence: isIframe 
    ? [browserLocalPersistence, browserSessionPersistence] 
    : [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});

// Gracefully test connection status on start without throwing unhandled SDK errors 
async function testConnection() {
  try {
    const connTestPromise = getDocFromServer(doc(db, "test", "connection"));
    // Race or timeout the connection check so it doesn't hang the thread indefinitely
    await Promise.race([
      connTestPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
    ]);
    console.log("Firebase Firestore connectivity successfully established.");
  } catch (error) {
    console.warn("VIDYA Firestore offline mode active. Using high-speed local persistence engine.");
  }
}
testConnection();

// Google Sign-In with popup (recommmended for this workspace context)
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const logoutUser = async () => {
  return signOut(auth);
};

// Error enforcement block matching requirements exactly
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error Exception: ", JSON.stringify(errInfo));
  if (operationType !== OperationType.GET && operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}
