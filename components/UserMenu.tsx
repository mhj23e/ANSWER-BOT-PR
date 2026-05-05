"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import type { SessionUser } from "./types";

interface UserMenuProps {
  isLoggedIn: boolean;
  user: SessionUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function UserMenu({ isLoggedIn, user, onLogin, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={`logo-button${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        title={isLoggedIn ? "Account" : "Sign in"}
        type="button"
      >
        <Icon name="database" size={16} />
        {isLoggedIn ? <span className="online-dot" /> : null}
      </button>

      {open ? (
        <div className="account-popover" role="menu">
          {isLoggedIn && user ? (
            <>
              <div className="account-header">
                <div className="account-avatar">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <p className="rag-h2" style={{ color: "var(--rag-primary)" }}>
                    {user.name}
                  </p>
                  <p className="rag-meta truncate">{user.email}</p>
                </div>
              </div>
              <div className="account-role">
                <Icon name="shield" size={12} style={{ color: "var(--rag-blue)" }} />
                <span className="rag-h3">{user.role}</span>
                <span className="rating-badge up" style={{ marginLeft: "auto" }}>
                  Active
                </span>
              </div>
              <button
                className="account-action danger"
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
                role="menuitem"
                type="button"
              >
                <Icon name="logout" size={14} />
                <span>Sign out</span>
                <Icon name="chevron-right" size={12} style={{ marginLeft: "auto" }} />
              </button>
            </>
          ) : (
            <>
              <div className="account-empty-header">
                <p className="rag-h2" style={{ color: "var(--rag-primary)" }}>
                  Enterprise RAG
                </p>
                <p className="rag-meta" style={{ marginTop: 2 }}>
                  Sign in to your account
                </p>
              </div>
              <button
                className="account-action"
                onClick={() => {
                  onLogin();
                  setOpen(false);
                }}
                role="menuitem"
                type="button"
              >
                <span className="document-icon" style={{ height: 26, width: 26 }}>
                  <Icon name="user" size={13} />
                </span>
                <span>
                  <span className="rag-h2" style={{ color: "var(--rag-primary)", display: "block" }}>
                    Sign in
                  </span>
                  <span className="rag-meta">Access your workspace</span>
                </span>
                <Icon name="login" size={14} style={{ marginLeft: "auto", color: "var(--rag-blue)" }} />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
