import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  Plus, 
  Trash2, 
  Coffee, 
  Layers, 
  X,
  ChevronRight,
  User as UserIcon,
  LayoutGrid,
  Download,
  CalendarDays,
  FileText,
  Edit,
  Globe,
  EyeOff,
  Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../components/Toast';
import NexusSelect from '../components/NexusSelect';
import SubmitButton from '../components/SubmitButton';
import ConfirmDialog from '../components/ConfirmDialog';
import './Timetable.css';

const API_BASE_URL = 'http://localhost:8000';

const DAYS_OF_WEEK = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' }
];

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');
  const [showModal, setShowModal] = useState(false);
  const [entryMode, setEntryMode] = useState('lecture'); // 'lecture' or 'break'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plannerView, setPlannerView] = useState('daily'); // 'daily' or 'weekly'
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    start_time: '',
    end_time: '',
    subject_id: '',
    teacher_id: '',
    is_break: false,
    label: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

    const fetchInitialData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes/`);
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
        fetchClassData(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error("Error", "Could not load academic classes.");
      setLoading(false);
    }
  };

  const fetchClassData = async (classId) => {
    setLoading(true);
    try {
      const [subjectsRes, timetableRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/subjects/`), // We'll filter these locally
        fetch(`${API_BASE_URL}/timetable/class/${classId}`),
        fetch(`${API_BASE_URL}/teachers/`)
      ]);
      const subjectsData = await subjectsRes.json();
      const timetableData = await timetableRes.json();
      const teachersData = await teachersRes.json();
      
      setSubjects(subjectsData.filter(s => String(s.class_id) === String(classId)));
      setTimetable(timetableData);
      setTeachers(teachersData);
    } catch (error) {
      toast.error("Sync Error", "Failed to load class schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (val) => {
    setSelectedClassId(val);
    fetchClassData(val);
  };

  const handleTogglePublish = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/classes/${selectedClassId}/publish`, {
        method: 'PUT'
      });
      if (res.ok) {
        const updatedClass = await res.json();
        setClasses(prev => prev.map(c => String(c.id) === String(updatedClass.id) ? updatedClass : c));
        toast.success(
          updatedClass.is_timetable_published ? "Published" : "Unpublished", 
          `Class timetable is now ${updatedClass.is_timetable_published ? 'visible' : 'hidden'} for students.`
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Error", err.detail || "Could not update publish status.");
      }
    } catch (error) {
      toast.error("Error", "Network error.");
    }
  };

  const handleEdit = (slot) => {
    setForm({
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject_id: slot.subject_id || '',
        teacher_id: slot.teacher_id || '',
        is_break: slot.is_break,
        label: slot.label || ''
    });
    setEntryMode(slot.is_break ? 'break' : 'lecture');
    setIsEditing(true);
    setEditingId(slot.id);
    setShowModal(true);
  };

  const openAddModal = () => {
    setForm({ start_time: '', end_time: '', subject_id: '', teacher_id: '', is_break: false, label: '' });
    setIsEditing(false);
    setEditingId(null);
    setEntryMode('lecture');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Ensure teacher_id is an integer if present
    const finalTeacherId = form.teacher_id ? parseInt(form.teacher_id) : null;
    const finalSubjectId = form.subject_id ? parseInt(form.subject_id) : null;

    if (entryMode === 'lecture' && !finalSubjectId) {
        toast.error("Validation Error", "Please select a subject.");
        setIsSubmitting(false);
        return;
    }

    const payload = {
      ...form,
      class_id: selectedClassId,
      day_of_week: activeDay,
      is_break: entryMode === 'break',
      subject_id: finalSubjectId,
      teacher_id: finalTeacherId,
      label: entryMode === 'break' ? form.label : null
    };

    try {
      const url = isEditing ? `${API_BASE_URL}/timetable/${editingId}` : `${API_BASE_URL}/timetable/`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(isEditing ? "Updated" : "Scheduled", `Timetable ${isEditing ? 'updated' : 'scheduled'} successfully.`);
        setShowModal(false);
        fetchClassData(selectedClassId);
      } else {
        const err = await res.json();
        let errorMessage = "Failed to process request.";
        if (err.detail) {
            errorMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        }
        toast.error("Error", errorMessage);
      }
    } catch (err) {
      toast.error("Error", "Network connectivity issue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/timetable/${entryToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Removed", "Slot deleted from schedule.");
        setShowDeleteModal(false);
        fetchClassData(selectedClassId);
      }
    } catch (err) {
      toast.error("Error", "Could not remove entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
        const doc = new jsPDF('l', 'mm', 'a4');
        const selectedClass = classes.find(c => c.id === selectedClassId);
        const className = selectedClass ? `${selectedClass.name} | ${selectedClass.academic_year}` : 'Class Timetable';

        doc.setFontSize(22);
        doc.setTextColor(61, 49, 255);
        doc.text(`${className}`, 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(150);
        doc.text(`Institutional Weekly Schedule - Generated on ${new Date().toLocaleDateString()}`, 14, 28);

        const days = DAYS_OF_WEEK.map(d => d.full);
        const timeSlots = Array.from(new Set(timetable.map(s => `${s.start_time} - ${s.end_time}`))).sort();
        
        const bodyContent = timeSlots.map(time => {
            const row = [time];
            days.forEach(day => {
                const entry = timetable.find(e => e.day_of_week === day && `${e.start_time} - ${e.end_time}` === time);
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

        doc.save(`Schedule_${className.replace(/\s+/g, '_')}.pdf`);
        toast.success("Exported", "Timetable PDF generated successfully.");
    } catch (error) {
        console.error("PDF Error:", error);
        toast.error("Export Failed", "Error creating PDF file.");
    }
  };

  const filteredSlots = timetable
    .filter(slot => slot.day_of_week === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="timetable-page">
      <div className="timetable-header-row">
        <div className="header-text">
          <h2 style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <Calendar size={36} color="var(--primary-color)" />
            Academic Planner
          </h2>
          <p>Orchestrate learning sessions, faculty assignments and institutional breaks.</p>
        </div>
        
        <div className="class-selector-section">
            <NexusSelect 
                options={classes.map(c => ({ label: `Class: ${c.name} | ${c.academic_year}`, value: c.id }))}
                value={selectedClassId}
                onChange={handleClassChange}
                placeholder="Select Class for Timetable"
            />
        </div>

        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <div className="nexus-view-toggle">
                <button 
                  className={`nexus-toggle-btn ${plannerView === 'daily' ? 'active' : ''}`}
                  onClick={() => setPlannerView('daily')}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  className={`nexus-toggle-btn ${plannerView === 'weekly' ? 'active' : ''}`}
                  onClick={() => setPlannerView('weekly')}
                >
                  <CalendarDays size={18} />
                </button>
            </div>

            <button 
                className={`btn-secondary ${classes.find(c => String(c.id) === String(selectedClassId))?.is_timetable_published ? 'active-glow' : ''}`} 
                onClick={handleTogglePublish} 
                title={classes.find(c => String(c.id) === String(selectedClassId))?.is_timetable_published ? 'Unpublish' : 'Publish'}
                style={{
                    padding: '0.8rem 1.2rem', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    border: '1px solid #e2e8f0',
                    background: classes.find(c => String(c.id) === String(selectedClassId))?.is_timetable_published ? '#f0fdf4' : 'white',
                    color: classes.find(c => String(c.id) === String(selectedClassId))?.is_timetable_published ? '#16a34a' : '#64748b'
                }}>
                {classes.find(c => String(c.id) === String(selectedClassId))?.is_timetable_published ? <Eye size={18} /> : <EyeOff size={18} />}
                <span className="hide-mobile">{classes.find(c => String(c.id) === String(selectedClassId))?.is_timetable_published ? 'Published' : 'Publish'}</span>
            </button>

            <button className="btn-secondary" onClick={handleDownloadPDF} style={{padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0'}}>
                <Download size={18} />
                <span className="hide-mobile">Export PDF</span>
            </button>

            <button className="btn-primary" onClick={openAddModal} style={{padding: '0.8rem 1.8rem', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(61, 49, 255, 0.1)'}}>
                <Plus size={18} />
                <span>Add Slot</span>
            </button>
        </div>
      </div>

      {plannerView === 'daily' && (
        <div className="day-tabs">
          {DAYS_OF_WEEK.map(day => (
            <button 
              key={day.full} 
              className={`day-tab ${activeDay === day.full ? 'active' : ''}`}
              onClick={() => setActiveDay(day.full)}
            >
              <span>{day.short}</span>
              <span>{day.full}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Syncing Planner...</p></div>
      ) : plannerView === 'daily' ? (
        filteredSlots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Calendar size={48} /></div>
            <h3>No Sessions Scheduled for {activeDay}</h3>
            <p>Begin by adding lectures or break intervals to the planner.</p>
            <button className="btn-primary mt-20" onClick={openAddModal}>Register First Slot</button>
          </div>
        ) : (
          <div className="timetable-grid">
            {filteredSlots.map(slot => (
              <div key={slot.id} className={`time-slot-card ${slot.is_break ? 'break-card' : ''}`}>
                 <div className="time-indicator">
                    <div className="time-box">{slot.start_time} - {slot.end_time}</div>
                    <div className="duration-tag">
                       Session Slot
                    </div>
                 </div>
                 
                 <div className="slot-content">
                    {slot.is_break ? (
                      <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                         <div className="break-icon"><Coffee size={24} /></div>
                         <div className="break-label">{slot.label || 'Interval Break'}</div>
                      </div>
                    ) : (
                      <div className="subject-info">
                         <h4>{slot.subject?.name}</h4>
                         <div className="teacher-tag">
                            <div className="teacher-avatar">
                              {slot.teacher?.name.charAt(0)}
                            </div>
                            <span>{slot.teacher?.name}</span>
                            <span style={{opacity: 0.4, margin: '0 8px'}}>•</span>
                            <span style={{fontSize: '0.8rem', fontStyle: 'italic'}}>{slot.academic_class?.name}</span>
                         </div>
                      </div>
                    )}
  
                    <div className="nexus-action-control">
                      <button className="nexus-action-btn edit" onClick={() => handleEdit(slot)}>
                        <Edit size={16} />
                      </button>
                      <button className="nexus-action-btn delete" onClick={() => handleDeleteClick(slot)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Weekly View Grid */
        <div className="weekly-container">
           <div className="weekly-grid-table">
              <div className="grid-header-row">
                 <div className="grid-time-head">Time</div>
                 {DAYS_OF_WEEK.map(day => (
                   <div key={day.full} className="grid-day-head">{day.short}</div>
                 ))}
              </div>
              
              {/* Generate time slots dynamically based on existing data */}
              {Array.from(new Set(timetable.map(s => `${s.start_time} - ${s.end_time}`))).sort().map(timeRange => (
                <div key={timeRange} className="grid-body-row">
                   <div className="grid-time-cell">{timeRange}</div>
                   {DAYS_OF_WEEK.map(day => {
                     const entry = timetable.find(s => s.day_of_week === day.full && `${s.start_time} - ${s.end_time}` === timeRange);
                     return (
                       <div key={`${day.full}-${timeRange}`} className={`grid-slot-cell ${entry?.is_break ? 'is-break' : entry ? 'has-lecture' : 'is-empty'}`}>
                    {entry ? (
                      <div className="mini-slot-container">
                        <div className="mini-slot-info">
                            <div className="mini-subject">{entry.is_break ? (entry.label || 'Break') : entry.subject?.name}</div>
                            {!entry.is_break && <div className="mini-teacher">{entry.teacher?.name}</div>}
                        </div>
                        <div className="mini-slot-actions">
                           <button className="nexus-action-btn edit" style={{opacity: 1}} onClick={() => handleEdit(entry)}><Edit size={12} /></button>
                           <button className="nexus-action-btn delete" style={{opacity: 1}} onClick={() => handleDeleteClick(entry)}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ) : '-'}
                  </div>
                     );
                   })}
                </div>
              ))}
              
              {timetable.length === 0 && (
                <div className="empty-weekly-state">
                   <p>No records found to display in weekly grid.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Entry Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-title">
                <div className="title-icon"><Clock size={20} /></div>
                <h3>{isEditing ? 'Modify Schedule Entry' : 'New Schedule Entry'}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div className="modal-body">
              <div className="timetable-modal-mode">
                 <button className={`mode-btn ${entryMode === 'lecture' ? 'active' : ''}`} onClick={() => setEntryMode('lecture')}>
                   <BookOpen size={16} /> Lecture
                 </button>
                 <button className={`mode-btn ${entryMode === 'break' ? 'active' : ''}`} onClick={() => setEntryMode('break')}>
                   <Coffee size={16} /> Break
                 </button>
              </div>

              <form id="nexus-timetable-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                   <div className="form-group">
                      <label>Start Time</label>
                      <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
                   </div>
                   <div className="form-group">
                      <label>End Time</label>
                      <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
                   </div>
                </div>

                {entryMode === 'lecture' ? (
                  <>
                    <div className="form-group">
                      <label>Subject</label>
                      <NexusSelect 
                        options={subjects.map(s => ({ label: s.name, value: s.id }))}
                        value={form.subject_id}
                        onChange={val => {
                          const selectedSub = subjects.find(s => s.id === val);
                          setForm({
                            ...form, 
                            subject_id: val,
                            teacher_id: selectedSub ? selectedSub.teacher_id : ''
                          });
                        }}
                        placeholder="Choose Subject"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Faculty Member</label>
                      <NexusSelect 
                        options={teachers.map(t => ({ label: t.name, value: t.id }))}
                        value={form.teacher_id}
                        onChange={val => setForm({...form, teacher_id: val})}
                        placeholder="Select Teacher"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label>Break Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Refreshment, Lunch, Prayer" 
                      value={form.label} 
                      onChange={e => setForm({...form, label: e.target.value})} 
                      required 
                    />
                  </div>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <SubmitButton 
                form="nexus-timetable-form" 
                loading={isSubmitting} 
                text="Confirm Schedule" 
                loadingText="Scheduling..." 
              />
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Remove Session?"
        description={<>Are you sure you want to remove <strong>{entryToDelete?.is_break ? entryToDelete.label : entryToDelete?.subject?.name}</strong> from the timetable?</>}
        icon={<Trash2 size={32} />}
        confirmText="Remove Slot"
      />
    </div>
  );
}
