import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message, // Support 'message' prop too
  description,
  type = 'info', // 'info', 'success', 'warning', 'error'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getVariant = () => {
    switch (type) {
      case 'success':
        return { icon: <CheckCircle2 size={32} />, color: '#10b981', bg: '#f0fdf4' };
      case 'warning':
        return { icon: <AlertCircle size={32} />, color: '#f59e0b', bg: '#fffbeb' };
      case 'error':
        return { icon: <XCircle size={32} />, color: '#ef4444', bg: '#fef2f2' };
      default:
        return { icon: <HelpCircle size={32} />, color: '#3d31ff', bg: '#eff6ff' };
    }
  };

  const variant = getVariant();

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'nexusFadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes nexusFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nexusScaleIn { 
          from { opacity: 0; transform: scale(0.9) translateY(20px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
      `}</style>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '2.5rem',
        borderRadius: '32px',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 25px 70px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
        animation: 'nexusScaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{ 
            position: 'absolute', 
            top: '-50px', 
            left: '-50px', 
            width: '150px', 
            height: '150px', 
            background: variant.color, 
            opacity: 0.1, 
            filter: 'blur(50px)',
            borderRadius: '50%'
        }} />

        <div style={{
          width: '72px',
          height: '72px',
          background: variant.bg,
          color: variant.color,
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: `0 10px 20px ${variant.color}15`
        }}>
          {variant.icon}
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          {message || description}
        </p>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {showCancel && (
            <button 
                onClick={onClose}
                disabled={loading}
                style={{
                flex: 1,
                padding: '14px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
                }}
            >
                {cancelText}
            </button>
          )}

          <button 
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: variant.color,
              color: 'white',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: `0 8px 25px ${variant.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
