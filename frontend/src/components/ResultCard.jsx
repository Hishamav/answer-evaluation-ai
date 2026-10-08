import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Award, FileText, CheckCircle2, Download, Terminal, Layers, X, RefreshCw } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import ThreeScore from './ThreeScore';
import './ResultCard.css';

export default function ResultCard({ result: fullResult, studentDetails, subjectName, className, courseName, specializationName, subjectId, hidePublish = false, students = [], filename = '', onPublishSuccess, onReset }) {
  const containerRef = useRef(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setCurrentPage(1);
    setShowConfirmPublish(false);
  }, [fullResult]);

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Handle both old and new result format (full result object vs evaluation_details)
  const result = fullResult.evaluation_details || fullResult;

  const allSummaryResults = result.sections?.flatMap(sec => 
    sec.results.map(r => ({ ...r, sectionName: sec.section_name }))
  ) || [];

  const totalPages = Math.ceil(allSummaryResults.length / ITEMS_PER_PAGE);
  const paginatedResults = allSummaryResults.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(containerRef.current, { scale: 0.9, opacity: 0, y: 50 }, { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.2)" });
    
    const targetPercentage = result.percentage || 0;
    setDisplayScore(0);
    const scoreVal = { val: 0 };
    gsap.to(scoreVal, {
        val: targetPercentage,
        duration: 2.5,
        ease: "power2.out",
        onUpdate: () => setDisplayScore(scoreVal.val)
    });
  }, [result.percentage]);

  const getScoreColor = (score) => {
    if (score >= 80) return "#28a745"; 
    if (score >= 50) return "#ffc107"; 
    return "#dc3545"; 
  };

  const handleGeneratePDF = () => {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // High-End Branding Header
    doc.setFillColor(61, 49, 255); // Nexus Primary
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text("ASSESSMENT PERFORMANCE REPORT", 20, 32);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Official Semantic Analytics | Generated: ${new Date().toLocaleDateString()}`, 20, 40);

    // Profile Matrix
    doc.setTextColor(26, 26, 46);
    let y = 70;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("CANDIDATE PROFILE", 20, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(studentDetails?.name || 'N/A', 50, y);

    doc.setFont('helvetica', 'bold');
    doc.text('CLASS:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(className, 140, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('REG ID:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(studentDetails?.registration_id || 'ID#'+studentDetails?.id, 50, y);

    doc.setFont('helvetica', 'bold');
    doc.text('COURSE:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(courseName, 140, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(subjectName, 50, y);

    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL.:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(specializationName, 140, y);

    // Human Evaluations Section
    if (fullResult.is_teacher_evaluated || fullResult.is_principal_evaluated) {
        y += 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("FACULTY EVALUATION", 20, y);
        y += 8;
        
        if (fullResult.is_teacher_evaluated) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Teacher's Score: ${fullResult.teacher_marks}`, 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            const splitTeacher = doc.splitTextToSize(`Comment: ${fullResult.teacher_comment}`, pageWidth - 40);
            doc.text(splitTeacher, 20, y);
            y += (splitTeacher.length * 5) + 5;
        }

        if (fullResult.is_principal_evaluated) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Principal's Score: ${fullResult.principal_marks}`, 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            const splitPrincipal = doc.splitTextToSize(`Comment: ${fullResult.principal_comment}`, pageWidth - 40);
            doc.text(splitPrincipal, 20, y);
            y += (splitPrincipal.length * 5) + 5;
        }
    }

    // Results Box
    y += 5;
    doc.setFillColor(248, 250, 255);
    doc.roundedRect(20, y, pageWidth - 40, 30, 4, 4, 'F');
    doc.setDrawColor(61, 49, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, y, pageWidth - 40, 30, 4, 4, 'D');

    doc.setTextColor(61, 49, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("AGGREGATE AI SCORE", 30, y + 12);
    doc.setFontSize(22);
    doc.text(`${result.obtained_marks}/${result.total_marks}`, 140, y + 20);

    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(`ACCURACY PERCENTAGE: ${result.percentage}%`, 30, y + 22);

    let currentY = y + 45;

    result.sections?.forEach(sec => {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        
        doc.setFillColor(242, 244, 255);
        doc.rect(20, currentY, pageWidth - 40, 12, 'F');
        doc.setTextColor(61, 49, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sec.section_name} Breakdown`, 25, currentY + 8);
        
        currentY += 15;

        const tableData = sec.results.map(r => [
            r.tag,
            r.question,
            r.marks_obtained + '/' + r.marks_possible,
            r.similarity + '%'
        ]);

        doc.autoTable({
            startY: currentY,
            head: [['Tag', 'Question', 'Score', 'Similarity']],
            body: tableData,
            styles: { fontSize: 9, font: 'helvetica' },
            headStyles: { fillColor: [61, 49, 255] },
            margin: { left: 20, right: 20 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Result_Report_${studentDetails?.registration_id || 'Nexus'}.pdf`);
  };

  const handlePublishResult = async () => {
    setShowConfirmPublish(false);
    try {
        let activeStudent = studentDetails;
        
        // Fallback: If studentDetails is incomplete, try to find student using filename (registration_id)
        if (!activeStudent?.id && filename) {
            const regId = filename.split('.')[0].trim().toUpperCase();
            const found = students.find(s => (s.registration_id || '').trim().toUpperCase() === regId);
            if (found) activeStudent = found;
        }

        const classIdVal = activeStudent?.class_id || activeStudent?.academic_class?.id;
        const subjectIdVal = parseInt(subjectId);

        if (!activeStudent?.id || !subjectIdVal || !classIdVal) {
            console.error("Missing IDs", { studentId: activeStudent?.id, subjectId: subjectIdVal, classId: classIdVal });
            showAlert("Publishing Error", "Essential identification data is missing. Please ensure student and subject are correctly selected.", "error");
            return;
        }

        if (fullResult.id && typeof fullResult.id === 'number') {
            // Case: Result already exists in DB, just publish it
            const res = await fetch(`http://localhost:8000/api/results/${fullResult.id}/publish`, {
                method: 'PUT'
            });
            if (res.ok) {
                showAlert("Success", "Result has been published to the student portal.");
                if (onPublishSuccess) onPublishSuccess();
            }
            else showAlert("Failure", "Failed to update publication status.", "error");
        } else {
            // Case: New evaluation, need to save it to DB as published
            const payload = {
                student_id: activeStudent.id,
                subject_id: subjectIdVal,
                class_id: classIdVal,
                total_marks: result.total_marks,
                obtained_marks: result.obtained_marks,
                percentage: result.percentage,
                evaluation_details: result,
                is_published: true
            };
            
            const res = await fetch('http://localhost:8000/api/results/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                showAlert("Success", "Result successfully saved and published to the student portal.");
                if (onPublishSuccess) onPublishSuccess();
            }
            else {
                const errData = await res.json();
                console.error("Save Error", errData);
                showAlert("Failure", "Failed to save and publish result. Please check backend logs.", "error");
            }
        }
    } catch (err) {
        console.error("Publishing failed", err);
        showAlert("Network Error", "Could not connect to the evaluation server.", "error");
    }
  };

  return (
    <div className="result-container" ref={containerRef}>
      <div className="result-header glass-panel">
        <div className="score-3d-wrapper">
          <ThreeScore score={displayScore} />
          <div className="score-3d-label">OVERALL ACCURACY</div>
        </div>
        <div className="feedback-section">
          <h3><Award className="icon-grad" size={28}/> PERFORMANCE ANALYSIS</h3>
          <p className="feedback-text">
            {result.percentage >= 80 ? "EXCELLENT PERFORMANCE: High semantic accuracy and conceptual alignment with institutional keys." : 
             result.percentage >= 50 ? "SUFFICIENT PERFORMANCE: Moderate conceptual alignment with some missing details." : 
             "UNSATISFACTORY PERFORMANCE: Significant conceptual gaps detected across the assessment blocks."}
          </p>
          <div className="performance-metrics-grid">
            <div className="metric-card hero">
              <span className="metric-label">Aggregate Marks</span>
              <span className="metric-value">{result.obtained_marks} / {result.total_marks}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Semantic Match</span>
              <span className="metric-value">{result.percentage}%</span>
            </div>
            <div className="metric-card">
                <span className="metric-label">Candidate ID</span>
                <span className="metric-value">{studentDetails?.registration_id || 'ID#'+studentDetails?.id}</span>
            </div>
          </div>
        </div>
      </div>

      {(fullResult.is_teacher_evaluated || fullResult.is_principal_evaluated) && (
        <div className="human-evaluation-section glass-panel" style={{ marginTop: '20px', padding: '25px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: fullResult.is_teacher_evaluated && fullResult.is_principal_evaluated ? '1fr 1fr' : '1fr', gap: '20px' }}>
                {fullResult.is_teacher_evaluated && (
                    <div className="eval-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={18} /> Teacher's Evaluation
                            </h4>
                            <span style={{ fontWeight: 700, background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                Score: {fullResult.teacher_marks}
                            </span>
                        </div>
                        <p style={{ color: '#475569', fontStyle: 'italic' }}>"{fullResult.teacher_comment}"</p>
                    </div>
                )}
                {fullResult.is_principal_evaluated && (
                    <div className="eval-box" style={{ borderLeft: fullResult.is_teacher_evaluated ? '1px solid #e2e8f0' : 'none', paddingLeft: fullResult.is_teacher_evaluated ? '20px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Layers size={18} /> Principal's Evaluation
                            </h4>
                            <span style={{ fontWeight: 700, background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                Score: {fullResult.principal_marks}
                            </span>
                        </div>
                        <p style={{ color: '#475569', fontStyle: 'italic' }}>"{fullResult.principal_comment}"</p>
                    </div>
                )}
            </div>
        </div>
      )}

      <div className="section-analysis-area">
        <div className="section-analysis-header">
            <h3><CheckCircle2 size={22} className="icon-blue" /> INDIVIDUAL QUESTION BREAKDOWN</h3>
            {totalPages > 1 && (
                <div className="pagination-compact">
                    Page {currentPage} of {totalPages}
                </div>
            )}
        </div>
        
        <div className="results-grid">
            {paginatedResults.map((res, idx) => (
            <div key={idx} className="fragment-card glass-panel">
                <div className="fragment-header">
                <div className="fragment-header-main">
                    <span className="fragment-tag">{res.tag}</span>
                    <span className="section-context-tag">{res.sectionName}</span>
                </div>
                <span className="fragment-score" style={{ color: getScoreColor(res.similarity) }}>
                    {res.similarity}% Match
                </span>
                </div>
                <div className="fragment-body">
                <div className="fragment-question">
                    <strong>Question:</strong> {res.question}
                </div>
                <div className="item-marks">
                    Score: {res.marks_obtained} / {res.marks_possible}
                </div>
                <div className="fragment-answers-grid">
                    <div className="answer-box student">
                    <label>Master Guide Answer</label>
                    <p>{res.ref_answer}</p>
                    </div>
                    <div className="answer-box model">
                    <label>Candidate Workspace</label>
                    <p>{res.cand_answer || "NO CONTENT DETECTED"}</p>
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>

        {totalPages > 1 && (
            <div className="pagination-controls">
                <button 
                    className="btn btn-secondary page-btn" 
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                    Prev
                </button>
                <div className="page-numbers">
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i} 
                            className={`page-num ${currentPage === i+1 ? 'active' : ''}`}
                            onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button 
                    className="btn btn-secondary page-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                    Next
                </button>
            </div>
        )}
      </div>
      <div className="result-footer-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        {onReset && (
            <button className="btn btn-secondary export-pdf-btn" onClick={onReset} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                <RefreshCw size={20} />
                <span>Start New</span>
            </button>
        )}
        <button
            className="btn btn-secondary export-pdf-btn"
            onClick={handleGeneratePDF}
            style={{
                background: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                color: 'white'
            }}
        >
            <Download size={20} />
            <span>Export Report as PDF</span>
        </button>
        {!hidePublish && (
            fullResult.is_published ? (
                <div className="status-badge-published" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '10px 20px', 
                    borderRadius: '12px', 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    fontWeight: '600'
                }}>
                    <CheckCircle2 size={20} />
                    <span>Published to Portal</span>
                </div>
            ) : (
                <button className="btn btn-primary export-pdf-btn" onClick={() => setShowConfirmPublish(true)} style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                    <CheckCircle2 size={20} />
                    <span>Publish to Portal</span>
                </button>
            )
        )}
      </div>

      <div className="extracted-text-section glass-panel">
        <h3><Terminal size={20}/> RAW TRANSCRIPTION DATA</h3>
        <details>
            <summary>View Extracted Master Key</summary>
            <pre className="text-content">{result.extracted_student_text}</pre>
        </details>
        <details>
            <summary>View Extracted Candidate Script</summary>
            <pre className="text-content">{result.extracted_model_text}</pre>
        </details>
      </div>

      <ConfirmDialog 
        isOpen={showConfirmPublish}
        title="Publish Result"
        message="Are you sure you want to publish this assessment result to the student portal? Students will be able to view their scores and download the report immediately."
        confirmText="Confirm & Publish"
        cancelText="Cancel"
        onConfirm={handlePublishResult}
        onClose={() => setShowConfirmPublish(false)}
      />

      <ConfirmDialog 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={false}
        confirmText="Dismiss"
        onConfirm={() => {
            setAlertConfig({ ...alertConfig, isOpen: false });
            // If success, we might want to refresh the UI state, 
            // but since ResultCard is often a child of a list, 
            // we'll just let the parent handle it or assume the user will reload.
            // For now, we'll manually set a local flag if we want.
        }}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
}
