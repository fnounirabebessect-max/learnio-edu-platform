// Dashboard.jsx - CLEAN INTEGRATED VERSION
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api/course";
import { 
  FiBook, 
  FiClock, 
  FiTrendingUp, 
  FiAward,
  FiSearch,
  FiPlay,
  FiCheckCircle,
  FiStar,
  FiActivity
} from "react-icons/fi";
import { HiOutlineFire, HiOutlineLightningBolt } from "react-icons/hi";

import "./Dashboard.css";

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
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
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (currentUser) {
        try {
          const stats = await getDashboardStats(currentUser.uid);
          setDashboardData(stats);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
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

  const getFilteredCourses = () => {
    switch (activeFilter) {
      case "in-progress":
        return dashboardData.enrolledCourses.filter(course => course.progress > 0 && course.progress < 100);
      case "completed":
        return dashboardData.enrolledCourses.filter(course => course.completed);
      case "not-started":
        return dashboardData.enrolledCourses.filter(course => course.progress === 0);
      default:
        return dashboardData.enrolledCourses;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-container">
          <div className="loading-spinner"></div>
        </div>
        <p>Loading your learning journey...</p>
      </div>
    );
  }

  const filteredCourses = getFilteredCourses();
  const greeting = getGreeting();
  const userName = userData?.displayName || currentUser?.email?.split('@')[0] || "Learner";

  return (
    <div className="dashboard-clean">
      {/* Minimal Header - Just greeting and name */}
      <div className="dashboard-header-clean">
        <div className="greeting-container">
          <h1 className="greeting-text">{greeting}, <span className="user-name-highlight">{userName}</span></h1>
          <p className="greeting-subtitle">Welcome to your learning dashboard</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-content-clean">
        {/* Stats Overview */}
        <div className="stats-grid-clean">
          <div className="stat-card-clean">
            <div className="stat-icon-clean stat-1">
              <FiBook size={22} />
            </div>
            <div className="stat-content-clean">
              <h3 className="stat-number-clean">{dashboardData.totalCourses}</h3>
              <p className="stat-label-clean">Enrolled Courses</p>
            </div>
          </div>
          
          <div className="stat-card-clean">
            <div className="stat-icon-clean stat-2">
              <FiClock size={22} />
            </div>
            <div className="stat-content-clean">
              <h3 className="stat-number-clean">{dashboardData.totalMinutes}</h3>
              <p className="stat-label-clean">Learning Minutes</p>
            </div>
          </div>
          
          <div className="stat-card-clean">
            <div className="stat-icon-clean stat-3">
              <FiTrendingUp size={22} />
            </div>
            <div className="stat-content-clean">
              <h3 className="stat-number-clean">{dashboardData.averageProgress}%</h3>
              <p className="stat-label-clean">Overall Progress</p>
            </div>
          </div>
          
          <div className="stat-card-clean">
            <div className="stat-icon-clean stat-4">
              <FiAward size={22} />
            </div>
            <div className="stat-content-clean">
              <h3 className="stat-number-clean">{dashboardData.completedCourses}</h3>
              <p className="stat-label-clean">Certificates</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="dashboard-main-clean">
          {/* Left Column - Courses */}
          <div className="dashboard-left-column">
            {/* Course Filter Tabs */}
            <div className="course-filter-tabs">
              <button 
                className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Courses
              </button>
              <button 
                className={`filter-tab ${activeFilter === "in-progress" ? "active" : ""}`}
                onClick={() => setActiveFilter("in-progress")}
              >
                In Progress
              </button>
              <button 
                className={`filter-tab ${activeFilter === "completed" ? "active" : ""}`}
                onClick={() => setActiveFilter("completed")}
              >
                Completed
              </button>
            </div>

            {/* Courses Section */}
            <div className="courses-section-clean">
              <div className="section-header-clean">
                <h2 className="section-title-clean">My Learning</h2>
                <button 
                  className="browse-courses-btn"
                  onClick={() => navigate("/courses")}
                >
                  <FiSearch size={16} />
                  Browse Courses
                </button>
              </div>
              
              {dashboardData.enrolledCourses.length > 0 ? (
                <div className="courses-list-clean">
                  {filteredCourses.map((course, index) => (
                    <div key={course.id || index} className="course-card-clean">
                      <div className="course-card-header">
                        <div className="course-info-header">
                          <h3 className="course-title-clean">{course.title || "Untitled Course"}</h3>
                          <div className="course-meta-clean">
                            <span className="course-category-tag">{course.category || "General"}</span>
                            <span className={`course-status-tag ${course.completed ? "completed" : course.progress > 0 ? "in-progress" : "not-started"}`}>
                              {course.completed ? "Completed" : course.progress > 0 ? "In Progress" : "Not Started"}
                            </span>
                          </div>
                        </div>
                        <div className="course-progress-display">
                          <span className="progress-percentage">{course.progress || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="course-progress-bar-container">
                        <div className="progress-bar-clean">
                          <div 
                            className="progress-fill-clean" 
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="course-card-footer">
                        <button 
                          className="action-btn-continue"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <FiPlay size={16} />
                          {course.progress > 0 ? "Continue" : "Start"}
                        </button>
                        
                        {course.completed && (
                          <button 
                            className="action-btn-certificate"
                            onClick={() => navigate(`/certificate/${course.id}`)}
                          >
                            <FiAward size={16} />
                            Certificate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-clean">
                  <div className="empty-state-icon-clean">
                    <HiOutlineLightningBolt size={48} />
                  </div>
                  <h3>No courses enrolled yet</h3>
                  <p>Start your learning journey by exploring our courses</p>
                  <button 
                    className="cta-btn-explore"
                    onClick={() => navigate("/courses")}
                  >
                    <FiSearch size={18} />
                    Explore Courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Insights */}
          <div className="dashboard-right-column">
            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h2 className="section-title-clean">Quick Actions</h2>
              <div className="quick-actions-grid-clean">
                <button 
                  className="quick-action-item"
                  onClick={() => navigate("/courses")}
                >
                  <div className="action-icon-wrapper">
                    <FiSearch size={20} />
                  </div>
                  <div className="action-content">
                    <h4>Browse Courses</h4>
                    <p>Discover new learning paths</p>
                  </div>
                </button>
                
                <button 
                  className="quick-action-item"
                  onClick={() => navigate("/profile")}
                >
                  <div className="action-icon-wrapper">
                    <FiActivity size={20} />
                  </div>
                  <div className="action-content">
                    <h4>My Profile</h4>
                    <p>View and edit your profile</p>
                  </div>
                </button>
                
                <button 
                  className="quick-action-item"
                  onClick={() => navigate("/courses?filter=free")}
                >
                  <div className="action-icon-wrapper">
                    <FiStar size={20} />
                  </div>
                  <div className="action-content">
                    <h4>Free Courses</h4>
                    <p>Start learning for free</p>
                  </div>
                </button>
                
                <button 
                  className="quick-action-item"
                  onClick={() => {
                    if (dashboardData.enrolledCourses.length > 0) {
                      navigate(`/courses/${dashboardData.enrolledCourses[0].id}`);
                    } else {
                      navigate("/courses");
                    }
                  }}
                >
                  <div className="action-icon-wrapper">
                    <HiOutlineFire size={20} />
                  </div>
                  <div className="action-content">
                    <h4>{dashboardData.enrolledCourses.length > 0 ? "Continue Learning" : "Start Learning"}</h4>
                    <p>{dashboardData.enrolledCourses.length > 0 ? "Pick up where you left off" : "Begin your first course"}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Learning Insights */}
            <div className="insights-card">
              <h2 className="section-title-clean">Learning Insights</h2>
              <div className="insights-list-clean">
                {dashboardData.enrolledCourses.length === 0 ? (
                  <div className="insight-item-clean">
                    <div className="insight-icon-wrapper">
                      <FiBook size={18} />
                    </div>
                    <div className="insight-content">
                      <h4>Welcome to Learnio!</h4>
                      <p>Enroll in your first course to unlock personalized insights and track your learning journey.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="insight-item-clean">
                      <div className="insight-icon-wrapper">
                        <FiTrendingUp size={18} />
                      </div>
                      <div className="insight-content">
                        <h4>Learning Progress</h4>
                        <p>
                          {dashboardData.averageProgress < 30 
                            ? "Getting started is the hardest part. Try to complete one lesson today!"
                            : dashboardData.averageProgress < 70
                            ? "Great progress! Keep this momentum going to reach your goals."
                            : "Excellent work! You're close to completing your courses. Keep going!"}
                        </p>
                      </div>
                    </div>
                    
                    {dashboardData.completedCourses > 0 && (
                      <div className="insight-item-clean">
                        <div className="insight-icon-wrapper">
                          <FiCheckCircle size={18} />
                        </div>
                        <div className="insight-content">
                          <h4>Great Job!</h4>
                          <p>You've completed {dashboardData.completedCourses} course{dashboardData.completedCourses > 1 ? 's' : ''}. Ready for the next challenge?</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;