import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './NexusSelect.css';

export default function NexusSelect({ options, value, onChange, placeholder, required, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(prev => !prev);
  };

  return (
    <div
      className={`nexus-custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
      ref={containerRef}
    >
      {required && !value && (
        <input
          type="text"
          required
          style={{ opacity: 0, position: 'absolute', height: '100%', width: '100%', pointerEvents: 'none', zIndex: -1 }}
        />
      )}

      <div className="nexus-select-trigger" onClick={handleToggle}>
        <span className={value ? 'selected-text' : 'placeholder-text'}>
          {selectedOption ? selectedOption.label : (placeholder || 'Select…')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronDown size={18} className={`nexus-chevron ${isOpen ? 'rotate' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="nexus-dropdown-menu">
          {options.length === 0 ? (
            <div className="nexus-no-options">No options available</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                className={`nexus-dropdown-item ${String(opt.value) === String(value) ? 'active' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
