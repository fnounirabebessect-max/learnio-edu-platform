import React, { useEffect, useState } from "react";
import "./Courses.css";
import { useAuth } from "../../context/authContext";
import { getAllCourses, enrollUserInCourse, getEnrollmentStatus } from "../../api/course";
import { Link } from "react-router-dom";

export default function Courses() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    level: "",
    price: "",
    rating: ""
  });
  
  // Available filter options
  const categories = [
    "All Categories",
    "Développement Web", 
    "Marketing", 
    "Design Graphique", 
    "Photographie", 
    "Langues", 
    "Intelligence Artificielle", 
    "Cybersécurité",
    "Other"
  ];
  
  const levels = ["All Levels", "Débutant", "Intermédiaire", "Avancé"];
  const priceRanges = ["All", "Free", "Paid"];
  const ratings = ["All", "5 stars", "4 stars & up", "3 stars & up"];

  // Load all courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getAllCourses();
        setCourses(data);

        if (currentUser) {
          const enrollmentMap = {};
          for (const course of data) {
            const status = await getEnrollmentStatus(currentUser.uid, course.id);
            enrollmentMap[course.id] = status;
          }
          setEnrolled(enrollmentMap);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [currentUser]);

  // Handle enrollment
  async function handleEnroll(courseId, isFree) {
    if (!currentUser) {
      alert("You must be logged in to enroll.");
      return;
    }

    if (!isFree) {
      alert("This is a premium course. Currently only free courses are available.");
      return;
    }

    try {
      await enrollUserInCourse(currentUser.uid, courseId);
      setEnrolled((prev) => ({ ...prev, [courseId]: true }));
      alert("Successfully enrolled!");
    } catch (error) {
      console.error("Enroll error:", error);
      alert("Error: " + error.message);
    }
  }

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === prev[filterType] || 
                    value === "All" || 
                    value === "All Categories" || 
                    value === "All Levels" ? "" : value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category: "",
      level: "",
      price: "",
      rating: ""
    });
  };

  // Helper function to infer category from course data
  const inferCategory = (course) => {
    const title = course.title?.toLowerCase() || '';
    const desc = course.description?.toLowerCase() || '';
    
    if (title.includes('ia') || title.includes('intelligence') || title.includes('ai') || 
        desc.includes('ai') || desc.includes('artificielle')) {
      return "Intelligence Artificielle";
    }
    if (title.includes('web') || title.includes('react') || title.includes('javascript') || 
        title.includes('html') || title.includes('css') || title.includes('frontend') || 
        title.includes('backend') || desc.includes('web')) {
      return "Développement Web";
    }
    if (title.includes('marketing') || title.includes('digital') || desc.includes('marketing')) {
      return "Marketing";
    }
    if (title.includes('design') || title.includes('photoshop') || title.includes('ui') || 
        title.includes('ux') || title.includes('graphic') || desc.includes('design')) {
      return "Design Graphique";
    }
    if (title.includes('photo') || title.includes('camera') || desc.includes('photography')) {
      return "Photographie";
    }
    if (title.includes('langue') || title.includes('espagnol') || title.includes('français') || 
        title.includes('english') || title.includes('spanish') || desc.includes('language')) {
      return "Langues";
    }
    if (title.includes('cybersécurité') || title.includes('security') || title.includes('hack') || 
        title.includes('cyber') || desc.includes('security')) {
      return "Cybersécurité";
    }
    return "Other";
  };

  // Filter courses based on selected filters
  const filteredCourses = courses.filter(course => {
    // Category filter
    if (filters.category) {
      const courseCategory = course.category || inferCategory(course);
      if (courseCategory !== filters.category) return false;
    }
    
    // Level filter
    if (filters.level && course.level !== filters.level) return false;
    
    // Price filter
    if (filters.price === "Free" && !course.isFree) return false;
    if (filters.price === "Paid" && course.isFree) return false;
    
    // Rating filter
    if (filters.rating) {
      const minRating = parseInt(filters.rating.charAt(0));
      if (!course.rating || course.rating < minRating) return false;
    }
    
    return true;
  });

  // Generate rating stars
  const renderRatingStars = (rating, reviews = 0) => {
    // If rating is 0 or undefined, show "No ratings yet"
    if (!rating || rating === 0) {
      return (
        <span className="rating-stars">
          {'☆'.repeat(5)}
          <span className="rating-text"> No ratings yet</span>
        </span>
      );
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <span className="rating-stars">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '½'}
        {'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
        <span className="rating-text"> {rating.toFixed(1)} ({reviews} reviews)</span>
      </span>
    );
  };

  // Format price display
  const renderPrice = (course) => {
    if (course.isFree) {
      return <span className="price-free">FREE</span>;
    }
    
    return (
      <>
        {course.oldPrice > 0 && (
          <span className="price-old">{course.oldPrice} DT</span>
        )}
        <span className="price-current">{course.price} DT</span>
      </>
    );
  };

  if (loading) {
    return <div className="course-loading">Loading courses...</div>;
  }

  return (
    <div className="courses-container">
      <h1 className="courses-title">Discover Our Courses</h1>
      <p className="courses-subtitle">Browse through our extensive collection of high-quality courses</p>
      
      <div className="courses-layout">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <h2 className="filters-title">Filters</h2>
          
          {/* Category Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Category</h3>
            <div className="filter-options">
              {categories.map(category => (
                <label key={category} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === category || (!filters.category && category === "All Categories")}
                    onChange={() => handleFilterChange("category", category)}
                  />
                  <span className="checkmark"></span>
                  {category}
                </label>
              ))}
            </div>
          </div>
          
          {/* Level Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Level</h3>
            <div className="filter-options">
              {levels.map(level => (
                <label key={level} className="filter-option">
                  <input
                    type="radio"
                    name="level"
                    checked={filters.level === level || (!filters.level && level === "All Levels")}
                    onChange={() => handleFilterChange("level", level)}
                  />
                  <span className="checkmark"></span>
                  {level}
                </label>
              ))}
            </div>
          </div>
          
          {/* Price Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Price</h3>
            <div className="filter-options">
              {priceRanges.map(price => (
                <label key={price} className="filter-option">
                  <input
                    type="radio"
                    name="price"
                    checked={filters.price === price || (!filters.price && price === "All")}
                    onChange={() => handleFilterChange("price", price)}
                  />
                  <span className="checkmark"></span>
                  {price === "All" ? "All Prices" : price === "Free" ? "Free Only" : "Paid Only"}
                </label>
              ))}
            </div>
          </div>
          
          {/* Rating Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Rating</h3>
            <div className="filter-options">
              {ratings.map(rating => (
                <label key={rating} className="filter-option">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.rating === rating || (!filters.rating && rating === "All")}
                    onChange={() => handleFilterChange("rating", rating)}
                  />
                  <span className="checkmark"></span>
                  {rating === "All" ? "All Ratings" : rating}
                </label>
              ))}
            </div>
          </div>
          
          {/* Reset Filters Button */}
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset Filters
          </button>
          
          {/* Results Count */}
          <div className="courses-count">
            {filteredCourses.length} of {courses.length} courses
          </div>
        </div>
        
        {/* Courses Grid */}
        <div className="courses-content">
          <div className="courses-grid">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div className="course-card" key={course.id}>
                  {/* Level Badge */}
                  {course.level && (
                    <div className="course-level-badge">{course.level}</div>
                  )}
                  
                  <div className="course-image">
                    {course.image ? (
                      <img src={course.image} alt={course.title} />
                    ) : (
                      <div className="course-placeholder-img">
                        <span>{course.title?.charAt(0) || "C"}</span>
                      </div>
                    )}
                  </div>

                  <div className="course-info">
                    <h2 className="course-name">{course.title || "Untitled Course"}</h2>
                    
                    {/* Instructor */}
                    <div className="course-instructor">
                      By <span className="instructor-name">{course.author || "Admin"}</span>
                    </div>
                    
                    {/* Rating */}
                    <div className="course-rating">
                      {renderRatingStars(course.rating, course.reviews || 0)}
                    </div>
                    
                    <p className="course-desc">
                      {course.description?.length > 100 
                        ? `${course.description.substring(0, 100)}...` 
                        : course.description || "No description available."}
                    </p>

                    <div className="course-meta">
                      <span className="course-duration">
                        ⏱️ {course.duration || 0} min
                      </span>
                      {course.language && (
                        <span className="course-language">🌐 {course.language}</span>
                      )}
                    </div>

                    <div className="course-price">
                      {renderPrice(course)}
                    </div>

                    <div className="course-actions">
                      {/* View details */}
                      <Link to={`/courses/${course.id}`} className="btn-details">
                        View Course
                      </Link>

                      {/* Enroll button */}
                      {enrolled[course.id] ? (
                        <button className="btn-enrolled" disabled>
                          ✓ Enrolled
                        </button>
                      ) : (
                        <button
                          className="btn-enroll"
                          onClick={() => handleEnroll(course.id, course.isFree)}
                        >
                          {course.isFree ? "Enroll For Free" : "Buy Course"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-courses-message">
                <p>No courses match your filters.</p>
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}