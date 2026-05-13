import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

// ── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Config ───────────────────────────────────────────────────────────────────
const VARIANTS = {
  success: {
    background: "#F0FDF4",
    border: "#BBF7D0",
    iconBg: "#22C55E",
    textColor: "#14532D",
    subColor: "#16A34A",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    background: "#FFF1F2",
    border: "#FECDD3",
    iconBg: "#EF4444",
    textColor: "#7F1D1D",
    subColor: "#DC2626",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    background: "#FFFBEB",
    border: "#FDE68A",
    iconBg: "#F59E0B",
    textColor: "#78350F",
    subColor: "#D97706",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    background: "#EFF6FF",
    border: "#BFDBFE",
    iconBg: "#2563EB",
    textColor: "#1E3A5F",
    subColor: "#2563EB",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    ),
  },
};

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 600;
}

function ToastItem({ id, type = "info", title, description, onRemove, duration = 4000 }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [mobile, setMobile] = useState(isMobile());
  const v = VARIANTS[type] || VARIANTS.info;

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(id), 320);
  }, [id, onRemove]);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(dismiss, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [dismiss, duration]);

  const transform = mobile
    ? leaving ? "translateY(110%)" : visible ? "translateY(0)" : "translateY(110%)"
    : leaving ? "translateX(110%)" : visible ? "translateX(0)" : "translateX(110%)";

  const wrapperStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: mobile ? "12px 14px" : "14px 16px",
    backgroundColor: v.background,
    border: `1.5px solid ${v.border}`,
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
    width: mobile ? "calc(100vw - 32px)" : "100%",
    maxWidth: mobile ? "none" : "360px",
    boxSizing: "border-box",
    fontFamily: "'Poppins', sans-serif",
    transform,
    opacity: leaving ? 0 : visible ? 1 : 0,
    transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
    position: "relative",
  };

  return (
    <div style={wrapperStyle}>
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={{
        width: "28px", height: "28px", minWidth: "28px",
        borderRadius: "8px", backgroundColor: v.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: "1px",
      }}>
        {v.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: "14px", fontWeight: "700", color: v.textColor,
          marginBottom: description ? "2px" : 0, lineHeight: "1.4",
          margin: 0,
        }}>
          {title}
        </p>
        {description && (
          <p style={{
            fontSize: "13px", color: v.subColor,
            lineHeight: "1.4", margin: "2px 0 0 0",
          }}>
            {typeof description === 'string' ? description : JSON.stringify(description)}
          </p>
        )}
      </div>
      <button style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "2px", color: v.subColor,
        display: "flex", alignItems: "center",
        opacity: 0.6, transition: "opacity 0.15s", flexShrink: 0,
        minWidth: mobile ? "32px" : "auto",
        minHeight: mobile ? "32px" : "auto",
        justifyContent: "center",
      }} onClick={dismiss}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: "3px", borderRadius: "0 0 14px 14px",
        backgroundColor: v.iconBg, opacity: 0.35,
        animation: `toast-shrink ${duration}ms linear forwards`,
      }} />
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  const [mobile, setMobile] = useState(isMobile());

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const containerStyle = mobile
    ? {
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "center",
        pointerEvents: "none",
        width: "100%",
      }
    : {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-end",
        pointerEvents: "none",
      };

  return (
    <div style={containerStyle}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "all", display: "flex", justifyContent: "center", width: "100%" }}>
          <ToastItem {...t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, description, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, description, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, description, duration) => addToast("success", title, description, duration),
    error:   (title, description, duration) => addToast("error",   title, description, duration),
    warning: (title, description, duration) => addToast("warning", title, description, duration),
    info:    (title, description, duration) => addToast("info",    title, description, duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toast-root">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </ToastContext.Provider>
  );
}
