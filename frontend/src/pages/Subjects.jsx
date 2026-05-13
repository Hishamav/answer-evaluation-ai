import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  X,
  Search,
  Edit,
  Trash,
  BookOpen,
  Calendar,
  Layers,
  Star,
  Users,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../components/Toast';
import NexusSelect from '../components/NexusSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import SubmitButton from '../components/SubmitButton';
import './Classes.css';

const API_BASE_URL = 'http://localhost:8000';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('');


  const [subjectForm, setSubjectForm] = useState({
    name: '',
  });
  const [selectedClasses, setSelectedClasses] = useState([]); // Array of {id, name, teacher_id, original_id}
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subjects/`),
        fetch(`${API_BASE_URL}/classes/`),
        fetch(`${API_BASE_URL}/teachers/`)
      ]);
      const sData = await subjectsRes.json();
      setSubjects(Array.isArray(sData) ? sData : []);
      setClasses(await classesRes.json());
      setTeachers(await teachersRes.json());
    } catch (error) {
      toast.error("Error", "Failed to load subjects data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (subj) => {
    setSubjectForm({ name: subj.name });
    setSelectedClasses([{
      id: subj.class_id,
      name: subj.academic_class?.name || 'Class',
      teacher_id: subj.teacher_id,
      original_id: subj.id
    }]);
    setIsEditing(true);
    setEditingSubjectId(subj.id);
    setShowModal(true);
  };

  const handleDeleteClick = (subj) => {
    setSubjectToDelete(subj);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subjects/${subjectToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Deleted", "Subject removed successfully.");
        setShowDeleteModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error("Error", "Could not delete subject.");
    }
  };

  const openAddModal = () => {
    setSubjectForm({ name: '' });
    setSelectedClasses([]);
    setIsEditing(false);
    setEditingSubjectId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedClasses.length === 0) {
      toast.error("Validation", "Select at least one class.");
      return;
    }

    setIsSubmitting(true);

    try {
      let successCount = 0;
      for (const cls of selectedClasses) {
        const isExisting = cls.original_id;
        const url = isExisting ? `${API_BASE_URL}/subjects/${cls.original_id}` : `${API_BASE_URL}/subjects/`;
        const method = isExisting ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subjectForm.name,
            class_id: cls.id,
            teacher_id: cls.teacher_id
          })
        });
        if (res.ok) successCount++;
      }

      if (successCount > 0) {
        toast.success("Success", isEditing ? "Updates saved." : `Registered ${successCount} subjects.`);
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error("Error", "Network error while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.academic_class?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !filterClassId || String(s.class_id) === String(filterClassId);
    return matchesSearch && matchesClass;
  });



  return (
    <div className="departments-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Subjects</h2>
          <p>Manage discrete subjects mapped to classes and assigned teachers.</p>
        </div>
        <button className="btn-primary add-dept-btn" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="toolbar">
        <div className="nexus-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} className="nexus-search-icon" style={{ position: 'absolute', left: '10px', pointerEvents: 'none', zIndex: 1 }} />
          <input
            type="text"
            placeholder="Search subjects..."
            className="nexus-toolbar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '300px' }}>
          <NexusSelect
            options={[{ label: 'All Classes', value: '' }, ...classes.map(c => ({ label: c.name, value: c.id }))]}
            value={filterClassId}
            onChange={setFilterClassId}
            placeholder="Filter by Class"
          />
        </div>


        <div className="nexus-view-toggle">
          <button className={`nexus-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
          <button className={`nexus-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><TableIcon size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="dept-empty"><p>Syncing Subject Data...</p></div>
      ) : filteredSubjects.length === 0 ? (
        <div className="dept-empty">
          <div className="empty-icon"><BookOpen size={48} /></div>
          <h3>No Subjects Found</h3>
          <p>Start registering subjects for your classes.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="dept-grid">
          {filteredSubjects.map(subj => (
            <div key={subj.id} className="dept-card">
              <div className="card-top">
                <div className="dept-icon-wrapper"><BookOpen size={24} /></div>
                <div className="nexus-action-control">
                  <button className="nexus-action-btn edit" onClick={() => handleEditClick(subj)}><Edit size={16} /></button>
                  <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(subj)}><Trash size={16} /></button>
                </div>
              </div>
              <div className="card-content">
                <h3>{subj.name}</h3>
                <div className="class-pills">
                  <span className="pill-item"><Building2 size={12} /> {subj.academic_class?.name || 'No Class'}</span>
                  {subj.teacher && <span className="pill-item"><Users size={12} /> {subj.teacher.name}</span>}
                </div>
              </div>
              <div className="card-footer">
                <span className="dept-meta">ID: {subj.id}</span>
                <div className="dept-status-pill">Active</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dept-table-wrapper">
          <table className="dept-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '200px' }}>Subject Name</th>
                <th>Class</th>
                <th>Teacher</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map(subj => (
                <tr key={subj.id}>
                  <td>#{subj.id}</td>
                  <td><strong>{subj.name}</strong></td>
                  <td>{subj.academic_class?.name || 'N/A'}</td>
                  <td>{subj.teacher?.name || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="nexus-action-control" style={{ justifyContent: 'flex-end' }}>
                      <button className="nexus-action-btn edit" onClick={() => handleEditClick(subj)}><Edit size={16} /></button>
                      <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(subj)}><Trash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-title">
                <div className="title-icon"><BookOpen size={20} /></div>
                <h3>{isEditing ? 'Edit Subject' : 'Register New Subject'}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <form id="nexus-subject-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text" placeholder="e.g. Advanced Operating Systems"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Select Classes *</label>
                  <p className="field-hint">Choose all classes that have this subject.</p>
                  <div className="multi-chip-selector" style={{ marginBottom: '20px' }}>
                    {classes.map(c => {
                      const isSel = selectedClasses.find(x => x.id === c.id);
                      return (
                        <button key={c.id} type="button"
                          className={`course-chip-btn ${isSel ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSel) {
                              // If it was the original class being edited, maybe don't allow removal or handle carefully
                              // But for now, just standard toggle
                              setSelectedClasses(prev => prev.filter(x => x.id !== c.id));
                            } else {
                              const defaultTeacherId = (c.teacher_ids && c.teacher_ids.length > 0) ? c.teacher_ids[0] : '';
                              setSelectedClasses(prev => [...prev, { id: c.id, name: c.name, teacher_id: defaultTeacherId }]);
                            }
                          }}
                        >
                          {c.name} {isSel && <CheckCircle2 size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedClasses.length > 0 && (
                  <div className="class-assignment-list" style={{ border: '1px solid #eee', borderRadius: '12px', padding: '15px', background: '#fafafa' }}>
                    <h5 style={{ marginBottom: '10px', fontSize: '0.85rem', color: '#64748b' }}>Teacher Assignments & Configuration</h5>
                    {selectedClasses.map((cls, idx) => {
                      const fullCls = classes.find(c => c.id === cls.id);
                      return (
                        <div key={cls.id} className="assignment-item" style={{ marginBottom: '15px' }}>
                          <div className="assignment-row" style={{
                            background: 'white', border: '1px solid #e2e8f0', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', padding: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>{cls.name}</div>
                              {cls.original_id && <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>Existing Record</span>}
                            </div>
                            <NexusSelect
                              options={teachers.filter(t => t.is_active).map(t => ({ label: t.name, value: t.id }))}
                              value={cls.teacher_id}
                              onChange={val => {
                                const next = [...selectedClasses];
                                next[idx].teacher_id = val;
                                setSelectedClasses(next);
                              }}
                              placeholder="Assign Teacher…"
                            />
                          </div>

                          {/* Sub-card with inherited info */}
                          <div style={{
                            background: 'rgba(61, 49, 255, 0.02)',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderBottomLeftRadius: '8px',
                            borderBottomRightRadius: '8px',
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase' }}>Dept / Course</div>
                              <div style={{ fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {fullCls?.department?.name} / {fullCls?.course?.name}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase' }}>Semester / Spec</div>
                              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                                Sem {fullCls?.semester} | {fullCls?.course?.specialization?.name || 'General'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <SubmitButton
                form="nexus-subject-form"
                loading={isSubmitting}
                text={isEditing ? 'Update Subject' : 'Create Subject'}
                loadingText={isEditing ? 'Updating...' : 'Registering...'}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Subject?"
        description={<>Removing <strong>{subjectToDelete?.name}</strong> will remove it from all course evaluations. Continue?</>}
        icon={<Trash size={32} />}
        iconBgColor="#fff1f0"
        iconColor="#ff4d4f"
        confirmText="Remove Subject"
        confirmBgColor="#ff4d4f"
        confirmHoverShadow="0 8px 15px rgba(255, 77, 79, 0.2)"
      />
    </div>
  );
}
