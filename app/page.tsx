"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { DatabasePanel } from "@/components/DatabasePanel";
import { Icon, type IconName } from "@/components/Icons";
import { UserMenu } from "@/components/UserMenu";
import type { ActiveTab, SessionUser, UploadedDocument } from "@/components/types";

const tabs: { id: ActiveTab; label: string; icon: IconName }[] = [
  { id: "chat", label: "Chat", icon: "message" },
  { id: "database", label: "Database", icon: "database" },
  { id: "analytics", label: "Analytics", icon: "bar-chart" }
];

const mockUser: SessionUser = {
  name: "Alex Johnson",
  email: "alex.johnson@enterprise.com",
  role: "Enterprise Admin"
};

const AUTH_SESSION_STORAGE_KEY = "rag-bot-auth-session";
const CHAT_SESSION_STORAGE_PREFIX = "rag-bot-chat-session";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [satisfaction, setSatisfaction] = useState({ up: 0, down: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isKnowledgeSyncing, setIsKnowledgeSyncing] = useState(false);

  useEffect(() => {
    const storedSession = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!storedSession) return;

    try {
      const parsedSession = JSON.parse(storedSession) as { user?: SessionUser | null };
      if (!parsedSession.user) return;
      setIsLoggedIn(true);
      setUser(parsedSession.user);
    } catch {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        user
      })
    );
  }, [isLoggedIn, user]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/knowledge-base", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { documents?: UploadedDocument[] };
      setDocuments(payload.documents || []);
    })();
  }, []);

  const handleSatisfactionChange = useCallback((up: number, down: number) => {
    setSatisfaction((previous) => {
      if (previous.up === up && previous.down === down) return previous;
      return { up, down };
    });
  }, []);

  const syncKnowledgeBase = useCallback(async () => {
    const response = await fetch("/api/knowledge-base", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load knowledge base state.");
    }
    const payload = (await response.json()) as { documents?: UploadedDocument[] };
    setDocuments(payload.documents || []);
  }, []);

  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsKnowledgeSyncing(true);
      try {
        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/knowledge-base", {
            method: "POST",
            body: formData
          });
          if (!response.ok) {
            const payload = (await response.json()) as { error?: string };
            throw new Error(payload.error || `Failed to ingest file: ${file.name}`);
          }
        }
        await syncKnowledgeBase();
      } finally {
        setIsKnowledgeSyncing(false);
      }
    },
    [syncKnowledgeBase]
  );

  const handleAddUrl = useCallback(
    async (url: string) => {
      setIsKnowledgeSyncing(true);
      try {
        const response = await fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Failed to ingest URL.");
        }
        await syncKnowledgeBase();
      } finally {
        setIsKnowledgeSyncing(false);
      }
    },
    [syncKnowledgeBase]
  );

  const handleRemoveDocument = useCallback(
    async (id: string) => {
      setIsKnowledgeSyncing(true);
      try {
        const response = await fetch(`/api/knowledge-base/${id}`, {
          method: "DELETE"
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Failed to remove document.");
        }
        await syncKnowledgeBase();
      } finally {
        setIsKnowledgeSyncing(false);
      }
    },
    [syncKnowledgeBase]
  );

  return (
    <main className="app-shell">
      <aside className={`sidebar${sidebarOpen ? "" : " is-collapsed"}`} aria-label="Primary navigation">
        <UserMenu
          isLoggedIn={isLoggedIn}
          onLogin={() => {
            setIsLoggedIn(true);
            setUser(mockUser);
          }}
          onLogout={() => {
            if (user?.email) {
              window.sessionStorage.removeItem(`${CHAT_SESSION_STORAGE_PREFIX}:${user.email}`);
            }
            window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
            setIsLoggedIn(false);
            setUser(null);
          }}
          user={user}
        />

        <div className="sidebar-divider" />

        {tabs.map((tab) => (
          <button
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`nav-button${activeTab === tab.id ? " is-active" : ""}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            type="button"
          >
            <Icon name={tab.icon} size={18} />
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
        <div className="sidebar-spacer" />
      </aside>

      {sidebarOpen ? (
        <button className="collapse-tab" onClick={() => setSidebarOpen(false)} title="Collapse sidebar" type="button">
          <Icon name="panel-close" size={12} />
        </button>
      ) : null}

      {!sidebarOpen ? (
        <button className="reopen-tab" onClick={() => setSidebarOpen(true)} title="Open sidebar" type="button">
          <Icon name="chevron-right" size={12} />
        </button>
      ) : null}

      <div className="main-panel">
        {activeTab === "chat" ? (
          <ChatPanel
            hasDocuments={documents.length > 0}
            isLoggedIn={isLoggedIn}
            sessionUser={user}
            onQuery={(query) => setQueries((previous) => [...previous, query])}
            onSatisfactionChange={handleSatisfactionChange}
          />
        ) : null}
        {activeTab === "database" ? (
          <DatabasePanel
            documents={documents}
            isSyncing={isKnowledgeSyncing}
            onAddFiles={handleAddFiles}
            onAddUrl={handleAddUrl}
            onRemoveDocument={handleRemoveDocument}
          />
        ) : null}
        {activeTab === "analytics" ? (
          <AnalyticsPanel documents={documents} queries={queries} satisfaction={satisfaction} />
        ) : null}
      </div>
    </main>
  );
}
