import React, { useState, useEffect } from 'react';
import {
  Plus, Calendar, Clock, BookOpen, GraduationCap, Award,
  Trash2, X, CheckCircle, Layers, Table2, Eye, Save, Filter, Download,
  Edit, Trash, Globe, FileCheck, EyeOff
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import SubmitButton from '../components/SubmitButton';
import NexusSelect from '../components/NexusSelect';
import QuestionPaperBuilder from './QuestionPaperBuilder';
import './Exams.css';

const API = 'http://localhost:8000';

const fmt = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (t) => (t ? t.slice(0, 5) : '—');

const isExamOver = (date, endTime) => {
  if (!date || !endTime) return false;
  const now = new Date();
  const examEnd = new Date(`${date}T${endTime}`);
  return now > examEnd;
};

export default function Exams() {
  const { toast } = useToast();

  // ── server data ─────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('assessments');
  const [delTarget, setDelTarget] = useState(null);

  // ── assessment form ──────────────────────────────────────────────────────────
  const [showCreateAssess, setShowCreateAssess] = useState(false);
  const [aForm, setAForm] = useState({ title: '', course_ids: [], class_ids: [], start_date: '', end_date: '', is_published: false });
  const [aSubmitting, setASubmitting] = useState(false);
  const [isEditingAssess, setIsEditingAssess] = useState(false);
  const [editingAssessId, setEditingAssessId] = useState(null);

  // ── timetable build form ─────────────────────────────────────────────────────
  const [bAssessmentId, setBAssessmentId] = useState('');
  const [bSpecId, setBSpecId] = useState('');
  const [bCourseId, setBCourseId] = useState('');
  const [bClassId, setBClassId] = useState('');
  const [tRows, setTRows] = useState([]);
  const [tSubmitting, setTSubmitting] = useState(false);

  // ── timetable view state ─────────────────────────────────────────────────────
  const [vAssessmentId, setVAssessmentId] = useState('');
  const [vSpecId, setVSpecId] = useState('');
  const [vCourseId, setVCourseId] = useState('');
  const [timetableData, setTimetableData] = useState([]);
  const [ttLoading, setTtLoading] = useState(false);
  const [ttLoaded, setTtLoaded] = useState(false);

  // ── copy & restrict state ───────────────────────────────────────────────────
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySource, setCopySource] = useState({ assessment_id: '', class_id: '' });
  const [bClassLocked, setBClassLocked] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [showQPBuilder, setShowQPBuilder] = useState(false);
  const [selectedExamForQP, setSelectedExamForQP] = useState(null);
  const [showEditSlot, setShowEditSlot] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState(null);
  const [editSlotForm, setEditSlotForm] = useState({ exam_date: '', start_time: '', end_time: '', total_marks: 100 });

  // ── load data ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoints = ['courses', 'classes', 'subjects', 'assessments'];
      const [cRes, clRes, sRes, aRes] = await Promise.all(
        endpoints.map(ep => fetch(`${API}/${ep}/`))
      );

      if (!cRes.ok || !clRes.ok || !sRes.ok || !aRes.ok) {
        throw new Error('Registry Sync Failed');
      }

      setCourses(await cRes.json());
      setClasses(await clRes.json());
      setSubjects(await sRes.json());
      setAssessments(await aRes.json());
    } catch (err) {
      console.error(err);
      toast.error('Sync Error', 'Failed to load data registry. Check server status.');
    } finally {
      setLoading(false);
    }
  };


  // ── assessment helpers ───────────────────────────────────────────────────────
  const toggleCourse = (id) => {
    const newIds = aForm.course_ids.includes(id)
      ? aForm.course_ids.filter(x => x !== id)
      : [...aForm.course_ids, id];
    const newClassIds = classes.filter(c => newIds.includes(c.course_id)).map(c => c.id);
    setAForm({ ...aForm, course_ids: newIds, class_ids: newClassIds });
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!aForm.title || !aForm.start_date || !aForm.end_date || aForm.course_ids.length === 0) {
      toast.error('Validation', 'Complete all fields and select courses.'); return;
    }
    setASubmitting(true);
    const url = isEditingAssess ? `${API}/assessments/${editingAssessId}` : `${API}/assessments/`;
    const method = isEditingAssess ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aForm)
      });
      if (res.ok) {
        toast.success(isEditingAssess ? 'Updated' : 'Success', `Assessment ${isEditingAssess ? 'updated' : 'created'} successfully.`);
        setShowCreateAssess(false);
        fetchAll();
      } else {
        const err = await res.json();
        toast.error('Error', err.detail || 'Failed to save assessment.');
      }
    } catch { toast.error('Error', 'Action failed.'); }
    finally { setASubmitting(false); }
  };

  const handleEditAssessClick = (a) => {
    setAForm({
      title: a.title,
      start_date: a.start_date,
      end_date: a.end_date,
      course_ids: a.course_ids || [],
      class_ids: a.class_ids || [],
      is_published: a.is_published || false
    });
    setIsEditingAssess(true);
    setEditingAssessId(a.id);
    setShowCreateAssess(true);
  };

  const openCreateAssess = () => {
    setAForm({ title: '', start_date: '', end_date: '', course_ids: [], class_ids: [], is_published: false });
    setIsEditingAssess(false);
    setEditingAssessId(null);
    setShowCreateAssess(true);
  };

  const handlePublishToggle = async (assessment) => {
    try {
      const res = await fetch(`${API}/assessments/${assessment.id}/publish`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Status Updated', `Assessment is now ${!assessment.is_published ? 'Published' : 'Hidden'} for students.`);
        fetchAll();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error('Error', errData.detail || 'Could not update publish status.');
      }
    } catch (err) {
      toast.error('Error', 'Network connectivity issue or server rejected the request.');
    }
  };

  const handleDeleteAssessment = async () => {
    if (!delTarget) return;
    try {
      const res = await fetch(`${API}/assessments/${delTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted', 'Assessment removed.'); setDelTarget(null); fetchAll(); }
    } catch { toast.error('Error', 'Could not delete.'); }
  };

  // ── build timetable helpers ──────────────────────────────────────────────────
  const bAssessment = assessments.find(a => String(a.id) === String(bAssessmentId));
  const bCourses = courses.filter(c => bAssessment?.course_ids?.some(id => String(id) === String(c.id)));
  const bSelectedCourse = bCourses.find(c => String(c.id) === String(bCourseId));

  const bSpecs = bSelectedCourse ? (
    bSelectedCourse.specialization ? [bSelectedCourse.specialization] : (
      classes.filter(c => String(c.course_id) === String(bSelectedCourse.id))
        .reduce((acc, c) => {
          if (c.specialization_id && !acc.find(s => String(s.id) === String(c.specialization_id))) {
            acc.push(c.specialization || { id: c.specialization_id, name: `Spec #${c.specialization_id}` });
          }
          return acc;
        }, [])
    )
  ) : [];

  const bClasses = React.useMemo(() => {
    return classes.filter(c => {
      const matchAssessment = !bAssessment || bAssessment.class_ids?.some(cid => String(cid) === String(c.id));
      const matchCourse = String(c.course_id) === String(bCourseId);
      const clsCourse = courses.find(cr => String(cr.id) === String(c.course_id));
      const matchSpec = !bSpecId || (clsCourse && String(clsCourse.specialization_id) === String(bSpecId));
      return matchAssessment && matchCourse && matchSpec;
    });
  }, [classes, bAssessment, bCourseId, bSpecId, courses]);

  useEffect(() => {
    if (bAssessmentId && bCourseId) {
      const hasSpecs = bSpecs && bSpecs.length > 0;
      const specUnambiguous = !hasSpecs || bSpecId !== '';
      if (specUnambiguous && bClasses.length === 1) {
        if (bClassId !== String(bClasses[0].id)) {
          setBClassId(String(bClasses[0].id));
          setBClassLocked(true);
          checkDuplicate(bAssessmentId, bClasses[0].id);
        }
      } else if (bClasses.length > 1) {
        setBClassLocked(false);
      }
    } else {
      setBClassLocked(false);
    }
  }, [bAssessmentId, bCourseId, bSpecId, bClasses, bSpecs]);

  const checkDuplicate = async (aId, cId) => {
    try {
      const res = await fetch(`${API}/assessments/${aId}/timetable`);
      const data = await res.json();
      const exists = data.some(e => e.class_id === parseInt(cId));
      setIsDuplicate(exists);
      if (exists) {
        toast.warning("Existing Schedule", "A timetable for this class already exists in this assessment.");
      }
    } catch (e) { console.error(e); }
  };

  const handleCopyTimetable = async () => {
    if (!copySource.assessment_id || !copySource.class_id) {
      toast.error("Selection Required", "Please select both source assessment and class.");
      return;
    }
    setTtLoading(true);
    try {
      const res = await fetch(`${API}/assessments/${copySource.assessment_id}/timetable`);
      const data = await res.json();
      const filtered = data.filter(e => e.class_id === parseInt(copySource.class_id));

      if (filtered.length === 0) {
        toast.error("Empty Source", "The selected class has no timetable entries to copy.");
      } else {
        const mapped = filtered.map(e => ({
          subject_id: String(e.subject_id),
          exam_date: e.exam_date,
          start_time: e.start_time,
          end_time: e.end_time,
          total_marks: e.total_marks
        }));
        setTRows(mapped);
        toast.success("Ready", `Copied ${mapped.length} entries. Review and save to confirm.`);
        setShowCopyModal(false);
      }
    } catch {
      toast.error("Error", "Failed to copy timetable.");
    } finally {
      setTtLoading(false);
    }
  };
  const bSubjects = subjects.filter(s => String(s.class_id) === String(bClassId));
  const usedSubjIds = tRows.map(r => parseInt(r.subject_id)).filter(Boolean);

  const addRow = () => setTRows(p => [...p, { subject_id: '', exam_date: '', start_time: '', end_time: '', total_marks: 100 }]);
  const removeRow = (i) => setTRows(p => p.filter((_, idx) => idx !== i));
  const updateRow = (i, f, v) => setTRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r));

  const handleSaveTimetable = async () => {
    if (!bAssessmentId || !bClassId) { toast.error('Validation', 'Select assessment and class.'); return; }
    if (isDuplicate) {
      toast.error('Restricted', 'Cannot overwrite an existing timetable. Please delete it from the view tab first if you wish to recreate it.');
      return;
    }
    if (tRows.length === 0) { toast.error('Validation', 'Add at least one row.'); return; }
    if (tRows.find(r => !r.subject_id || !r.exam_date || !r.start_time || !r.end_time)) { toast.error('Validation', 'Complete all row fields.'); return; }

    if (!bAssessment) { toast.error('Error', 'Assessment context lost. Please re-select assessment.'); return; }

    const invalidDate = tRows.find(r => r.exam_date < bAssessment.start_date || r.exam_date > bAssessment.end_date);
    if (invalidDate) {
      toast.error('Date Validation', `All exam dates must be within the assessment period: ${fmt(bAssessment.start_date)} to ${fmt(bAssessment.end_date)}.`);
      return;
    }

    setTSubmitting(true);
    try {
      const entries = tRows.map(r => ({
        assessment_id: parseInt(bAssessmentId),
        class_id: parseInt(bClassId),
        subject_id: parseInt(r.subject_id),
        exam_date: r.exam_date,
        start_time: r.start_time,
        end_time: r.end_time,
        total_marks: parseInt(r.total_marks),
      }));
      const res = await fetch(`${API}/assessments/${bAssessmentId}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        toast.success('Saved', 'Timetable saved! Switch to "View Timetable" to see it.');
        setTRows([]);
      } else { toast.error('Error', 'Failed to save timetable.'); }
    } catch { toast.error('Network Error', 'Could not reach server.'); }
    finally { setTSubmitting(false); }
  };

  // ── view timetable helpers ───────────────────────────────────────────────────
  const vAssessment = assessments.find(a => String(a.id) === String(vAssessmentId));
  const vAllCourses = courses.filter(c => vAssessment?.course_ids?.includes(c.id));
  const vSelectedCourse = vAllCourses.find(c => String(c.id) === String(vCourseId));

  const vSpecs = vSelectedCourse ? (
    vSelectedCourse.specialization ? [vSelectedCourse.specialization] : (
      classes.filter(c => String(c.course_id) === String(vSelectedCourse.id))
        .reduce((acc, c) => {
          if (c.specialization_id && !acc.find(s => String(s.id) === String(c.specialization_id))) {
            acc.push(c.specialization || { id: c.specialization_id, name: `Spec #${c.specialization_id}` });
          }
          return acc;
        }, [])
    )
  ) : [];


