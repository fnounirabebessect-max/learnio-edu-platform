// src/api/course.js - FIXED VERSION
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
  deleteDoc,
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
      
      // Ensure modules have proper IDs
      const modules = courseData.modules?.map((module, index) => ({
        ...module,
        id: module.id || `module_${index + 1}`
      })) || [];
      
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
        modules,
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

// Enroll user in course - FIXED VERSION
export const enrollUserInCourse = async (userId, courseId) => {
  try {
    console.log(`Attempting to enroll user ${userId} in course ${courseId}`);
    
    // Check if already enrolled
    const existingEnrollment = await getEnrollmentStatus(userId, courseId);
    if (existingEnrollment) {
      console.log("User already enrolled in this course");
      throw new Error("Already enrolled in this course");
    }
    
    // Create enrollment document
    const enrollmentsRef = collection(db, "enrollments");
    const enrollmentData = {
      userId: userId,
      courseId: courseId,
      enrolledAt: new Date().toISOString(),
      completed: false,
      lastAccessed: new Date().toISOString()
    };
    
    console.log("Creating enrollment with data:", enrollmentData);
    const enrollmentDoc = await addDoc(enrollmentsRef, enrollmentData);
    
    // Create initial progress record
    try {
      const progressRef = doc(db, "progress", `${userId}_${courseId}`);
      await setDoc(progressRef, {
        userId: userId,
        courseId: courseId,
        progress: 0,
        completedModules: [],
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      console.log("Progress record created");
    } catch (progressError) {
      console.warn("Could not create progress record:", progressError);
    }
    
    console.log("Enrollment successful");
    return { 
      success: true, 
      enrollmentId: enrollmentDoc.id 
    };
  } catch (error) {
    console.error("Error enrolling user:", error);
    throw error;
  }
};

// Purchase single course
export const purchaseCourse = async (userId, courseId, paymentData) => {
  try {
    console.log(`Purchasing course ${courseId} for user ${userId}`);
    
    // First, enroll the user in the course
    await enrollUserInCourse(userId, courseId);
    
    // Create payment record
    const paymentsRef = collection(db, "payments");
    const paymentRecord = {
      userId: userId,
      courseIds: [courseId],
      ...paymentData,
      status: 'completed',
      paymentDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    console.log("Creating payment record:", paymentRecord);
    const paymentDoc = await addDoc(paymentsRef, paymentRecord);
    
    return { 
      success: true, 
      message: "Course purchased successfully",
      paymentId: paymentDoc.id
    };
  } catch (error) {
    console.error("Error purchasing course:", error);
    throw error;
  }
};

// Purchase multiple courses
export const purchaseMultipleCourses = async (userId, cartItems, paymentData) => {
  try {
    console.log("Purchasing multiple courses for user:", userId);
    console.log("Cart items count:", cartItems.length);
    
    // Extract course IDs from cart items
    const courseIds = cartItems.map(item => item.id);
    console.log("Course IDs to purchase:", courseIds);
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }
    
    // Enroll user in each course
    const enrolledCourses = [];
    const failedCourses = [];
    
    for (const item of cartItems) {
      try {
        console.log(`Enrolling in course: ${item.id} - ${item.title}`);
        await enrollUserInCourse(userId, item.id);
        enrolledCourses.push(item.id);
        console.log(`Successfully enrolled in course ${item.id}`);
      } catch (enrollError) {
        console.error(`Error enrolling in course ${item.id}:`, enrollError.message);
        
        if (enrollError.message.includes("Already enrolled")) {
          enrolledCourses.push(item.id);
          console.log(`Course ${item.id} already enrolled`);
        } else {
          failedCourses.push({
            courseId: item.id,
            title: item.title,
            error: enrollError.message
          });
        }
      }
    }
    
    if (enrolledCourses.length === 0 && failedCourses.length > 0) {
      throw new Error(`Failed to enroll in any courses: ${failedCourses.map(f => f.title).join(', ')}`);
    }
    
    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    
    // Create payment record for all courses
    const paymentsRef = collection(db, "payments");
    const paymentRecord = {
      userId: userId,
      courseIds: enrolledCourses,
      totalAmount: totalAmount,
      ...paymentData,
      status: 'completed',
      paymentDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    console.log("Creating payment record with data:", paymentRecord);
    const paymentDoc = await addDoc(paymentsRef, paymentRecord);
    const paymentId = paymentDoc.id;
    
    console.log("Payment created with ID:", paymentId);
    
    return { 
      success: true, 
      message: "Courses purchased successfully",
      paymentId: paymentId,
      enrolledCourses: enrolledCourses,
      totalAmount: totalAmount,
      failedCourses: failedCourses.length > 0 ? failedCourses : undefined
    };
    
  } catch (error) {
    console.error("Error purchasing multiple courses:", error);
    
    let errorMessage = error.message;
    
    if (error.message.includes("Missing or insufficient permissions")) {
      errorMessage = "Permission denied. Please make sure you're logged in and have proper permissions.";
    } else if (error.message.includes("invalid data")) {
      errorMessage = "Invalid data format. Please try again.";
    }
    
    throw new Error(errorMessage);
  }
};

// Get user's progress for a course - FIXED
export const getCourseProgress = async (userId, courseId) => {
  try {
    // Try to get progress document
    const progressRef = doc(db, "progress", `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const data = progressSnap.data();
      return {
        ...data,
        completedModules: data.completedModules || [],
        progress: data.progress || 0
      };
    }
    
    // If no progress exists, return default structure (don't create automatically)
    return {
      userId: userId,
      courseId: courseId,
      progress: 0,
      completedModules: [],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in getCourseProgress:", error);
    return {
      userId: userId,
      courseId: courseId,
      progress: 0,
      completedModules: [],
      lastUpdated: new Date().toISOString()
    };
  }
};

// Mark module as complete - FIXED
export const markModuleComplete = async (userId, courseId, moduleId) => {
  try {
    if (!userId || !courseId || !moduleId) {
      throw new Error("Missing required parameters");
    }
    
    console.log(`Marking module ${moduleId} complete for user ${userId}, course ${courseId}`);
    
    // Get current progress
    const progressRef = doc(db, "progress", `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    let progressData;
    if (progressSnap.exists()) {
      progressData = progressSnap.data();
    } else {
      // Create initial progress data
      progressData = {
        userId: userId,
        courseId: courseId,
        progress: 0,
        completedModules: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    const completedModules = progressData.completedModules || [];
    const moduleIdStr = String(moduleId);
    
    if (!completedModules.includes(moduleIdStr)) {
      completedModules.push(moduleIdStr);
    }
    
    // Get course to calculate total modules
    let totalModules = 1;
    try {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        const courseData = courseSnap.data();
        totalModules = courseData.modules?.length || 1;
      }
    } catch (courseError) {
      console.warn("Could not get course details:", courseError);
    }
    
    // Calculate progress
    const progress = Math.round((completedModules.length / totalModules) * 100);
    
    // Update progress document
    await setDoc(progressRef, {
      ...progressData,
      completedModules,
      progress,
      lastUpdated: new Date().toISOString()
    });
    
    // Check if course is now complete
    if (completedModules.length === totalModules && totalModules > 0) {
      try {
        // Update enrollment status
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
            completedAt: new Date().toISOString()
          });
        }
      } catch (enrollmentError) {
        console.warn("Could not update enrollment status:", enrollmentError);
      }
    }
    
    return { 
      success: true,
      completed: true, 
      progress,
      completedModules,
      totalModules
    };
  } catch (error) {
    console.error("Error in markModuleComplete:", error);
    return { 
      success: false,
      error: error.message,
      completed: true,
      progress: 100,
      completedModules: [String(moduleId)],
      totalModules: 1
    };
  }
};

// Submit a course review
export const submitCourseReview = async (userId, courseId, reviewData) => {
  try {
    console.log(`Submitting review for course ${courseId} by user ${userId}`);
    
    // Validate review data
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      throw new Error("Please provide a review comment");
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
      console.log("Updated existing review");
    } else {
      // Create new review
      const newReviewData = {
        userId: userId,
        courseId: courseId,
        ...reviewData,
        userName: reviewData.userName || "Anonymous",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Creating new review with data:", newReviewData);
      reviewDoc = await addDoc(reviewsRef, newReviewData);
      console.log("Created new review with ID:", reviewDoc.id);
    }
    
    return { 
      success: true, 
      reviewId: reviewDoc.id 
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    if (error.message.includes("Missing or insufficient permissions")) {
      throw new Error("Permission denied. Please make sure you're logged in.");
    } else if (error.message.includes("FirebaseError")) {
      throw new Error("Database error. Please try again.");
    }
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
    
    return reviews;
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

// Generate certificate
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
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("paymentId", "==", paymentId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const paymentDoc = querySnapshot.docs[0];
      
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
    console.log("Handling payment success for user:", userId);
    
    // Enroll user in courses
    const enrolledCourses = [];
    for (const courseId of courseIds) {
      try {
        await enrollUserInCourse(userId, courseId);
        enrolledCourses.push(courseId);
      } catch (enrollError) {
        console.warn(`Course ${courseId} already enrolled or error:`, enrollError.message);
        if (enrollError.message.includes("Already enrolled")) {
          enrolledCourses.push(courseId);
        }
      }
    }
    
    // Create payment record
    const paymentsRef = collection(db, "payments");
    const paymentRecord = {
      userId: userId,
      courseIds: enrolledCourses,
      ...paymentDetails,
      status: 'completed',
      paymentDate: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    await addDoc(paymentsRef, paymentRecord);
    
    return { 
      success: true, 
      message: "Payment processed successfully",
      enrolledCourses: enrolledCourses
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
            
            const modules = courseData.modules?.map((module, index) => ({
              ...module,
              id: module.id || `module_${index + 1}`
            })) || [];
            
            // Get progress for this course
            const progressData = await getCourseProgress(userId, enrollment.courseId);
            
            // Get user's review for this course
            const userReview = await getUserReview(userId, enrollment.courseId);
            
            return {
              id: enrollment.courseId,
              ...courseData,
              modules,
              enrollmentId: enrollment.id,
              enrolledAt: enrollment.enrolledAt,
              completed: enrollment.completed || false,
              progress: progressData.progress || 0,
              completedModules: progressData.completedModules || [],
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
      !course.completed && (course.progress > 0 || course.completedModules?.length > 0)
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

// Get user's cart items
export const getUserCartItems = async (userId) => {
  try {
    const cartRef = collection(db, "cart");
    const q = query(cartRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const cartItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return cartItems;
  } catch (error) {
    console.error("Error getting user cart items:", error);
    return [];
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
  markModuleComplete,
  submitCourseReview,
  getUserReview,
  getUserReviews,
  deleteReview,
  generateCertificate,
  verifyPaymeePayment,
  handlePaymentSuccess,
  getDashboardStats,
  getUserCartItems
};