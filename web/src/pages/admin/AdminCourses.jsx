// src/pages/admin/AdminCourses.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Navigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './AdminCourses.css';

const AdminCourses = () => {
  const { role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    category: 'Development',
    price: '',
    status: 'active',
    description: '',
    duration: '',
    image: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  // Check if user is admin - AFTER all hooks
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesList = coursesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure all required fields have defaults
          title: data.title || 'Untitled Course',
          instructor: data.instructor || 'Unknown Instructor',
          category: data.category || 'Uncategorized',
          price: parseFloat(data.price) || 0,
          status: data.status || 'draft',
          enrolledUsers: parseInt(data.enrolledUsers) || 0,
          duration: parseInt(data.duration) || 0
        };
      });
      setCourses(coursesList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const courseData = {
        title: formData.title.trim(),
        instructor: formData.instructor.trim(),
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        status: formData.status,
        description: formData.description.trim(),
        duration: parseInt(formData.duration) || 0,
        image: formData.image.trim() || 'https://via.placeholder.com/300x200?text=Course+Image',
        enrolledUsers: 0,
        rating: 0,
        reviews: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Validate required fields
      if (!courseData.title || !courseData.instructor || !courseData.category) {
        alert('Please fill in all required fields (Title, Instructor, Category)');
        return;
      }

      if (editingCourse) {
        // Update existing course
        const courseRef = doc(db, 'courses', editingCourse.id);
        await updateDoc(courseRef, {
          ...courseData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new course
        await addDoc(collection(db, 'courses'), courseData);
      }

      // Reset form and refresh
      setFormData({
        title: '',
        instructor: '',
        category: 'Development',
        price: '',
        status: 'active',
        description: '',
        duration: '',
        image: ''
      });
      setEditingCourse(null);
      setShowForm(false);
      fetchCourses();
      
    } catch (error) {
      console.error('Error saving course:', error);
      alert(`Error saving course: ${error.message}`);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      instructor: course.instructor || '',
      category: course.category || 'Development',
      price: course.price?.toString() || '',
      status: course.status || 'active',
      description: course.description || '',
      duration: course.duration?.toString() || '',
      image: course.image || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="admin-courses">
      <div className="admin-header">
        <h1>Course Management</h1>
        <p>Manage all courses on the platform</p>
      </div>

      <button 
        className="btn-add-course"
        onClick={() => {
          setEditingCourse(null);
          setShowForm(true);
        }}
      >
        + Add New Course
      </button>

      {showForm && (
        <div className="course-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Course title"
                  />
                </div>
                <div className="form-group">
                  <label>Instructor *</label>
                  <input
                    type="text"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    required
                    placeholder="Instructor name"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Development">Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Business">Business</option>
                    <option value="Personal Development">Personal Development</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="60"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Course description..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="courses-table-container">
        {courses.length === 0 ? (
          <div className="no-courses">
            <p>No courses found. Add your first course!</p>
          </div>
        ) : (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Instructor</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title-cell">
                      {course.image && (
                        <img 
                          src={course.image} 
                          alt={course.title} 
                          className="course-thumbnail"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40x30?text=Image';
                          }}
                        />
                      )}
                      <span className="course-title">{course.title}</span>
                    </div>
                  </td>
                  <td className="instructor-cell">{course.instructor}</td>
                  <td>
                    <span className="category-badge">{course.category}</span>
                  </td>
                  <td className="price-cell">
                    {course.price > 0 ? `${course.price.toFixed(2)} €` : 'Free'}
                  </td>
                  <td>
                    <span className={`status-badge ${course.status}`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </td>
                  <td className="enrollments-cell">{course.enrolledUsers}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(course)}
                        title="Edit Course"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(course.id)}
                        title="Delete Course"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;