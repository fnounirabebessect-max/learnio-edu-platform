import React from "react";

export default function CourseCard({ course, onEnroll }) {
  return (
    <div className="course-card">
      <img src={course.thumbnail} alt={course.title} className="course-thumb" />

      <div className="course-content">
        <h3 className="course-title">{course.title}</h3>
        <p className="course-desc">{course.description}</p>

        <div className="course-footer">
          <span className={`badge ${course.isPaid ? "paid" : "free"}`}>
            {course.isPaid ? `${course.price} TND` : "Free"}
          </span>

          <button className="enroll-btn" onClick={() => onEnroll(course)}>
            {course.isPaid ? "Buy" : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}
