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
  Users,
  Phone,
  Camera,
  User
} from 'lucide-react';

import { useToast } from '../components/Toast';
import NexusSelect from '../components/NexusSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import SubmitButton from '../components/SubmitButton';
import './Classes.css';
import './Teachers.css';

const API_BASE_URL = 'http://localhost:8000';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  
  const [teacherForm, setTeacherForm] = useState({ 
    name: '', 
    department_id: '',
    phone: '', 
    profile_image: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/teachers/`),
        fetch(`${API_BASE_URL}/departments/`)
      ]);
      const teachersData = await teachersRes.json();
      const deptsData = await deptsRes.json();
      setTeachers(teachersData);
      setDepartments(deptsData);
    } catch (error) {
      toast.error("Error", "Failed to load academic data.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setTeacherForm({ name: '', department_id: '', phone: '', profile_image: '' });
    setIsEditing(false);
    setEditingTeacherId(null);
    setShowModal(true);
  };

  const handleEditClick = (teacher) => {
    setTeacherForm({
      name: teacher.name,
      department_id: teacher.department_id || '',
      phone: teacher.phone || '',
      profile_image: teacher.profile_image || ''
    });

    setIsEditing(true);
    setEditingTeacherId(teacher.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = isEditing ? `${API_BASE_URL}/teachers/${editingTeacherId}` : `${API_BASE_URL}/teachers/`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(isEditing ? "Updated" : "Created", isEditing ? "Teacher profile seamlessly updated." : "Teacher added to registry.");
        setShowModal(false);
        fetchData();
      } else {
        toast.error("Error", data.detail || `Failed to ${isEditing ? 'update' : 'create'} teacher.`);
      }
    } catch (error) {
      toast.error("Error", "Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/teachers/${teacherToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Removed", "Teacher removed from registry.");
        fetchData();
      } else {
        const data = await res.json();
        toast.error("Error", data.detail || "Could not remove teacher.");
      }
    } catch (error) {
      toast.error("Error", "Could not remove teacher.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Constraint", "Image must be under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeacherForm({ ...teacherForm, profile_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (t.department?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = !filterDeptId || String(t.department_id) === String(filterDeptId);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="departments-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Teachers Registry</h2>
          <p>Institutional directory of teaching faculty (No login required).</p>
        </div>
        <button className="btn-primary add-dept-btn" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Teacher</span>
        </button>
      </div>

      <div className="toolbar">
        <div className="nexus-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} className="nexus-search-icon" style={{ position: 'absolute', left: '10px', pointerEvents: 'none', zIndex: 1 }} />
          <input 
            type="text" 
            placeholder="Search teachers..." 
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

      {loading ? (
        <div className="dept-empty"><p>Syncing Registry...</p></div>
      ) : filteredTeachers.length === 0 ? (
        <div className="dept-empty">
           <div className="empty-icon"><Users size={48} /></div>
           <h3>No Teachers Found</h3>
           <p>Start building your institutional teacher directory.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="dept-grid">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="dept-card">
              <div className="card-top">
                <div className="dept-icon-wrapper">
                  {teacher.profile_image ? (
                    <img src={teacher.profile_image} alt={teacher.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                  ) : (
                    <Users size={24} />
                  )}
                </div>

                <div className="nexus-action-control">
                  <button className="nexus-action-btn edit" onClick={() => handleEditClick(teacher)}><Edit size={16} /></button>
                  <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(teacher)}><Trash size={16} /></button>
                </div>
              </div>
              <div className="card-content">
                <h3>{teacher.name}</h3>
                <div className="class-pills" style={{ marginTop: '10px' }}>
                  {teacher.department && <span className="pill-item"><Building2 size={12} /> {teacher.department.name}</span>}
                  {teacher.phone && <span className="pill-item"><Phone size={12} /> {teacher.phone}</span>}
                </div>
              </div>
              <div className="card-footer">
                <span className="dept-meta">ID: {teacher.id}</span>
                <div className="dept-status-pill active">Registered</div>
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
                <th style={{ width: '250px' }}>Teacher Name</th>
                <th>Department</th>
                <th>Phone</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>#{teacher.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {teacher.profile_image ? (
                         <img src={teacher.profile_image} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                         <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="#94a3b8" />
                         </div>
                      )}
                      <strong>{teacher.name}</strong>
                    </div>
                  </td>
                  <td>{teacher.department?.name || '-'}</td>
                  <td>{teacher.phone || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="nexus-action-control" style={{ justifyContent: 'flex-end' }}>
                      <button className="nexus-action-btn edit" onClick={() => handleEditClick(teacher)}><Edit size={16} /></button>
                      <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(teacher)}><Trash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-title">
                <div className="title-icon"><Users size={20} /></div>
                <h3>{isEditing ? 'Edit Teacher' : 'Add Teacher'}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div className="modal-body">
                <form id="nexus-teacher-form" onSubmit={handleSubmit} className="modal-form">
                  <div className="profile-upload-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
                    <div className="image-preview-ring" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--primary-color)', padding: '5px', position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
                       {teacherForm.profile_image ? (
                          <img src={teacherForm.profile_image} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                       ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Camera size={32} color="#94a3b8" />
                          </div>
                       )}
                       <label htmlFor="teacher-img-upload" style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary-color)', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                          <Plus size={14} />
                       </label>
                    </div>
                    <input type="file" id="teacher-img-upload" hidden accept="image/*" onChange={handleImageUpload} />
                  </div>

                  <div className="form-group">
                      <label>Teacher Name *</label>
                      <input 
                        type="text" placeholder="e.g. Dr. A. Smith" 
                        value={teacherForm.name} 
                        onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})} 
                        required 
                      />
                  </div>

                  <div className="form-group">
                      <label>Department</label>
                      <NexusSelect 
                        options={departments.map(d => ({ label: d.name, value: d.id }))}
                        value={teacherForm.department_id}
                        onChange={(val) => setTeacherForm({...teacherForm, department_id: val})}
                        placeholder="Select Department"
                      />
                  </div>

                  <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="text" placeholder="+1..." 
                        value={teacherForm.phone} 
                        onChange={(e) => setTeacherForm({...teacherForm, phone: e.target.value})} 
                      />
                  </div>
                </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <SubmitButton 
                form="nexus-teacher-form" 
                loading={isSubmitting} 
                text={isEditing ? 'Save Changes' : 'Register Teacher'} 
                loadingText="Processing..." 
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        title="Remove Teacher?"
        description={<>Are you sure you want to remove <strong>{teacherToDelete?.name}</strong> from the registry? This will affect linked subjects and timetables.</>}
        icon={<Trash size={32} />}
        confirmText="Remove"
      />
    </div>
  );
}
