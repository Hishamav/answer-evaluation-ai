import React, { useState } from 'react';
import { Layers, Plus, Trash2, CheckCircle, Download, X } from 'lucide-react';
import SubmitButton from './SubmitButton';
import './SectionConfig.css';

export default function SectionConfig({ onComplete, onClose, sections, setSections }) {
  const [submitting, setSubmitting] = useState(false);

  const addSection = () => {
    const newId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1;
    const nextLetter = String.fromCharCode(65 + sections.length); // A, B, C...
    setSections([...sections, { id: newId, name: `Section ${nextLetter}`, questions: 5, marks: 2 }]);
  };

  const removeSection = (id) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
        onComplete(sections);
        setSubmitting(false);
    }, 800);
  };

  return (
    <div className="section-config-container">
      <div className="form-header">
        <Layers size={24} className="icon-purple" />
        <h3>Quantum Section Architecture</h3>
      </div>
      <p className="form-desc">Define the structural schema for evaluation. Questions and marks per section.</p>
      
      <form onSubmit={handleSubmit} className="sections-form">
        <div className="sections-list">
          {sections.map((section, index) => (
            <div key={section.id} className="section-row glass-panel">
              <div className="section-index">{index + 1}</div>
              
              <button 
                type="button" 
                className="section-remove-x-btn" 
                onClick={() => removeSection(section.id)}
                title="Remove Section"
                disabled={sections.length === 1}
              >
                <X size={16} />
              </button>
              
              <div className="input-group">
                <label>Section Name</label>
                <input 
                  type="text" 
                  value={section.name} 
                  onChange={(e) => updateSection(section.id, 'name', e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group short">
                <label>Q. Count</label>
                <input 
                  type="number" 
                  min="1"
                  value={section.questions} 
                  onChange={(e) => updateSection(section.id, 'questions', parseInt(e.target.value))} 
                  required 
                />
              </div>

              <div className="input-group short">
                <label>Marks/Q</label>
                <input 
                  type="number" 
                  min="1"
                  value={section.marks} 
                  onChange={(e) => updateSection(section.id, 'marks', parseInt(e.target.value))} 
                  required 
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-add-section" onClick={addSection}>
            <Plus size={18} /> Add Section
          </button>
          
          <SubmitButton 
            loading={submitting} 
            text="Finalize Schema" 
            loadingText="Finalizing..." 
            icon={<CheckCircle size={18} />} 
            className="btn btn-primary finalize-btn" 
          />
        </div>
      </form>
    </div>
  );
}
