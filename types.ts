
export type UserRole = 'admin' | 'user' | 'unauthorized';

export interface UserAccount {
  username: string;
  accessKey: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'file' | 'url';
  content: string;
  status: 'processing' | 'ready' | 'error';
  size?: number;
  userId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  sources?: string[];
}

export interface ChatState {
  messages: Message[];
  documents: Document[];
  isLoading: boolean;
  auth: {
    role: UserRole;
    username?: string;
  };
}
