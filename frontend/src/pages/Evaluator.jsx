import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import UploadZone from '../components/UploadZone';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import StudentForm from '../components/StudentForm';
import SectionConfig from '../components/SectionConfig';
import { FileText, Type, UserCheck, RefreshCw, Layers, Download, CheckCircle, ChevronLeft, Search, Building2, Calendar, Mail, Phone, Hash, ChevronRight, GraduationCap, X } from 'lucide-react';
import LogoLoader from '../components/LogoLoader';
import SubmitButton from '../components/SubmitButton';
import NexusSelect from '../components/NexusSelect';
import BulkResultGrid from '../components/BulkResultGrid';
import ConfirmDialog from '../components/ConfirmDialog';
import './Evaluator.css';


export default function Evaluator() {
  const [studentFile, setStudentFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [evalMode, setEvalMode] = useState('single'); // 'single' or 'bulk'
  const [bulkFiles, setBulkFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [schema, setSchema] = useState(null);
  const [step, setStep] = useState(1); // 1: Identity, 2: Schema, 3: Upload
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [showAbsentDialog, setShowAbsentDialog] = useState(false);
  const [missingStudents, setMissingStudents] = useState([]);
  const [hasConfirmedMissing, setHasConfirmedMissing] = useState(false);
  const [sections, setSections] = useState([
    { id: 1, name: 'Section A', questions: 5, marks: 2 }
  ]);
  const containerRef = useRef(null);

  // IndexedDB Helper for File Persistence
  const dbName = "EvaluatorFilesDB";
  const storeName = "files";

  const getDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const saveFileLocally = async (key, file) => {
    try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(file, key);
    } catch (e) { console.error("IDB Save Error", e); }
  };

  const getFileLocally = async (key) => {
    try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readonly');
        const request = tx.objectStore(storeName).get(key);
        return new Promise(r => request.onsuccess = () => r(request.result));
    } catch (e) { return null; }
  };

  useEffect(() => {
    fetchStudents();
    
    // Restore state from localStorage
    const savedState = localStorage.getItem('evaluatorState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.step) setStep(state.step);
            if (state.selectedClassId) setSelectedClassId(state.selectedClassId);
            if (state.selectedSubjectId) setSelectedSubjectId(state.selectedSubjectId);
            if (state.studentDetails) setStudentDetails(state.studentDetails);
            if (state.schema) setSchema(state.schema);
            if (state.sections) setSections(state.sections);
            if (state.result) setResult(state.result);
            
            // Restore files from IndexedDB
            getFileLocally('studentFile').then(f => f && setStudentFile(f));
            getFileLocally('modelFile').then(f => f && setModelFile(f));
            getFileLocally('bulkFiles').then(f => f && setBulkFiles(Array.isArray(f) ? f : []));
        } catch (e) {
            console.error("Failed to restore state", e);
        }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
        step,
        selectedClassId,
        selectedSubjectId,
        studentDetails,
        schema,
        sections,
        result
    };
    localStorage.setItem('evaluatorState', JSON.stringify(state));
  }, [step, selectedClassId, selectedSubjectId, studentDetails, schema, sections, result]);

  const fetchStudents = async () => {
    try {
        const [stRes, clRes, subRes] = await Promise.all([
          axios.get('http://localhost:8000/students/'),
          axios.get('http://localhost:8000/classes/'),
          axios.get('http://localhost:8000/subjects/')
        ]);
        setStudents(stRes.data);
        setClasses(clRes.data);
        setSubjects(subRes.data);
    } catch (e) {
        console.error("Failed to sync institutional registry");
    }
  };

  // Sync files to IndexedDB
  useEffect(() => { if (studentFile) saveFileLocally('studentFile', studentFile); }, [studentFile]);
  useEffect(() => { if (modelFile) saveFileLocally('modelFile', modelFile); }, [modelFile]);
  useEffect(() => { if (bulkFiles.length > 0) saveFileLocally('bulkFiles', bulkFiles); }, [bulkFiles]);

  const changeStep = (newStep) => {
    setStepLoading(true);
    setTimeout(() => {
        setStep(newStep);
        setStepLoading(false);
    }, 2000);
  };
  
  const resetEvaluator = () => {
    setStudentFile(null);
    setModelFile(null);
    setBulkFiles([]);
    setResult(null);
    setStudentDetails(null);
    setStep(1);
    setSelectedClassId('');
    setSelectedSubjectId('');
    setStudentFilter('');
    localStorage.removeItem('evaluatorState');
    // Clear IndexedDB
    indexedDB.deleteDatabase(dbName);
  };

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
  }, []);

  const handleEvaluate = async () => {
    if (!studentFile) {
      setError("Please upload a student answer sheet.");
      return;
    }
    if (!modelFile) {
      setError("Please upload a model answer key.");
      return;
    }
    
    setError('');
    setLoading(true);
    setLoadingText("Extracting text via OCR...");
    setResult(null);

    const formData = new FormData();
    formData.append("student_file", studentFile);
    formData.append("model_file", modelFile);
    formData.append("eval_schema", JSON.stringify(schema));

    try {
      const response = await axios.post('http://localhost:8000/api/evaluate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // If the backend returned a validation error within a 200 OK
      if (response.data.error) {
        setError(String(response.data.error));
        setLoading(false);
        return;
      }

      setLoadingText("Comparing semantic meaning...");
      
      // Delay for animation effect
      setTimeout(() => {
        setResult(response.data);
        setLoading(false);
      }, 2000);

      
    } catch (err) {
      console.error("Evaluation Error:", err);
      let errorMsg = "An internal error occurred during the Nexus sync.";
      
      if (!err.response) {
        errorMsg = "Access Denied: The Nexus is unreachable. Please ensure the backend server is running on port 8000.";
      } else {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
            errorMsg = detail;
        } else if (Array.isArray(detail)) {
            errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else if (detail) {
            errorMsg = JSON.stringify(detail);
        }
      }
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleBulkEvaluate = async (proceedWithMissing = false) => {
    if (!studentFile) {
        setError("Reference key is missing.");
        return;
    }
    if (bulkFiles.length === 0) {
        setError("Bulk folder is empty or no files selected.");
        return;
    }

    // 1. Get all students in the selected class registry
    const classIdNum = parseInt(selectedClassId);
    const classStudents = students.filter(s => s.class_id === classIdNum);
    
    // 2. Map the uploaded files to their base names (registration IDs)
    const uploadedFileIds = bulkFiles.map(f => f.name.split('.').slice(0, -1).join('.').trim().toUpperCase());
    
    // 3. Identify missing students from the registry
    const missing = classStudents.filter(s => {
        const regId = (s.registration_id || '').trim().toUpperCase();
        return !uploadedFileIds.includes(regId);
    });
    
    // 4. Strict Blocking: If uploaded scripts do not match the registry perfectly, trigger verification.
    if (missing.length > 0 && !proceedWithMissing && !hasConfirmedMissing) {
        setMissingStudents(missing);
        setShowAbsentDialog(true);
        return;
    }

    // 5. Overflow Verification: Block if more files are found than students in the class
    if (bulkFiles.length > classStudents.length) {
        setError(`Registry Overflow: You have uploaded ${bulkFiles.length} scripts, but the class registry only has ${classStudents.length} students. Please only include registered candidate files.`);
        return;
    }


    setLoading(true);
    setLoadingText("Starting Massive Assessment Sync...");
    setError('');
    setShowAbsentDialog(false);

    const formData = new FormData();
    formData.append("model_file", studentFile); 
    bulkFiles.forEach(file => {
        formData.append("student_files", file);
    });
    formData.append("eval_schema", JSON.stringify(schema));

    try {
        const response = await axios.post('http://localhost:8000/api/bulk-evaluate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult({ ...response.data, isBulk: true });
        setLoading(false);
    } catch (err) {
        setError("Bulk Evaluation Failed. Check filenames and networking.");
        setLoading(false);
    }
  };



  const generateTemplate = (type) => {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Aesthetic Branding
    doc.setFillColor(61, 49, 255); // Nexus Primary
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(type === 'master' ? 'MASTER REFERENCE KEY' : 'CANDIDATE ANSWER SCRIPT', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Nexus AI Evaluation System | Institutional Standard', 20, 33);

    // Metadata Grid
    doc.setTextColor(26, 26, 46);
    let y = 55;
    
    const subjectObj = subjects.find(s => s.id === parseInt(selectedSubjectId));
    const subjectName = subjectObj?.name || 'N/A';
    const className = studentDetails?.academic_class?.name || 'N/A';
    const courseName = studentDetails?.academic_class?.course?.name || 'N/A';
    const specName = studentDetails?.academic_class?.course?.specialization?.name || 'N/A';

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(studentDetails?.name || 'Guest Student', 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('ID/REG:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(studentDetails?.registration_id || 'ID#'+studentDetails?.id, 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(subjectName, 60, y);

    // Right Column (at x=120)
    let ry = 55;
    doc.setFont('helvetica', 'bold');
    doc.text('CLASS:', 120, ry);
    doc.setFont('helvetica', 'normal');
    doc.text(className, 160, ry);

    ry += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('COURSE:', 120, ry);
    doc.setFont('helvetica', 'normal');
    doc.text(courseName, 160, ry);

    ry += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL.:', 120, ry);
    doc.setFont('helvetica', 'normal');
    doc.text(specName, 160, ry);

    doc.setDrawColor(229, 233, 242);
    doc.line(20, ry + 10, 190, ry + 10);
    
    y = ry + 25;

    schema?.forEach(sec => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(61, 49, 255);
        doc.text(`${sec.name} (${sec.marks} marks per question)`, 20, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(26, 26, 46);
        
        for(let i=1; i<=sec.questions; i++) {
            if (type === 'master') {
                doc.text(`Q${i})`, 25, y);
                y += 8;
                doc.text(`A${i})`, 25, y);
                y += 12;
            } else {
                doc.text(`A${i})`, 25, y);
                y += 15; 
            }
            if (y > 275) { doc.addPage(); y = 30; }
        }
        y += 5;
    });

    doc.save(`${type === 'master' ? 'Master' : 'Candidate'}_Script_${studentDetails?.registration_id || 'Nexus'}.pdf`);
  };

  const generateStudentIdList = () => {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFillColor(34, 197, 94); // Success Green for tracking
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('CLASS STUDENT REGISTRY (ID LIST)', 20, 20);
    
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(10);
    let y = 45;
    
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRATION ID', 20, y);
    doc.text('STUDENT NAME', 80, y);
    doc.line(20, y+2, 190, y+2);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    const classIdNum = parseInt(selectedClassId);
    const classStudents = students.filter(s => s.class_id === classIdNum);
    
    classStudents.forEach((s, idx) => {
        doc.text(s.registration_id || 'N/A', 20, y);
        doc.text(s.name, 80, y);
        y += 8;
        if (y > 280) { doc.addPage(); y = 20; }
    });
    
    doc.save(`Student_IDs_${classes.find(c => c.id === classIdNum)?.name || 'Batch'}.pdf`);
  };


  const generateWordTemplate = async (type) => {
    const subjectObj = subjects.find(s => s.id === parseInt(selectedSubjectId));
    const subjectName = subjectObj?.name || 'N/A';
    const className = studentDetails?.academic_class?.name || 'N/A';
    const courseName = studentDetails?.academic_class?.course?.name || 'N/A';
    const specName = studentDetails?.academic_class?.course?.specialization?.name || 'N/A';

    const sectionsObj = schema.map(sec => {
        const lines = [];
        lines.push(new Paragraph({
            text: `${sec.name} (${sec.marks} marks per question)`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
        }));
        
        for(let i=1; i<=sec.questions; i++) {
            if (type === 'master') {
                lines.push(new Paragraph({ children: [new TextRun({ text: `Q${i})`, bold: true, font: 'Poppins' })] }));
                lines.push(new Paragraph({ children: [new TextRun({ text: `A${i})`, font: 'Poppins' })], spacing: { after: 200 } }));
            } else {
                lines.push(new Paragraph({ children: [new TextRun({ text: `A${i})`, font: 'Poppins' })], spacing: { after: 400 } }));
            }
        }
        return lines;
    }).flat();

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ 
                    text: type === 'master' ? 'MASTER REFERENCE KEY' : 'CANDIDATE ANSWER SCRIPT', 
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ 
                    children: [
                        new TextRun({ text: `CANDIDATE: ${studentDetails?.name || 'Student'}`, bold: true, break: 1 }),
                        new TextRun({ text: `ID: ${studentDetails?.registration_id || 'ID#'+studentDetails?.id}`, break: 1 }),
                        new TextRun({ text: `SUBJECT: ${subjectName}`, break: 1 }),
                        new TextRun({ text: `CLASS: ${className}`, break: 1 }),
                        new TextRun({ text: `COURSE: ${courseName} | SPEC: ${specName}`, break: 1 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 600 }
                }),
                ...sectionsObj
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${type === 'master' ? 'Master' : 'Candidate'}_Script_${studentDetails?.registration_id || 'Nexus'}.docx`);
  };

  return (
    <div className="evaluator-page" ref={containerRef}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="header-text">
          <div className="evaluation-mode-toggle" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button 
                className={`mode-btn ${evalMode === 'single' ? 'active' : ''}`}
                onClick={() => { setEvalMode('single'); setStep(1); setStudentDetails(null); }}
              >
                  Standard Profile
              </button>
              <button 
                className={`mode-btn ${evalMode === 'bulk' ? 'active' : ''}`}
                onClick={() => { setEvalMode('bulk'); setStep(1); setStudentDetails(null); }}
              >
                  Batch Assessment
              </button>
          </div>

          <div className="eval-nav-stepper" style={{ marginBottom: '1.5rem', marginLeft: '0', padding: '0.5rem 1rem' }}>
              <div className={`step-node ${step >= 1 ? 'active' : ''}`}>Identity</div>
              <div className="step-line" />
              <div className={`step-node ${step >= 2 ? 'active' : ''}`}>Schema</div>
              <div className="step-line" />
              <div className={`step-node ${step >= 3 ? 'active' : ''}`}>Evaluation</div>
          </div>
          <h2>AI Answer Evaluator</h2>
          <p>Execute intelligent semantic verification on student submissions.</p>
          {studentDetails && (
            <div className="active-student-pill glass-panel" style={{ marginTop: '1.5rem' }}>
              <UserCheck size={16} />
              <span>Verifying: <strong>{studentDetails.name}</strong> ({studentDetails.registration_id || 'ID#'+studentDetails.id})</span>
              <button className="reset-student-btn" onClick={() => { setStudentDetails(null); setSchema(null); changeStep(1); setResult(null); setStudentFilter(''); }}>
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {stepLoading && <LogoLoader message="Architecting Assessment Flow..." />}

      {!stepLoading && step === 1 && (

        <div className="identity-nexus-step">
            <div className="nexus-step-header">
                <h3>Identify Candidate</h3>
                <p>Identify the academic group and subject to start this assessment stream.</p>
            </div>

            <div className="identity-selection-matrix" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="class-nexus-row">
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Class Allocation</label>
                    <NexusSelect 
                        options={classes.map(c => ({ label: c.name, value: c.id }))}
                        value={selectedClassId}
                        onChange={(val) => {
                            setSelectedClassId(val);
                            setSelectedSubjectId('');
                            setStudentDetails(null);
                            setStudentFilter('');
                        }}
                        placeholder="Select Class"
                    />
                </div>

                <div className="subject-nexus-row">
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Assessment Subject</label>
                    <NexusSelect 
                        disabled={!selectedClassId}
                        options={subjects.filter(s => s.class_id === parseInt(selectedClassId)).map(s => ({ label: s.name, value: s.id }))}
                        value={selectedSubjectId}
                        onChange={(val) => {
                            setSelectedSubjectId(val);
                            setStudentDetails(null);
                            setStudentFilter('');
                        }}
                        placeholder="Select Subject"
                    />
                </div>
            </div>

            {selectedSubjectId && evalMode === 'single' && (
                <div className={`student-nexus-selector ${showStudentList ? 'selecting' : ''}`} style={{ animation: 'fadeIn 0.3s ease' }}>

                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Search Student</label>
                    <div className="nexus-search-row">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder={`Search among students of selected class...`}
                            value={studentFilter}
                            onChange={(e) => {
                                setStudentFilter(e.target.value);
                                setShowStudentList(true);
                            }}
                            onFocus={() => setShowStudentList(true)}
                        />
                        {showStudentList && <button className="close-dropdown-btn" onClick={() => setShowStudentList(false)}><X size={16} /></button>}
                    </div>

                    {showStudentList && (
                        <div className="student-result-dropdown">
                            {students
                                .filter(s => s.class_id === parseInt(selectedClassId))
                                .filter(s => 
                                    s.name.toLowerCase().includes(studentFilter.toLowerCase()) || 
                                    (s.registration_id && s.registration_id.toLowerCase().includes(studentFilter.toLowerCase()))
                                )
                                .map(s => (
                                    <div key={s.id} className="student-select-item" onClick={() => {
                                        setStudentDetails(s);
                                        setStudentFilter(s.name);
                                        setShowStudentList(false);
                                    }}>
                                        <div className="student-avatar-mini">{s.name[0]}</div>
                                        <div className="item-info">
                                            <span className="item-name">{s.name}</span>
                                            <span className="item-reg">{s.registration_id || 'ID#'+s.id}</span>
                                        </div>
                                        <div className="item-class">{s.academic_class?.name}</div>
                                    </div>
                                ))
                            }
                            {students.filter(s => s.class_id === parseInt(selectedClassId)).length === 0 && (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No students registered in this class.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {evalMode === 'bulk' && selectedSubjectId && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                    <button className="btn-primary evaluate-proceed-btn" onClick={() => changeStep(2)}>
                        <span>Continue to Schema Architecture</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {studentDetails && evalMode === 'single' && (
                <div className="student-profile-detailed glass-panel">
                    <div className="profile-top">
                        <div className="avatar-huge">{studentDetails.name[0]}</div>
                        <div className="id-card-info">
                            <h2>{studentDetails.name}</h2>
                            <div className="badge-ribbon">
                                <span className="reg-badge"><Hash size={12}/> {studentDetails.registration_id || 'UNASSIGNED'}</span>
                                <span className={`status-pill ${studentDetails.is_active ? 'active' : 'inactive'}`}>
                                    {studentDetails.is_active ? 'Active Record' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="academic-matrix">
                         <div className="matrix-col">
                            <label><Building2 size={14}/> Faculty Path</label>
                            <div className="value-group">
                                <span><strong>Dept:</strong> {studentDetails.academic_class?.department?.name}</span>
                                <span><strong>Course:</strong> {studentDetails.academic_class?.course?.name}</span>
                            </div>
                         </div>
                         <div className="matrix-col">
                            <label><GraduationCap size={14}/> Level & Term</label>
                            <div className="value-group">
                                <span><strong>Class:</strong> {studentDetails.academic_class?.name}</span>
                                <span><strong>Year:</strong> {studentDetails.academic_class?.academic_year} | <strong>Sem:</strong> {studentDetails.academic_class?.semester}</span>
                            </div>
                         </div>
                         <div className="matrix-col">
                            <label><Mail size={14}/> Communication</label>
                            <div className="value-group">
                                <span><strong>E:</strong> {studentDetails.email}</span>
                                <span><strong>P:</strong> {studentDetails.phone || 'Not Shared'}</span>
                            </div>
                         </div>
                    </div>

                    <div className="profile-action-footer">
                        <button className="btn-primary evaluate-proceed-btn" onClick={() => changeStep(2)}>
                            <span>Continue to Schema Architecture</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
 
      {!stepLoading && step === 2 && (

        <div className="step-container">
            <button className="btn-back-nexus" onClick={() => changeStep(1)}>
                <ChevronLeft size={18}/> 
                <span>Back</span>
            </button>
            <SectionConfig 
                sections={sections}
                setSections={setSections}
                onComplete={(schema) => {
                    setSchema(schema);
                    changeStep(3);
                }} 
                onClose={() => changeStep(1)}
            />
        </div>
      )}
 
      {!stepLoading && step === 3 && (

        <>
          <div className="template-download-ribbon glass-panel">
            <div className="ribbon-text">
                <Download size={20} className="icon-blue" />
                <div>
                   <h4>Template Repository Ready</h4>
                   <p>Download the formatted schemas, edit them, and upload as PDF.</p>
                </div>
            </div>
            <div className="ribbon-actions">
                <div className="template-group">
                    <p className="group-label">Reference Key</p>
                    <div className="btn-stack">
                        <button className="btn btn-secondary template-btn pdf" onClick={() => generateTemplate('master')}>
                            Download PDF
                        </button>
                        <button className="btn btn-secondary template-btn word" onClick={() => generateWordTemplate('master')}>
                            Download Word
                        </button>
                    </div>
                </div>
                <div className="template-group">
                    <p className="group-label">Candidate Script</p>
                    <div className="btn-stack">
                        <button className="btn btn-secondary template-btn pdf" onClick={() => generateTemplate('candidate')}>
                            Download PDF
                        </button>
                        <button className="btn btn-secondary template-btn word" onClick={() => generateWordTemplate('candidate')}>
                            Download Word
                        </button>
                    </div>
                </div>
                <div className="template-group">
                    <p className="group-label">Batch Management</p>
                    <div className="btn-stack">
                        <button className="btn btn-secondary template-btn" onClick={generateStudentIdList}>
                            Download ID List
                        </button>
                    </div>
                </div>
            </div>
          </div>


          <div className="eval-grid">
            <div className="eval-col">
              <div className="section-title">
                <FileText size={20} className="icon-blue" />
                <h3>1. Master Reference Key</h3>
              </div>
              <p className="field-desc">Upload document containing Questions (Q1:) and correct Answers (A1:).</p>
              <UploadZone 
                onFileSelect={setStudentFile} 
                currentFile={studentFile} 
                id="student-upload"
                label="Reference Key (Correct Q&A)"
              />
            </div>
            
            <div className="eval-col">
              <div className="section-title">
                {evalMode === 'single' ? <Type size={20} className="icon-purple" /> : <Layers size={20} className="icon-purple" />}
                <h3>2. {evalMode === 'single' ? 'Candidate Submission' : 'Bulk Answer Repository'}</h3>
              </div>
              
              {evalMode === 'single' ? (
                <>
                    <p className="field-desc">Upload the student's answer sheet labeled correctly (A1: etc).</p>
                    <UploadZone 
                        onFileSelect={setModelFile} 
                        currentFile={modelFile} 
                        id="model-upload"
                        label="Candidate Script (Student's Answer)"
                    />
                </>
              ) : (
                <div className="bulk-instruction-container">
                    <div className="bulk-alert-info">
                        <strong>Bulk Processing Architecture:</strong>
                        <ul>
                            <li>Step 1: Create a folder named <code>Bulk answer upload</code></li>
                            <li>Step 2: Save each candidate script as a PDF or DOCX named with the <strong>Student Registration ID</strong> (e.g. <code>REG001.pdf</code> or <code>REG001.docx</code>)</li>
                            <li>Step 3: Click "Browse" below and select <strong>all candidate scripts</strong> from that folder (Ctrl+A).</li>
                        </ul>
                    </div>
                    <div className="multi-upload-wrapper">
                        <input 
                            type="file" 
                            id="bulk-input" 
                            multiple 
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const files = Array.from(e.target.files).filter(f => {
                                    const ext = f.name.toLowerCase();
                                    return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc');
                                });
                                setBulkFiles(files);
                                setHasConfirmedMissing(false);
                                
                                // Perform Immediate Synchronization Check
                                if (files.length > 0 && selectedClassId) {
                                    const classIdNum = parseInt(selectedClassId);
                                    const classSt = students.filter(s => s.class_id === classIdNum);
                                    const uploadedFileIds = files.map(f => f.name.split('.').slice(0, -1).join('.').trim().toUpperCase());
                                    const missing = classSt.filter(s => {
                                        const regId = (s.registration_id || '').trim().toUpperCase();
                                        return !uploadedFileIds.includes(regId);
                                    });
                                    if (missing.length > 0) {
                                        setMissingStudents(missing);
                                        setShowAbsentDialog(true);
                                    }
                                }
                            }}

                        />

                        <label htmlFor="bulk-input" className="bulk-drop-zone">
                            <Layers size={32} />
                            <span>{bulkFiles.length > 0 ? `${bulkFiles.length} Scripts Synchronized` : 'Select "Bulk answer upload" Contents'}</span>
                        </label>
                    </div>
                    
                    {bulkFiles.length > 0 && (
                        <div className="bulk-verification-pills">
                            <p style={{ width: '100%', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Automated Filename Verification:</p>
                            {bulkFiles.slice(0, 15).map((f, i) => {
                                const regId = f.name.split('.')[0];
                                const isMatch = students.some(s => s.registration_id === regId && s.class_id === parseInt(selectedClassId));
                                return (
                                    <span key={i} className={`verify-pill ${isMatch ? 'match' : 'mismatch'}`}>
                                        {regId} 
                                        {isMatch ? 
                                            <CheckCircle size={10} style={{ color: '#22c55e' }} /> : 
                                            <X size={10} style={{ color: '#ef4444' }} />
                                        }
                                    </span>
                                );
                            })}
                            {bulkFiles.length > 15 && <span className="verify-pill">+{bulkFiles.length - 15} more...</span>}
                        </div>
                    )}
                </div>
              )}
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="action-row">
            <SubmitButton 
              loading={loading} 
              text="Start Evaluation" 
              loadingText={evalMode === 'bulk' ? 'Processing Batch...' : 'Evaluating...'} 
              icon={<CheckCircle size={18} />} 
              className="btn btn-primary evaluate-btn" 
              onClick={evalMode === 'single' ? handleEvaluate : handleBulkEvaluate}
            />
            {loading && <Loader text={loadingText} />}
            <button className="btn-text-only" onClick={() => changeStep(2)}>Modify Schema Architecture</button>
          </div>
        </>
      )}

       {result && result.isBulk && (
          <BulkResultGrid 
            result={result} 
            studentDetails={studentDetails} 
            students={students} 
            schema={schema}
            subjectName={subjects.find(s => s.id === parseInt(selectedSubjectId))?.name}
            classId={selectedClassId}
            subjectId={selectedSubjectId}
            onPublishSuccess={resetEvaluator}
          />
      )}

      {result && !result.isBulk && (
          <ResultCard 
            result={result} 
            studentDetails={studentDetails} 
            students={students}
            filename={studentFile?.name}
            schema={schema}
            subjectName={subjects.find(s => s.id === parseInt(selectedSubjectId))?.name || 'N/A'}
            className={studentDetails?.academic_class?.name || 'N/A'}
            courseName={studentDetails?.academic_class?.course?.name || 'N/A'}
            specializationName={studentDetails?.academic_class?.course?.specialization?.name || 'N/A'}
            subjectId={selectedSubjectId}
            onPublishSuccess={resetEvaluator}
          />
      )}

      <ConfirmDialog 
        isOpen={showAbsentDialog}
        type="warning"
        onClose={() => {
            setShowAbsentDialog(false);
            setBulkFiles([]); // Reset files if they cancel
            setHasConfirmedMissing(false);
        }}
        onConfirm={() => {
            setHasConfirmedMissing(true);
            setShowAbsentDialog(false);
        }}
        title="Student Scripts Missing"
        message={`${missingStudents.length} students from the selected class registry do not have matching PDF files in this folder. Mark them as absent and continue evaluation?`}
        confirmText="Mark Absent & Continue"
        cancelText="Cancel & Re-check"
      />

    </div>
  );
}