const loadTimetable = async () => {
  if (!vAssessmentId) { toast.error('Select', 'Choose an assessment first.'); return; }
  setTtLoading(true);
  setTtLoaded(false);
  try {
    const res = await fetch(`${API}/assessments/${vAssessmentId}/timetable`);
    const data = await res.json();
    setTimetableData(Array.isArray(data) ? data : []);
    setTtLoaded(true);
  } catch { toast.error('Error', 'Could not load timetable.'); }
  finally { setTtLoading(false); }
};

const quickView = async (assessment) => {
  setVAssessmentId(String(assessment.id));
  setVSpecId('');
  setVCourseId('');
  setActiveTab('view');
  setTtLoading(true);
  setTtLoaded(false);
  try {
    const res = await fetch(`${API}/assessments/${assessment.id}/timetable`);
    const data = await res.json();
    setTimetableData(Array.isArray(data) ? data : []);
    setTtLoaded(true);
  } catch { toast.error('Error', 'Could not load timetable.'); }
  finally { setTtLoading(false); }
};

const filteredTimetable = timetableData.filter(e => {
  const cls = classes.find(c => c.id === e.class_id);
  const crs = courses.find(c => c.id === cls?.course_id);
  if (vCourseId && cls?.course_id !== parseInt(vCourseId)) return false;
  if (vSpecId && crs?.specialization_id !== parseInt(vSpecId)) return false;
  return true;
});

