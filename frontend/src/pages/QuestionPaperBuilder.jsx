import React, { useState, useEffect } from 'react';
import { Plus, Trash, Save, X, PlusCircle, AlertCircle, BookOpen } from 'lucide-react';
import SubmitButton from '../components/SubmitButton';
import './QuestionPaperBuilder.css';

const API = 'http://localhost:8000';

export default function QuestionPaperBuilder({ exam, onClose, onSave }) {
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState([
    { text: '', type: 'subjective', marks: 5, options: ['', '', '', ''], correct_option_index: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Load existing paper if any
    const fetchPaper = async () => {
      try {
        const res = await fetch(`${API}/online-exam/question-paper/${exam.id}`);
        if (res.ok) {
          const data = await res.json();
          setInstructions(data.instructions || '');
          setDuration(data.duration_minutes || 60);
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions.map(q => ({
              ...q,
              options: q.options || ['', '', '', '']
            })));
          }
        }
      } catch (err) {
        console.error("No existing paper found");
      } finally {
        setFetching(false);
      }
    };
    fetchPaper();
  }, [exam.id]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'subjective', marks: 5, options: ['', '', '', ''], correct_option_index: 0 }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, val) => {
    const newQs = [...questions];
    newQs[idx][field] = val;
    setQuestions(newQs);
  };

  const updateOption = (qIdx, optIdx, val) => {
    const newQs = [...questions];
    newQs[qIdx].options[optIdx] = val;
    setQuestions(newQs);
  };

  const handleSave = async () => {
    if (questions.some(q => !q.text)) {
      alert("Please fill all question texts.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        exam_timetable_entry_id: exam.id,
        instructions,
        duration_minutes: duration,
        total_marks: questions.reduce((acc, q) => acc + parseInt(q.marks || 0), 0),
        questions: questions.map((q, i) => ({
          text: q.text,
          type: q.type,
          marks: parseInt(q.marks),
          options: q.type === 'mcq' ? q.options : null,
          correct_option_index: q.type === 'mcq' ? q.correct_option_index : null,
          order_index: i
        }))
      };

      const res = await fetch(`${API}/online-exam/question-paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        alert("Failed to save question paper");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="builder-loading">Syncing secure paper stream...</div>;

  return (
    <div className="qp-builder-overlay">
      <div className="qp-builder-container glass-panel">
        <header className="builder-header">
          <div className="header-info">
            <BookOpen size={24} className="icon-blue" />
            <div>
              <h3>Question Paper Designer</h3>
              <p>{exam.subject_name} | {exam.class_name}</p>
            </div>
          </div>
          <button className="close-builder" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="builder-body">
          <section className="builder-section">
            <h4>General Config</h4>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>General Instructions</label>
                <input 
                  type="text" 
                  value={instructions} 
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. All questions are compulsory. Use of calculators is prohibited."
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="builder-section">
            <div className="section-header">
              <h4>Questions ({questions.length})</h4>
              <p className="marks-total">Total Marks: {questions.reduce((acc, q) => acc + parseInt(q.marks || 0), 0)}</p>
            </div>

            <div className="questions-list">
              {questions.map((q, idx) => (
                <div key={idx} className="q-builder-card">
                  <div className="q-card-header">
                    <span className="q-index">Q{idx + 1}</span>
                    <div className="q-type-select">
                      <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                        <option value="subjective">Subjective</option>
                        <option value="mcq">MCQ</option>
                      </select>
                    </div>
                    <div className="q-marks-input">
                      <label>Marks:</label>
                      <input type="number" value={q.marks} onChange={e => updateQuestion(idx, 'marks', e.target.value)} />
                    </div>
                    <button className="q-delete-btn" onClick={() => removeQuestion(idx)}><Trash size={16} /></button>
                  </div>

                  <div className="q-content">
                    <textarea 
                      placeholder="Enter question text..."
                      value={q.text}
                      onChange={e => updateQuestion(idx, 'text', e.target.value)}
                    />

                    {q.type === 'mcq' && (
                      <div className="mcq-builder">
                        <label>Options & Correct Answer</label>
                        <div className="options-grid">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="option-row">
                              <input 
                                type="radio" 
                                name={`correct-${idx}`} 
                                checked={q.correct_option_index === oIdx}
                                onChange={() => updateQuestion(idx, 'correct_option_index', oIdx)}
                              />
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={e => updateOption(idx, oIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-add-q" onClick={addQuestion}>
              <PlusCircle size={18} /> Add New Question
            </button>
          </section>
        </div>

        <footer className="builder-footer">
          <div className="footer-warning">
             <AlertCircle size={16} />
             <span>Students will only see this once the exam schedule reaches.</span>
          </div>
          <div className="footer-actions">
            <button className="btn-secondary" onClick={onClose}>Discard Changes</button>
            <SubmitButton 
              loading={loading} 
              text="Save Question Paper" 
              icon={<Save size={18} />} 
              onClick={handleSave}
              className="btn btn-primary"
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
