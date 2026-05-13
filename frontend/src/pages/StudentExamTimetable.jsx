import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Download, AlertCircle, Award, Filter, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import NexusSelect from '../components/NexusSelect';
import { useNavigate } from 'react-router-dom';
import './StudentTimetables.css';

const API_BASE_URL = 'http://localhost:8000';

const fmtTime = (t) => (t ? t.slice(0, 5) : '—');

export default function StudentExamTimetable({ user }) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [examTimetable, setExamTimetable] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Precision update
    return () => clearInterval(timer);
  }, []);

  const [activeExam, setActiveExam] = useState(null);

  const sortedExams = [...examTimetable].sort((a, b) => a.exam_date.localeCompare(b.exam_date) || a.start_time.localeCompare(b.start_time));

  // Auto-Join Logic
  useEffect(() => {
    const active = sortedExams.find(e => isExamTime(e.exam_date, e.start_time, e.end_time) && !isExamOver(e.exam_date, e.end_time));
    setActiveExam(active);
  }, [currentTime, sortedExams]);

  const isExamTime = (date, start, end) => {
    const now = currentTime;
    const examDate = new Date(date + 'T00:00:00');
    if (now.toDateString() !== examDate.toDateString()) return false;

    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(sH, sM, 0);
    const endTime = new Date(now);
    endTime.setHours(eH, eM, 0);

    return now >= startTime && now <= endTime;
  };

  const isExamOver = (date, endTime) => {
    if (!date || !endTime) return false;
    const now = currentTime;
    const examEnd = new Date(`${date}T${endTime}`);
    return now > examEnd;
  };

  useEffect(() => {
    if (user?.class_id) {
      fetchAssessments(user.class_id);
    }
  }, [user]);

  const fetchAssessments = async (classId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/`);
      if (res.ok) {
        let allAssessments = await res.json();
        const valid = allAssessments.filter(a => a.is_published && (a.class_ids || []).some(id => String(id) === String(classId)));
        setAssessments(valid);
        if (valid.length > 0) {
          setSelectedAssessmentId(String(valid[0].id));
          fetchExamTimetable(valid[0].id);
        }
      }
    } catch {
      console.error('Failed to load assessments');
    }
  };

  const fetchExamTimetable = async (assessmentId) => {
    setExamLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/timetable`);
      if (res.ok) {
        const data = await res.json();
        setExamTimetable(data.filter(e => String(e.class_id) === String(user.class_id)));
      }
    } catch {
      toast.error('Error', 'Could not load exam timetable.');
    } finally {
      setExamLoading(false);
    }
  };

  const handleAssessmentChange = (id) => {
    setSelectedAssessmentId(id);
    fetchExamTimetable(id);
  };

  return (
    <div className="student-timetable-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Exam Timetable</h2>
          <p>View upcoming examinations and join online exams.</p>
        </div>
      </div>

      {!user?.class_id ? (
        <div className="no-data-card">
          <AlertCircle size={48} className="icon-blue" style={{ opacity: 0.5 }} />
          <h3>No Class Assigned</h3>
          <p>You are not assigned to a class yet. Please contact administration.</p>
        </div>
      ) : (
        <div className="tab-content fade-in">
          <div className="section-header-box">
             <h3 className="section-label"><Award size={18} /> Examination Schedules</h3>
          </div>
          
          <div className="glass-panel mt-4" style={{ padding: '20px' }}>
            {assessments.length === 0 ? (
              <div className="no-data-card" style={{ boxShadow: 'none', background: 'transparent' }}>
                <BookOpen size={48} className="icon-blue" style={{ opacity: 0.3 }} />
                <h3>No Exams Scheduled</h3>
                <p>There are currently no published exams for your class.</p>
              </div>
            ) : (
              <>
                <div className="assessment-selection-bar" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  marginBottom: '30px',
                  padding: '15px',
                  background: 'rgba(241, 245, 249, 0.5)',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div className="selection-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-color)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}>
                    <Filter size={20} />
                  </div>
                  <div style={{ flex: 1, maxWidth: '400px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Select Academic Assessment
                    </label>
                    <NexusSelect 
                      options={assessments.map(a => ({ label: a.title, value: a.id }))}
                      value={selectedAssessmentId} 
                      onChange={handleAssessmentChange}
                      placeholder="Choose an assessment..."
                    />
                  </div>
                </div>

                {examLoading ? (
                  <div className="loading-state">Loading exams...</div>
                ) : examTimetable.length === 0 ? (
                  <div className="no-data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                     <p>Selected assessment has no scheduled exams for your class.</p>
                  </div>
                ) : (
                  <div className="exam-cards-list">
                    {sortedExams.map((e, idx) => {
                      const dObj = new Date(e.exam_date + 'T00:00:00');
                      const isOver = isExamOver(e.exam_date, e.end_time);
                      const isActive = isExamTime(e.exam_date, e.start_time, e.end_time);
                      
                      return (
                        <div key={idx} className={`student-exam-card ${isOver ? 'is-over' : ''}`}>
                          <div className="exam-date-box">
                             <span className="exam-day">{dObj.toLocaleDateString('en-US', { day: '2-digit' })}</span>
                             <span className="exam-month">{dObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                             <span className="exam-weekday">{dObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          </div>
                          <div className="exam-details-main">
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                               <h4>{e.subject_name || `Subject Code: ${e.subject_id}`}</h4>
                               {isOver && <span className="status-badge over">Exam Over</span>}
                             </div>
                             <div className="exam-meta">
                                <span><Clock size={14} /> {e.start_time.slice(0, 5)} — {e.end_time.slice(0, 5)}</span>
                                <span><Award size={14} /> {e.total_marks} Marks</span>
                             </div>
                             <div className="exam-action-wrapper" style={{ marginTop: '15px' }}>
                               <button 
                                 className={`btn-primary ${isOver ? 'btn-over' : isActive ? 'btn-active' : 'btn-waiting'}`} 
                                 style={{ 
                                   width: '100%', 
                                   display: 'flex', 
                                   alignItems: 'center', 
                                   justifyContent: 'center', 
                                   gap: '8px', 
                                   padding: '10px',
                                   background: isOver ? '#94a3b8' : isActive ? '#22c55e' : '#3d31ff',
                                   border: 'none',
                                   borderRadius: '10px',
                                   color: 'white',
                                   fontWeight: 800,
                                   cursor: 'pointer'
                                 }}
                                 onClick={() => navigate(`/exam/${e.id}`)}
                               >
                                 {isOver ? (
                                   <><AlertCircle size={18} /> Exam Concluded</>
                                 ) : isActive ? (
                                   <><PlayCircle size={18} /> Join Online Exam</>
                                 ) : (
                                   <><Clock size={18} /> View Exam Status</>
                                 )}
                               </button>
                             </div>
                             {isOver && (
                               <div className="exam-over-hint" style={{ marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                 <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                 This examination has concluded.
                               </div>
                             )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {activeExam && (
        <div className="exam-active-overlay-force" style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="force-join-card"
            style={{ padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '500px' }}
          >
            <div className="live-badge" style={{ background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '20px', display: 'inline-block' }}>
              LIVE EXAM DETECTED
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{activeExam.subject_name}</h2>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Your scheduled examination has started. Please join the secure environment immediately.</p>
            <button 
              className="btn-primary" 
              style={{ padding: '15px 40px', fontSize: '1.1rem', borderRadius: '15px', background: '#3d31ff', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 800, width: '100%' }}
              onClick={() => navigate(`/exam/${activeExam.id}`)}
            >
              Enter Exam Now
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
