import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "./firebase";
import { UserProfile, SavedContent, ProgressHistory, ChatSession } from "./types";

function isFirebaseReadyForUser(userId: string): boolean {
  if (!auth.currentUser) {
    return false;
  }
  const firebaseEmail = auth.currentUser.email;
  const firebaseUid = auth.currentUser.uid;
  return firebaseUid === userId || (!!firebaseEmail && firebaseEmail.toLowerCase() === userId.toLowerCase());
}

function sanitizeForFirestore<T>(val: T): T {
  if (val === null || val === undefined) {
    return val;
  }
  if (typeof val === "string") {
    const MAX_FIRESTORE_STRING_LEN = 30000;
    if (val.length > MAX_FIRESTORE_STRING_LEN) {
      if (val.startsWith("data:image/") || val.startsWith("data:application/pdf") || val.startsWith("data:")) {
        const semiIdx = val.indexOf(";");
        const mimeType = semiIdx !== -1 ? val.substring(0, semiIdx) : "data:image/png";
        return `${mimeType};base64,...[Truncated to fit Firestore 1MB limit. Full content preserved in LocalStorage]...` as unknown as T;
      } else {
        return `${val.substring(0, MAX_FIRESTORE_STRING_LEN)}... [Truncated due to size limits. Full text is preserved locally.]` as unknown as T;
      }
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof val === "object") {
    if (Object.prototype.toString.call(val) !== "[object Object]") {
      return val;
    }
    const copy: any = {};
    for (const key of Object.keys(val)) {
      copy[key] = sanitizeForFirestore((val as any)[key]);
    }
    return copy as T;
  }
  return val;
}

// LocalStorage helpers to support offline sandboxed environment
const USER_PROFILE_KEY_PREFIX = "vidya_user_profile_";
const VAULT_ITEMS_KEY_PREFIX = "vidya_vault_items_";
const HISTORY_ITEMS_KEY_PREFIX = "vidya_history_items_";
const CHAT_SESSIONS_KEY_PREFIX = "vidya_chat_sessions_";

function getLocalUserProfile(userId: string): UserProfile | null {
  try {
    const data = localStorage.getItem(USER_PROFILE_KEY_PREFIX + userId);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function setLocalUserProfile(userId: string, profile: UserProfile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY_PREFIX + userId, JSON.stringify(profile));
  } catch (e) {
    console.error("LocalStorage save profile failed:", e);
  }
}

function getLocalVaultItems(userId: string): SavedContent[] {
  try {
    const data = localStorage.getItem(VAULT_ITEMS_KEY_PREFIX + userId);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalVaultItems(userId: string, items: SavedContent[]) {
  try {
    localStorage.setItem(VAULT_ITEMS_KEY_PREFIX + userId, JSON.stringify(items));
  } catch (e) {
    console.error("LocalStorage save vault items failed:", e);
  }
}

function getLocalHistoryItems(userId: string): ProgressHistory[] {
  try {
    const data = localStorage.getItem(HISTORY_ITEMS_KEY_PREFIX + userId);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalHistoryItems(userId: string, items: ProgressHistory[]) {
  try {
    localStorage.setItem(HISTORY_ITEMS_KEY_PREFIX + userId, JSON.stringify(items));
  } catch (e) {
    console.error("LocalStorage save history items failed:", e);
  }
}

function getLocalChatSessions(userId: string): ChatSession[] {
  try {
    const data = localStorage.getItem(CHAT_SESSIONS_KEY_PREFIX + userId);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalChatSessions(userId: string, items: ChatSession[]) {
  try {
    localStorage.setItem(CHAT_SESSIONS_KEY_PREFIX + userId, JSON.stringify(items));
  } catch (e) {
    console.error("LocalStorage save chat sessions failed:", e);
  }
}

// User Profile Operations
export async function saveUserProfile(userId: string, profile: UserProfile) {
  const docPath = `users/${userId}`;
  setLocalUserProfile(userId, profile);
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    await setDoc(doc(db, "users", userId), sanitizeForFirestore(profile));
  } catch (err) {
    console.warn("Firestore saveUserProfile deferred or written locally. System continues using local storage.", err);
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return getLocalUserProfile(userId);
  }
  const docPath = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      const profile = snap.data() as UserProfile;
      setLocalUserProfile(userId, profile);
      return profile;
    }
    return getLocalUserProfile(userId);
  } catch (err) {
    console.warn("Firestore fetchUserProfile failed. Operating from local cache.", err);
    handleFirestoreError(err, OperationType.GET, docPath);
    return getLocalUserProfile(userId);
  }
}

// Saved Content Operations
export async function saveVaultItem(userId: string, item: SavedContent) {
  const docPath = `users/${userId}/savedVault/${item.id}`;
  const localItems = getLocalVaultItems(userId);
  const updated = [item, ...localItems.filter((i) => i.id !== item.id)];
  setLocalVaultItems(userId, updated);
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    await setDoc(doc(db, "users", userId, "savedVault", item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn("Firestore saveVaultItem deferred or saved locally.", err);
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function fetchVaultItems(userId: string): Promise<SavedContent[]> {
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return getLocalVaultItems(userId);
  }
  const colPath = `users/${userId}/savedVault`;
  try {
    const qSnap = await getDocs(collection(db, "users", userId, "savedVault"));
    const list: SavedContent[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data() as SavedContent);
    });
    const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLocalVaultItems(userId, sorted);
    return sorted;
  } catch (err) {
    console.warn("Firestore fetchVaultItems failed. Using local storage vault cache.", err);
    handleFirestoreError(err, OperationType.LIST, colPath);
    return getLocalVaultItems(userId);
  }
}

export async function deleteVaultItem(userId: string, itemId: string) {
  const docPath = `users/${userId}/savedVault/${itemId}`;
  const localItems = getLocalVaultItems(userId);
  const updated = localItems.filter((i) => i.id !== itemId);
  setLocalVaultItems(userId, updated);
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    await deleteDoc(doc(db, "users", userId, "savedVault", itemId));
  } catch (err) {
    console.warn("Firestore deleteVaultItem deferred or executed locally.", err);
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// Progress History Operations
export async function saveHistoryItem(userId: string, item: ProgressHistory) {
  const docPath = `users/${userId}/history/${item.id}`;
  const localItems = getLocalHistoryItems(userId);
  const updated = [item, ...localItems.filter((i) => i.id !== item.id)];
  setLocalHistoryItems(userId, updated);
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    await setDoc(doc(db, "users", userId, "history", item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn("Firestore saveHistoryItem deferred or written locally.", err);
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function fetchHistoryItems(userId: string): Promise<ProgressHistory[]> {
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return getLocalHistoryItems(userId);
  }
  const colPath = `users/${userId}/history`;
  try {
    const qSnap = await getDocs(collection(db, "users", userId, "history"));
    const list: ProgressHistory[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data() as ProgressHistory);
    });
    const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLocalHistoryItems(userId, sorted);
    return sorted;
  } catch (err) {
    console.warn("Firestore fetchHistoryItems failed. Operating from local cache.", err);
    handleFirestoreError(err, OperationType.LIST, colPath);
    return getLocalHistoryItems(userId);
  }
}

// Chat Sessions Operations
export async function saveChatSession(userId: string, item: ChatSession) {
  const docPath = `users/${userId}/chatSessions/${item.id}`;
  const localItems = getLocalChatSessions(userId);
  const updated = [item, ...localItems.filter((i) => i.id !== item.id)];
  setLocalChatSessions(userId, updated);
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    await setDoc(doc(db, "users", userId, "chatSessions", item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn("Firestore saveChatSession deferred or saved locally.", err);
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function fetchChatSessions(userId: string): Promise<ChatSession[]> {
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return getLocalChatSessions(userId);
  }
  const colPath = `users/${userId}/chatSessions`;
  try {
    const qSnap = await getDocs(collection(db, "users", userId, "chatSessions"));
    const list: ChatSession[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data() as ChatSession);
    });
    const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLocalChatSessions(userId, sorted);
    return sorted;
  } catch (err) {
    console.warn("Firestore fetchChatSessions failed. Using local storage cache.", err);
    handleFirestoreError(err, OperationType.LIST, colPath);
    return getLocalChatSessions(userId);
  }
}

export async function deleteChatSession(userId: string, sessionId: string) {
  const docPath = `users/${userId}/chatSessions/${sessionId}`;
  const localItems = getLocalChatSessions(userId);
  const updated = localItems.filter((i) => i.id !== sessionId);
  setLocalChatSessions(userId, updated);
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    await deleteDoc(doc(db, "users", userId, "chatSessions", sessionId));
  } catch (err) {
    console.warn("Firestore deleteChatSession deferred or executed locally.", err);
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// Clear all subcollections on database reset
export async function clearUserLearningData(userId: string) {
  try {
    localStorage.removeItem(USER_PROFILE_KEY_PREFIX + userId);
    localStorage.removeItem(VAULT_ITEMS_KEY_PREFIX + userId);
    localStorage.removeItem(HISTORY_ITEMS_KEY_PREFIX + userId);
    localStorage.removeItem(CHAT_SESSIONS_KEY_PREFIX + userId);
  } catch (e) {
    console.error("Local clean error", e);
  }
  if (userId === "guest-student@vidyaai.local" || userId.endsWith("@vidyaai.local") || !isFirebaseReadyForUser(userId)) {
    return;
  }
  try {
    const histSnap = await getDocs(collection(db, "users", userId, "history"));
    const histDeletes = histSnap.docs.map((d) => deleteDoc(doc(db, "users", userId, "history", d.id)));
    await Promise.all(histDeletes);

    const vaultSnap = await getDocs(collection(db, "users", userId, "savedVault"));
    const vaultDeletes = vaultSnap.docs.map((d) => deleteDoc(doc(db, "users", userId, "savedVault", d.id)));
    await Promise.all(vaultDeletes);

    const chatSnap = await getDocs(collection(db, "users", userId, "chatSessions"));
    const chatDeletes = chatSnap.docs.map((d) => deleteDoc(doc(db, "users", userId, "chatSessions", d.id)));
    await Promise.all(chatDeletes);
  } catch (err) {
    console.warn("Failed to clear nested records in subcollections on distant server:", err);
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

