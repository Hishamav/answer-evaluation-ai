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
  Check,
  Star,
  Layers
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import NexusSelect from '../components/NexusSelect';
import SubmitButton from '../components/SubmitButton';
import './Departments.css';

const API_BASE_URL = 'http://localhost:8000';

export default function Departments() {
  const [activeTab, setActiveTab] = useState('depts'); // 'depts' or 'courses'
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', year: '', description: '', course_ids: [] });
  const [courseForm, setCourseForm] = useState({ name: '', description: '', specialization_id: '' });
  const [specForm, setSpecForm] = useState({ name: '', description: '' });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete confirm states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsRes, coursesRes, specsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/departments/`),
        fetch(`${API_BASE_URL}/courses/`),
        fetch(`${API_BASE_URL}/specializations/`)
      ]);
      setDepartments(await deptsRes.json());
      setCourses(await coursesRes.json());
      setSpecializations(await specsRes.json());
    } catch (error) {
      toast.error("Error", "Could not load academic data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isDept = activeTab === 'depts';
    const isCourse = activeTab === 'courses';
    const isSpec = activeTab === 'specs';
    
    let url = '';
    let payload = null;
    
    if (isDept) { url = `${API_BASE_URL}/departments/`; payload = deptForm; }
    else if (isCourse) { url = `${API_BASE_URL}/courses/`; payload = courseForm; }
    else if (isSpec) { url = `${API_BASE_URL}/specializations/`; payload = specForm; }
    
    // Simple validation (mandatory fields)
    if (isDept && (!deptForm.name || !deptForm.year || deptForm.course_ids.length === 0)) {
        toast.error("Validation Error", "Name, Year and at least one Course are mandatory.");
        setIsSubmitting(false);
        return;
    }
    if (isCourse && !courseForm.name) {
        toast.error("Validation Error", "Course Name is mandatory.");
        setIsSubmitting(false);
        return;
    }
    if (isSpec && !specForm.name) {
        toast.error("Validation Error", "Specialization Name is mandatory.");
        setIsSubmitting(false);
        return;
    }

    const method = isEditing ? 'PUT' : 'POST';
    const finalUrl = isEditing ? `${url}${editingId}` : url;

    try {
      const res = await fetch(finalUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const entityName = isDept ? 'Department' : isCourse ? 'Course' : 'Specialization';
        toast.success(isEditing ? "Updated" : "Created", `${entityName} saved successfully.`);
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error("Error", err.detail || "Action failed.");
      }
    } catch (error) {
        toast.error("Server Error", "Could not process request.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    if (activeTab === 'depts') {
      setDeptForm({ 
        name: item.name, 
        year: item.year, 
        description: item.description, 
        course_ids: item.courses.map(c => c.id) 
      });
    } else if (activeTab === 'courses') {
      setCourseForm({ name: item.name, description: item.description, specialization_id: item.specialization_id || '' });
    } else {
      setSpecForm({ name: item.name, description: item.description });
    }
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    let url = '';
    if (activeTab === 'depts') url = `${API_BASE_URL}/departments/`;
    else if (activeTab === 'courses') url = `${API_BASE_URL}/courses/`;
    else url = `${API_BASE_URL}/specializations/`;

    try {
      const res = await fetch(`${url}${itemToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Deleted", "Item removed successfully.");
        setShowDeleteModal(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error("Error", data.detail || "Action failed.");
      }
    } catch (error) {
        toast.error("Error", "Action failed.");
    } finally {
        setShowDeleteModal(false);
    }
  };

  const resetForms = () => {
    setDeptForm({ name: '', year: '', description: '', course_ids: [] });
    setCourseForm({ name: '', description: '', specialization_id: '' });
    setSpecForm({ name: '', description: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const toggleCourseInDept = (courseId) => {
    setDeptForm(prev => {
        const ids = [...prev.course_ids];
        if (ids.includes(courseId)) {
            return { ...prev, course_ids: ids.filter(id => id !== courseId) };
        } else {
            return { ...prev, course_ids: [...ids, courseId] };
        }
    });
  };

  const filteredItems = (activeTab === 'depts' ? departments : activeTab === 'courses' ? courses : specializations).filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="departments-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Academic Management</h2>
          <p>Organize your departments and their curriculum courses.</p>
        </div>
        <div className="tab-control">
          <button 
            className={`tab-btn ${activeTab === 'depts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('depts'); resetForms(); }}
          >
            <Building2 size={18} />
            <span>Departments</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('courses'); resetForms(); }}
          >
            <BookOpen size={18} />
            <span>Courses</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('specs'); resetForms(); }}
          >
            <Star size={18} />
            <span>Specializations</span>
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="nexus-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <Search size={18} className="nexus-search-icon" style={{ position: 'absolute', left: '10px', pointerEvents: 'none', zIndex: 1 }} />
  <input 
    type="text" 
    placeholder={`Search ${activeTab}...`} 
    className="nexus-toolbar-search-input"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    style={{ paddingLeft: '34px' }}
  />
</div>
        
        <div className="action-row">
            <div className="nexus-view-toggle">
                <button className={`nexus-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
                <button className={`nexus-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><TableIcon size={18} /></button>
            </div>
            <button className="btn-primary add-dept-btn" onClick={() => { resetForms(); setShowModal(true); }}>
                <Plus size={18} />
                <span>Add {activeTab === 'depts' ? 'Dept' : activeTab === 'courses' ? 'Course' : 'Specialization'}</span>
            </button>
        </div>
      </div>

      {loading ? (
        <div className="dept-empty"><p>Syncing Academic Nexus...</p></div>
      ) : filteredItems.length === 0 ? (
        <div className="dept-empty">
          <div className="empty-icon">{activeTab === 'depts' ? <Building2 size={48} /> : activeTab === 'courses' ? <BookOpen size={48} /> : <Star size={48} />}</div>
          <h3>No {activeTab} Listed</h3>
          <p>Click the "Add" button to register your academic node.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="dept-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="dept-card">
              <div className="card-top">
                <div className="dept-icon-wrapper">{activeTab === 'depts' ? <Building2 size={24} /> : activeTab === 'courses' ? <BookOpen size={24} /> : <Star size={24} />}</div>
                <div className="nexus-action-control">
                  <button className="nexus-action-btn edit" onClick={() => handleEditClick(item)}><Edit size={16} /></button>
                  <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(item)}><Trash size={16} /></button>
                </div>
              </div>
              <div className="card-content">
                <h3>{item.name}</h3>
                {activeTab === 'courses' && (
                  <>
                    {item.specialization && (
                      <div className="dept-meta-info" style={{marginBottom: '8px'}}>
                          <span className="meta-badge"><Star size={12} /> {item.specialization.name}</span>
                      </div>
                    )}
                    <div className="dept-meta-info" style={{marginBottom: '8px'}}>
                        <span className="meta-badge"><Building2 size={12} /> {item.departments?.map(d => d.name).join(', ') || 'No Departments'}</span>
                    </div>
                  </>
                )}
                {activeTab === 'depts' && (
                  <>
                    <div className="dept-meta-info">
                        <span className="meta-badge"><Calendar size={12} /> {item.year}</span>
                        <span className="meta-badge"><Layers size={12} /> {item.courses?.length || 0} Courses</span>
                    </div>
                    <div className="course-list-preview">
                        {item.courses?.map(c => <span key={c.id} className="mini-pill">{c.name}</span>)}
                    </div>
                  </>
                )}
                <p className="item-desc">{item.description || 'No detailed description available.'}</p>
              </div>
              <div className="card-footer">
                <span className="dept-meta">ID: {item.id}</span>
                <div className="dept-status-pill">Operational</div>
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
                <th>Name</th>
                {activeTab === 'depts' && <th>Year</th>}
                {activeTab === 'depts' && <th>Mapped Courses</th>}
                {activeTab === 'courses' && <th>Specialization</th>}
                {activeTab === 'courses' && <th>Departments</th>}
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td><strong>{item.name}</strong></td>
                  {activeTab === 'depts' && <td>{item.year}</td>}
                  {activeTab === 'depts' && (
                    <td>{item.courses?.map(c => c.name).join(', ') || 'No Courses'}</td>
                  )}
                  {activeTab === 'courses' && (
                    <>
                      <td>{item.specialization?.name || '-'}</td>
                      <td>{item.departments?.map(d => d.name).join(', ') || 'No Departments'}</td>
                    </>
                  )}
                  <td style={{ textAlign: 'right' }}>
                    <div className="nexus-action-control" style={{ justifyContent: 'flex-end' }}>
                      <button className="nexus-action-btn edit" onClick={() => handleEditClick(item)}><Edit size={16} /></button>
                      <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(item)}><Trash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-title">
                <div className="title-icon">{activeTab === 'depts' ? <Building2 size={20} /> : activeTab === 'courses' ? <BookOpen size={20} /> : <Star size={20} />}</div>
                <h3>{isEditing ? 'Update' : 'Create'} {activeTab === 'depts' ? 'Department' : activeTab === 'courses' ? 'Course' : 'Specialization'}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div className="modal-body">
                <form id="nexus-dept-course-form" onSubmit={handleCreate} className="modal-form">
                {activeTab === 'depts' ? (
                    <>
                    <div className="form-group">
                        <label>Department Name <span className="req">*</span></label>
                        <input 
                        type="text" placeholder="e.g. Science & Tech" 
                        value={deptForm.name} 
                        onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} 
                        required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Academic Year <span className="req">*</span></label>
                        <input 
                        type="text" placeholder="e.g. 2024" 
                        value={deptForm.year} 
                        onChange={(e) => setDeptForm({...deptForm, year: e.target.value})} 
                        required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Assigned Courses <span className="req">*</span></label>
                        <div className="multi-select-box">
                            {courses.length === 0 ? (
                                <p className="no-data-hint">Please register courses first to map them here.</p>
                            ) : (
                                courses.map(c => (
                                    <div 
                                        key={c.id} 
                                        className={`select-chip ${deptForm.course_ids.includes(c.id) ? 'active' : ''}`}
                                        onClick={() => toggleCourseInDept(c.id)}
                                    >
                                        {deptForm.course_ids.includes(c.id) && <Check size={14} />}
                                        <span>{c.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Internal Summary</label>
                        <textarea 
                        placeholder="Organization details..." 
                        value={deptForm.description} 
                        onChange={(e) => setDeptForm({...deptForm, description: e.target.value})} 
                        rows={3}
                        />
                    </div>
                    </>
                ) : activeTab === 'courses' ? (
                    <>
                    <div className="form-group">
                        <label>Course Name <span className="req">*</span></label>
                        <input 
                        type="text" placeholder="e.g. Discrete Mathematics" 
                        value={courseForm.name} 
                        onChange={(e) => setCourseForm({...courseForm, name: e.target.value})} 
                        required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Specialization</label>
                        <br />
                        <NexusSelect 
                            options={specializations.map(s => ({ label: s.name, value: s.id }))}
                            value={courseForm.specialization_id}
                            onChange={(val) => setCourseForm({...courseForm, specialization_id: val})}
                            placeholder="Select Specialization"
                        />
                    </div>

                    <div className="form-group" style={{marginTop: '10px'}}>
                    <label>Course Syllabus Overview</label>
                        <textarea 
                        placeholder="Briefly describe what this course covers..." 
                        value={courseForm.description} 
                        onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} 
                        rows={5}
                        />
                    </div>
                    </>
                ) : (
                    <>
                    <div className="form-group">
                        <label>Specialization Name <span className="req">*</span></label>
                        <input 
                        type="text" placeholder="e.g. Software Engineering" 
                        value={specForm.name} 
                        onChange={(e) => setSpecForm({...specForm, name: e.target.value})} 
                        required 
                        />
                    </div>
                    <div className="form-group">
                    <label>Description</label>
                        <textarea 
                        placeholder="Details about this specialization..." 
                        value={specForm.description} 
                        onChange={(e) => setSpecForm({...specForm, description: e.target.value})} 
                        rows={5}
                        />
                    </div>
                    </>
                )}
                </form>
            </div>
            
            <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <SubmitButton 
                  form="nexus-dept-course-form" 
                  loading={isSubmitting} 
                  text={isEditing ? 'Push Updates' : `Create ${activeTab==='depts'?'Dept':activeTab==='courses'?'Course':'Specialization'}`} 
                  loadingText={isEditing ? 'Updating...' : `Creating...`} 
                />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={`Remove ${activeTab === 'depts' ? 'Department' : activeTab === 'courses' ? 'Course' : 'Specialization'}?`}
        description={<>Removing <strong>{itemToDelete?.name}</strong> is permanent and will detach all associated academic links. Proceed with caution.</>}
        icon={<Trash size={32} />}
        iconBgColor="#fff1f0"
        iconColor="#ff4d4f"
        confirmText="Yes, Delete"
        confirmBgColor="#ff4d4f"
        confirmHoverShadow="0 8px 15px rgba(255, 77, 79, 0.2)"
      />
    </div>
  );
}
