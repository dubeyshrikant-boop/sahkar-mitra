
import { initializeApp, FirebaseApp } from "firebase/app";
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

let firebaseConfig: any = null;
try {
  const configEnv = process.env.FIREBASE_CONFIG;
  if (configEnv) {
    firebaseConfig = JSON.parse(configEnv);
  }
} catch (e) {
  console.error("Firebase config error.");
}

let db: Firestore | null = null;
if (firebaseConfig && firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

const DOC_COLL = "documents";
const USER_COLL = "users";
const MSG_COLL = "messages";

export const storage = {
  async init() {
    console.log(db ? "Connected to Firebase" : "Local mode");
  },
  async saveDocument(docData: Document) {
    if (!db) return;
    await setDoc(doc(db, DOC_COLL, docData.id), docData);
  },
  async deleteDocument(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, DOC_COLL, id));
  },
  async getAllDocuments(): Promise<Document[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, DOC_COLL));
    return snapshot.docs.map(d => d.data() as Document);
  },
  subscribeToDocuments(callback: (docs: Document[]) => void) {
    if (!db) return () => {};
    return onSnapshot(collection(db, DOC_COLL), (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as Document));
    });
  },
  async addUser(user: UserAccount) {
    if (!db) return;
    await setDoc(doc(db, USER_COLL, user.username), user);
  },
  async deleteUser(username: string) {
    if (!db) return;
    await deleteDoc(doc(db, USER_COLL, username));
  },
  async getUser(username: string): Promise<UserAccount | null> {
    if (!db) return null;
    const userDoc = await getDoc(doc(db, USER_COLL, username));
    return userDoc.exists() ? (userDoc.data() as UserAccount) : null;
  },
  async getAllUsers(): Promise<UserAccount[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, USER_COLL));
    return snapshot.docs.map(d => d.data() as UserAccount);
  },
  async saveMessages(username: string, messages: Message[]) {
    if (!db) return;
    await setDoc(doc(db, MSG_COLL, username), { history: messages });
  },
  async getAllMessages(username: string): Promise<Message[]> {
    if (!db) return [];
    const msgDoc = await getDoc(doc(db, MSG_COLL, username));
    return msgDoc.exists() ? (msgDoc.data() as any).history || [] : [];
  }
};
