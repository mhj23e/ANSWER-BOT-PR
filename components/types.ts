export type ActiveTab = "chat" | "database" | "analytics";

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url?: string;
  sourceType: "file" | "url";
  textPreview?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
  rating?: "up" | "down" | null;
}

export interface SessionUser {
  name: string;
  email: string;
  role: string;
}
