import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Download, AlertCircle, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import ResultCard from '../components/ResultCard';
import './StudentTimetables.css';

const API_BASE_URL = 'http://localhost:8000';

export default function StudentResults({ user }) {
  const { toast } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchResults(user.id);
    }
  }, [user]);

  const fetchResults = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/results/student/${studentId}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch {
      toast.error('Error', 'Could not load results.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedResult) {
    return (
      <div className="student-results-page">
        <button 
          className="btn-back" 
          onClick={() => setSelectedResult(null)}
          style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
        >
          <AlertCircle size={18} /> Back to Results List
        </button>
        <ResultCard 
          result={selectedResult} 
          studentDetails={user}
          subjectName={selectedResult.subject?.name || 'Subject'}
          className={user.academic_class?.name || 'N/A'}
          courseName={user.academic_class?.course?.name || 'N/A'}
          specializationName={user.academic_class?.course?.specialization?.name || 'N/A'}
          hidePublish={true}
        />
      </div>
    );
  }

  return (
    <div className="student-timetable-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Academic Performance</h2>
          <p>Review your published assessment results and AI feedback.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '30px' }}>
        {loading ? (
          <div className="loading-state">Synchronizing academic records...</div>
        ) : results.length === 0 ? (
          <div className="no-data-card">
            <Award size={48} className="icon-blue" style={{ opacity: 0.3 }} />
            <h3>No Results Published</h3>
            <p>Your assessment results have not been published by the faculty yet.</p>
          </div>
        ) : (
          <div className="results-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {results.map((res, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="result-summary-card glass-panel"
                style={{ 
                    padding: '20px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '16px', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedResult(res)}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'flex-start' }}>
                    <div className="res-subject-icon" style={{ background: 'rgba(61, 49, 255, 0.1)', color: '#3d31ff', padding: '10px', borderRadius: '12px' }}>
                       <BookOpen size={24} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                        <div className="res-score-badge" style={{ background: res.percentage >= 50 ? '#dcfce7' : '#fee2e2', color: res.percentage >= 50 ? '#166534' : '#991b1b', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.8rem' }}>
                            {res.percentage}% AI
                        </div>
                        {res.is_teacher_evaluated && (
                            <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Teacher Eval</span>
                        )}
                        {res.is_principal_evaluated && (
                            <span style={{ fontSize: '0.65rem', background: '#f3e8ff', color: '#7e22ce', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Principal Eval</span>
                        )}
                    </div>
                 </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{res.subject?.name || 'Subject Assessment'}</h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '15px' }}>Date: {new Date(res.created_at).toLocaleDateString()}</p>
                
                <div className="res-meta-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                    <span style={{ fontWeight: 600 }}>{res.obtained_marks} / {res.total_marks}</span>
                    <span style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Analysis <ChevronRight size={14} />
                    </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
