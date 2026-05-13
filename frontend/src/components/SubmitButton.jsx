import React from 'react';
import { Loader2 } from 'lucide-react';

const SubmitButton = ({ 
  loading, 
  text, 
  loadingText = "Processing...", 
  icon = null, 
  className = "btn-primary-glow", 
  disabled = false,
  ...props
}) => {
  return (
    <button 
      type="submit" 
      className={className} 
      disabled={loading || disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <span>{text}</span>
          {icon}
        </>
      )}
    </button>
  );
};

export default SubmitButton;
