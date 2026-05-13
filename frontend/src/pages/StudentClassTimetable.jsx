import React, { useState, useEffect } from 'react';
import { Calendar, Download, AlertCircle, Table2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../components/Toast';
import './StudentTimetables.css';

const API_BASE_URL = 'http://localhost:8000';

const DAYS_OF_WEEK = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' }
];

export default function StudentClassTimetable({ user }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classTimetable, setClassTimetable] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [isClassPublished, setIsClassPublished] = useState(false);
  const [activeExam, setActiveExam] = useState(null);

  useEffect(() => {
    if (user?.class_id) {
      fetchClassTimetable(user.class_id);
      fetchActiveExamCheck(user.class_id);
    } else {
      setClassLoading(false);
    }
  }, [user]);

  const fetchActiveExamCheck = async (classId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/`);
      if (res.ok) {
        const all = await res.json();
        const published = all.filter(a => a.is_published && a.class_ids?.some(id => String(id) === String(classId)));
        
        for (const a of published) {
          const ttRes = await fetch(`${API_BASE_URL}/assessments/${a.id}/timetable`);
          if (ttRes.ok) {
            const entries = await ttRes.json();
            const now = new Date();
            const live = entries.find(e => {
               if (String(e.class_id) !== String(classId)) return false;
               const d = new Date(e.exam_date + 'T00:00:00');
               if (now.toDateString() !== d.toDateString()) return false;
               const [sH, sM] = e.start_time.split(':').map(Number);
               const [eH, eM] = e.end_time.split(':').map(Number);
               const start = new Date(now); start.setHours(sH, sM, 0);
               const end = new Date(now); end.setHours(eH, eM, 0);
               return now >= start && now <= end;
            });
            if (live) {
              setActiveExam(live);
              break;
            }
          }
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchClassTimetable = async (classId) => {
    try {
      const classRes = await fetch(`${API_BASE_URL}/classes/`);
      if (classRes.ok) {
        const allClasses = await classRes.json();
        const currentClass = allClasses.find(c => String(c.id) === String(classId));
        if (currentClass?.is_timetable_published) {
          setIsClassPublished(true);
          const res = await fetch(`${API_BASE_URL}/timetable/class/${classId}`);
          if (res.ok) {
            const data = await res.json();
            setClassTimetable(data);
          }
        } else {
          setIsClassPublished(false);
          setClassTimetable([]);
        }
      }
    } catch {
      toast.error('Error', 'Could not load class timetable.');
    } finally {
      setClassLoading(false);
    }
  };

  const downloadClassPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(22);
      doc.setTextColor(61, 49, 255);
      doc.text(`My Class Timetable`, 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

      const days = DAYS_OF_WEEK.map(d => d.full);
      const timeSlots = Array.from(new Set(classTimetable.map(s => `${s.start_time} - ${s.end_time}`))).sort();
      
      const bodyContent = timeSlots.map(time => {
          const row = [time];
          days.forEach(day => {
              const entry = classTimetable.find(e => e.day_of_week === day && `${e.start_time} - ${e.end_time}` === time);
              if (entry) {
                  row.push(entry.is_break ? `[BREAK]\n${entry.label}` : `${entry.subject?.name}\n(${entry.teacher?.name})`);
              } else {
                  row.push('-');
              }
          });
          return row;
      });

      autoTable(doc, {
          head: [['Time Slot', ...DAYS_OF_WEEK.map(d => d.short)]],
          body: bodyContent,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [61, 49, 255], textColor: [255, 255, 255], fontSize: 10, halign: 'center' },
          styles: { fontSize: 9, cellPadding: 5, halign: 'center', valign: 'middle', font: 'helvetica' },
          columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 247, 255], cellWidth: 35 } },
          alternateRowStyles: { fillColor: [250, 251, 255] }
      });

      doc.save(`Class_Timetable.pdf`);
      toast.success("Exported", "Class Timetable PDF generated successfully.");
    } catch {
      toast.error("Export Failed", "Error creating PDF file.");
    }
  };

  const classTimeSlots = Array.from(new Set(classTimetable.map(s => `${s.start_time} - ${s.end_time}`))).sort();

  return (
    <div className="student-timetable-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Class Timetable</h2>
          <p>View your regular weekly class schedule.</p>
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
             <h3 className="section-label"><Calendar size={18} /> Regular Schedule</h3>
             {classTimetable.length > 0 && (
               <button className="btn-primary-glow" onClick={downloadClassPDF}>
                 <Download size={16} /> Download PDF
               </button>
             )}
          </div>
          
          {classLoading ? (
            <div className="loading-state">Loading schedule...</div>
          ) : !isClassPublished || classTimetable.length === 0 ? (
            <div className="no-data-card">
              <Table2 size={48} className="icon-blue" style={{ opacity: 0.3 }} />
              <h3>No Timetable Published</h3>
              <p>{!isClassPublished ? "Your class timetable has not been published yet." : "No schedule entries found for your class."}</p>
            </div>
          ) : (
            <div className="weekly-container glass-panel mt-4">
              <div className="weekly-grid-table">
                <div className="grid-header-row">
                  <div className="grid-time-head">Time</div>
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.full} className="grid-day-head">{day.short}</div>
                  ))}
                </div>
                {classTimeSlots.map(timeRange => (
                  <div key={timeRange} className="grid-body-row">
                    <div className="grid-time-cell">{timeRange}</div>
                    {DAYS_OF_WEEK.map(day => {
                      const entry = classTimetable.find(s => s.day_of_week === day.full && `${s.start_time} - ${s.end_time}` === timeRange);
                      return (
                        <div key={`${day.full}-${timeRange}`} className={`grid-slot-cell ${entry?.is_break ? 'is-break' : entry ? 'has-lecture' : 'is-empty'}`}>
                          {entry ? (
                            <div className="mini-slot-container" style={{ padding: '8px', textAlign: 'center' }}>
                              <div className="mini-subject" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {entry.is_break ? (entry.label || 'Break') : entry.subject?.name}
                              </div>
                              {!entry.is_break && <div className="mini-teacher" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>{entry.teacher?.name}</div>}
                            </div>
                          ) : '-'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
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
