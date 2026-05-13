import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    History, 
    Search, 
    Filter, 
    ChevronRight, 
    Calendar, 
    BookOpen, 
    User, 
    CheckCircle2, 
    XCircle,
    LayoutGrid,
    List as ListIcon,
    ArrowLeft,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ResultCard from '../components/ResultCard';
import NexusSelect from '../components/NexusSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import './Evaluator.css'; 

export default function EvaluationHistory() {
    const [results, setResults] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClassId, setFilterClassId] = useState('');
    const [selectedResult, setSelectedResult] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
        fetchClasses();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/results/');
            setResults(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch history", err);
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await axios.get('http://localhost:8000/classes/');
            setClasses(res.data);
        } catch (err) {
            console.error("Failed to fetch classes", err);
        }
    };

    const filteredResults = results.filter(r => {
        const studentName = r.student?.name?.toLowerCase() || '';
        const subjectName = r.subject?.name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        const matchesSearch = studentName.includes(search) || subjectName.includes(search);
        const matchesClass = !filterClassId || String(r.class_id) === String(filterClassId);
        return matchesSearch && matchesClass;
    });

    const handleDelete = (id) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        const id = deleteConfirm.id;
        try {
            const res = await axios.delete(`http://localhost:8000/api/results/${id}`);
            if (res.status === 200) {
                setResults(results.filter(r => r.id !== id));
            }
        } catch (err) {
            console.error("Delete failed", err);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (selectedResult) {
        return (
            <div className="evaluator-container" style={{ padding: '2rem' }}>
                <div className="history-detail-header" style={{ marginBottom: '2rem' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedResult(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={18} />
                        <span>Back to History</span>
                    </button>
                </div>
                <ResultCard 
                    result={selectedResult} 
                    studentDetails={selectedResult.student} 
                    subjectName={selectedResult.subject?.name}
                    className={selectedResult.academic_class?.name}
                    courseName={selectedResult.academic_class?.course?.name}
                    specializationName={selectedResult.academic_class?.course?.specialization?.name}
                    subjectId={selectedResult.subject_id}
                    hidePublish={false} // Will show status badge since is_published is true in DB
                />
            </div>
        );
    }

    return (
        <div className="evaluator-container">
            <div className="eval-header glass-panel">
                <div className="header-text">
                    <h1><History className="icon-pulse" /> Evaluation Repository</h1>
                    <p>Comprehensive record of all semantic assessments and faculty validations.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-value">{results.length}</span>
                        <span className="stat-label">Total Records</span>
                    </div>
                </div>
            </div>

            <div className="history-controls glass-panel" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 100 }}>
                <div className="search-box" style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                    <input 
                        type="text" 
                        placeholder="Search student or subject..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="class-filter" style={{ width: '250px', position: 'relative', zIndex: 110 }}>
                    <NexusSelect 
                        options={[{ label: 'All Classes', value: '' }, ...classes.map(c => ({ label: c.name, value: c.id }))]}
                        value={filterClassId}
                        onChange={setFilterClassId}
                        placeholder="Filter by Class"
                    />
                </div>
                <div className="view-toggle" style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                    <button 
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} 
                        onClick={() => setViewMode('grid')} 
                        style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--primary-color)' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, boxShadow: viewMode === 'grid' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}
                    >
                        <LayoutGrid size={18} />
                        <span>Grid</span>
                    </button>
                    <button 
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} 
                        onClick={() => setViewMode('list')} 
                        style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? 'var(--primary-color)' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, boxShadow: viewMode === 'list' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}
                    >
                        <ListIcon size={18} />
                        <span>List</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="nexus-spinner"></div>
                    <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Retrieving assessment records...</p>
                </div>
            ) : filteredResults.length === 0 ? (
                <div className="empty-state glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
                    <History size={64} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }} />
                    <h3>No evaluation records found</h3>
                    <p>Refine your search or perform new assessments to populate the repository.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredResults.map(res => (
                        <div key={res.id} className="history-card glass-panel" onClick={() => setSelectedResult(res)} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}>
                            <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div className="student-info">
                                    <h4 style={{ margin: 0 }}>{res.student?.name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {res.student?.registration_id}</span>
                                </div>
                                <div className="score-ring" style={{ width: '45px', height: '45px', borderRadius: '50%', border: `3px solid ${res.percentage > 50 ? '#22c55e' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {Math.round(res.percentage)}%
                                </div>
                            </div>
                            <div className="card-mid" style={{ marginBottom: '1rem' }}>
                                <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                    <BookOpen size={16} />
                                    <span>{res.subject?.name}</span>
                                </div>
                                <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                    <Calendar size={16} />
                                    <span>{formatDate(res.created_at)}</span>
                                </div>
                            </div>
                            <div className="card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.75rem', 
                                    background: res.is_published ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: res.is_published ? '#22c55e' : '#ef4444'
                                }}>
                                    {res.is_published ? 'PUBLISHED' : 'DRAFT'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        className="btn-icon-sm" 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                                        style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                    <ChevronRight size={18} style={{ color: '#64748b' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="history-list glass-panel" style={{ padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '1.2rem' }}>Student</th>
                                <th style={{ padding: '1.2rem' }}>Subject</th>
                                <th style={{ padding: '1.2rem' }}>Date</th>
                                <th style={{ padding: '1.2rem' }}>Score</th>
                                <th style={{ padding: '1.2rem' }}>Status</th>
                                <th style={{ padding: '1.2rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.map(res => (
                                <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{res.student?.name[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{res.student?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{res.student?.registration_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem' }}>{res.subject?.name}</td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                            <Clock size={14} />
                                            {formatDate(res.created_at)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem', fontWeight: 'bold', color: res.percentage > 50 ? '#22c55e' : '#ef4444' }}>{res.obtained_marks}/{res.total_marks}</td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.7rem', 
                                            background: res.is_published ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: res.is_published ? '#22c55e' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {res.is_published ? 'PUBLISHED' : 'DRAFT'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-icon-sm" onClick={() => setSelectedResult(res)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary-color)', border: 'none', cursor: 'pointer' }}>
                                                <ChevronRight size={18} />
                                            </button>
                                            <button 
                                                className="btn-icon-sm" 
                                                onClick={() => handleDelete(res.id)} 
                                                style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog 
                isOpen={deleteConfirm.isOpen}
                type="error"
                title="Confirm Permanent Deletion"
                message="Are you sure you want to delete this evaluation record? This action will permanently remove the result from the institutional repository and the student's portal. This cannot be undone."
                confirmText="Yes, Delete Record"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
            />
        </div>
    );
}
