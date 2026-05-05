"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import type { ChatMessage } from "./types";

interface ChatPanelProps {
  hasDocuments: boolean;
  onQuery: (query: string) => void;
  onSatisfactionChange: (up: number, down: number) => void;
}

export function ChatPanel({ hasDocuments, onQuery, onSatisfactionChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const up = messages.filter((message) => message.role === "assistant" && message.rating === "up").length;
    const down = messages.filter((message) => message.role === "assistant" && message.rating === "down").length;
    onSatisfactionChange(up, down);
  }, [messages, onSatisfactionChange]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, [input]);

  const canSend = input.trim().length > 0 && hasDocuments && !isTyping;

  const sendMessage = () => {
    const query = input.trim();
    if (!query || !canSend) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date()
    };

    setMessages((previous) => [...previous, userMessage]);
    onQuery(query);
    setInput("");
    setIsTyping(true);
    setRequestError(null);

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content
    }));

    void (async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            history
          })
        });

        const payload = (await response.json()) as {
          answer?: string;
          model?: string;
          references?: Array<{ source: string; section: string }>;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Chat request failed.");
        }

        const sourceLabels =
          payload.references?.map((ref) => `${ref.source} - ${ref.section}`) || [];
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.answer || "No answer returned.",
          timestamp: new Date(),
          sources: sourceLabels
        };
        setMessages((previous) => [...previous, assistantMessage]);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while requesting an answer.";
        setRequestError(message);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const rateMessage = (messageId: string, rating: "up" | "down") => {
    setMessages((previous) => {
      return previous.map((message) =>
        message.id === messageId
          ? { ...message, rating: message.rating === rating ? null : rating }
          : message
      );
    });
  };

  return (
    <section className="page" aria-label="Chat">
      <header className="page-header">
        <div>
          <h1 className="rag-h1">Enterprise RAG Assistant</h1>
          <p className="rag-h5" style={{ color: "rgba(26,58,107,0.5)", marginTop: 1 }}>
            Ephemeral session - data is not persisted after closing
          </p>
        </div>
        <div className="status-pill">
          <span className={`status-dot${hasDocuments ? " ready" : ""}`} />
          <span>{hasDocuments ? "Ready" : "Awaiting documents"}</span>
        </div>
      </header>

      {!hasDocuments ? (
        <div className="callout">
          <Icon name="alert" size={15} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="rag-h3" style={{ color: "#92400e" }}>
              No documents uploaded
            </p>
            <p className="rag-text" style={{ color: "#b45309", marginTop: 2 }}>
              Open the Database tab to add files or URL sources before asking questions.
            </p>
          </div>
        </div>
      ) : null}
      {requestError ? (
        <div className="callout" style={{ borderColor: "rgba(220,38,38,0.35)", marginTop: 12 }}>
          <Icon name="alert" size={15} style={{ color: "var(--rag-danger)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="rag-h3" style={{ color: "var(--rag-danger)" }}>
              Chat request failed
            </p>
            <p className="rag-text" style={{ marginTop: 2 }}>
              {requestError}
            </p>
          </div>
        </div>
      ) : null}

      <div className="scroll-area">
        {messages.length === 0 && hasDocuments ? (
          <div className="empty-state">
            <div className="empty-state-inner">
              <div className="empty-icon">
                <Icon name="message" size={23} />
              </div>
              <h2 className="rag-h2" style={{ color: "var(--rag-primary)", marginBottom: 6 }}>
                Ready to assist
              </h2>
              <p className="rag-text">
                Ask questions about your uploaded documents. The RAG system will retrieve relevant information and cite its sources.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageRow key={message.id} message={message} onRate={rateMessage} />
            ))}
            {isTyping ? (
              <div className="message-row">
                <div className="avatar">
                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="message-content">
                  <p className="rag-h5">Retrieving and synthesizing...</p>
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <footer className="composer">
        <div className={`composer-box${canSend ? " is-ready" : ""}`}>
          <textarea
            disabled={!hasDocuments}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={hasDocuments ? "Ask a question about your documents..." : "Upload documents first..."}
            ref={textareaRef}
            rows={1}
            value={input}
          />
          <button
            className={`send-button${canSend ? " is-ready" : ""}`}
            disabled={!canSend}
            onClick={sendMessage}
            title="Send"
            type="button"
          >
            <Icon name="send" size={14} />
          </button>
        </div>
        <p className="rag-meta" style={{ marginTop: 4, paddingLeft: 2 }}>
          Press Enter to send - Shift+Enter for new line
        </p>
      </footer>
    </section>
  );
}

function MessageRow({
  message,
  onRate
}: {
  message: ChatMessage;
  onRate: (messageId: string, rating: "up" | "down") => void;
}) {
  const isUser = message.role === "user";

  return (
    <article className={`message-row${isUser ? " is-user" : ""}`}>
      <div className="avatar">
        <Icon name={isUser ? "user" : "bot"} size={14} />
      </div>
      <div className="message-content">
        <div className="message-meta">
          <span className="role-name">{isUser ? "You" : "RAG Assistant"}</span>
          <span className="rag-meta">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {!isUser && message.rating ? (
            <span className={`rating-badge ${message.rating}`}>
              <Icon name={message.rating === "up" ? "thumbs-up" : "thumbs-down"} size={10} />
              {message.rating === "up" ? "Helpful" : "Not helpful"}
            </span>
          ) : null}
        </div>
        <p className="rag-text">{message.content}</p>

        {message.sources?.length ? (
          <div className="sources">
            <p className="rag-h5">Sources referenced:</p>
            <div className="source-list">
              {message.sources.map((source, index) => (
                <span className="source-chip" key={`${source}-${index}`}>
                  <Icon name="file-text" size={10} />
                  <span className="truncate">{source}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!isUser ? (
          <div className="rate-actions">
            <span className="rag-meta" style={{ marginRight: 2 }}>
              Was this helpful?
            </span>
            <button
              className={`rate-button${message.rating === "up" ? " is-up" : ""}`}
              onClick={() => onRate(message.id, "up")}
              title="Helpful"
              type="button"
            >
              <Icon name="thumbs-up" size={13} />
            </button>
            <button
              className={`rate-button${message.rating === "down" ? " is-down" : ""}`}
              onClick={() => onRate(message.id, "down")}
              title="Not helpful"
              type="button"
            >
              <Icon name="thumbs-down" size={13} />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
