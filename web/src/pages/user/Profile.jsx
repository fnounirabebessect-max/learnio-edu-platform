// Profile.jsx - UPDATED WITH CERTIFICATES AND REVIEWS
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/firebase'
import { signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  FaUser, FaEnvelope, FaLock, FaEdit, FaSave, FaTimes, FaSignOutAlt, 
  FaBook, FaChartLine, FaClock, FaCheckCircle, FaSpinner, FaCertificate,
  FaStar, FaComment
} from 'react-icons/fa';
import './profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    averageProgress: 0,
    totalMinutes: 0
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

  // Simple function to get user stats
  const getUserStats = async (userId) => {
    try {
      // Get enrollments
      const enrollmentsRef = collection(db, "enrollments");
      const q = query(enrollmentsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      const enrollments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get course details for each enrollment
      const courses = [];
      let totalProgress = 0;
      let totalMinutes = 0;
      let completedCount = 0;
      
      for (const enrollment of enrollments) {
        try {
          const courseRef = doc(db, "courses", enrollment.courseId);
          const courseSnap = await getDoc(courseRef);
          
          if (courseSnap.exists()) {
            const courseData = courseSnap.data();
            
            // Get progress
            const progressRef = doc(db, "progress", `${userId}_${enrollment.courseId}`);
            const progressSnap = await getDoc(progressRef);
            const progress = progressSnap.exists() ? progressSnap.data().progress || 0 : 0;
            
            totalProgress += progress;
            totalMinutes += courseData.duration || 0;
            if (enrollment.completed) completedCount++;
            
            courses.push({
              id: courseSnap.id,
              ...courseData,
              enrollmentId: enrollment.id,
              enrolledAt: enrollment.enrolledAt || new Date().toISOString(),
              completed: enrollment.completed || false,
              progress: progress
            });
          }
        } catch (error) {
          console.error(`Error loading course ${enrollment.courseId}:`, error);
        }
      }
      
      setEnrolledCourses(courses);
      
      // Calculate stats
      const totalCourses = courses.length;
      const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
      
      setStats({
        totalCourses,
        completedCourses: completedCount,
        averageProgress,
        totalMinutes
      });
      
    } catch (error) {
      console.error("Error getting user stats:", error);
    }
  };

  // Get user's reviews
  const getUserReviews = async (userId) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      const reviewsList = await Promise.all(
        snapshot.docs.map(async (reviewDoc) => {
          const reviewData = reviewDoc.data();
          
          // Get course details
          try {
            const courseRef = doc(db, "courses", reviewData.courseId);
            const courseSnap = await getDoc(courseRef);
            
            if (courseSnap.exists()) {
              return {
                id: reviewDoc.id,
                ...reviewData,
                courseTitle: courseSnap.data().title,
                courseCategory: courseSnap.data().category
              };
            }
          } catch (error) {
            console.error("Error getting course for review:", error);
          }
          
          return {
            id: reviewDoc.id,
            ...reviewData,
            courseTitle: "Unknown Course"
          };
        })
      );
      
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error getting user reviews:", error);
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
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || ''
        });
        
        // Get user stats
        await getUserStats(currentUser.uid);
        
        // Get user reviews
        await getUserReviews(currentUser.uid);
        
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
    // In a real app, this would navigate to a certificate page
    // For now, we'll show a simple modal-like alert
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
    // In a real app, this would generate and download a PDF
    alert(`Downloading certificate for ${certificate.courseTitle}...`);
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
              <h3>{reviews.length}</h3>
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
                          {course.completed ? 'Review Course' : 'Continue Learning'}
                        </button>
                        {course.completed && (
                          <button 
                            className="action-btn outline"
                            onClick={() => {
                              const cert = certificates.find(c => c.courseId === course.id);
                              if (cert) viewCertificate(cert);
                            }}
                          >
                            <FaCertificate /> View Certificate
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
              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="review-course">
                          <h4>{review.courseTitle}</h4>
                          <span className="review-category">{review.courseCategory}</span>
                        </div>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={`star ${i < review.rating ? 'filled' : ''}`}
                            />
                          ))}
                          <span className="rating-value">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <div className="review-meta">
                        <span className="review-date">
                          Reviewed: {new Date(review.createdAt).toLocaleDateString()}
                        </span>
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
    </div>
  );
};

export default Profile;