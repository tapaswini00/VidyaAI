# Security Specification & Threat Model

This document outlines the security architecture and invariants for the VidyaAI Firebase platform.

## 1. Data Invariants

1. **Owner-Is-Authenticated-Email**: A document in `/users/{userId}` can only be accessed or modified if the authenticated user's email matches `{userId}` and `email_verified` is true.
2. **Strict Subcollection Ownership**: All child collections under `users/{userId}/*` (i.e., `savedVault`, `history`, `chatSessions`) derive their master access controls from the parent user's authentication and must prevent list queries from leakage.
3. **Immutability of Key Tracking ID**: The `id`, `email`, and path identifiers must match perfectly and remain immutable once initialized.
4. **Strong Schema Verification**: Every document write must be statically validated against our TypeScript/JSON entities schema definitions (types, size limit bounds, and syntax validation helpers on creation and update).

---

## 2. The "Dirty Dozen" Threat Payloads

Here are twelve highly critical JSON payloads designed to bypass or break the rules.

### Payload 1: ID Poisoning (Resource Exhaustion)
*Target:* `/users/victim@vidyaai.edu/savedVault/[1.5_KB_Junk_Id_With_Special_Chars]`
*Threat:* Attempts to register junk characters as a subcollection ID to exhaust memory or trigger DB exploits.
```json
{
  "id": "1.5_KB_JUNK_ID_CONTAINING_EXPLOIT_SYMBOLS_!!!!!!!!",
  "type": "note",
  "topic": "Gravity",
  "timestamp": "2026-06-18T00:00:00.000Z"
}
```

### Payload 2: Identity Spoofing / Account Takeover
*Target:* `/users/victim@vidyaai.edu`
*Threat:* Authenticated attacker (`attacker@vidyaai.edu`) attempting to register/write to a victim's document root.
```json
{
  "name": "Attacker",
  "email": "victim@vidyaai.edu",
  "avatar": "😈",
  "level": 1,
  "exp": 0,
  "streak": 0,
  "lastActive": "2026-06-18T00:00:00.000Z"
}
```

### Payload 3: Privilege Escalation (Shadow Fields / Admin Flag Inject)
*Target:* `/users/attacker@vidyaai.edu`
*Threat:* Attacker attempting to inject an unvalidated `role` or `isAdmin` flag on their profile during creation or update.
```json
{
  "name": "Attacker",
  "email": "attacker@vidyaai.edu",
  "avatar": "🎓",
  "level": 1,
  "exp": 100,
  "streak": 5,
  "lastActive": "2026-06-18T00:00:00.000Z",
  "role": "admin",
  "isAdmin": true
}
```

### Payload 4: Arbitrary Level / EXP Modification
*Target:* `/users/attacker@vidyaai.edu`
*Threat:* Attacker modifying their `level` directly to 9999 or updating without maintaining standard progression.
```json
{
  "name": "Attacker",
  "email": "attacker@vidyaai.edu",
  "avatar": "🎓",
  "level": 9999,
  "exp": 1000000,
  "streak": 5,
  "lastActive": "2026-06-18T00:00:00.000Z"
}
```

### Payload 5: Unauthorized SavedContent Snooping / Read Leak
*Target:* `/users/victim@vidyaai.edu/savedVault/vault-123`
*Threat:* Non-owner user attempting to query or read documents in another user's vault.
```json
{}
```

### Payload 6: Corrupted SavedContent Creation (Type Mismatch)
*Target:* `/users/attacker@vidyaai.edu/savedVault/vault-123`
*Threat:* Attempting to save a note with a `title` list instead of string or missing crucial required parameters like `topic`.
```json
{
  "id": "vault-123",
  "type": 55,
  "topic": ["Not", "A", "String"],
  "timestamp": "2026"
}
```

### Payload 7: Dynamic Value Poisoning (Ghost Field Addition)
*Target:* `/users/attacker@vidyaai.edu/savedVault/vault-123`
*Threat:* Injection of a malicious custom parameter (`customDatabaseQuery`) to test for loose `hasOnly` mapping.
```json
{
  "id": "vault-123",
  "type": "video",
  "topic": "Magnetism",
  "timestamp": "2026-06-18T00:00:00Z",
  "maliciousSecretPayload": "drop_tables"
}
```

### Payload 8: History Logs Scraping (Unbounded List Query)
*Target:* `/users/victim@vidyaai.edu/history`
*Threat:* Querying someone else's activity log to scrape user metadata, study habits, or timestamps.
```json
{}
```

### Payload 9: ProgressHistory Value Injection (Denial of Wallet)
*Target:* `/users/attacker@vidyaai.edu/history/hist-1`
*Threat:* Writing standard large details strings (e.g. 5MB) to trigger Firestore storage overhead charges.
```json
{
  "id": "hist-1",
  "timestamp": "2026-06-18T00:00:00Z",
  "topic": "Math",
  "actionType": "quiz",
  "details": "A".repeat(500000), 
  "expGained": 100000
}
```

### Payload 10: Unauthorized Session Destruction
*Target:* `/users/victim@vidyaai.edu/chatSessions/session-abc`
*Threat:* Attacker trying to delete a tutoring session of another user.
```json
{}
```

### Payload 11: ChatSession Schema Hijacking
*Target:* `/users/attacker@vidyaai.edu/chatSessions/session-abc`
*Threat:* Writing to chat session with invalid messages schema structure or incomplete required parameters.
```json
{
  "id": "session-abc",
  "title": "Mitosis",
  "timestamp": "2026-06-18T00:00:00Z",
  "lastMessagePreview": "What is mitosis?"
}
```

### Payload 12: Email Spoofing (Unverified Token)
*Target:* `/users/victim@vidyaai.edu`
*Threat:* An attacker with `email: victim@vidyaai.edu` in their auth token, but where `email_verified` is `false`.
```json
{
  "name": "Spoofer",
  "email": "victim@vidyaai.edu",
  "avatar": "🎓",
  "level": 1,
  "exp": 10,
  "streak": 1,
  "lastActive": "2026-06-18T00:00:00.000Z"
}
```

---

## 3. The Test Runner Specification (`firestore.rules.test.ts`)

```typescript
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment 
} from "@firebase/rules-unit-testing";
import { 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "eternal-bindery-dxqhd",
    firestore: {
      host: "localhost",
      port: 8080,
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("VidyaAI Firestore Defense-in-Depth TDD Tests", () => {
  test("Payload 2: Identity Spoofing fails for mismatched auth email", async () => {
    const context = testEnv.authenticatedContext("attacker_id", {
      email: "attacker@vidyaai.edu",
      email_verified: true,
    });
    const db = context.firestore();
    
    await expect(
      setDoc(doc(db, "users", "victim@vidyaai.edu"), {
        name: "Attacker",
        email: "victim@vidyaai.edu",
        avatar: "🎓",
        level: 1,
        exp: 0,
        streak: 0,
        lastActive: "2026-06-18"
      })
    ).rejects.toThrow();
  });

  test("Payload 12: Email Spoofing rejects when email_verified is false", async () => {
    const context = testEnv.authenticatedContext("unverified_user_id", {
      email: "victim@vidyaai.edu",
      email_verified: false,
    });
    const db = context.firestore();

    await expect(
      getDoc(doc(db, "users", "victim@vidyaai.edu"))
    ).rejects.toThrow();
  });
});
```
