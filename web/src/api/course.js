// src/api/course.js - UPDATED WITH RATING/REVIEW AND PAYMENT SUPPORT
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  setDoc,
  updateDoc,
  deleteDoc,  // Added for deleteReview function
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Get all courses
export const getAllCourses = async () => {
  try {
    const coursesRef = collection(db, "courses");
    const snapshot = await getDocs(coursesRef);
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return courses;
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
};

// Get single course by ID
export const getCourseById = async (courseId) => {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (courseSnap.exists()) {
      const courseData = courseSnap.data();
      
      // Get course reviews
      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(reviewsRef, where("courseId", "==", courseId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const reviews = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate average rating
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
      
      return {
        id: courseSnap.id,
        ...courseData,
        reviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length
      };
    } else {
      throw new Error("Course not found");
    }
  } catch (error) {
    console.error("Error getting course:", error);
    throw error;
  }
};

// Get course reviews
export const getCourseReviews = async (courseId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(reviewsRef, where("courseId", "==", courseId));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return reviews;
  } catch (error) {
    console.error("Error getting course reviews:", error);
    throw error;
  }
};

// Check enrollment status
export const getEnrollmentStatus = async (userId, courseId) => {
  try {
    const enrollmentsRef = collection(db, "enrollments");
    const q = query(
      enrollmentsRef, 
      where("userId", "==", userId), 
      where("courseId", "==", courseId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return null;
  }
};

// Enroll user in course
export const enrollUserInCourse = async (userId, courseId) => {
  try {
    // Check if already enrolled
    const existingEnrollment = await getEnrollmentStatus(userId, courseId);
    if (existingEnrollment) {
      throw new Error("Already enrolled in this course");
    }
    
    // Create enrollment
    const enrollmentsRef = collection(db, "enrollments");
    const enrollmentData = {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      completed: false,
      lastAccessed: new Date().toISOString()
    };
    
    await addDoc(enrollmentsRef, enrollmentData);
    
    // Create initial progress record
    const progressRef = doc(db, "progress", `${userId}_${courseId}`);
    await setDoc(progressRef, {
      userId,
      courseId,
      progress: 0,
      completedModules: [],
      lastUpdated: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error enrolling user:", error);
    throw error;
  }
};

// Purchase single course
export const purchaseCourse = async (userId, courseId, paymentData) => {
  try {
    // First, enroll the user in the course
    await enrollUserInCourse(userId, courseId);
    
    // Create payment record
    const paymentsRef = collection(db, "payments");
    const paymentRecord = {
      userId,
      courseId,
      ...paymentData,
      status: 'completed',
      paymentDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    await addDoc(paymentsRef, paymentRecord);
    
    return { success: true, message: "Course purchased successfully" };
  } catch (error) {
    console.error("Error purchasing course:", error);
    throw error;
  }
};

// Purchase multiple courses
export const purchaseMultipleCourses = async (userId, courseIds, paymentData) => {
  try {
    // Enroll user in each course
    for (const courseId of courseIds) {
      await enrollUserInCourse(userId, courseId);
    }
    
    // Create payment record for all courses
    const paymentsRef = collection(db, "payments");
    const paymentRecord = {
      userId,
      courseIds,
      ...paymentData,
      status: 'completed',
      paymentDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    await addDoc(paymentsRef, paymentRecord);
    
    return { success: true, message: "Courses purchased successfully" };
  } catch (error) {
    console.error("Error purchasing multiple courses:", error);
    throw error;
  }
};

// Get user's progress for a course
export const getCourseProgress = async (userId, courseId) => {
  try {
    const progressRef = doc(db, "progress", `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return progressSnap.data();
    }
    
    // Return default progress if not exists
    return {
      userId,
      courseId,
      progress: 0,
      completedModules: []
    };
  } catch (error) {
    console.error("Error getting course progress:", error);
    throw error;
  }
};

// Update course progress
export const updateCourseProgress = async (userId, courseId, progressData) => {
  try {
    const progressRef = doc(db, "progress", `${userId}_${courseId}`);
    
    await setDoc(progressRef, {
      ...progressData,
      userId,
      courseId,
      lastUpdated: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating progress:", error);
    throw error;
  }
};

// Mark module as complete
export const markModuleComplete = async (userId, courseId, moduleId) => {
  try {
    const progressRef = doc(db, "progress", `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    let completedModules = [];
    if (progressSnap.exists()) {
      completedModules = progressSnap.data().completedModules || [];
    }
    
    // Add module if not already completed
    if (!completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    }
    
    // Get course to calculate total modules
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    const courseData = courseSnap.data();
    const totalModules = courseData.modules?.length || 1;
    const progress = Math.round((completedModules.length / totalModules) * 100);
    
    // Update progress
    await updateDoc(progressRef, {
      completedModules,
      progress,
      lastUpdated: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
    
    // If all modules completed, update enrollment
    if (completedModules.length === totalModules) {
      const enrollmentsRef = collection(db, "enrollments");
      const q = query(
        enrollmentsRef,
        where("userId", "==", userId),
        where("courseId", "==", courseId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const enrollmentDoc = querySnapshot.docs[0];
        const enrollmentRef = doc(db, "enrollments", enrollmentDoc.id);
        await updateDoc(enrollmentRef, {
          completed: true,
          completedAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return { 
      completed: true, 
      progress,
      completedModules
    };
  } catch (error) {
    console.error("Error marking module complete:", error);
    throw error;
  }
};

// Submit a course review
export const submitCourseReview = async (userId, courseId, reviewData) => {
  try {
    // Check if user is enrolled
    const enrollment = await getEnrollmentStatus(userId, courseId);
    if (!enrollment) {
      throw new Error("You must be enrolled to review this course");
    }
    
    // Check if user already reviewed this course
    const reviewsRef = collection(db, "reviews");
    const existingReviewQuery = query(
      reviewsRef,
      where("userId", "==", userId),
      where("courseId", "==", courseId)
    );
    const existingReview = await getDocs(existingReviewQuery);
    
    let reviewDoc;
    if (!existingReview.empty) {
      // Update existing review
      reviewDoc = doc(db, "reviews", existingReview.docs[0].id);
      await updateDoc(reviewDoc, {
        ...reviewData,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new review
      reviewDoc = await addDoc(reviewsRef, {
        userId,
        courseId,
        ...reviewData,
        userName: reviewData.userName || "Anonymous",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return { 
      success: true, 
      reviewId: reviewDoc.id 
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
};

// Get user's review for a course
export const getUserReview = async (userId, courseId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("userId", "==", userId),
      where("courseId", "==", courseId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error getting user review:", error);
    return null;
  }
};

// Get user's reviews
export const getUserReviews = async (userId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get course details for each review
    const reviewsWithCourseDetails = await Promise.all(
      reviews.map(async (review) => {
        try {
          const courseRef = doc(db, "courses", review.courseId);
          const courseSnap = await getDoc(courseRef);
          
          if (courseSnap.exists()) {
            return {
              ...review,
              courseTitle: courseSnap.data().title,
              courseImage: courseSnap.data().image
            };
          }
          return review;
        } catch (error) {
          console.error(`Error fetching course ${review.courseId}:`, error);
          return review;
        }
      })
    );
    
    return reviewsWithCourseDetails;
  } catch (error) {
    console.error("Error getting user reviews:", error);
    return [];
  }
};

// Delete review
export const deleteReview = async (reviewId) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await deleteDoc(reviewRef);
    
    return { success: true, message: "Review deleted successfully" };
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

// Generate certificate (client-side only)
export const generateCertificate = (course, user) => {
  const certificateData = {
    certificateId: `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userName: user.displayName || user.email,
    courseName: course.title,
    completedDate: new Date().toLocaleDateString(),
    issueDate: new Date().toLocaleDateString(),
    certificateNumber: `LEARN-${Date.now().toString().substr(-8)}`
  };
  
  return certificateData;
};

// Verify Paymee payment
export const verifyPaymeePayment = async (paymentId) => {
  try {
    // This is a mock function - you should implement actual Paymee API integration
    // For now, we'll simulate a successful verification
    
    // Get payment record from Firestore
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("paymentId", "==", paymentId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const paymentDoc = querySnapshot.docs[0];
      
      // Update payment status
      const paymentRef = doc(db, "payments", paymentDoc.id);
      await updateDoc(paymentRef, {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        payment: {
          id: paymentDoc.id,
          ...paymentDoc.data(),
          status: 'verified'
        }
      };
    }
    
    return { success: false, message: "Payment not found" };
  } catch (error) {
    console.error("Error verifying Paymee payment:", error);
    throw error;
  }
};

// Handle payment success
export const handlePaymentSuccess = async (userId, courseIds, paymentDetails) => {
  try {
    // Enroll user in courses
    for (const courseId of courseIds) {
      await enrollUserInCourse(userId, courseId);
    }
    
    // Create payment record
    const paymentsRef = collection(db, "payments");
    const paymentRecord = {
      userId,
      courseIds,
      ...paymentDetails,
      status: 'completed',
      paymentDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    await addDoc(paymentsRef, paymentRecord);
    
    return { 
      success: true, 
      message: "Payment processed successfully",
      enrolledCourses: courseIds
    };
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
};

// Dashboard stats
export const getDashboardStats = async (userId) => {
  try {
    // Get enrollment documents for the user
    const enrollmentsRef = collection(db, "enrollments");
    const q = query(enrollmentsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const enrollmentDocs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get course details for each enrollment
    const coursesWithDetails = await Promise.all(
      enrollmentDocs.map(async (enrollment) => {
        try {
          const courseRef = doc(db, "courses", enrollment.courseId);
          const courseSnap = await getDoc(courseRef);
          
          if (courseSnap.exists()) {
            const courseData = courseSnap.data();
            
            // Get progress for this course
            const progressRef = doc(db, "progress", `${userId}_${enrollment.courseId}`);
            const progressSnap = await getDoc(progressRef);
            const progress = progressSnap.exists() ? progressSnap.data().progress || 0 : 0;
            
            // Get user's review for this course
            const userReview = await getUserReview(userId, enrollment.courseId);
            
            return {
              id: enrollment.courseId,
              ...courseData,
              enrollmentId: enrollment.id,
              enrolledAt: enrollment.enrolledAt,
              completed: enrollment.completed || false,
              progress: progress,
              userReview: userReview,
              certificateEligible: enrollment.completed || false
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching course ${enrollment.courseId}:`, error);
          return null;
        }
      })
    );
    
    const validCourses = coursesWithDetails.filter(course => course !== null);
    
    const totalCourses = validCourses.length;
    const completedCourses = validCourses.filter(course => course.completed).length;
    const inProgressCourses = validCourses.filter(course => 
      !course.completed && course.progress > 0
    ).length;
    
    const totalProgress = validCourses.reduce((sum, course) => sum + (course.progress || 0), 0);
    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
    
    const totalMinutes = validCourses.reduce((sum, course) => sum + (course.duration || 0), 0);
    
    // Sort by most recently enrolled first
    const sortedCourses = [...validCourses]
      .sort((a, b) => {
        const dateA = a.enrolledAt ? new Date(a.enrolledAt) : new Date(0);
        const dateB = b.enrolledAt ? new Date(b.enrolledAt) : new Date(0);
        return dateB - dateA;
      });
    
    return {
      enrolledCourses: sortedCourses,
      totalCourses,
      completedCourses,
      inProgressCourses,
      averageProgress,
      totalMinutes
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return {
      enrolledCourses: [],
      totalCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      averageProgress: 0,
      totalMinutes: 0
    };
  }
};

// Export all functions
export default {
  getAllCourses,
  getCourseById,
  getCourseReviews,
  getEnrollmentStatus,
  enrollUserInCourse,
  purchaseCourse,
  purchaseMultipleCourses,
  getCourseProgress,
  updateCourseProgress,
  markModuleComplete,
  submitCourseReview,
  getUserReview,
  getUserReviews,
  deleteReview,
  generateCertificate,
  verifyPaymeePayment,
  handlePaymentSuccess,
  getDashboardStats
};