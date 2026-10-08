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
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { useToast } from '../components/Toast';
import NexusSelect from '../components/NexusSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import SubmitButton from '../components/SubmitButton';
import './Classes.css';

const API_BASE_URL = 'http://localhost:8000';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('');

  
  const [classForm, setClassForm] = useState({ 
    name: '', 
    department_id: '', 
    course_id: '',
    academic_year: '', 
    semester: '',
    teacher_ids: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, deptsRes, coursesRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/classes/`),
        fetch(`${API_BASE_URL}/departments/`),
        fetch(`${API_BASE_URL}/courses/`),
        fetch(`${API_BASE_URL}/teachers/`)
      ]);
      const classesData = await classesRes.json();
      const deptsData = await deptsRes.json();
      const coursesData = await coursesRes.json();
      const teachersData = await teachersRes.json();
      setClasses(classesData);
      setDepartments(deptsData);
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (error) {
      toast.error("Error", "Failed to load academic data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (cls) => {
    setClassForm({ 
      name: cls.name, 
      department_id: cls.department_id,
      course_id: cls.course_id || '', 
      academic_year: cls.academic_year, 
      semester: cls.semester,
      teacher_ids: cls.teacher_ids || []
    });
    setIsEditing(true);
    setEditingClassId(cls.id);
    setShowModal(true);
  };

  const handleDeleteClick = (cls) => {
    setClassToDelete(cls);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes/${classToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Deleted", "Class removed successfully.");
        setShowDeleteModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error("Delete Error", err.detail || "Could not delete class.");
      }

    } catch (error) {
      toast.error("Error", "Could not delete class.");
    }
  };

  const openAddModal = () => {
    setClassForm({ name: '', department_id: '', course_id: '', academic_year: '', semester: '', teacher_ids: [] });
    setIsEditing(false);
    setEditingClassId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const url = isEditing ? `${API_BASE_URL}/classes/${editingClassId}` : `${API_BASE_URL}/classes/`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      ...classForm,
      department_id: Number(classForm.department_id),
      course_id: (classForm.course_id === '' || classForm.course_id === undefined) ? null : Number(classForm.course_id)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(isEditing ? "Updated" : "Created", "Academic class saved successfully.");
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error("Save Error", err.detail || "Failed to save academic class.");
      }

    } catch (error) {
      toast.error("Error", "Failed to save class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.department?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !filterDeptId || String(c.department_id) === String(filterDeptId);
    return matchesSearch && matchesDept;
  });


  return (
    <div className="departments-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Academic Classes</h2>
          <p>Organize year-groups and semesters within your departments.</p>
        </div>
        <button className="btn-primary add-dept-btn" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Class</span>
        </button>
      </div>

      <div className="toolbar">
        <div className="nexus-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <Search size={18} className="nexus-search-icon" style={{ position: 'absolute', left: '10px', pointerEvents: 'none', zIndex: 1 }} />
  <input 
    type="text" 
    placeholder="Search classes..." 
    className="nexus-toolbar-search-input"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    style={{ paddingLeft: '34px' }}
  />
</div>

<div className="filter-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '300px' }}>
  <NexusSelect
    options={[{ label: 'All Departments', value: '' }, ...departments.map(d => ({ label: d.name, value: d.id }))]}
    value={filterDeptId}
    onChange={setFilterDeptId}
    placeholder="Filter by Dept"
  />
</div>

        
        <div className="nexus-view-toggle">
          <button className={`nexus-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
          <button className={`nexus-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><TableIcon size={18} /></button>
        </div>
      </div>

      {filteredClasses.length === 0 && !loading ? (
        <div className="dept-empty">
           <div className="empty-icon"><GraduationCap size={48} /></div>
           <h3>No Classes Found</h3>
           <p>Start organizing your academic structure.</p>
        </div>
      ) : loading ? null : viewMode === 'grid' ? (

        <div className="dept-grid">
          {filteredClasses.map(cls => (
            <div key={cls.id} className="dept-card">
              <div className="card-top">
                <div className="dept-icon-wrapper"><GraduationCap size={24} /></div>
                <div className="nexus-action-control">
                  <button className="nexus-action-btn edit" onClick={() => handleEditClick(cls)}><Edit size={16} /></button>
                  <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(cls)}><Trash size={16} /></button>
                </div>
              </div>
              <div className="card-content">
                <h3>{cls.name}</h3>
                <div className="class-pills">
                  <span className="pill-item"><Building2 size={12} /> {cls.department?.name}</span>
                  {cls.course && <span className="pill-item"><Layers size={12} /> {cls.course.name}</span>}
                  <span className="pill-item"><Calendar size={12} /> {cls.academic_year}</span>
                </div>
                <p className="semester-info">Semester: <strong>{cls.semester}</strong></p>
              </div>
              <div className="card-footer">
                <span className="dept-meta">CLASS ID: {cls.id}</span>
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
                <th style={{ width: '200px' }}>Class Name</th>
                <th>Department</th>
                <th>Course</th>
                <th>Year</th>
                <th>Semester</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => (
                <tr key={cls.id}>
                  <td>#{cls.id}</td>
                  <td><strong>{cls.name}</strong></td>
                  <td>{cls.department?.name}</td>
                  <td>{cls.course?.name || '-'}</td>
                  <td>{cls.academic_year}</td>
                  <td>{cls.semester}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="nexus-action-control" style={{ justifyContent: 'flex-end' }}>
                      <button className="nexus-action-btn edit" onClick={() => handleEditClick(cls)}><Edit size={16} /></button>
                      <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(cls)}><Trash size={16} /></button>
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
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-title">
                <div className="title-icon"><GraduationCap size={20} /></div>
                <h3>{isEditing ? 'Edit Academic Class' : 'Register New Class'}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div className="modal-body">
                <form id="nexus-class-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>Class Name</label>
                    <input 
                    type="text" placeholder="e.g. FY-CS-A" 
                    value={classForm.name} 
                    onChange={(e) => setClassForm({...classForm, name: e.target.value})} 
                    required 
                    />
                </div>

                <div className="form-group">
                    <label>Department</label>
                    <NexusSelect 
                      options={departments.map(d => ({ label: d.name, value: d.id }))}
                      value={classForm.department_id}
                      onChange={(val) => setClassForm({...classForm, department_id: val, course_id: ''})}
                      placeholder="Select Department"
                      required
                    />
                </div>

                <div className="form-group">
                    <label>Course</label>
                    <NexusSelect 
                      options={(() => {
                        const selectedDept = departments.find(d => String(d.id) === String(classForm.department_id));
                        const availableCourses = selectedDept ? selectedDept.courses : [];
                        return availableCourses.map(c => ({ 
                          label: `${c.name} (${c.specialization?.name || 'No Specialization'})`, 
                          value: c.id 
                        }));
                      })()}
                      value={classForm.course_id}
                      onChange={(val) => setClassForm({...classForm, course_id: val})}
                      placeholder={classForm.department_id ? "Select Course" : "Select Department First"}
                      disabled={!classForm.department_id}
                      required
                    />
                </div>

                <div className="form-group">
                    <label>Academic Year</label>
                    <input 
                    type="text" placeholder="e.g. 2024-25" 
                    value={classForm.academic_year} 
                    onChange={(e) => setClassForm({...classForm, academic_year: e.target.value})} 
                    required 
                    />
                </div>
                <div className="form-group">
                    <label>Semester</label>
                    <NexusSelect 
                      options={[
                        { label: '1st Semester', value: '1' },
                        { label: '2nd Semester', value: '2' },
                        { label: '3rd Semester', value: '3' },
                        { label: '4th Semester', value: '4' },
                        { label: '5th Semester', value: '5' },
                        { label: '6th Semester', value: '6' },
                        { label: '7th Semester', value: '7' },
                        { label: '8th Semester', value: '8' },
                      ]}
                      value={classForm.semester}
                      onChange={(val) => setClassForm({...classForm, semester: val})}
                      placeholder="Select Semester"
                      required
                    />
                </div>

                <div className="form-group">
                    <label>Assign Teachers</label>
                    <div className="multi-select-box">
                      {teachers.map(teacher => (
                        <div 
                          key={teacher.id}
                          className={`select-chip ${classForm.teacher_ids.includes(teacher.id) ? 'active' : ''}`}
                          onClick={() => {
                            const newIds = classForm.teacher_ids.includes(teacher.id)
                              ? classForm.teacher_ids.filter(id => id !== teacher.id)
                              : [...classForm.teacher_ids, teacher.id];
                            setClassForm({...classForm, teacher_ids: newIds});
                          }}
                        >
                          {teacher.name} {classForm.teacher_ids.includes(teacher.id) && <CheckCircle2 size={14} />}
                        </div>
                      ))}
                      {teachers.length === 0 && <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>No teachers available.</span>}
                    </div>
                </div>
                </form>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <SubmitButton 
                  form="nexus-class-form" 
                  loading={isSubmitting} 
                  text={isEditing ? 'Update Class' : 'Create Class'} 
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
        title="Delete Academic Class?"
        description={<>Removing <strong>{classToDelete?.name}</strong> will affect all linked evaluation streams. Continue?</>}
        icon={<Trash size={32} />}
        iconBgColor="#fff1f0"
        iconColor="#ff4d4f"
        confirmText="Remove Class"
        confirmBgColor="#ff4d4f"
        confirmHoverShadow="0 8px 15px rgba(255, 77, 79, 0.2)"
      />
    </div>
  );
}
