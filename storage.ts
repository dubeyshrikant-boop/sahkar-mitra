
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  Firestore
} from "firebase/firestore";
import { Document, Message, UserAccount } from "./types";

// Setup Firebase Configuration
let firebaseConfig: any = null;
const configEnv = process.env.FIREBASE_CONFIG;

if (configEnv) {
  try {
    // Attempt to parse the environment variable as JSON
    firebaseConfig = typeof configEnv === 'string' ? JSON.parse(configEnv) : configEnv;
  } catch (e) {
    console.error("Critical: FIREBASE_CONFIG is not a valid JSON string. Check your environment variables settings.");
  }
}

let db: Firestore | null = null;

if (firebaseConfig && firebaseConfig.projectId) {
  try {
    // Standard Firebase init pattern
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("✅ Sahkar Mitra Database Connected to Project: " + firebaseConfig.projectId);
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
  }
} else {
  console.warn("⚠️ Firebase configuration missing (FIREBASE_CONFIG). The app will run in temporary local mode and won't save data permanently.");
}

const DOC_COLL = "documents";
const USER_COLL = "users";
const MSG_COLL = "messages";

export const storage = {
  async init() {
    // Ensure we are initialized
    return Promise.resolve();
  },

  async saveDocument(docData: Document): Promise<void> {
    if (!db) return;
    try {
      await setDoc(doc(db, DOC_COLL, docData.id), docData);
    } catch (e) {
      console.error("Error saving document:", e);
    }
  },

  async deleteDocument(id: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, DOC_COLL, id));
    } catch (e) {
      console.error("Error deleting document:", e);
    }
  },

  async getAllDocuments(): Promise<Document[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, DOC_COLL));
      return snapshot.docs.map(d => d.data() as Document);
    } catch (e) {
      console.error("Error fetching documents:", e);
      return [];
    }
  },

  subscribeToDocuments(callback: (docs: Document[]) => void) {
    if (!db) return () => {};
    return onSnapshot(collection(db, DOC_COLL), (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as Document));
    }, (error) => {
      console.error("Firestore Document Subscription Error:", error);
    });
  },

  async addUser(user: UserAccount): Promise<void> {
    if (!db) return;
    try {
      await setDoc(doc(db, USER_COLL, user.username), user);
    } catch (e) {
      console.error("Error adding user:", e);
    }
  },

  async deleteUser(username: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, USER_COLL, username));
    } catch (e) {
      console.error("Error deleting user:", e);
    }
  },

  async getUser(username: string): Promise<UserAccount | null> {
    if (!db) return null;
    try {
      const userDoc = await getDoc(doc(db, USER_COLL, username));
      return userDoc.exists() ? (userDoc.data() as UserAccount) : null;
    } catch (e) {
      console.error("Error getting user:", e);
      return null;
    }
  },

  async getAllUsers(): Promise<UserAccount[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, USER_COLL));
      return snapshot.docs.map(d => d.data() as UserAccount);
    } catch (e) {
      console.error("Error getting all users:", e);
      return [];
    }
  },

  async saveMessages(username: string, messages: Message[]): Promise<void> {
    if (!db) return;
    try {
      // Keep only last 50 messages to optimize Firestore storage
      const historyLimit = messages.slice(-50);
      await setDoc(doc(db, MSG_COLL, username), { history: historyLimit });
    } catch (e) {
      console.error("Error saving chat history:", e);
    }
  },

  async getAllMessages(username: string): Promise<Message[]> {
    if (!db) return [];
    try {
      const msgDoc = await getDoc(doc(db, MSG_COLL, username));
      return msgDoc.exists() ? (msgDoc.data() as any).history || [] : [];
    } catch (e) {
      console.error("Error fetching chat history:", e);
      return [];
    }
  }
};
