import React, { useState } from 'react';
import { Download, Eye, FileText, User, CheckCircle, XCircle, FolderDown, X } from 'lucide-react';
import ResultCard from './ResultCard';
import ConfirmDialog from './ConfirmDialog';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './ResultCard.css'; // Reuse some styles

export default function BulkResultGrid({ result, students, schema, subjectName, classId, subjectId, onPublishSuccess }) {
  const [selectedResult, setSelectedResult] = useState(null);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };



  const handleBulkExport = async () => {
    if (!window.jspdf) {
        alert("PDF generation library not found.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const zip = new JSZip();
    
    result.results.forEach((res) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        const student = getStudentInfo(res.registration_id);
        const studentClass = students.find(s => s.registration_id === res.registration_id)?.academic_class;
        const classNameStr = studentClass?.name || 'N/A';
        const courseNameStr = studentClass?.course?.name || 'N/A';
        const specNameStr = studentClass?.course?.specialization?.name || 'N/A';

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
        doc.text(student?.name || 'N/A', 50, y);

        doc.setFont('helvetica', 'bold');
        doc.text('CLASS:', 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text(classNameStr, 140, y);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('REG ID:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(student?.registration_id || 'ID#'+student?.id, 50, y);

        doc.setFont('helvetica', 'bold');
        doc.text('COURSE:', 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text(courseNameStr, 140, y);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('SUBJECT:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(subjectName, 50, y);

        doc.setFont('helvetica', 'bold');
        doc.text('SPECIAL.:', 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text(specNameStr, 140, y);

        // Results Box
        y += 15;
        doc.setFillColor(248, 250, 255);
        doc.roundedRect(20, y, pageWidth - 40, 30, 4, 4, 'F');
        doc.setDrawColor(61, 49, 255);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, y, pageWidth - 40, 30, 4, 4, 'D');

        doc.setTextColor(61, 49, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("AGGREGATE SCORE", 30, y + 12);
        doc.setFontSize(22);
        doc.text(`${res.obtained_marks}/${res.total_marks}`, 140, y + 20);

        doc.setFontSize(10);
        doc.setTextColor(110, 110, 110);
        doc.text(`ACCURACY PERCENTAGE: ${res.percentage}%`, 30, y + 22);

        let currentY = y + 45;

        res.sections?.forEach(sec => {
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
                (r.question || '').substring(0, 40) + '...',
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
        
        // Add PDF to zip
        const pdfBlob = doc.output('blob');
        const fileName = `Result_Report_${student?.registration_id || 'ID#'+student?.id}.pdf`;
        zip.file(fileName, pdfBlob);
    });

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `Bulk_Result_Report_${subjectName}.zip`);
    } catch (err) {
        console.error("Failed to generate zip", err);
        alert("Failed to collect PDFs into a single folder file.");
    }
  };
  const getStudentInfo = (regId) => {
    if (!regId) return { name: 'Unknown Student', registration_id: 'N/A' };
    
    const searchId = regId.trim().toUpperCase();
    
    // Exact match
    let student = students.find(s => (s.registration_id || '').trim().toUpperCase() === searchId);
    
    // Fuzzy match: check if registration_id is contained within the filename or vice-versa
    if (!student) {
        student = students.find(s => {
            const dbId = (s.registration_id || '').trim().toUpperCase();
            return dbId && (searchId.includes(dbId) || dbId.includes(searchId));
        });
    }

    if (student) return student;
    return { name: 'Unknown (Unlinked)', registration_id: regId, id: null };
  };

  const handlePublishResults = async () => {
    setShowConfirmPublish(false);
    
    const validResults = result.results.filter(res => !res.error);
    const publishable = validResults.filter(res => {
        const student = getStudentInfo(res.registration_id);
        return student && student.id;
    });

    console.log("Publishing Summary:", {
        total: result.results.length,
        valid: validResults.length,
        publishable: publishable.length,
        registrySize: students.length
    });

    if (publishable.length === 0) {
        showAlert("Linkage Error", `None of the ${validResults.length} scripts could be linked to students in the Institutional Registry. Please ensure filenames match Registration IDs exactly.`, "error");
        return;
    }

    try {
        const publishPromises = publishable.map(async (res) => {
            const student = getStudentInfo(res.registration_id);
            const payload = {
                student_id: student.id,
                subject_id: parseInt(subjectId),
                class_id: parseInt(classId),
                total_marks: res.total_marks,
                obtained_marks: res.obtained_marks,
                percentage: res.percentage,
                evaluation_details: res,
                is_published: true
            };
            
            try {
                const response = await fetch('http://localhost:8000/api/results/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                return response;
            } catch (innerErr) {
                console.error(`Network error for ${student.name}:`, innerErr);
                return null;
            }
        });

        const responses = await Promise.all(publishPromises);
        const successCount = responses.filter(r => r && r.ok).length;
        
        if (successCount > 0) {
            showAlert("Publication Synchronized", `${successCount} results successfully pushed to student portals.`, "success");
            if (onPublishSuccess) onPublishSuccess();
        } else {
            showAlert("Synchronization Failure", "The backend rejected the publication requests. Check server logs for validation errors.", "error");
        }
    } catch (err) {
        console.error("Bulk sync orchestration failed", err);
        showAlert("Critical Error", "A system error occurred during synchronization.", "error");
    }
  };

  return (
    <div className="bulk-result-container">
      <div className="bulk-header-actions glass-panel">
          <div className="bulk-stats">
              <FolderDown size={24} className="icon-blue" />
              <div>
                  <h3>Batch Assessment Results</h3>
                  <p>{result.results.length} Students Processed for {subjectName}</p>
              </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary bulk-export-btn" onClick={handleBulkExport} style={{ background: 'white', color: 'var(--primary-color)', border: '1px solid #e2e8f0' }}>
                  <Download size={20} />
                  <span>Bulk PDF</span>
              </button>
              <button className="btn btn-primary bulk-export-btn" onClick={() => setShowConfirmPublish(true)} style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                  <CheckCircle size={20} />
                  <span>Publish to Portal</span>
              </button>
          </div>
      </div>

      <div className="bulk-grid-layout">
        {result.results.map((res, idx) => {
          const student = getStudentInfo(res.registration_id);
          const hasError = !!res.error;
          const isSelected = selectedResult && selectedResult.registration_id === res.registration_id;

          return (
            <React.Fragment key={idx}>
            <div className={`bulk-student-card glass-panel ${hasError ? 'error-card' : ''} ${isSelected ? 'selected' : ''}`}>
              <div className="batch-card-top">
                  <div className="student-mini-profile">
                      <div className="avatar-small">{student.name[0]}</div>
                      <div className="name-stack">
                          <h4>{student.name}</h4>
                          <span className="reg-id">{student.registration_id}</span>
                      </div>
                  </div>
                  {hasError ? <XCircle size={20} color="#ef4444" /> : <div className="score-badge">{res.percentage}%</div>}
              </div>
              
              <div className="batch-card-body">
                  {!hasError ? (
                      <div className="marks-summary">
                          <span><strong>{res.obtained_marks}/{res.total_marks}</strong> Marks</span>
                          <span className="status-verify"><CheckCircle size={12}/> Verified</span>
                      </div>
                  ) : (
                      <p className="error-text">Sync Failed: {res.error}</p>
                  )}
              </div>

              <div className="batch-card-actions">
                  <button className="btn-icon-label" onClick={() => isSelected ? setSelectedResult(null) : setSelectedResult(res)} disabled={hasError}>
                      <Eye size={16} />
                      <span>{isSelected ? 'Hide' : 'View'}</span>
                  </button>
                  <button className="btn-icon-label" disabled={hasError} onClick={() => {
                        // We reuse ResultCard logic for single PDF, but since ResultCard does it internally,
                        // easiest is to let the user use "View" -> "Export Report as PDF" inside ResultCard.
                        // We can simulate viewing and alert them, or write the code here. Let's just alert them to View.
                        alert("Please click 'View' to see the detailed report and download the individual PDF.");
                  }}>
                      <Download size={16} />
                      <span>PDF</span>
                  </button>
              </div>
            </div>
            
            {isSelected && (
               <div className="inline-result-view glass-panel" style={{ gridColumn: '1 / -1', marginTop: '-1rem', marginBottom: '1rem' }}>
                    <div className="result-card-inner-scale" style={{ zoom: '0.9', width: '100%' }}>
                        <ResultCard 
                            result={selectedResult} 
                            studentDetails={student} 
                            schema={schema}
                            subjectName={subjectName}
                            className={students.find(s => s.registration_id === selectedResult.registration_id)?.academic_class?.name || 'N/A'}
                            courseName={students.find(s => s.registration_id === selectedResult.registration_id)?.academic_class?.course?.name || 'N/A'}
                            specializationName={students.find(s => s.registration_id === selectedResult.registration_id)?.academic_class?.course?.specialization?.name || 'N/A'}
                        />
                    </div>
               </div>
            )}
            </React.Fragment>
          );
        })}
      </div>
      <ConfirmDialog 
        isOpen={showConfirmPublish}
        title="Confirm Bulk Publication"
        message={`Are you sure you want to publish results for ${result.results.length} processed students? They will be able to access their reports immediately.`}
        confirmText="Confirm & Publish"
        cancelText="Cancel"
        onConfirm={handlePublishResults}
        onClose={() => setShowConfirmPublish(false)}
      />

      <ConfirmDialog 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={false}
        confirmText="Dismiss"
        onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
}
