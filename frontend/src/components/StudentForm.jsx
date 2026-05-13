import React, { useState } from 'react';
import { User, IdCard, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import SubmitButton from './SubmitButton';
import './StudentForm.css';

export default function StudentForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    subject: '',
    examDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.rollNo && formData.subject) {
      setSubmitting(true);
      setTimeout(() => {
        onSubmit(formData);
        setSubmitting(false);
      }, 800);
    }
  };

  return (
    <div className="student-form-container glass-panel">
      <div className="form-header">
        <User size={24} className="icon-blue" />
        <h3>Student Identity Authorization</h3>
      </div>
      <p className="form-desc">Provide subject metadata to register the evaluation stream accurately.</p>
      
      <form onSubmit={handleSubmit} className="quantum-form">
        <div className="input-group">
          <label><User size={16} /> Full Name</label>
          <input 
            type="text" 
            name="name" 
            placeholder="e.g. John Doe" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label><IdCard size={16} /> Roll Number</label>
            <input 
              type="text" 
              name="rollNo" 
              placeholder="e.g. CS2024-05" 
              value={formData.rollNo} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label><BookOpen size={16} /> Subject</label>
            <input 
              type="text" 
              name="subject" 
              placeholder="e.g. Machine Learning" 
              value={formData.subject} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="input-group">
          <label><Calendar size={16} /> Assessment Date</label>
          <input 
            type="date" 
            name="examDate" 
            value={formData.examDate} 
            onChange={handleChange} 
            required 
          />
        </div>

        <SubmitButton 
          loading={submitting} 
          text="Authorize Stream" 
          loadingText="Authorizing..." 
          icon={<ChevronRight size={18} />} 
          className="start-upload-btn" 
        />
      </form>
    </div>
  );
}