const groupedByDate = filteredTimetable.reduce((acc, e) => {
  if (!acc[e.exam_date]) acc[e.exam_date] = [];
  acc[e.exam_date].push(e);
  return acc;
}, {});
const sortedDates = Object.keys(groupedByDate).sort();

// ── download PDF ─────────────────────────────────────────────────────────────
const handleDownloadPDF = () => {
  if (!window.jspdf) { alert('PDF library not available.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const courseLabel = vCourseId ? courses.find(c => c.id === parseInt(vCourseId))?.name : 'All Courses';

  doc.setFillColor(61, 49, 255);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('EXAMINATION TIMETABLE', 16, 18);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Assessment: ${vAssessment?.title || ''}`, 16, 27);
  doc.text(`Course Filter: ${courseLabel}  |  Period: ${fmt(vAssessment?.start_date)} — ${fmt(vAssessment?.end_date)}  |  Generated: ${new Date().toLocaleDateString()}`, 16, 33);

  let y = 50;
  const cols = [60, 55, 40, 30, 30, 35, 35];
  const headers = ['Subject', 'Class', 'Exam Date', 'Day', 'Start', 'End', 'Marks'];
  doc.setFillColor(242, 244, 255);
  doc.rect(10, y - 6, pageW - 20, 10, 'F');
  doc.setTextColor(61, 49, 255);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  let x = 12;
  headers.forEach((h, i) => { doc.text(h, x, y); x += cols[i]; });
  y += 4;
  doc.setDrawColor(200, 200, 255); doc.setLineWidth(0.3);
  doc.line(10, y, pageW - 10, y);

  doc.setTextColor(30, 30, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);

  sortedDates.forEach(dateKey => {
    const entries = groupedByDate[dateKey];
    const dateObj = new Date(dateKey + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    entries.forEach((entry, idx) => {
      if (y > pageH - 18) {
        doc.addPage(); y = 20;
        doc.setFillColor(242, 244, 255);
        doc.rect(10, y - 6, pageW - 20, 10, 'F');
        doc.setTextColor(61, 49, 255); doc.setFont('helvetica', 'bold');
        let xh = 12;
        headers.forEach((h, i) => { doc.text(h, xh, y); xh += cols[i]; });
        y += 4; doc.setDrawColor(200, 200, 255);
        doc.line(10, y, pageW - 10, y);
        doc.setTextColor(30, 30, 60); doc.setFont('helvetica', 'normal');
      }
      y += 7;
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(10, y - 5.5, pageW - 20, 7.5, 'F'); }
      const isFirstOfDate = idx === 0;
      x = 12;
      doc.setFont('helvetica', isFirstOfDate ? 'bold' : 'normal');
      const subject = entry.subject_name || `#${entry.subject_id}`;
      doc.text(subject.length > 30 ? subject.substring(0, 28) + '…' : subject, x, y); x += cols[0];
      doc.setFont('helvetica', 'normal');
      const cls = entry.class_name || `#${entry.class_id}`;
      doc.text(cls.length > 28 ? cls.substring(0, 26) + '…' : cls, x, y); x += cols[1];
      doc.text(isFirstOfDate ? dateStr : '', x, y); x += cols[2];
      doc.text(isFirstOfDate ? dayStr : '', x, y); x += cols[3];
      doc.text(fmtTime(entry.start_time), x, y); x += cols[4];
      doc.text(fmtTime(entry.end_time), x, y); x += cols[5];
      doc.text(String(entry.total_marks), x, y);
    });
    y += 3;
    doc.setDrawColor(220, 224, 240); doc.setLineWidth(0.2);
    doc.line(10, y, pageW - 10, y);
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(160, 160, 180);
    doc.text(`Page ${i} of ${totalPages}  |  Nexus Examination Management System`, pageW / 2, pageH - 6, { align: 'center' });
  }

  doc.save(`Timetable_${(vAssessment?.title || 'Exam').replace(/\s+/g, '_')}.pdf`);
};

