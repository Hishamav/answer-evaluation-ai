import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle, X } from 'lucide-react';
import './UploadZone.css';

export default function UploadZone({ onFileSelect, currentFile, id = "fileInput", label = "file" }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isDragActive) setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, [isDragActive]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (currentFile) {
    return (
      <div className="upload-zone success">
        <CheckCircle size={48} className="success-icon" />
        <p className="file-name">{currentFile.name}</p>
        <button className="remove-btn" onClick={() => onFileSelect(null)}>
          <X size={16} /> Remove {label}
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`upload-zone ${isDragActive ? 'active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        id={id}
        className="file-input" 
        onChange={handleChange}
        accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      <label htmlFor={id} className="upload-label">
        <UploadCloud size={48} className="upload-icon" />
        <p>Drag and drop your <span>{label}</span> here or <span>browse</span></p>
        <p className="file-hint">Supported formats: PDF, DOCX, JPG, PNG</p>
      </label>
    </div>
  );
}
