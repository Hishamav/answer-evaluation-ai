import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash,
  UserCheck,
  UserX,
  Users,
  Mail,
  Copy,
  CheckCircle2,
  Download,
  Building2,
  Layers,
  GraduationCap,
  Calendar,
  X,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  Camera,
  User,
  FileText
} from 'lucide-react';

import { useToast } from '../components/Toast';
import NexusSelect from '../components/NexusSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import SubmitButton from '../components/SubmitButton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Classes.css';
import './Teachers.css';
import './Students.css';

const API_BASE_URL = 'http://localhost:8000';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('');

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showModal, setShowModal] = useState(false);
  const [entryMode, setEntryMode] = useState('single'); // 'single' or 'bulk'
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [studentToToggle, setStudentToToggle] = useState(null);
  
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedStudentResults, setSelectedStudentResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [evaluatingResult, setEvaluatingResult] = useState(null);
  const [evalForm, setEvalForm] = useState({ comment: '', marks: '', role: 'teacher' });

  // Auto-filled info based on class selection
  const [selectedClassInfo, setSelectedClassInfo] = useState(null);

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    registration_id: '',
    phone: '',
    class_id: '',
    profile_image: ''
  });


  const [bulkStudents, setBulkStudents] = useState([
    { id: Date.now(), name: '', email: '', registration_id: '', phone: '', class_id: '', classInfo: null }
  ]);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/students/`),
        fetch(`${API_BASE_URL}/classes/`)
      ]);
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      toast.error("Error", "Failed to load students data.");
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId, isBulk = false, index = null) => {
    const cls = classes.find(c => c.id === parseInt(classId));
    if (isBulk) {
        const updatedBulk = [...bulkStudents];
        updatedBulk[index] = { ...updatedBulk[index], class_id: classId, classInfo: cls };
        setBulkStudents(updatedBulk);
    } else {
        setStudentForm({ ...studentForm, class_id: classId });
        setSelectedClassInfo(cls);
    }
  };

  const addBulkRow = () => {
    setBulkStudents([...bulkStudents, { id: Date.now(), name: '', email: '', registration_id: '', phone: '', class_id: '', classInfo: null }]);
  };

  const removeBulkRow = (id) => {
    if (bulkStudents.length > 1) {
        setBulkStudents(bulkStudents.filter(s => s.id !== id));
    }
  };

  const updateBulkRow = (index, field, value) => {
    const updatedBulk = [...bulkStudents];
    updatedBulk[index][field] = value;
    setBulkStudents(updatedBulk);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (entryMode === 'single') {
        const url = isEditing ? `${API_BASE_URL}/students/${editingStudentId}` : `${API_BASE_URL}/students/`;
        const method = isEditing ? 'PUT' : 'POST';
        
        const payload = {
          ...studentForm,
          class_id: studentForm.class_id ? Number(studentForm.class_id) : null,
          registration_id: studentForm.registration_id || null,
          phone: studentForm.phone || null
        };

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Success", isEditing ? "Student updated." : "Student created.");
          if (!isEditing) {
            setCreatedCredentials([{ email: data.student.email, password: data.password, name: data.student.name }]);
          } else {
            setShowModal(false);
          }
          fetchData();
        } else {
          toast.error("Error", data.detail || "Failed to save student.");
        }
      } else {
        // Bulk mode
        const payload = {
          students: bulkStudents.map(({name, email, registration_id, phone, class_id}) => ({
            name,
            email,
            registration_id: registration_id || null,
            phone: phone || null,
            class_id: class_id ? Number(class_id) : null
          }))
        };

        const res = await fetch(`${API_BASE_URL}/students/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            toast.success("Bulk Success", `${data.created_students.length} students created.`);
            setCreatedCredentials(data.created_students.map(c => ({
                name: c.student.name,
                email: c.student.email,
                password: c.password
            })));
            fetchData();
        } else {
            toast.error("Bulk Error", "Failed to create students in bulk.");
        }
      }
    } catch (error) {
      toast.error("Error", "Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (student) => {
    setStudentForm({
      name: student.name,
      email: student.email,
      registration_id: student.registration_id || '',
      phone: student.phone || '',
      class_id: student.class_id,
      profile_image: student.profile_image || ''
    });

    const cls = classes.find(c => c.id === student.class_id);
    setSelectedClassInfo(cls);
    setIsEditing(true);
    setEditingStudentId(student.id);
    setEntryMode('single');
    setShowModal(true);
    setCreatedCredentials(null);
  };

  const handleToggleStatus = (student) => {
    setStudentToToggle(student);
    setShowStatusConfirmModal(true);
  };

  const executeToggleStatus = async () => {
    if (!studentToToggle) return;
    setShowStatusConfirmModal(false);
    try {
      const newStatus = !studentToToggle.is_active;
      const res = await fetch(`${API_BASE_URL}/students/${studentToToggle.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(newStatus ? "Activated" : "Deactivated", `Student account ${newStatus ? 'activated' : 'deactivated'}.`);
        if (newStatus && data.password) {
          setCreatedCredentials([{ 
            name: data.student.name, 
            email: data.student.email, 
            password: data.password 
          }]);
          setShowModal(true);
        }
        fetchData();
      } else {
        toast.error("Error", data.detail || "Failed to update status.");
      }
    } catch (error) {
      toast.error("Error", "Failed to update status.");
    }
  };

  const fetchStudentResults = async (studentId) => {
    setLoadingResults(true);
    setSelectedStudentResults([]);
    try {
        const res = await fetch(`${API_BASE_URL}/api/results/student/${studentId}`);
        if (res.ok) {
            setSelectedStudentResults(await res.json());
        }
    } catch {
        toast.error("Error", "Could not fetch student results.");
    } finally {
        setLoadingResults(false);
    }
  };

  const submitEvaluation = async () => {
    if (!evalForm.comment || !evalForm.marks) {
        toast.error("Required", "Please provide both comment and marks.");
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/api/results/${evaluatingResult.id}/evaluate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(evalForm)
        });
        if (res.ok) {
            toast.success("Success", "Evaluation updated successfully.");
            setEvaluatingResult(null);
            fetchStudentResults(evaluatingResult.student_id);
            fetchData();
        }
    } catch {
        toast.error("Error", "Failed to submit evaluation.");
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
        setStudentForm({ ...studentForm, profile_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (text, key) => {

    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Student Portal Credentials", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text("Academic Evaluation Nexus AI - Official Student Accounts", 14, 30);
    
    const tableData = createdCredentials.map(c => [c.name, c.email, c.password]);
    autoTable(doc, {
      head: [['Name', 'Email/Username', 'Initial Password']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [61, 49, 255] },
      margin: { top: 40 }
    });
    
    doc.save(`student_credentials_${Date.now()}.pdf`);
  };

  const filteredStudents = Array.isArray(students) ? students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.registration_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.academic_class?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !filterClassId || String(s.class_id) === String(filterClassId);
    return matchesSearch && matchesClass;
  }) : [];


  return (
    <div className="departments-page">
      <div className="page-header">
        <div className="header-text">
          <h2>Student Management</h2>
          <p>Register and manage student credentials and class allocations.</p>
        </div>
        <div className="header-actions-group">
            <button className="btn-primary add-dept-btn" onClick={() => { 
                setEntryMode('single'); 
                setIsEditing(false); 
                setStudentForm({name:'', email:'', phone:'', class_id:''}); 
                setSelectedClassInfo(null);
                setShowModal(true); 
                setCreatedCredentials(null);
            }}>
            <UserPlus size={18} />
            <span>Register Student</span>
            </button>
            <button className="nexus-bulk-btn add-dept-btn" onClick={() => { 
                setEntryMode('bulk'); 
                setBulkStudents([{ id: Date.now(), name: '', email: '', phone: '', class_id: '', classInfo: null }]);
                setShowModal(true); 
                setCreatedCredentials(null);
            }}>
                <FileSpreadsheet size={18} />
                <span>Bulk Provisioning</span>
            </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="nexus-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} className="nexus-search-icon" style={{ position: 'absolute', left: '10px', pointerEvents: 'none', zIndex: 1 }} />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="nexus-toolbar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', width: '300px' }}
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
            <button 
                className={`nexus-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
            >
                Table
            </button>
            <button 
                className={`nexus-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
            >
                Grid
            </button>
        </div>
      </div>

      {filteredStudents.length === 0 && !loading ? (
        <div className="dept-empty">
           <div className="empty-icon"><Users size={48} /></div>
           <h3>Registry Empty</h3>
           <p>No student accounts found for the current search.</p>
        </div>
      ) : loading ? null : viewMode === 'table' ? (

        <div className="dept-table-wrapper">
          <table className="dept-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Reg. ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} className={!student.is_active ? 'row-inactive' : ''}>
                  <td className="id-col">#{student.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {student.profile_image ? (
                        <img src={student.profile_image} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color="#94a3b8" />
                        </div>
                      )}
                      <strong>{student.registration_id || "-"}</strong>
                    </div>
                  </td>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.email}</td>

                  <td>
                    <div className="class-pills">
                        <span className="pill-item"><GraduationCap size={12} /> {student.academic_class?.name || '-'}</span>
                    </div>
                  </td>
                  <td>{student.phone || '-'}</td>
                  <td>
                    <span className={`status-badge ${student.is_active ? 'active' : 'inactive'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="nexus-action-control" style={{ justifyContent: 'flex-end' }}>
                      <button className="nexus-action-btn edit" onClick={() => handleEditClick(student)} title="Edit Student"><Edit size={16} /></button>
                      <button className="nexus-action-btn" style={{ color: '#3d31ff' }} onClick={() => fetchStudentResults(student.id)} title="View Results"><FileText size={16} /></button>
                      <button 
                         className={`nexus-action-btn ${student.is_active ? 'delete' : 'edit'}`} 
                         onClick={() => handleToggleStatus(student)}
                         title={student.is_active ? 'Deactivate' : 'Activate'}
                       >
                         {student.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="student-grid-wrapper">
            {filteredStudents.map(student => (
                <div key={student.id} className={`student-nexus-card ${!student.is_active ? 'card-inactive' : ''}`}>
                    <div className="card-top">
                        <div className="student-id-tag">Reg: {student.registration_id || 'Pending'}</div>
                        <span className={`status-pill-small ${student.is_active ? 'active' : 'inactive'}`}></span>
                    </div>
                    
                    <div className="student-avatar-large">
                        {student.profile_image ? (
                            <img src={student.profile_image} alt={student.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : student.name[0]}
                    </div>

                    
                    <div className="student-profile-info">
                        <h4>{student.name}</h4>
                        <p className="student-email-row"><Mail size={12} /> {student.email}</p>
                    </div>

                    <div className="student-class-mapping">
                         <div className="mapping-item">
                            <span className="label">Class</span>
                            <span className="value"><GraduationCap size={14} /> {student.academic_class?.name || 'Unassigned'}</span>
                         </div>
                    </div>

                    <div className="card-footer-actions">
                        <button className="nexus-action-btn edit" onClick={() => handleEditClick(student)}>
                            <Edit size={16} /> Edit
                        </button>
                        <button className="nexus-action-btn" style={{ color: '#3d31ff' }} onClick={() => fetchStudentResults(student.id)}>
                            <FileText size={16} /> Results
                        </button>
                        <button 
                            className={`nexus-action-btn ${student.is_active ? 'delete' : 'edit'}`} 
                            onClick={() => handleToggleStatus(student)}
                        >
                            {student.is_active ? <UserX size={16} /> : <UserCheck size={16} />} 
                            {student.is_active ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Entry Modal */}
      {showModal && (
        <div className={`modal-overlay ${entryMode === 'bulk' ? 'modal-bulk' : ''}`} onClick={(e) => { if(e.target === e.currentTarget && !createdCredentials) setShowModal(false); }}>
          <div className={`modal-container ${entryMode === 'bulk' ? 'bulk-container' : ''}`}>
            <div className="modal-header">
              <div className="header-title">
                <div className="title-icon"><Users size={20} /></div>
                <h3>{createdCredentials ? 'Accounts Provisioned' : entryMode === 'bulk' ? 'Bulk Student Registration' : isEditing ? 'Edit Student Profile' : 'Register Student'}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div className="modal-body">
              {createdCredentials ? (
                <div className="credentials-view">
                   <div className="success-banner">
                    <CheckCircle2 size={32} />
                    <h4>Nexus Sync Successful</h4>
                    <p>{createdCredentials.length} student accounts have been mapped to their classes.</p>
                  </div>
                  
                  <div className="credentials-list-scroll">
                    {createdCredentials.map((cred, i) => (
                        <div key={i} className="credential-box-mini">
                            <div className="mini-cred-header">
                                <strong>{cred.name}</strong>
                                <span className="mini-meta">{cred.email}</span>
                            </div>
                            <div className="mini-cred-pass">
                                <span>Password: <code>{cred.password}</code></span>
                                <button className="mini-copy-btn" onClick={() => handleCopy(cred.password, `pass-${i}`)}>
                                    {copiedKey === `pass-${i}` ? 'Copied' : <Copy size={12} />}
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>

                  <div className="credential-export-actions">
                    <button className="btn-primary-glow w-full" onClick={generatePDF}>
                        <Download size={18} />
                        Download Credentials PDF
                    </button>
                  </div>
                </div>
              ) : entryMode === 'single' ? (
                <form id="nexus-student-form" onSubmit={handleSubmit} className="modal-form">
                    <div className="profile-upload-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
                        <div className="image-preview-ring" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--primary-color)', padding: '5px', position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
                        {studentForm.profile_image ? (
                            <img src={studentForm.profile_image} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={32} color="#94a3b8" />
                            </div>
                        )}
                        <label htmlFor="student-img-upload" style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary-color)', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                            <Plus size={14} />
                        </label>
                        </div>
                        <input type="file" id="student-img-upload" hidden accept="image/*" onChange={handleImageUpload} />
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px' }}>Click icon to upload profile photo</span>
                    </div>

                    <div className="form-group">

                        <label>Student Name *</label>
                        <input 
                            type="text" placeholder="Full legal name" 
                            value={studentForm.name} 
                            onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Institutional Email *</label>
                            <input 
                                type="email" placeholder="student@nexus.edu" 
                                value={studentForm.email} 
                                onChange={(e) => setStudentForm({...studentForm, email: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Registration ID *</label>
                            <input 
                                type="text" placeholder="e.g. REG-2026-001" 
                                value={studentForm.registration_id} 
                                onChange={(e) => setStudentForm({...studentForm, registration_id: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input 
                                type="text" placeholder="+1..." 
                                value={studentForm.phone} 
                                onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})} 
                            />
                        </div>
                        <div className="form-group">
                            <label>Class *</label>
                            <NexusSelect 
                                options={classes.map(c => ({ label: c.name, value: c.id }))}
                                value={studentForm.class_id}
                                onChange={(val) => handleClassChange(val)}
                                placeholder="Assign Class"
                                required
                            />
                        </div>
                    </div>

                    {selectedClassInfo && (
                        <div className="class-meta-preview glass-panel">
                            <div className="meta-row">
                                <div className="meta-item">
                                    <span className="meta-label">Department</span>
                                    <span className="meta-value"><Building2 size={14} /> {selectedClassInfo.department?.name}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Course</span>
                                    <span className="meta-value"><Layers size={14} /> {selectedClassInfo.course?.name}</span>
                                </div>
                            </div>
                            <div className="meta-row mt-10">
                                <div className="meta-item">
                                    <span className="meta-label">Semester</span>
                                    <span className="meta-value"><Calendar size={14} /> Sem {selectedClassInfo.semester} • {selectedClassInfo.academic_year}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Specialization</span>
                                    <span className="meta-value">
                                        {selectedClassInfo.course?.specialization ? (
                                            <span style={{color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>
                                                {selectedClassInfo.course.specialization.name}
                                            </span>
                                        ) : 'General Mapping'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
              ) : (
                <div className="bulk-entry-view">
                    <table className="bulk-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Reg. ID</th>
                                <th>Phone</th>
                                <th style={{width: '200px'}}>Class Mapping</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bulkStudents.map((s, i) => (
                                <tr key={s.id}>
                                    <td>
                                        <input 
                                            type="text" placeholder="Name" 
                                            value={s.name} 
                                            onChange={(e) => updateBulkRow(i, 'name', e.target.value)} 
                                            className="table-input"
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="email" placeholder="Email" 
                                            value={s.email} 
                                            onChange={(e) => updateBulkRow(i, 'email', e.target.value)} 
                                            className="table-input"
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="text" placeholder="Reg ID" 
                                            value={s.registration_id} 
                                            onChange={(e) => updateBulkRow(i, 'registration_id', e.target.value)} 
                                            className="table-input"
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="text" placeholder="Phone" 
                                            value={s.phone} 
                                            onChange={(e) => updateBulkRow(i, 'phone', e.target.value)} 
                                            className="table-input"
                                        />
                                    </td>
                                    <td>
                                        <NexusSelect 
                                            options={classes.map(c => ({ label: c.name, value: c.id }))}
                                            value={s.class_id}
                                            onChange={(val) => handleClassChange(val, true, i)}
                                            placeholder="Assign Class"
                                        />
                                        {s.classInfo && (
                                            <div className="bulk-meta-expanded">
                                                <div className="bulk-hint-row">
                                                    <span className="hint-tag"><Building2 size={10} /> {s.classInfo.department?.name}</span>
                                                    <span className="hint-tag"><Layers size={10} /> {s.classInfo.course?.name}</span>
                                                </div>
                                                <div className="bulk-hint-row">
                                                    <span className="hint-tag"><Calendar size={10} /> Sem {s.classInfo.semester} • {s.classInfo.academic_year}</span>
                                                    {s.classInfo.course?.specialization && (
                                                        <span className="hint-tag spec-tag">{s.classInfo.course.specialization.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button className="bulk-row-remove" onClick={() => removeBulkRow(s.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="btn-secondary mt-20" onClick={addBulkRow}>
                        <Plus size={16} /> Add Another Entry
                    </button>
                    <div className="bulk-submit-area">
                        <SubmitButton 
                            onClick={handleSubmit}
                            loading={isSubmitting} 
                            text={`Provision ${bulkStudents.length} Students`} 
                            loadingText="Provisioning..." 
                            className="btn-primary-glow"
                            style={{marginLeft: 'auto'}}
                        />
                    </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {createdCredentials ? (
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Acknowledge & Close</button>
              ) : entryMode === 'single' ? (
                <>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <SubmitButton 
                    form="nexus-student-form" 
                    loading={isSubmitting} 
                    text={isEditing ? 'Save Changes' : 'Generate Account'} 
                    loadingText={isEditing ? 'Syncing...' : 'Provisioning...'} 
                  />
                </>
              ) : null /* Bulk has its own submit button in body */}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showStatusConfirmModal}
        onClose={() => setShowStatusConfirmModal(false)}
        onConfirm={executeToggleStatus}
        title={studentToToggle?.is_active ? 'Deactivate Account?' : 'Activate Account?'}
        description={studentToToggle?.is_active 
          ? <>Deactivating <strong>{studentToToggle?.name}</strong> will immediately revoke their access to the system. Continue?</>
          : <>Re-activating <strong>{studentToToggle?.name}</strong> will randomly generate a new secure password for system access. Continue?</>
        }
        icon={studentToToggle?.is_active ? <UserX size={32} /> : <UserCheck size={32} />}
        iconBgColor={studentToToggle?.is_active ? '#fff1f0' : '#f0fdf4'}
        iconColor={studentToToggle?.is_active ? '#ff4d4f' : '#22c55e'}
        confirmText={studentToToggle?.is_active ? 'Deactivate Account' : 'Activate Account'}
        confirmBgColor={studentToToggle?.is_active ? '#ff4d4f' : 'var(--primary-color)'}
        confirmHoverShadow={studentToToggle?.is_active ? '0 8px 15px rgba(255, 77, 79, 0.2)' : '0 8px 15px rgba(61, 49, 255, 0.2)'}
      />

      {/* Results List Modal */}
      {selectedStudentResults && (
        <div className="modal-overlay" onClick={() => setSelectedStudentResults(null)}>
            <div className="modal-container" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Student Assessment Stream</h3>
                    <button onClick={() => setSelectedStudentResults(null)}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    {loadingResults ? <p>Synchronizing results...</p> : selectedStudentResults.length === 0 ? <p>No results found for this student.</p> : (
                        <div className="results-grid-mini" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                            {selectedStudentResults.map((res, i) => (
                                <div key={i} className="glass-panel" style={{ padding: '15px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0 }}>{res.subject?.name}</h4>
                                        <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{res.percentage}%</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '15px' }}>
                                        {new Date(res.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => {
                                            setEvaluatingResult(res);
                                            setEvalForm({ 
                                                comment: res.teacher_comment || '', 
                                                marks: res.teacher_marks || '', 
                                                role: 'teacher' 
                                            });
                                        }}>
                                            Teacher Eval
                                        </button>
                                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => {
                                            setEvaluatingResult(res);
                                            setEvalForm({ 
                                                comment: res.principal_comment || '', 
                                                marks: res.principal_marks || '', 
                                                role: 'principal' 
                                            });
                                        }}>
                                            Principal Eval
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Evaluation Form Modal */}
      {evaluatingResult && (
        <div className="modal-overlay" onClick={() => setEvaluatingResult(null)}>
            <div className="modal-container" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{evalForm.role.toUpperCase()} EVALUATION</h3>
                    <button onClick={() => setEvaluatingResult(null)}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '15px', fontSize: '0.9rem' }}>Subject: <strong>{evaluatingResult.subject?.name}</strong></p>
                    <div className="form-group">
                        <label>Assigned Marks</label>
                        <input 
                            type="number" 
                            value={evalForm.marks} 
                            onChange={e => setEvalForm({...evalForm, marks: e.target.value})}
                            placeholder="Enter marks"
                        />
                    </div>
                    <div className="form-group">
                        <label>Evaluation Comments</label>
                        <textarea 
                            value={evalForm.comment} 
                            onChange={e => setEvalForm({...evalForm, comment: e.target.value})}
                            placeholder="Provide detailed feedback..."
                            style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Role Context</label>
                        <select 
                            value={evalForm.role} 
                            onChange={e => setEvalForm({...evalForm, role: e.target.value})}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        >
                            <option value="teacher">Teacher</option>
                            <option value="principal">Principal</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setEvaluatingResult(null)}>Cancel</button>
                    <button className="btn-primary" onClick={submitEvaluation}>Save Evaluation</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
