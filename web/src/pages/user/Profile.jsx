// Profile.jsx - COMPLETE WITH REVIEW SYSTEM
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/firebase';
import { signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  FaUser, FaEnvelope, FaLock, FaEdit, FaSave, FaTimes, FaSignOutAlt, 
  FaBook, FaChartLine, FaClock, FaCheckCircle, FaSpinner, FaCertificate,
  FaStar, FaComment, FaTrash, FaRegStar, FaStarHalfAlt
} from 'react-icons/fa';
import './profile.css';
import { getDashboardStats, getUserReviews, deleteReview } from '../../api/course';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    averageProgress: 0,
    totalMinutes: 0,
    reviewsCount: 0
  });
  const [editMode, setEditMode] = useState({
    displayName: false,
    email: false,
    password: false
  });
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [certificates, setCertificates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || ''
        });
        
        // Load user stats
        await loadUserStats(currentUser.uid);
        
        // Get additional user data
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData(prev => ({
            ...prev,
            ...userData
          }));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user stats
  const loadUserStats = async (userId) => {
    try {
      const statsData = await getDashboardStats(userId);
      setStats(statsData);
      setEnrolledCourses(statsData.enrolledCourses);
      
      // Load user reviews
      await loadUserReviews(userId);
      
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  // Load user reviews
  const loadUserReviews = async (userId) => {
    try {
      setLoadingReviews(true);
      const userReviews = await getUserReviews(userId);
      setReviews(userReviews);
    } catch (error) {
      console.error("Error loading user reviews:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!selectedCourse || !reviewForm.comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      // Import the submitCourseReview function
      const { submitCourseReview } = await import('../../api/course');
      
      const reviewData = {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: user.displayName || user.email.split('@')[0]
      };

      await submitCourseReview(user.uid, selectedCourse.id, reviewData);
      
      // Refresh data
      await loadUserStats(user.uid);
      
      // Reset form
      setReviewForm({ rating: 5, comment: '' });
      setSelectedCourse(null);
      setShowReviewModal(false);
      
      setSuccess('Review submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrors({ form: 'Error: ' + error.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = async (review) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeletingReviewId(review.id);
    try {
      await deleteReview(review.id, user.uid, review.courseId);
      
      // Refresh reviews
      await loadUserStats(user.uid);
      
      setSuccess('Review deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error deleting review:', error);
      setErrors({ form: 'Error: ' + error.message });
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Generate certificates for completed courses
  const generateCertificates = () => {
    const certs = enrolledCourses
      .filter(course => course.completed)
      .map(course => ({
        id: `CERT_${course.id}_${user.uid}`,
        courseId: course.id,
        courseTitle: course.title,
        issueDate: new Date().toLocaleDateString(),
        completedDate: new Date().toLocaleDateString(),
        userName: user.displayName || user.email
      }));
    
    setCertificates(certs);
  };

  useEffect(() => {
    if (user && enrolledCourses.length > 0) {
      generateCertificates();
    }
  }, [user, enrolledCourses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (field) => {
    const newErrors = {};
    
    if (field === 'displayName' || field === 'all') {
      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      }
    }
    
    if (field === 'email' || field === 'all') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }
    
    if (field === 'password' || field === 'all') {
      if (formData.newPassword && formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm('all')) return;
    
    try {
      // Update display name if changed
      if (formData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName
        });
      }
      
      // Update email if changed
      if (formData.email !== user.email) {
        await updateEmail(auth.currentUser, formData.email);
      }
      
      // Update password if provided
      if (formData.newPassword) {
        await updatePassword(auth.currentUser, formData.newPassword);
      }
      
      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: formData.displayName,
        email: formData.email,
        updatedAt: new Date().toISOString()
      });
      
      setSuccess('Profile updated successfully!');
      setEditMode({
        displayName: false,
        email: false,
        password: false
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ form: error.message });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleEditMode = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    
    if (editMode[field]) {
      // Reset form data for this field when canceling edit
      setFormData(prev => ({
        ...prev,
        ...(field === 'password' ? {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        } : { [field]: user[field] || '' })
      }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // View certificate
  const viewCertificate = (certificate) => {
    alert(`Certificate of Completion\n\n` +
          `This certifies that\n` +
          `${certificate.userName}\n` +
          `has successfully completed the course\n` +
          `"${certificate.courseTitle}"\n\n` +
          `Issued on: ${certificate.issueDate}\n` +
          `Certificate ID: ${certificate.id}`);
  };

  // Download certificate (simulated)
  const downloadCertificate = (certificate) => {
    alert(`Downloading certificate for ${certificate.courseTitle}...`);
  };

  // Render rating stars
  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <FaStar key={i} className="star full" />;
          } else if (i === fullStars && hasHalfStar) {
            return <FaStarHalfAlt key={i} className="star half" />;
          } else {
            return <FaRegStar key={i} className="star empty" />;
          }
        })}
      </div>
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Recently";
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      return "Recently";
    } catch (error) {
      return "Recently";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-signed-in">
        <h2>Please sign in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header Section */}
        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} />
              ) : (
                <FaUser className="avatar-icon" />
              )}
            </div>
            <div className="user-info">
              <h1>{user.displayName || 'User'}</h1>
              <p className="user-email">{user.email}</p>
              <p className="member-since">
                Member since: {new Date(user.metadata.creationTime).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>
            <div className="stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Enrolled Courses</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.completedCourses}</h3>
              <p>Completed</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaCertificate />
            </div>
            <div className="stat-content">
              <h3>{certificates.length}</h3>
              <p>Certificates</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaComment />
            </div>
            <div className="stat-content">
              <h3>{stats.reviewsCount}</h3>
              <p>Reviews</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            My Courses
          </button>
          <button
            className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            Certificates
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            My Reviews
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {enrolledCourses.length > 0 ? (
                <>
                  <h3>Recent Courses</h3>
                  <div className="recent-courses">
                    {enrolledCourses.slice(0, 4).map(course => (
                      <div key={course.id} className="course-item">
                        <div className="course-info">
                          <h4>{course.title}</h4>
                          <p className="course-category">{course.category || 'General'}</p>
                          <div className="course-rating-small">
                            {course.rating > 0 ? (
                              <>
                                {renderRatingStars(course.rating)}
                                <span className="rating-value">{course.rating.toFixed(1)}</span>
                              </>
                            ) : (
                              <span className="no-rating">No ratings yet</span>
                            )}
                          </div>
                        </div>
                        <div className="course-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{course.progress}%</span>
                        </div>
                        {course.completed && !course.hasReviewed && (
                          <button 
                            className="review-course-btn"
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowReviewModal(true);
                            }}
                          >
                            <FaComment /> Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {enrolledCourses.length > 4 && (
                    <button 
                      className="view-all-btn"
                      onClick={() => setActiveTab('courses')}
                    >
                      View All Courses
                    </button>
                  )}
                </>
              ) : (
                <div className="no-courses">
                  <p>You haven't enrolled in any courses yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="courses-tab">
              {enrolledCourses.length > 0 ? (
                <div className="courses-list">
                  {enrolledCourses.map(course => (
                    <div key={course.id} className="enrolled-course-card">
                      <div className="course-header">
                        <h4>{course.title}</h4>
                        <span className={`status-badge ${course.completed ? 'completed' : 'in-progress'}`}>
                          {course.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <p className="course-description">{course.description || 'No description available'}</p>
                      <div className="course-meta">
                        <span className="meta-item">
                          <FaClock /> {course.duration || 0} minutes
                        </span>
                        <span className="meta-item">
                          Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                        </span>
                        {course.rating > 0 && (
                          <span className="meta-item">
                            <FaStar /> Rating: {course.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="course-progress-section">
                        <div className="progress-info">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="course-actions">
                        <button 
                          className="action-btn"
                          onClick={() => window.location.href = `/courses/${course.id}`}
                        >
                          {course.completed ? 'View Course' : 'Continue Learning'}
                        </button>
                        {course.completed && !course.hasReviewed && (
                          <button 
                            className="action-btn outline"
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowReviewModal(true);
                            }}
                          >
                            <FaComment /> Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-courses">
                  <p>You haven't enrolled in any courses yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="certificates-tab">
              {certificates.length > 0 ? (
                <div className="certificates-grid">
                  {certificates.map(certificate => (
                    <div key={certificate.id} className="certificate-card">
                      <div className="certificate-header">
                        <FaCertificate className="certificate-icon" />
                        <div className="certificate-info">
                          <h4>{certificate.courseTitle}</h4>
                          <p className="certificate-date">Issued: {certificate.issueDate}</p>
                        </div>
                      </div>
                      <div className="certificate-body">
                        <p>Certificate of Completion</p>
                        <p className="certificate-user">{certificate.userName}</p>
                        <p className="certificate-id">ID: {certificate.id}</p>
                      </div>
                      <div className="certificate-actions">
                        <button 
                          className="action-btn"
                          onClick={() => viewCertificate(certificate)}
                        >
                          View Certificate
                        </button>
                        <button 
                          className="action-btn outline"
                          onClick={() => downloadCertificate(certificate)}
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-certificates">
                  <FaCertificate className="no-data-icon" />
                  <h3>No Certificates Yet</h3>
                  <p>Complete courses to earn certificates</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              {loadingReviews ? (
                <div className="reviews-loading">
                  <FaSpinner className="spinner" />
                  <p>Loading your reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="review-course">
                          <h4>{review.courseTitle || 'Course'}</h4>
                          <span className="review-category">{review.courseCategory || 'General'}</span>
                        </div>
                        <div className="review-rating">
                          {renderRatingStars(review.rating)}
                          <span className="rating-value">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <div className="review-meta">
                        <span className="review-date">
                          Reviewed: {formatTimestamp(review.createdAt)}
                        </span>
                        <button 
                          className="delete-review-btn"
                          onClick={() => handleDeleteReview(review)}
                          disabled={deletingReviewId === review.id}
                        >
                          {deletingReviewId === review.id ? (
                            <FaSpinner className="spinner" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reviews">
                  <FaComment className="no-data-icon" />
                  <h3>No Reviews Yet</h3>
                  <p>Review completed courses to share your experience</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              {success && <div className="success-message">{success}</div>}
              {errors.form && <div className="error-message">{errors.form}</div>}
              
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-header">
                    <FaUser className="setting-icon" />
                    <div>
                      <h4>Display Name</h4>
                      <p>Your public display name</p>
                    </div>
                    <button 
                      className="edit-btn"
                      onClick={() => toggleEditMode('displayName')}
                    >
                      {editMode.displayName ? <FaTimes /> : <FaEdit />}
                    </button>
                  </div>
                  
                  {editMode.displayName ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className={`form-input ${errors.displayName ? 'error' : ''}`}
                        placeholder="Enter your display name"
                      />
                      {errors.displayName && (
                        <span className="error-text">{errors.displayName}</span>
                      )}
                      <div className="form-actions">
                        <button 
                          className="save-btn"
                          onClick={() => {
                            if (validateForm('displayName')) {
                              handleUpdateProfile();
                            }
                          }}
                        >
                          <FaSave /> Save
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => toggleEditMode('displayName')}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="setting-value">{user.displayName || 'Not set'}</p>
                  )}
                </div>

                <div className="setting-item">
                  <div className="setting-header">
                    <FaEnvelope className="setting-icon" />
                    <div>
                      <h4>Email Address</h4>
                      <p>Your account email</p>
                    </div>
                    <button 
                      className="edit-btn"
                      onClick={() => toggleEditMode('email')}
                    >
                      {editMode.email ? <FaTimes /> : <FaEdit />}
                    </button>
                  </div>
                  
                  {editMode.email ? (
                    <div className="edit-form">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <span className="error-text">{errors.email}</span>
                      )}
                      <div className="form-actions">
                        <button 
                          className="save-btn"
                          onClick={() => {
                            if (validateForm('email')) {
                              handleUpdateProfile();
                            }
                          }}
                        >
                          <FaSave /> Save
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => toggleEditMode('email')}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="setting-value">{user.email}</p>
                  )}
                </div>

                <div className="setting-item">
                  <div className="setting-header">
                    <FaLock className="setting-icon" />
                    <div>
                      <h4>Password</h4>
                      <p>Change your password</p>
                    </div>
                    <button 
                      className="edit-btn"
                      onClick={() => toggleEditMode('password')}
                    >
                      {editMode.password ? <FaTimes /> : <FaEdit />}
                    </button>
                  </div>
                  
                  {editMode.password && (
                    <div className="edit-form">
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className={`form-input ${errors.newPassword ? 'error' : ''}`}
                          placeholder="Enter new password"
                        />
                        {errors.newPassword && (
                          <span className="error-text">{errors.newPassword}</span>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                          placeholder="Confirm new password"
                        />
                        {errors.confirmPassword && (
                          <span className="error-text">{errors.confirmPassword}</span>
                        )}
                      </div>
                      
                      <div className="form-actions">
                        <button 
                          className="save-btn"
                          onClick={() => {
                            if (validateForm('password')) {
                              handleUpdateProfile();
                            }
                          }}
                        >
                          <FaSave /> Update Password
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => toggleEditMode('password')}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedCourse && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Review: {selectedCourse.title}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedCourse(null);
                  setReviewForm({ rating: 5, comment: '' });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="review-form">
                <div className="rating-section">
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
                    <span className="rating-text">{reviewForm.rating}.0 stars</span>
                  </div>
                </div>
                
                <div className="comment-section">
                  <label htmlFor="review-comment">Your Review:</label>
                  <textarea
                    id="review-comment"
                    className="review-textarea"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    placeholder="Share your experience with this course..."
                    rows={5}
                  />
                </div>
                
                <div className="modal-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedCourse(null);
                      setReviewForm({ rating: 5, comment: '' });
                    }}
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    className="submit-btn"
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
    </div>
  );
};

export default Profile;