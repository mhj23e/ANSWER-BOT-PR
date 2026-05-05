"use client";

import { useState } from "react";
import { Icon } from "./Icons";
import type { UploadedDocument } from "./types";

interface DatabasePanelProps {
  documents: UploadedDocument[];
  onAddFiles: (files: FileList | File[]) => Promise<void>;
  onAddUrl: (url: string) => Promise<void>;
  onRemoveDocument: (id: string) => Promise<void>;
  isSyncing: boolean;
}

export function DatabasePanel({
  documents,
  onAddFiles,
  onAddUrl,
  onRemoveDocument,
  isSyncing
}: DatabasePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);

  const fileCount = documents.filter((document) => !document.url).length;
  const urlCount = documents.filter((document) => document.url).length;
  const totalSize = documents.reduce((sum, document) => sum + document.size, 0);

  const addFiles = async (files: FileList | File[]) => {
    setSyncError(null);
    try {
      await onAddFiles(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add files to knowledge base.";
      setSyncError(message);
    }
  };

  const addUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setUrlError("Please enter a valid URL, for example https://example.com/document.pdf");
      return;
    }

    try {
      setSyncError(null);
      await onAddUrl(trimmed);
      setUrlInput("");
      setUrlError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to index URL source.";
      setSyncError(message);
    }
  };

  return (
    <section className="page" aria-label="Knowledge base">
      <header className="page-header">
        <div>
          <h1 className="rag-h1">Knowledge Base</h1>
          <p className="rag-h5" style={{ color: "rgba(26,58,107,0.5)", marginTop: 1 }}>
            Manage session documents and URL sources
          </p>
        </div>
        <div className="header-stats" aria-label="Knowledge base stats">
          <HeaderStat label="Files" value={fileCount} />
          <HeaderStat label="URLs" value={urlCount} />
          <HeaderStat label="Documents" value={documents.length} />
        </div>
      </header>

      <div className="database-body">
        <aside className="upload-column" aria-label="Upload controls">
          <label className={`drop-zone${isDragging ? " is-dragging" : ""}`}>
            <span
              className="drop-zone-hitbox"
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                void addFiles(event.dataTransfer.files);
              }}
            >
              <span className="drop-icon">
                <Icon name="upload" size={21} />
              </span>
              <span>
                <span className="rag-h3" style={{ display: "block" }}>
                  Drop files here
                </span>
                <span className="rag-meta" style={{ display: "block", marginTop: 3 }}>
                  or click to browse - PDF, DOCX, TXT, CSV
                </span>
              </span>
            </span>
            <input
              className="hidden-input"
              multiple
              onChange={(event) => {
                void addFiles(event.target.files || []);
              }}
              type="file"
            />
          </label>

          <div className="divider-text">or</div>

          <div className={`url-card${urlError ? " has-error" : ""}`}>
            <div className="url-card-header">
              <Icon name="link" size={11} style={{ color: "var(--rag-blue)" }} />
              <p className="rag-h5">Paste a URL</p>
            </div>
            <div className="url-input-row">
              <input
                onChange={(event) => {
                  setUrlInput(event.target.value);
                  if (urlError) setUrlError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addUrl();
                }}
                placeholder="https://example.com/document.pdf"
                value={urlInput}
              />
              <button
                className={`add-url${urlInput.trim() ? " is-ready" : ""}`}
                disabled={!urlInput.trim()}
                onClick={() => {
                  void addUrl();
                }}
                title="Add URL"
                type="button"
              >
                <Icon name="plus" size={15} />
              </button>
            </div>
          </div>

          {isSyncing ? (
            <div className="form-error" style={{ color: "var(--rag-blue)" }}>
              <Icon name="activity" size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Indexing knowledge source...</span>
            </div>
          ) : null}

          {syncError ? (
            <div className="form-error">
              <Icon name="alert" size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{syncError}</span>
            </div>
          ) : null}

          {urlError ? (
            <div className="form-error">
              <Icon name="alert" size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{urlError}</span>
            </div>
          ) : null}

          {documents.length > 0 ? (
            <div className="storage-summary">
              <div style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
                <span className="status-dot ready" />
                <p className="rag-h4" style={{ color: "var(--rag-primary)" }}>
                  {documents.length} document{documents.length === 1 ? "" : "s"} in session
                </p>
              </div>
              <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
                <Icon name="hard-drive" size={11} style={{ color: "rgba(26,58,107,0.45)" }} />
                <p className="rag-meta">
                  {formatFileSize(totalSize)} total - {urlCount} URL{urlCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="document-region">
          {documents.length > 0 ? (
            <div className="document-heading">
              <p className="rag-h4" style={{ color: "var(--rag-primary)" }}>
                Uploaded Documents
              </p>
              <span className="count-badge">{documents.length}</span>
            </div>
          ) : null}

          <div className="scroll-area">
            {documents.length === 0 ? (
              <div className="empty-state" style={{ opacity: 0.62 }}>
                <div className="empty-state-inner">
                  <div className="empty-icon">
                    <Icon name="database" size={32} style={{ color: "#c5cfe0" }} />
                  </div>
                  <p className="rag-h3" style={{ color: "var(--rag-primary)" }}>
                    No documents yet
                  </p>
                  <p className="rag-meta" style={{ marginTop: 4 }}>
                    Drop files or paste a URL to populate the knowledge base.
                  </p>
                </div>
              </div>
            ) : (
              <div className="document-grid">
                {documents.map((document) => (
                  <DocumentCard document={document} key={document.id} onRemove={onRemoveDocument} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeaderStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="header-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DocumentCard({
  document,
  onRemove
}: {
  document: UploadedDocument;
  onRemove: (id: string) => Promise<void>;
}) {
  const isUrl = Boolean(document.url);

  return (
    <article className="document-card">
      <div className={`document-icon${isUrl ? " is-url" : ""}`}>
        <Icon name={isUrl ? "link" : "file"} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="rag-h2 truncate" title={document.name}>
          {document.name}
        </p>
        {isUrl ? (
          <p className="rag-meta truncate" style={{ color: "var(--rag-blue)", marginTop: 2 }} title={document.url}>
            {document.url}
          </p>
        ) : (
          <p className="rag-meta" style={{ marginTop: 2 }}>
            {formatFileSize(document.size)}
          </p>
        )}
        <p className="rag-meta" style={{ marginTop: 2 }}>
          {new Date(document.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <button
        className="remove-button"
        onClick={() => {
          void onRemove(document.id);
        }}
        title="Remove document"
        type="button"
      >
        <Icon name="x" size={13} />
      </button>
    </article>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "URL source";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
