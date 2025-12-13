// src/pages/course/CourseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./CourseDetail.css";
import { 
  getCourseById, 
  enrollUserInCourse, 
  getEnrollmentStatus,
  getCourseProgress,
  markModuleComplete,
  purchaseCourse,
  submitCourseReview,
  getUserReview,
  getCourseReviews,
  deleteReview
} from "../../api/course";
import { useAuth } from "../../context/authContext";
import { useCart } from "../../context/CartContext";
import { FaFilePdf, FaCheckCircle, FaClock, FaBook, FaStar, FaUser, FaLanguage, FaChartLine, FaComment, FaSpinner, FaEdit, FaTrash, FaRegStar, FaStarHalfAlt, FaShoppingCart } from "react-icons/fa";
import CertificateGenerator from "../../components/CertificateGenerator";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();

  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Review states
  const [courseReviews, setCourseReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourse();
    loadReviews();
  }, [id]);

  async function loadCourse() {
    try {
      setLoading(true);
      const data = await getCourseById(id);
      setCourse(data);

      if (currentUser) {
        try {
          const status = await getEnrollmentStatus(currentUser.uid, id);
          setIsEnrolled(!!status);
          
          if (status) {
            try {
              const progressData = await getCourseProgress(currentUser.uid, id);
              console.log("Loaded progress:", progressData);
              setProgress({
                ...progressData,
                completedModules: progressData.completedModules || [],
                progress: progressData.progress || 0
              });
            } catch (progressError) {
              console.warn("Error loading progress:", progressError.message);
              setProgress({
                userId: currentUser.uid,
                courseId: id,
                progress: 0,
                completedModules: []
              });
            }
            
            try {
              const userRev = await getUserReview(currentUser.uid, id);
              setUserReview(userRev);
            } catch (reviewError) {
              console.warn("Error loading user review:", reviewError.message);
            }
          }
        } catch (enrollmentError) {
          console.warn("Error checking enrollment:", enrollmentError.message);
          setIsEnrolled(false);
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load reviews for this course
  async function loadReviews() {
    try {
      setLoadingReviews(true);
      const reviews = await getCourseReviews(id);
      setCourseReviews(reviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
      setCourseReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function handleEnroll() {
    if (!currentUser) {
      alert("Please log in to enroll.");
      navigate("/login");
      return;
    }

    setEnrolling(true);
    
    try {
      if (course.isFree) {
        // Free course enrollment
        await enrollUserInCourse(currentUser.uid, id);
        setIsEnrolled(true);
        
        // Load progress
        try {
          const progressData = await getCourseProgress(currentUser.uid, id);
          setProgress(progressData);
        } catch (progressError) {
          console.warn("Progress load error:", progressError.message);
          setProgress({
            userId: currentUser.uid,
            courseId: id,
            progress: 0,
            completedModules: []
          });
        }
        
        alert("Enrolled successfully! You can now access all course materials.");
      } else {
        // Paid course - direct purchase
        try {
          const userData = {
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            amount: course.price || 0,
            totalAmount: course.price || 0
          };

          await purchaseCourse(currentUser.uid, id, userData);
          
          alert("Payment processed successfully! You are now enrolled.");
          setIsEnrolled(true);
          loadCourse(); // Reload course data
        } catch (paymentError) {
          console.error("Payment error:", paymentError);
          
          // Check if it's an "already enrolled" error
          if (paymentError.message.includes("Already enrolled")) {
            setIsEnrolled(true);
            alert("You are already enrolled in this course!");
            loadCourse();
          } else {
            alert("Payment error: " + paymentError.message);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleEnroll:", error);
      
      // Check specific error messages
      if (error.message.includes("Already enrolled")) {
        setIsEnrolled(true);
        alert("You are already enrolled in this course!");
        loadCourse();
      } else {
        alert("Error: " + (error.message || "Failed to enroll. Please try again."));
      }
    } finally {
      setEnrolling(false);
    }
  }

  const handleAddToCart = () => {
    if (course.isFree) {
      // Free course - enroll directly
      handleEnroll();
    } else {
      // Paid course - add to cart
      if (addToCart(course)) {
        alert(`"${course.title}" added to cart!`);
      } else {
        alert("Course is already in your cart!");
      }
    }
  };

  const handleRemoveFromCart = () => {
    if (removeFromCart(course.id)) {
      alert(`"${course.title}" removed from cart!`);
    }
  };

  const handleMarkComplete = async (moduleId) => {
    if (!currentUser || !isEnrolled) {
      alert("Please enroll in the course first.");
      return;
    }

    if (!moduleId) {
      console.error("Module ID is undefined!");
      alert("Cannot mark module complete: Module ID is missing.");
      return;
    }

    console.log("Marking module complete:", moduleId);
    
    try {
      const result = await markModuleComplete(currentUser.uid, id, moduleId);
      
      if (result.success) {
        setProgress(prev => ({
          ...prev,
          completedModules: result.completedModules || [],
          progress: result.progress || 0
        }));
        alert("Module marked as complete!");
        
        // Check if course is now complete
        if (result.progress === 100 && course?.modules?.length > 0) {
          alert("🎉 Congratulations! You have completed this course!");
        }
      } else {
        alert("Could not mark module as complete: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error marking module complete:", error);
      alert("Error: " + (error.message || "Failed to mark module as complete"));
    }
  };

  // Check if user can review (completed all modules)
  const canReviewCourse = () => {
    if (!isEnrolled || !progress || !course) return false;
    
    const totalModules = course.modules?.length || 0;
    const completedModules = progress.completedModules?.length || 0;
    
    return completedModules >= totalModules;
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!currentUser || !isEnrolled) {
      alert("Please enroll in the course first.");
      return;
    }

    if (!canReviewCourse()) {
      alert("Please complete all modules before reviewing this course.");
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewData = {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: currentUser.displayName || currentUser.email.split('@')[0]
      };

      await submitCourseReview(currentUser.uid, id, reviewData);

      // Reload course and reviews
      await loadCourse();
      await loadReviews();
      
      // Reset form and close modal
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewModal(false);
      setShowEditReviewModal(false);
      setEditingReviewId(null);
      
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error: ' + (error.message || 'Failed to submit review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle edit review
  const handleEditReview = (review) => {
    setReviewForm({
      rating: review.rating,
      comment: review.comment
    });
    setEditingReviewId(review.id);
    setShowEditReviewModal(true);
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!currentUser || !window.confirm("Are you sure you want to delete your review?")) {
      return;
    }

    setDeletingReview(true);
    try {
      await deleteReview(reviewId);
      
      // Reload course and reviews
      await loadCourse();
      await loadReviews();
      
      alert("Review deleted successfully!");
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error: ' + (error.message || 'Failed to delete review'));
    } finally {
      setDeletingReview(false);
    }
  };

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
    if (!progress || !progress.completedModules || !moduleId) return false;
    
    // Convert both to string for comparison
    const moduleIdStr = String(moduleId);
    return progress.completedModules.some(id => String(id) === moduleIdStr);
  };

  const canGetCertificate = () => {
    if (!progress || !course || !course.modules) return false;
    
    const allModulesCompleted = 
      progress.completedModules?.length === course.modules.length;
    
    return allModulesCompleted;
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Render rating stars
  const renderRatingStars = (rating, size = 'normal') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const starSize = size === 'large' ? '24px' : '20px';
    
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <FaStar key={i} className="star full" style={{ fontSize: starSize }} />;
          } else if (i === fullStars && hasHalfStar) {
            return <FaStarHalfAlt key={i} className="star half" style={{ fontSize: starSize }} />;
          } else {
            return <FaRegStar key={i} className="star empty" style={{ fontSize: starSize }} />;
          }
        })}
        <span className="rating-text">{rating?.toFixed(1) || '0.0'}</span>
      </div>
    );
  };

  // Render small rating stars for reviews
  const renderReviewStars = (rating) => {
    return (
      <div className="review-rating-stars">
        {[...Array(5)].map((_, i) => (
          <FaStar 
            key={i} 
            className={`review-star ${i < rating ? 'filled' : 'empty'}`} 
          />
        ))}
      </div>
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Recently";
    
    try {
      // If it's a Firebase timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      // If it's a string
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return "Recently";
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Recently";
    }
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

  // Ensure modules have proper IDs
  const safeModules = course.modules?.map((module, index) => ({
    ...module,
    id: module.id || `module_${index + 1}`
  })) || [];

  // Certificate data
  const certificateData = currentUser ? {
    userName: currentUser.displayName || currentUser.email.split('@')[0],
    courseName: course.title,
    completionDate: new Date().toLocaleDateString('fr-FR'),
    certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`
  } : null;

  // Check if course is in cart
  const inCart = isInCart(course.id);

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
            
            <div className="meta-item">
              <span className="meta-label">
                <FaStar /> Rating
              </span>
              <div className="meta-rating">
                {renderRatingStars(course.avgRating)}
                <span className="rating-text-small">({course.totalReviews || 0} reviews)</span>
              </div>
            </div>
            
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
            {course.image ? (
              <img src={course.image} alt={course.title} />
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
              
              {safeModules.length > 0 && (
                <div className="feature">
                  <span className="feature-icon">
                    <FaBook />
                  </span>
                  <span className="feature-text">{safeModules.length} modules</span>
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
                {course.isFree ? (
                  // Free course - enroll directly
                  <button 
                    className="btn-enroll-large btn-free"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <>
                        <FaSpinner className="spinner" /> Enrolling...
                      </>
                    ) : (
                      "Enroll For Free"
                    )}
                  </button>
                ) : inCart ? (
                  // Paid course - already in cart
                  <>
                    <button className="btn-in-cart" disabled>
                      <FaShoppingCart /> In Cart
                    </button>
                    <div className="cart-actions-row">
                      <button 
                        className="btn-remove-from-cart"
                        onClick={handleRemoveFromCart}
                      >
                        Remove from Cart
                      </button>
                      <Link to="/cart" className="btn-go-to-cart">
                        Go to Cart →
                      </Link>
                    </div>
                  </>
                ) : (
                  // Paid course - not in cart
                  <>
                    <button 
                      className="btn-enroll-large btn-premium"
                      onClick={handleAddToCart}
                    >
                      <FaShoppingCart /> Add to Cart - {course.price} DT
                    </button>
                    <button 
                      className="btn-buy-now"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? (
                        <>
                          <FaSpinner className="spinner" /> Processing...
                        </>
                      ) : (
                        "Buy Now"
                      )}
                    </button>
                  </>
                )}
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
        
        {safeModules.length > 0 ? (
          <div className="modules-list">
            {safeModules.map((module, index) => (
              <div 
                key={module.id || `module_${index}`} 
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(module.id);
                            }}
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
                        {isEnrolled && !isModuleCompleted(module.id) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(module.id);
                            }}
                            className="btn-mark-complete-pdf"
                          >
                            <FaCheckCircle /> Mark as Complete
                          </button>
                        )}
                      </div>
                    )}
                    
                    {!module.videoUrl && !module.pdfUrl && (
                      <div className="no-content-container">
                        <p className="no-content">Content coming soon...</p>
                        {isEnrolled && !isModuleCompleted(module.id) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(module.id);
                            }}
                            className="btn-mark-complete"
                          >
                            <FaCheckCircle /> Mark as Complete
                          </button>
                        )}
                      </div>
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
            <div className={`requirement ${progress.completedModules?.length === safeModules.length ? 'met' : ''}`}>
              <span className="requirement-icon">
                {progress.completedModules?.length === safeModules.length ? '✓' : '○'}
              </span>
              <span className="requirement-text">
                Complete all modules ({progress.completedModules?.length || 0}/{safeModules.length || 0})
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

      {/* Reviews Section */}
      <div className="course-reviews-section">
        <h2 className="section-title">Student Reviews</h2>
        
        {loadingReviews ? (
          <div className="reviews-loading">
            <FaSpinner className="loading-spinner" />
            <p>Loading reviews...</p>
          </div>
        ) : courseReviews.length > 0 ? (
          <>
            <div className="reviews-stats">
              <div className="overall-rating">
                <span className="rating-number">{course.avgRating?.toFixed(1) || '0.0'}</span>
                <div className="rating-stars-large">
                  {renderRatingStars(course.avgRating || 0, 'large')}
                </div>
                <span className="reviews-count">{course.totalReviews || 0} reviews</span>
              </div>
            </div>
            
            <div className="reviews-list">
              {courseReviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-avatar">
                      <span>{review.userName?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="reviewer-info">
                      <div className="reviewer-name">{review.userName || "Anonymous User"}</div>
                      <div className="review-date">
                        {formatTimestamp(review.createdAt)}
                      </div>
                    </div>
                    <div className="review-rating">
                      {renderReviewStars(review.rating)}
                      {currentUser && review.userId === currentUser.uid && (
                        <div className="review-actions">
                          <button 
                            className="review-edit-btn"
                            onClick={() => handleEditReview(review)}
                            disabled={deletingReview}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="review-delete-btn"
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={deletingReview}
                          >
                            {deletingReview ? <FaSpinner className="spinner" /> : <FaTrash />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="review-comment">
                    {review.comment}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-reviews">
            <FaComment className="no-reviews-icon" />
            <h3>No Reviews Yet</h3>
            <p>Be the first to review this course!</p>
          </div>
        )}
        
        {/* Show review button for enrolled users who completed the course */}
        {isEnrolled && canReviewCourse() && !userReview && (
          <div className="review-action">
            <button 
              className="btn-leave-review"
              onClick={() => setShowReviewModal(true)}
            >
              <FaComment /> Leave a Review
            </button>
          </div>
        )}
        
        {/* Show message if user has already reviewed */}
        {userReview && (
          <div className="already-reviewed">
            <p>✓ You have already reviewed this course</p>
            <button 
              className="btn-edit-review"
              onClick={() => handleEditReview(userReview)}
            >
              Edit Review
            </button>
          </div>
        )}
      </div>

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

      {/* Review Modal (New Review) */}
      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <div className="review-modal-header">
              <h3>Write a Review for {course.title}</h3>
              <button 
                className="review-modal-close"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewForm({ rating: 5, comment: '' });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="review-modal-content">
              <div className="review-form">
                <div className="review-rating-input">
                  <label>Your Rating:</label>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${reviewForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-text">{reviewForm.rating}.0</span>
                  </div>
                </div>
                
                <div className="review-comment-input">
                  <label htmlFor="review-comment">Your Review:</label>
                  <textarea
                    id="review-comment"
                    className="review-textarea"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    placeholder="Share your experience with this course. What did you like? What could be improved?"
                    rows={5}
                  />
                  <p className="review-hint">Your review will be visible to other students.</p>
                </div>
                
                <div className="review-modal-actions">
                  <button
                    className="review-cancel-btn"
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewForm({ rating: 5, comment: '' });
                    }}
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    className="review-submit-btn"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewForm.comment.trim()}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <div className="review-modal-header">
              <h3>Edit Your Review for {course.title}</h3>
              <button 
                className="review-modal-close"
                onClick={() => {
                  setShowEditReviewModal(false);
                  setReviewForm({ rating: 5, comment: '' });
                  setEditingReviewId(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="review-modal-content">
              <div className="review-form">
                <div className="review-rating-input">
                  <label>Your Rating:</label>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${reviewForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-text">{reviewForm.rating}.0</span>
                  </div>
                </div>
                
                <div className="review-comment-input">
                  <label htmlFor="review-comment">Your Review:</label>
                  <textarea
                    id="review-comment"
                    className="review-textarea"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    placeholder="Share your experience with this course. What did you like? What could be improved?"
                    rows={5}
                  />
                </div>
                
                <div className="review-modal-actions">
                  <button
                    className="review-cancel-btn"
                    onClick={() => {
                      setShowEditReviewModal(false);
                      setReviewForm({ rating: 5, comment: '' });
                      setEditingReviewId(null);
                    }}
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    className="review-submit-btn"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewForm.comment.trim()}
                  >
                    {submittingReview ? 'Updating...' : 'Update Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}