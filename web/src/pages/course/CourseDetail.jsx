// src/pages/CourseDetail.jsx - SIMPLIFIED VERSION
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./CourseDetail.css";
import { 
  getCourseById, 
  enrollUserInCourse, 
  getEnrollmentStatus,
  getCourseProgress,
  markModuleComplete
} from "../../api/course";
import { useAuth } from "../../context/authContext";
import { FaFilePdf, FaCheckCircle, FaClock, FaBook, FaStar, FaUser, FaLanguage, FaChartLine } from "react-icons/fa";
import CertificateGenerator from "../../components/CertificateGenerator";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  async function loadCourse() {
    try {
      setLoading(true);
      const data = await getCourseById(id);
      setCourse(data);

      if (currentUser) {
        const status = await getEnrollmentStatus(currentUser.uid, id);
        setIsEnrolled(status);
        
        if (status) {
          const progressData = await getCourseProgress(currentUser.uid, id);
          setProgress(progressData);
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!currentUser) {
      alert("Please log in to enroll.");
      navigate("/login");
      return;
    }

    try {
      await enrollUserInCourse(currentUser.uid, id);
      setIsEnrolled(true);
      
      const progressData = await getCourseProgress(currentUser.uid, id);
      setProgress(progressData);
      
      alert("Enrolled successfully! You can now access all course materials.");
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  const handleMarkComplete = async (moduleId) => {
    if (!currentUser || !isEnrolled) {
      alert("Please enroll in the course first.");
      return;
    }

    try {
      const result = await markModuleComplete(currentUser.uid, id, moduleId);
      setProgress(prev => ({
        ...prev,
        completedModules: result.completedModules,
        progress: result.progress
      }));
      alert("Module marked as complete!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // SIMPLIFIED: Just show certificate without saving to Firestore
  const handleGenerateCertificate = () => {
    if (!currentUser || !isEnrolled) {
      alert("Please enroll in the course first.");
      return;
    }

    if (!canGetCertificate()) {
      alert("Please complete all modules first.");
      return;
    }

    setShowCertificate(true);
  };

  const isModuleCompleted = (moduleId) => {
    return progress?.completedModules?.includes(moduleId) || false;
  };

  const canGetCertificate = () => {
    if (!progress || !course) return false;
    
    const allModulesCompleted = 
      course.modules?.length === progress.completedModules?.length;
    
    return allModulesCompleted;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`star ${i < fullStars ? 'full' : i === fullStars && hasHalfStar ? 'half' : 'empty'}`}>
            ★
          </span>
        ))}
        <span className="rating-text">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-container">
        <div className="detail-error">
          <h2>Course not found</h2>
          <p>The course you're looking for doesn't exist or has been removed.</p>
          <Link to="/courses" className="btn-back">
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // Certificate data (client-side only)
  const certificateData = currentUser ? {
    userName: currentUser.displayName || currentUser.email.split('@')[0],
    courseName: course.title,
    completionDate: new Date().toLocaleDateString('fr-FR'),
    certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`
  } : null;

  return (
    <div className="course-detail-container">
      {/* Header Section */}
      <div className="course-header">
        <div className="course-header-content">
          <div className="course-breadcrumb">
            <Link to="/courses">Courses</Link> / <span>{course.title}</span>
          </div>
          
          <h1 className="detail-title">{course.title}</h1>
          <p className="course-subtitle">{course.description}</p>
          
          <div className="course-meta-info">
            <div className="meta-item">
              <span className="meta-label">
                <FaUser /> Instructor
              </span>
              <span className="meta-value">{course.author || "Admin"}</span>
            </div>
            
            {course.rating > 0 && (
              <div className="meta-item">
                <span className="meta-label">
                  <FaStar /> Rating
                </span>
                <div className="meta-rating">
                  {renderRatingStars(course.rating)}
                  <span className="rating-text-small">({course.reviews || 0} reviews)</span>
                </div>
              </div>
            )}
            
            <div className="meta-item">
              <span className="meta-label">
                <FaChartLine /> Level
              </span>
              <span className="meta-value">{course.level || "All Levels"}</span>
            </div>
            
            {course.language && (
              <div className="meta-item">
                <span className="meta-label">
                  <FaLanguage /> Language
                </span>
                <span className="meta-value">{course.language}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Card */}
        <div className="enrollment-card">
          <div className="course-image-large">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} />
            ) : (
              <div className="course-placeholder-large">
                <span>{course.title?.charAt(0) || "C"}</span>
              </div>
            )}
          </div>
          
          <div className="enrollment-details">
            <div className="course-price-info">
              {course.isFree ? (
                <div className="price-free">FREE</div>
              ) : (
                <div className="price-paid">
                  {course.oldPrice > 0 && (
                    <span className="original-price">{course.oldPrice} DT</span>
                  )}
                  <span className="current-price">{course.price} DT</span>
                </div>
              )}
            </div>

            <div className="course-features">
              <div className="feature">
                <span className="feature-icon">
                  <FaClock />
                </span>
                <span className="feature-text">{formatTime(course.duration || 0)} total</span>
              </div>
              
              {course.modules && (
                <div className="feature">
                  <span className="feature-icon">
                    <FaBook />
                  </span>
                  <span className="feature-text">{course.modules.length} modules</span>
                </div>
              )}
              
              {course.hasCertificate && (
                <div className="feature">
                  <span className="feature-icon">🎓</span>
                  <span className="feature-text">Certificate included</span>
                </div>
              )}
            </div>

            {isEnrolled ? (
              <div className="enrollment-status">
                {progress && (
                  <div className="progress-display">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progress.progress || 0}% Complete</span>
                  </div>
                )}
                
                {showCertificate ? (
                  <button className="btn-certificate-action" onClick={() => setShowCertificate(false)}>
                    🎓 Hide Certificate
                  </button>
                ) : canGetCertificate() ? (
                  <button className="btn-certificate-action" onClick={handleGenerateCertificate}>
                    🎓 View Certificate
                  </button>
                ) : (
                  <Link to={`/learn/${id}`} className="btn-continue-learning">
                    {progress?.progress === 0 ? "Start Learning" : "Continue Learning"}
                  </Link>
                )}
              </div>
            ) : (
              <div className="enrollment-actions">
                <button 
                  className={`btn-enroll-large ${!course.isFree ? 'btn-premium' : ''}`}
                  onClick={handleEnroll}
                >
                  {course.isFree ? "Enroll For Free" : `Enroll for ${course.price} DT`}
                </button>
                <div className="guarantee">
                  <span className="guarantee-icon">✓</span>
                  {course.isFree ? "Free forever" : "30-day money-back guarantee"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Description */}
      <div className="course-description">
        <h2 className="section-title">Course Description</h2>
        <p className="description-text">
          {course.description || "No detailed description available for this course."}
        </p>
      </div>

      {/* Course Content */}
      <div className="course-content-section">
        <h2 className="section-title">Course Content</h2>
        
        {course.modules && course.modules.length > 0 ? (
          <div className="modules-list">
            {course.modules.map((module, index) => (
              <div 
                key={module.id} 
                className={`module-item ${isModuleCompleted(module.id) ? 'completed' : ''} ${activeModule === module.id ? 'active' : ''}`}
                onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
              >
                <div className="module-header">
                  <div className="module-number">
                    {index + 1}
                  </div>
                  <div className="module-content">
                    <h3 className="module-title">{module.title}</h3>
                    <div className="module-meta">
                      <span className="meta-item">
                        <FaClock /> {module.duration || 10} min
                      </span>
                      {isModuleCompleted(module.id) && (
                        <span className="completed-badge">
                          <FaCheckCircle /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="module-arrow">
                    {activeModule === module.id ? '▲' : '▼'}
                  </div>
                </div>
                
                {activeModule === module.id && (
                  <div className="module-details">
                    {/* Video */}
                    {module.videoUrl && (
                      <div className="video-container">
                        <div className="video-wrapper">
                          <iframe
                            src={module.videoUrl}
                            title={module.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        {isEnrolled && !isModuleCompleted(module.id) && (
                          <button 
                            onClick={() => handleMarkComplete(module.id)}
                            className="btn-mark-complete"
                          >
                            <FaCheckCircle /> Mark as Complete
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* PDF */}
                    {module.pdfUrl && (
                      <div className="pdf-container">
                        <div className="pdf-wrapper">
                          <iframe
                            src={module.pdfUrl}
                            title={`${module.title} Notes`}
                            className="pdf-frame"
                          ></iframe>
                        </div>
                        <a 
                          href={module.pdfUrl.replace('/preview', '/view')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-download-pdf"
                        >
                          <FaFilePdf /> Download PDF
                        </a>
                      </div>
                    )}
                    
                    {!module.videoUrl && !module.pdfUrl && (
                      <p className="no-content">Content coming soon...</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-content">No course content available yet.</p>
        )}
      </div>

      {/* Certificate Eligibility */}
      {isEnrolled && progress && (
        <div className="certificate-status">
          <h2 className="section-title">Certificate Status</h2>
          <div className="requirements-list">
            <div className={`requirement ${progress.completedModules?.length === course.modules?.length ? 'met' : ''}`}>
              <span className="requirement-icon">
                {progress.completedModules?.length === course.modules?.length ? '✓' : '○'}
              </span>
              <span className="requirement-text">
                Complete all modules ({progress.completedModules?.length || 0}/{course.modules?.length || 0})
              </span>
            </div>
          </div>
          
          {canGetCertificate() && (
            <div className="certificate-ready">
              <p>🎉 You've completed all modules! View your certificate now.</p>
              <button className="btn-generate-certificate" onClick={handleGenerateCertificate}>
                View Certificate
              </button>
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && certificateData && (
        <div className="certificate-modal">
          <div className="certificate-modal-content">
            <button 
              className="close-modal"
              onClick={() => setShowCertificate(false)}
            >
              ×
            </button>
            <CertificateGenerator {...certificateData} />
          </div>
        </div>
      )}
    </div>
  );
}