import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, ChevronLeft, ChevronRight, Send, AlertCircle, 
  BookOpen, LayoutGrid, CheckCircle2, Timer
} from 'lucide-react';
import { useToast } from '../components/Toast';
import LogoLoader from '../components/LogoLoader';
import './ExamEnvironment.css';

const API = 'http://localhost:8000';

export default function ExamEnvironment({ setIsExamActive, user }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [preCountdown, setPreCountdown] = useState(3);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Sync with App state for restricted mode
  useEffect(() => {
    setIsExamActive(true);
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      setIsExamActive(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timer);
    };
  }, [setIsExamActive]);

  // Load Exam Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const paperRes = await fetch(`${API}/online-exam/question-paper/${examId}`);
        if (!paperRes.ok) throw new Error("Question paper not found");
        const paperData = await paperRes.json();
        setPaper(paperData);

        const entryRes = await fetch(`${API}/assessments/timetable/${examId}`);
        if (!entryRes.ok) throw new Error("Timetable entry not found");
        const entryData = await entryRes.json();
        setEntry(entryData);

        setTimeLeft(paperData.duration_minutes * 60);
        setLoading(false);
      } catch (err) {
        toast.error("Error", "Could not load the exam environment.");
        navigate('/student-timetables');
      }
    };
    loadData();
  }, [examId, navigate, toast]);

  useEffect(() => {
    if (!entry) return;

    const checkStatus = () => {
      const now = currentTime;
      const d = new Date(entry.exam_date + 'T00:00:00');
      const [sH, sM] = entry.start_time.split(':').map(Number);
      const [eH, eM] = entry.end_time.split(':').map(Number);
      
      const start = new Date(d); start.setHours(sH, sM, 0);
      const end = new Date(d); end.setHours(eH, eM, 0);

      if (now < start) {
        setIsExamWaiting(true);
        setIsExamOver(false);
        setIsExamActive(true);
      } else if (now > end) {
        setIsExamWaiting(false);
        setIsExamOver(true);
        setIsExamActive(false);
      } else {
        setIsExamWaiting(false);
        setIsExamOver(false);
        setIsExamActive(true);
      }
    };

    checkStatus();
  }, [currentTime, entry, setIsExamActive]);

  // Pre-countdown Logic
  useEffect(() => {
    if (!loading && preCountdown > 0) {
      const timer = setTimeout(() => setPreCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (preCountdown === 0 && !isStarted) {
      setIsStarted(true);
    }
  }, [loading, preCountdown, isStarted]);

  // Main Timer Logic
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true); // Auto-submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isStarted, timeLeft]);

  const handleAnswerChange = (qId, val, type) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleSubmit = async (isAuto = false) => {
    if (isSubmitting) return;
    if (!isAuto && !window.confirm("Are you sure you want to submit your exam? You cannot make changes after submission.")) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        exam_timetable_entry_id: parseInt(examId),
        answers: Object.keys(answers).map(qId => ({
          question_id: parseInt(qId),
          answer_text: typeof answers[qId] === 'string' ? answers[qId] : null,
          selected_option_index: typeof answers[qId] === 'number' ? answers[qId] : null
        }))
      };

      const res = await fetch(`${API}/online-exam/submit?student_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (res.ok) {
        toast.success("Success", "Exam submitted successfully!");
        setIsExamActive(false);
        navigate('/student-timetables');
      } else {
        throw new Error("Submission failed");
      }
    } catch (err) {
      toast.error("Error", "Failed to submit exam. Please try again or contact administrator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent Copy, Paste, Context Menu
  useEffect(() => {
    if (isStarted) {
      const preventAction = (e) => {
        e.preventDefault();
        toast.warning("Restricted", "Copy-pasting and right-clicking are disabled during the exam.");
      };

      document.addEventListener('copy', preventAction);
      document.addEventListener('paste', preventAction);
      document.addEventListener('contextmenu', preventAction);

      return () => {
        document.removeEventListener('copy', preventAction);
        document.removeEventListener('paste', preventAction);
        document.removeEventListener('contextmenu', preventAction);
      };
    }
  }, [isStarted]);

  // Request Fullscreen
  useEffect(() => {
    if (isStarted && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn("Fullscreen request failed");
      });
    }
  }, [isStarted]);

  if (loading) return <div className="exam-loading-screen"><LogoLoader message="Preparing Secure Environment..." /></div>;

  const examInterval = entry ? `${entry.start_time.slice(0, 5)} - ${entry.end_time.slice(0, 5)}` : '--:--';

  if (isExamWaiting) {
    return (
      <div className="exam-waiting-screen" style={{
        height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', textAlign: 'center', padding: '20px'
      }}>
        <div className="waiting-clock" style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '20px', color: '#3d31ff' }}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="waiting-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '500px' }}>
          <Clock size={48} style={{ color: '#3d31ff', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Exam is coming up...</h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '1.1rem' }}>
            The examination for <strong>{paper?.subject_name}</strong> is scheduled for:
            <br />
            <span style={{ color: '#3d31ff', fontSize: '1.4rem', fontWeight: 800 }}>{examInterval}</span>
          </p>
          <div className="waiting-loader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', color: '#94a3b8' }}>
             <LogoLoader message="" />
             <span>Please stay on this page. The exam will start automatically.</span>
          </div>
        </div>
        <button onClick={() => navigate('/student-exam-timetable')} style={{ marginTop: '30px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}>
          Return to Timetable
        </button>
      </div>
    );
  }

  if (isExamOver) {
    return (
      <div className="exam-over-screen" style={{
        height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', textAlign: 'center', padding: '20px'
      }}>
        <div className="over-card" style={{ background: 'white', padding: '50px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
          <AlertCircle size={64} style={{ color: '#94a3b8', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '10px' }}>Exam is Over</h2>
          <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.2rem' }}>
            The time for <strong>{paper?.subject_name}</strong> has concluded.
            <br />
            Scheduled time: {examInterval}
          </p>
          <button className="btn-primary" onClick={() => navigate('/student-exam-timetable')} style={{ padding: '12px 30px', borderRadius: '12px', background: '#3d31ff' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (preCountdown > 0) {
    return (
      <div className="countdown-overlay">
        <div className="countdown-content">
          <h1>EXAM STARTING IN</h1>
          <div className="countdown-number">{preCountdown}</div>
          <p>The interface will lock automatically.</p>
        </div>
      </div>
    );
  }

  const currentQ = paper.questions[currentIdx];
  const totalQ = paper.questions.length;

  return (
    <div className="exam-env-container fade-in">
      {/* Header */}
      <header className="exam-header">
        <div className="exam-info">
          <BookOpen size={20} />
          <div>
            <h3>{paper.instructions || "Academic Examination"}</h3>
            <span className="exam-meta-text">Question {currentIdx + 1} of {totalQ}</span>
          </div>
        </div>
        
        <div className="exam-status-badges" style={{ display: 'flex', gap: '15px' }}>
          <div className="exam-interval-badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Clock size={14} /> <span>{examInterval}</span>
          </div>
          <div className="live-clock-badge" style={{ background: '#3d31ff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Timer size={14} /> <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        <div className={`exam-timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
          <Timer size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <div className="header-actions">
          <button className="grid-toggle-btn" onClick={() => setShowGrid(!showGrid)}>
            <LayoutGrid size={20} />
          </button>
          <button className="submit-exam-btn" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
            <Send size={18} />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="exam-main">
        {showGrid && (
          <aside className="question-grid-panel glass-panel">
            <h4>Question Palette</h4>
            <div className="q-grid">
              {paper.questions.map((q, idx) => (
                <button 
                  key={idx} 
                  className={`q-grid-item ${currentIdx === idx ? 'active' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
                  onClick={() => { setCurrentIdx(idx); setShowGrid(false); }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="grid-legend">
              <span className="legend-item"><span className="dot answered"></span> Answered</span>
              <span className="legend-item"><span className="dot"></span> Pending</span>
            </div>
          </aside>
        )}

        <div className="question-viewer">
          <div className="question-card glass-panel">
            <div className="question-header">
              <span className="q-number">Question {currentIdx + 1}</span>
              <span className="q-marks">{currentQ.marks} Marks</span>
            </div>
            
            <div className="question-text">
              {currentQ.text}
            </div>

            <div className="answer-area">
              {currentQ.type === 'mcq' ? (
                <div className="mcq-options">
                  {(currentQ.options || []).map((opt, idx) => (
                    <label key={idx} className={`mcq-option ${answers[currentQ.id] === idx ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${currentQ.id}`} 
                        checked={answers[currentQ.id] === idx}
                        onChange={() => handleAnswerChange(currentQ.id, idx, 'mcq')}
                      />
                      <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="option-text">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea 
                  className="subjective-input"
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value, 'subjective')}
                  onPaste={(e) => e.preventDefault()}
                />
              )}
            </div>
          </div>

          <div className="navigation-footer">
            <button 
              className="nav-btn" 
              disabled={currentIdx === 0} 
              onClick={() => setCurrentIdx(prev => prev - 1)}
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <div className="progress-dots">
               {paper.questions.map((_, idx) => (
                 <div key={idx} className={`progress-dot ${idx === currentIdx ? 'active' : ''} ${answers[paper.questions[idx].id] !== undefined ? 'filled' : ''}`} />
               ))}
            </div>
            {currentIdx < totalQ - 1 ? (
              <button 
                className="nav-btn primary" 
                onClick={() => setCurrentIdx(prev => prev + 1)}
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                className="nav-btn submit-trigger" 
                onClick={() => handleSubmit(false)}
              >
                Finish <CheckCircle2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
