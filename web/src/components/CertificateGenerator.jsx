// src/components/CertificateGenerator.jsx
import React, { useRef } from 'react';
import './CertificateGenerator.css';

const CertificateGenerator = ({ 
  userName = "John Doe", 
  courseName = "Introduction to AI",
  completionDate = new Date().toLocaleDateString('fr-FR'),
  certificateId = `CERT-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`
}) => {
  const certificateRef = useRef(null);

  const downloadCertificate = () => {
    if (!certificateRef.current) return;

    // Get HTML content
    const content = certificateRef.current.outerHTML;
    
    // Create HTML file
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${userName}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Orbitron:wght@700;800&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 40px; 
            background: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .certificate-wrapper { 
            width: 100%;
            max-width: 1000px;
          }
          .certificate { 
            border: 15px solid #3b82f6; 
            padding: 60px; 
            text-align: center; 
            background: white;
            border-radius: 20px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
            position: relative;
          }
          .certificate-title { 
            color: #1e293b; 
            font-size: 42px; 
            margin: 30px 0; 
            font-family: 'Orbitron', sans-serif;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .user-name { 
            color: #3b82f6; 
            font-size: 48px; 
            font-weight: 800; 
            margin: 40px 0;
            padding: 20px;
            border-bottom: 3px solid #f59e0b;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .course-name { 
            color: #059669; 
            font-size: 32px; 
            font-weight: 700; 
            margin: 30px 0;
            padding: 20px;
            background: #f0fdf4;
            border-radius: 12px;
            display: inline-block;
          }
          .completion-date {
            color: #64748b; 
            font-size: 20px; 
            margin: 20px 0;
          }
          .certificate-id {
            font-family: monospace;
            font-size: 16px;
            color: #94a3b8;
            margin: 30px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            display: inline-block;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #e2e8f0;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            width: 200px;
            height: 1px;
            background: #000;
            margin: 30px auto 10px;
          }
          .verification-link {
            font-size: 14px;
            color: #64748b;
            margin-top: 40px;
            font-family: monospace;
          }
          @media print {
            body { padding: 0; }
            .certificate { border-width: 20px; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `], { type: 'text/html' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificate_${userName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="certificate-generator">
      <div className="certificate-wrapper">
        <div className="certificate" ref={certificateRef}>
          <div className="certificate-logo">
            <h1>🎓 LEARNIO</h1>
          </div>
          
          <h2 className="certificate-title">Certificate of Completion</h2>
          
          <p className="certificate-subtitle">
            This is to certify that
          </p>
          
          <h3 className="user-name">{userName}</h3>
          
          <p className="certificate-text">
            has successfully completed the course
          </p>
          
          <h4 className="course-name">{courseName}</h4>
          
          <p className="completion-date">
            Completed on: {completionDate}
          </p>
          
          <p className="certificate-id">
            Certificate ID: {certificateId}
          </p>
          
          <div className="signatures">
            <div className="signature-box">
              <div className="signature-line"></div>
              <p>Learnio Academy</p>
              <p>Director</p>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <p>Learnio Academy</p>
              <p>Instructor</p>
            </div>
          </div>
          
          <p className="verification-link">
            Verify at: https://learnio.com/verify/{certificateId}
          </p>
        </div>
        
        <div className="certificate-actions">
          <h3>Download Your Certificate</h3>
          <div className="action-buttons">
            <button onClick={downloadCertificate} className="btn-download">
              📥 Download as HTML
            </button>
            <button onClick={printCertificate} className="btn-print">
              🖨️ Print Certificate
            </button>
          </div>
          <p className="note">
            Save as HTML file or print directly. This certificate verifies your course completion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;