// Dashboard.jsx - UPDATED WITH REVIEW MODAL
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, submitCourseReview } from "../api/course";

// UI Components
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

import "./Dashboard.css";

const Dashboard = () => {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: [],
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0,
    totalMinutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    userName: ""
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (currentUser) {
        try {
          const stats = await getDashboardStats(currentUser.uid);
          console.log("Dashboard stats loaded:", {
            totalCourses: stats.totalCourses,
            enrolledCourses: stats.enrolledCourses.length,
            courses: stats.enrolledCourses.map(c => c.title)
          });
          setDashboardData(stats);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
          // Fallback to empty data
          setDashboardData({
            enrolledCourses: [],
            totalCourses: 0,
            completedCourses: 0,
            inProgressCourses: 0,
            averageProgress: 0,
            totalMinutes: 0
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle course rating/review
  const handleReviewSubmit = async () => {
    if (!selectedCourse || !currentUser) return;
    
    setReviewSubmitting(true);
    try {
      await submitCourseReview(currentUser.uid, selectedCourse.id, {
        ...reviewData,
        userName: reviewData.userName || currentUser.displayName || currentUser.email.split('@')[0]
      });
      
      // Refresh dashboard data
      const stats = await getDashboardStats(currentUser.uid);
      setDashboardData(stats);
      
      // Close modal and reset
      setReviewModalOpen(false);
      setSelectedCourse(null);
      setReviewData({
        rating: 5,
        comment: "",
        userName: ""
      });
      
      alert("Thank you for your review!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Open review modal
  const openReviewModal = (course) => {
    setSelectedCourse(course);
    setReviewData({
      rating: course.userReview?.rating || 5,
      comment: course.userReview?.comment || "",
      userName: currentUser?.displayName || currentUser?.email.split('@')[0] || ""
    });
    setReviewModalOpen(true);
  };

  // View certificate
  const viewCertificate = (course) => {
    if (course.completed) {
      navigate(`/certificate/${course.id}`);
    } else {
      alert("Complete the course to get your certificate!");
    }
  };

  // Simple icon renderer using emojis
  const renderIcon = (type, size = "medium") => {
    const icons = {
      home: "🏠",
      courses: "📚",
      profile: "👤",
      progress: "📈",
      fire: "🔥",
      hat: "🎓",
      clock: "⏱️",
      star: "⭐",
      arrow: "→",
      logout: "↩️",
      check: "✅",
      certificate: "📜",
      rocket: "🚀",
      brain: "🧠",
      review: "✍️",
      trophy: "🏆"
    };
    
    const icon = icons[type] || "⚡";
    
    return (
      <span 
        className={`dashboard-icon dashboard-icon-${size}`}
        aria-label={type}
      >
        {icon}
      </span>
    );
  };

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Recently";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      return `${Math.floor(diffInDays / 30)} months ago`;
    } catch (error) {
      return "Recently";
    }
  };

  // Get course status based on progress
  const getCourseStatus = (progress, completed) => {
    if (completed) return { text: "Completed", className: "status-completed" };
    if (progress >= 80) return { text: "Almost Done", className: "status-almost" };
    if (progress >= 50) return { text: "In Progress", className: "status-progress" };
    if (progress > 0) return { text: "Started", className: "status-started" };
    return { text: "Not Started", className: "status-not-started" };
  };

  // Render star rating
  const renderStarRating = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => setReviewData({...reviewData, rating: star})}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your learning journey...</p>
      </div>
    );
  }

  const {
    enrolledCourses,
    totalCourses,
    completedCourses,
    inProgressCourses,
    averageProgress,
    totalMinutes
  } = dashboardData;

  return (
    <div className="dashboard-container">
      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Rate ${selectedCourse?.title}`}
      >
        <div className="review-modal-content">
          <div className="review-stars">
            {renderStarRating(reviewData.rating)}
            <span className="rating-text">{reviewData.rating} out of 5</span>
          </div>
          
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={reviewData.userName}
              onChange={(e) => setReviewData({...reviewData, userName: e.target.value})}
              className="form-input"
              placeholder="Your name"
            />
          </div>
          
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
              className="form-textarea"
              placeholder="Share your experience with this course..."
              rows="4"
            />
          </div>
          
          <div className="modal-actions">
            <Button
              onClick={() => setReviewModalOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={reviewSubmitting || !reviewData.comment.trim()}
            >
              {reviewSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-area">
            <h1 className="dashboard-title">
              {renderIcon("rocket", "large")}
              <span>Learnio</span>
              <span className="tagline">Dashboard</span>
            </h1>
            <p className="greeting">
              Welcome back, <strong>{userData?.displayName || currentUser?.email?.split('@')[0] || "Learner"}</strong>
            </p>
          </div>
          
          <div className="header-actions">
            <div className="user-profile">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="profile-img" />
              ) : (
                <div className="profile-avatar">
                  {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <span className="user-name">{currentUser?.email?.split('@')[0]}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="logout-btn-minimal"
              title="Logout"
            >
              {renderIcon("logout")} Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* QUICK STATS BAR */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-icon">{renderIcon("courses")}</div>
            <div className="stat-info">
              <span className="stat-number">{totalCourses}</span>
              <span className="stat-label">Enrolled Courses</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">{renderIcon("clock")}</div>
            <div className="stat-info">
              <span className="stat-number">{totalMinutes}</span>
              <span className="stat-label">Learning Minutes</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">{renderIcon("progress")}</div>
            <div className="stat-info">
              <span className="stat-number">{averageProgress}%</span>
              <span className="stat-label">Overall Progress</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">{renderIcon("certificate")}</div>
            <div className="stat-info">
              <span className="stat-number">{completedCourses}</span>
              <span className="stat-label">Certificates</span>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="dashboard-grid">
          {/* LEFT COLUMN - ALL COURSES */}
          <div className="dashboard-column">
            {/* MY COURSES CARD - Shows ALL enrolled courses */}
            <Card className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">
                  {renderIcon("courses")}
                  My Courses ({totalCourses})
                </h2>
                <Button 
                  onClick={() => navigate("/courses")}
                  variant="ghost"
                  size="small"
                >
                  Browse More {renderIcon("arrow", "small")}
                </Button>
              </div>
              
              <div className="courses-list">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course, index) => {
                    const status = getCourseStatus(course.progress || 0, course.completed || false);
                    
                    return (
                      <div key={course.id || index} className="course-card-minimal">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="course-img" />
                        ) : (
                          <div className="course-img-placeholder">
                            {course.title?.charAt(0) || "C"}
                          </div>
                        )}
                        <div className="course-info-minimal">
                          <div className="course-header">
                            <h3 className="course-title">{course.title || "Untitled Course"}</h3>
                            <div className="course-actions-minimal">
                              <span className={`course-status ${status.className}`}>
                                {status.text}
                              </span>
                              {course.userReview && (
                                <span className="course-reviewed">
                                  {renderIcon("star", "small")} Reviewed
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="course-meta">
                            <span className="course-category">{course.category || "General"}</span>
                            <span className="course-level">{course.level || "All Levels"}</span>
                            {course.isFree && (
                              <span className="course-free">FREE</span>
                            )}
                            <span className="course-enrolled">
                              {course.enrolledAt ? `Enrolled ${formatRelativeTime(course.enrolledAt)}` : "Recently enrolled"}
                            </span>
                          </div>
                          <div className="course-progress-minimal">
                            <div className="progress-bar-minimal">
                              <div 
                                className="progress-fill-minimal" 
                                style={{ width: `${course.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{course.progress || 0}% complete</span>
                          </div>
                          
                          {/* Course Actions */}
                          <div className="course-extra-actions">
                            {course.completed && (
                              <>
                                <Button 
                                  size="small"
                                  variant="outline"
                                  onClick={() => viewCertificate(course)}
                                >
                                  {renderIcon("certificate", "small")} Certificate
                                </Button>
                                <Button 
                                  size="small"
                                  variant="ghost"
                                  onClick={() => openReviewModal(course)}
                                >
                                  {course.userReview ? "Edit Review" : "Add Review"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => navigate(`/courses/${course.id}`)}
                          size="small"
                          variant={course.progress > 0 ? "primary" : "outline"}
                        >
                          {course.progress > 0 ? "Continue" : "Start"}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state-minimal">
                    <div className="empty-state-icon">{renderIcon("courses", "large")}</div>
                    <p>No courses enrolled yet</p>
                    <p className="empty-state-subtitle">
                      Start your learning journey by exploring our courses
                    </p>
                    <Button 
                      onClick={() => navigate("/courses")}
                      className="explore-btn"
                    >
                      {renderIcon("rocket")} Explore Courses
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* LEARNING PROGRESS CARD */}
            <Card className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">
                  {renderIcon("progress")}
                  Learning Progress
                </h2>
              </div>
              <div className="progress-chart">
                <div className="progress-circle">
                  <div className="circle-background"></div>
                  <div 
                    className="circle-progress" 
                    style={{ transform: `rotate(${averageProgress * 3.6}deg)` }}
                  ></div>
                  <div className="circle-content">
                    <span className="progress-percent">{averageProgress}%</span>
                    <span className="progress-label">Overall Progress</span>
                  </div>
                </div>
                <div className="progress-details">
                  <div className="detail-item">
                    <span className="detail-label">Total Enrolled</span>
                    <span className="detail-value">{totalCourses}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Completed</span>
                    <span className="detail-value">{completedCourses}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">In Progress</span>
                    <span className="detail-value">{inProgressCourses}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="dashboard-column">
            {/* QUICK ACTIONS CARD */}
            <Card className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">
                  {renderIcon("star")}
                  Quick Actions
                </h2>
              </div>
              <div className="actions-grid-minimal">
                <button 
                  className="action-card"
                  onClick={() => navigate("/courses")}
                >
                  <div className="action-icon">{renderIcon("courses", "large")}</div>
                  <span className="action-title">Browse Courses</span>
                  <p className="action-desc">Discover new learning paths</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => navigate("/profile")}
                >
                  <div className="action-icon">{renderIcon("profile", "large")}</div>
                  <span className="action-title">Edit Profile</span>
                  <p className="action-desc">Update your information</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => navigate("/courses?filter=free")}
                >
                  <div className="action-icon">{renderIcon("star", "large")}</div>
                  <span className="action-title">Free Courses</span>
                  <p className="action-desc">Start learning for free</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => {
                    if (enrolledCourses.length > 0) {
                      navigate(`/courses/${enrolledCourses[0].id}`);
                    } else {
                      navigate("/courses");
                    }
                  }}
                >
                  <div className="action-icon">{renderIcon("fire", "large")}</div>
                  <span className="action-title">
                    {enrolledCourses.length > 0 ? "Continue Learning" : "Start Learning"}
                  </span>
                  <p className="action-desc">
                    {enrolledCourses.length > 0 
                      ? "Pick up where you left off" 
                      : "Begin your first course"}
                  </p>
                </button>
              </div>
            </Card>

            {/* LEARNING INSIGHTS CARD */}
            <Card className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">
                  {renderIcon("brain")}
                  Learning Insights
                </h2>
              </div>
              <div className="recommendations-minimal">
                {enrolledCourses.length === 0 ? (
                  <div className="recommendation-item">
                    <div className="rec-icon">{renderIcon("star")}</div>
                    <div className="rec-content">
                      <h3>Welcome to Learnio!</h3>
                      <p>Enroll in your first course to unlock personalized insights and track your learning journey.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="recommendation-item">
                      <div className="rec-icon">{renderIcon("progress")}</div>
                      <div className="rec-content">
                        <h3>Your Learning Streak</h3>
                        <p>
                          {averageProgress < 30 
                            ? "Getting started is the hardest part. Try to complete one lesson today!"
                            : averageProgress < 70
                            ? "Great progress! Keep this momentum going to reach your goals."
                            : "Excellent work! You're close to completing your courses. Keep going!"}
                        </p>
                      </div>
                    </div>
                    
                    {completedCourses > 0 && (
                      <div className="recommendation-item">
                        <div className="rec-icon">{renderIcon("trophy")}</div>
                        <div className="rec-content">
                          <h3>Great Job!</h3>
                          <p>You've completed {completedCourses} course{completedCourses > 1 ? 's' : ''}. Ready for the next challenge?</p>
                        </div>
                        <Button size="small" onClick={() => navigate("/courses")}>
                          Explore
                        </Button>
                      </div>
                    )}
                    
                    <div className="recommendation-item">
                      <div className="rec-icon">{renderIcon("review")}</div>
                      <div className="rec-content">
                        <h3>Review Completed Courses</h3>
                        <p>Share your experience to help other learners and improve our courses.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;