// ── render ───────────────────────────────────────────────────────────────────
return (
  <div className="exams-page">

    <div className="page-header">
      <div className="header-text">
        <h2>Examination Management</h2>
        <p>Create assessments, build timetables, and view scheduled slots.</p>
      </div>
      <div className="exam-tab-switcher">
        <button className={`exam-tab-btn ${activeTab === 'assessments' ? 'active' : ''}`} onClick={() => setActiveTab('assessments')}>
          <Award size={16} /> Assessments
        </button>
        <button className={`exam-tab-btn ${activeTab === 'build' ? 'active' : ''}`} onClick={() => setActiveTab('build')}>
          <Table2 size={16} /> Build Timetable
        </button>
        <button className={`exam-tab-btn ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>
          <Eye size={16} /> View Timetable
        </button>
      </div>
    </div>

    {activeTab === 'assessments' && (
      <div className="exam-section">
        <div className="section-action-row">
          <h3 className="section-label"><Layers size={18} /> All Assessments</h3>
          <button className="btn-primary-glow" onClick={openCreateAssess}>
            <Plus size={16} /> Create Assessment
          </button>
        </div>

        {showCreateAssess && (
          <div className="form-panel glass-panel" style={{ marginBottom: '2rem' }}>
            <div className="form-panel-header">
              <h3>{isEditingAssess ? 'Edit Assessment' : 'New Assessment'}</h3>
              <button className="icon-btn" onClick={() => setShowCreateAssess(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateAssessment} className="assess-form">
              <div className="form-group">
                <label>Assessment Title *</label>
                <input type="text" placeholder="e.g. End Semester Exam April 2024" value={aForm.title} onChange={e => setAForm({ ...aForm, title: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" value={aForm.start_date} onChange={e => setAForm({ ...aForm, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" value={aForm.end_date} onChange={e => setAForm({ ...aForm, end_date: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label>Select Course(s) *</label>
                <p className="field-hint">Choosing a course automatically includes all its linked classes.</p>
                <div className="multi-chip-selector">
                  {courses.map(c => (
                    <button key={c.id} type="button" className={`course-chip-btn ${aForm.course_ids.includes(c.id) ? 'selected' : ''}`} onClick={() => toggleCourse(c.id)}>
                      {c.name} {aForm.course_ids.includes(c.id) && <CheckCircle size={14} />}
                    </button>
                  ))}
                  {courses.length === 0 && <span className="no-data-hint">No courses configured.</span>}
                </div>
              </div>

              {aForm.class_ids.length > 0 && (
                <div className="form-group">
                  <label>Scoped Classes ({aForm.class_ids.length})</label>
                  <div className="class-chips-preview">
                    {aForm.class_ids.map(cid => {
                      const cls = classes.find(cx => cx.id === cid);
                      return cls ? <span key={cid} className="class-chip">{cls.name}</span> : null;
                    })}
                  </div>
                </div>
              )}
              <div className="form-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateAssess(false)}>Cancel</button>
                <SubmitButton loading={aSubmitting} text={isEditingAssess ? 'Update Assessment' : 'Create Assessment'} loadingText={isEditingAssess ? 'Updating...' : 'Creating…'} icon={<CheckCircle size={16} />} className="btn btn-primary" />
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="dept-empty"><p>Loading…</p></div>
        ) : assessments.length === 0 ? (
          <div className="dept-empty">
            <div className="empty-icon"><Award size={48} /></div>
            <h3>No Assessments Yet</h3>
            <p>Create your first assessment to get started.</p>
          </div>
        ) : (
          <div className="assessment-cards-grid">
            {assessments.map(a => (
              <div className="assessment-card" key={a.id}>
                <div className="assessment-card-header">
                  <div className="assess-title-row">
                    <div className="assess-icon-box"><Award size={18} /></div>
                    <div>
                      <h4>{a.title}</h4>
                      <span className="assess-date-range">
                        <Calendar size={12} /> {fmt(a.start_date)} → {fmt(a.end_date)}
                      </span>
                    </div>
                  </div>
                  <div className="nexus-action-control">
                    <button className={`nexus-action-btn ${a.is_published ? 'published' : ''}`} title={a.is_published ? 'Unpublish' : 'Publish'} onClick={() => handlePublishToggle(a)}>
                      {a.is_published ? <Eye size={16} color="var(--primary-color)" /> : <EyeOff size={16} />}
                    </button>
                    <button className="nexus-action-btn edit" onClick={() => handleEditAssessClick(a)}><Edit size={16} /></button>
                    <button className="nexus-action-btn delete" onClick={() => setDelTarget(a)}><Trash size={16} /></button>
                  </div>
                </div>
                <div className="assess-course-tags">
                  {(a.course_ids || []).map(cid => {
                    const c = courses.find(x => x.id === cid);
                    return c ? <span key={cid} className="course-chip">{c.name}</span> : null;
                  })}
                </div>
                <div className="assess-stats">
                  <span><GraduationCap size={13} /> {(a.class_ids || []).length} Classes</span>
                  <span><BookOpen size={13} /> {(a.course_ids || []).length} Courses</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline-sm" onClick={() => quickView(a)} style={{ flex: 1 }}>
                    <Table2 size={14} /> View Timetable
                  </button>
                  {a.is_published && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', background: '#e0e7ff', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={12} /> Published
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {activeTab === 'build' && (
      <div className="exam-section">
        <div className="section-action-row">
          <h3 className="section-label"><Table2 size={18} /> Build Timetable</h3>
        </div>

        <div className="tt-context-panel glass-panel">
          <h4 className="tt-step-label"><span className="step-dot">1</span> Select Context</h4>
          <div className="form-row four-col">
            <div className="form-group">
              <label>Assessment *</label>
              <NexusSelect
                options={assessments.map(a => ({ label: a.title, value: a.id }))}
                value={bAssessmentId}
                onChange={val => { setBAssessmentId(val); setBSpecId(''); setBCourseId(''); setBClassId(''); setTRows([]); }}
                placeholder="Choose Assessment…"
              />
            </div>
            <div className="form-group">
              <label>Course *</label>
              <NexusSelect
                options={bCourses.map(c => ({ label: c.name, value: c.id }))}
                value={bCourseId}
                onChange={val => { setBCourseId(val); setBSpecId(''); setBClassId(''); setTRows([]); }}
                placeholder="Choose Course…"
                disabled={!bAssessmentId}
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <NexusSelect
                options={[
                  { label: 'All Specializations', value: '' },
                  ...bSpecs.map(s => ({ label: s.name, value: s.id }))
                ]}
                value={bSpecId}
                onChange={val => { setBSpecId(val); setBClassId(''); setTRows([]); }}
                placeholder="All Specializations"
                disabled={!bCourseId}
              />
            </div>
            <div className="form-group">
              <label>Class *</label>
              <NexusSelect
                options={bClasses.map(c => ({ label: c.name, value: c.id }))}
                value={bClassId}
                onChange={val => { setBClassId(val); setTRows([]); checkDuplicate(bAssessmentId, val); }}
                placeholder="Choose Class…"
                disabled={!bCourseId || bClassLocked}
              />
              {bClassLocked && <p className="field-hint" style={{ color: 'var(--primary-color)' }}>Auto-selected based on Course & Spec.</p>}
            </div>
          </div>

          <div className="build-header-actions" style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button
              className="btn-outline-sm"
              onClick={() => setShowCopyModal(true)}
              disabled={!bAssessmentId || !bClassId || isDuplicate}
            >
              <Save size={14} /> Copy From Another Timetable
            </button>
            {isDuplicate && <span style={{ fontSize: '0.8rem', color: '#ff4d4f', fontWeight: 'bold' }}>⚠️ Schedule already exists for this class.</span>}
          </div>
        </div>

        {bClassId && (
          <div className="tt-rows-panel glass-panel">
            <h4 className="tt-step-label"><span className="step-dot">2</span> Schedule Subjects</h4>

            {tRows.length === 0 ? (
              <div className="tt-empty-hint">
                <BookOpen size={32} />
                <p>No subjects added yet. Click "Add Subject Row" to begin.</p>
              </div>
            ) : (
              <div className="tt-rows-table">
                <div className="tt-row tt-row-header">
                  <span>Subject</span><span>Exam Date</span><span>Start Time</span><span>End Time</span><span>Total Marks</span><span></span>
                </div>
                {tRows.map((row, idx) => {
                  const filteredSubs = bSubjects.filter(s => !usedSubjIds.includes(s.id) || parseInt(row.subject_id) === s.id);
                  return (
                    <div className="tt-row" key={idx}>
                      <NexusSelect
                        options={filteredSubs.map(s => ({ label: s.name, value: s.id }))}
                        value={row.subject_id}
                        onChange={val => updateRow(idx, 'subject_id', val)}
                        placeholder="Select Subject…"
                      />
                      <input 
                        type="date" 
                        value={row.exam_date} 
                        onChange={e => updateRow(idx, 'exam_date', e.target.value)} 
                        min={bAssessment?.start_date}
                        max={bAssessment?.end_date}
                      />
                      <input type="time" value={row.start_time} onChange={e => updateRow(idx, 'start_time', e.target.value)} />
                      <input type="time" value={row.end_time} onChange={e => updateRow(idx, 'end_time', e.target.value)} />
                      <input type="number" value={row.total_marks} onChange={e => updateRow(idx, 'total_marks', e.target.value)} min="1" />
                      <div className="nexus-action-control">
                        <button className="nexus-action-btn delete" onClick={() => removeRow(idx)}><Trash size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="tt-row-actions">
              <button className="btn-add-row" onClick={addRow}
                disabled={bSubjects.length === 0 || tRows.length >= bSubjects.length || isDuplicate || bAssessment?.is_published}>
                <Plus size={16} /> Add Subject Row
              </button>
              {tRows.length > 0 && (
                <button type="button" className="btn btn-primary" onClick={handleSaveTimetable} disabled={tSubmitting || bAssessment?.is_published}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 22px', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', opacity: bAssessment?.is_published ? 0.6 : 1 }}>
                  {tSubmitting ? <span>Saving…</span> : <><Save size={16} /><span>Save Timetable</span></>}
                </button>
              )}
            </div>
            {bAssessment?.is_published && (
              <div className="publish-lock-hint" style={{ marginTop: '10px', fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Timetable is published and locked. Unpublish to make changes.
              </div>
            )}
          </div>
        )}
      </div>
    )}

    {/* ════════════════════ VIEW TIMETABLE TAB ═══════════════════════════════ */}
    {activeTab === 'view' && (
      <div className="exam-section">
        <div className="section-action-row">
          <h3 className="section-label"><Eye size={18} /> View Timetable</h3>
          {ttLoaded && filteredTimetable.length > 0 && (
            <button
              className="btn-primary-glow"
              onClick={handleDownloadPDF}
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 6px 16px rgba(16,185,129,0.25)' }}
            >
              <Download size={16} /> Download PDF
            </button>
          )}
        </div>

        <div className="tt-filter-bar glass-panel">
          <div className="tt-filter-row">
            <Filter size={18} className="icon-blue" style={{ flexShrink: 0, marginBottom: '6px' }} />
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label>Assessment *</label>
              <NexusSelect
                options={assessments.map(a => ({ label: a.title, value: a.id }))}
                value={vAssessmentId}
                onChange={val => { setVAssessmentId(val); setVSpecId(''); setVCourseId(''); setTtLoaded(false); setTimetableData([]); }}
                placeholder="Choose Assessment…"
              />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label>Filter by Course</label>
              <NexusSelect
                options={[{ label: 'All Courses', value: '' }, ...vAllCourses.map(c => ({ label: c.name, value: c.id }))]}
                value={vCourseId}
                onChange={val => { setVCourseId(val); setVSpecId(''); }}
                placeholder="All Courses"
                disabled={!vAssessmentId}
              />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label>Specialization</label>
              <NexusSelect
                options={[
                  { label: 'All Specializations', value: '' },
                  ...vSpecs.map(s => ({ label: s.name, value: s.id }))
                ]}
                value={vSpecId}
                onChange={val => setVSpecId(val)}
                placeholder="All Specializations"
                disabled={!vCourseId}
              />
            </div>
            <button className="btn-primary-glow" onClick={loadTimetable} disabled={!vAssessmentId || ttLoading}
              style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
              {ttLoading ? 'Loading…' : <><Eye size={16} /> Load Timetable</>}
            </button>
          </div>
          {ttLoaded && vAssessment && (
            <div className="tt-view-meta">
              <span><Calendar size={13} /> {fmt(vAssessment.start_date)} — {fmt(vAssessment.end_date)}</span>
              <span><BookOpen size={13} /> {filteredTimetable.length} Exam slot{filteredTimetable.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {ttLoading && <div className="dept-empty"><p>Loading timetable…</p></div>}

        {ttLoaded && filteredTimetable.length === 0 && (
          <div className="dept-empty">
            <div className="empty-icon"><Table2 size={48} /></div>
            <h3>No Entries Found</h3>
            <p>{vCourseId ? 'No exam slots for the selected course filter.' : 'No timetable entries saved for this assessment yet.'}</p>
          </div>
        )}

        {ttLoaded && filteredTimetable.length > 0 && (
          <div className="tt-schedule-view">
            {sortedDates.map(dateKey => (
              <div key={dateKey} className="tt-day-block">
                <div className="tt-day-header">
                  <div className="tt-day-badge">
                    <span className="tt-day-num">{new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit' })}</span>
                    <span className="tt-day-mon">{new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="tt-day-info">
                    <span className="tt-day-name">{new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    <span className="tt-day-count">{groupedByDate[dateKey].length} Exam{groupedByDate[dateKey].length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="tt-slots-grid">
                  {groupedByDate[dateKey].map((entry, idx) => {
                    const isOver = isExamOver(entry.exam_date, entry.end_time);
                    return (
                      <div key={idx} className={`tt-slot-card ${isOver ? 'is-over' : ''}`}>
                        <div className="tt-slot-subject">
                          <BookOpen size={16} className="icon-blue" />
                          <span>{entry.subject_name || `Subject #${entry.subject_id}`}</span>
                          {isOver && <span className="status-badge over">Exam Over</span>}
                        </div>
                        <div className="tt-slot-meta">
                          <div className="tt-slot-time"><Clock size={13} /><span>{fmtTime(entry.start_time)} — {fmtTime(entry.end_time)}</span></div>
                          <div className="tt-slot-class"><GraduationCap size={13} /><span>{entry.class_name || `Class #${entry.class_id}`}</span></div>
                          <div className="tt-slot-marks"><Award size={13} /><span>{entry.total_marks} Marks</span></div>
                        </div>
                        <div className="tt-slot-actions" style={{ 
                          marginTop: '12px', 
                          paddingTop: '12px', 
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '8px'
                        }}>
                          {!isOver && !vAssessment?.is_published && (
                            <button 
                              className="btn-outline-sm"
                              onClick={() => {
                                setSlotToEdit(entry);
                                setEditSlotForm({
                                  exam_date: entry.exam_date,
                                  start_time: entry.start_time,
                                  end_time: entry.end_time,
                                  total_marks: entry.total_marks
                                });
                                setShowEditSlot(true);
                              }}
                              style={{ fontSize: '0.75rem', padding: '6px 12px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            >
                              <Edit size={14} /> Edit Slot
                            </button>
                          )}
                          <button 
                            className="btn-outline-sm" 
                            onClick={() => {
                              setSelectedExamForQP(entry);
                              setShowQPBuilder(true);
                            }}
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                            disabled={isOver}
                          >
                            <FileCheck size={14} /> Question Paper
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    <ConfirmDialog
      isOpen={!!delTarget}
      onClose={() => setDelTarget(null)}
      onConfirm={handleDeleteAssessment}
      title="Delete Assessment?"
      description={<>Remove <strong>{delTarget?.title}</strong>? All timetable entries will also be deleted.</>}
      icon={<Trash2 size={32} />}
      iconBgColor="#fff1f0"
      iconColor="#ff4d4f"
      confirmText="Delete"
      confirmBgColor="#ff4d4f"
    />

    {/* ── Copy Timetable Modal ── */}
    {showCopyModal && (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCopyModal(false)}>
        <div className="modal-container" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <div className="header-title">
              <div className="title-icon"><Table2 size={20} /></div>
              <h3>Copy Existing Timetable</h3>
            </div>
            <button className="close-modal" onClick={() => setShowCopyModal(false)}><X size={16} /></button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>Select a source to copy rows from. This will overwrite your current draft.</p>
            <div className="form-group">
              <label>Source Assessment</label>
              <NexusSelect
                options={assessments.map(a => ({ label: a.title, value: a.id }))}
                value={copySource.assessment_id}
                onChange={val => setCopySource({ ...copySource, assessment_id: val, class_id: '' })}
                placeholder="Select Assessment…"
              />
            </div>
            <div className="form-group">
              <label>Source Class</label>
              <NexusSelect
                options={classes.filter(c => {
                  const a = assessments.find(ax => ax.id === parseInt(copySource.assessment_id));
                  return a?.class_ids?.includes(c.id);
                }).map(c => ({ label: c.name, value: c.id }))}
                value={copySource.class_id}
                onChange={val => setCopySource({ ...copySource, class_id: val })}
                placeholder="Select Class…"
                disabled={!copySource.assessment_id}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowCopyModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCopyTimetable} disabled={ttLoading}>
              {ttLoading ? 'Fetching...' : 'Copy Timetable Rows'}
            </button>
          </div>
        </div>
      </div>
    )}

    {showQPBuilder && selectedExamForQP && (
      <QuestionPaperBuilder 
        exam={selectedExamForQP} 
        onClose={() => setShowQPBuilder(false)} 
        onSave={() => toast.success("Success", "Question paper saved successfully.")}
      />
    )}

    {/* ── Edit Slot Modal ── */}
    {showEditSlot && slotToEdit && (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditSlot(false)}>
        <div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <div className="header-title">
              <div className="title-icon"><Edit size={20} /></div>
              <h3>Edit Exam Slot</h3>
            </div>
            <button className="close-modal" onClick={() => setShowEditSlot(false)}><X size={16} /></button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
              Modify details for <strong>{slotToEdit.subject_name}</strong>.
            </p>
            <div className="form-group">
              <label>Exam Date</label>
              <input type="date" value={editSlotForm.exam_date} onChange={e => setEditSlotForm({ ...editSlotForm, exam_date: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" value={editSlotForm.start_time} onChange={e => setEditSlotForm({ ...editSlotForm, start_time: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" value={editSlotForm.end_time} onChange={e => setEditSlotForm({ ...editSlotForm, end_time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Total Marks</label>
              <input type="number" value={editSlotForm.total_marks} onChange={e => setEditSlotForm({ ...editSlotForm, total_marks: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowEditSlot(false)}>Cancel</button>
            <button className="btn-primary" onClick={async () => {
              try {
                const res = await fetch(`${API}/assessments/timetable/${slotToEdit.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editSlotForm)
                });
                if (res.ok) {
                  toast.success("Updated", "Exam slot updated successfully.");
                  setShowEditSlot(false);
                  loadTimetable();
                } else {
                  toast.error("Error", "Failed to update slot.");
                }
              } catch { toast.error("Error", "Network error."); }
            }}>Update Slot</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
