import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc 
} from 'firebase/firestore';

export const getDashboardStats = async (userId) => {
  try {
    console.log(`Fetching dashboard stats for user: ${userId}`);
    
    // 1. Get all enrollments for the user
    const enrollmentsRef = collection(db, "enrollments");
    const enrollmentsQuery = query(enrollmentsRef, where("userId", "==", userId));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    const enrollmentDocs = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${enrollmentDocs.length} enrollments`);
    
    if (enrollmentDocs.length === 0) {
      return {
        enrolledCourses: [],
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        averageProgress: 0,
        totalMinutes: 0
      };
    }
    
    // 2. Get details for each enrolled course
    const coursesWithDetails = [];
    
    for (const enrollment of enrollmentDocs) {
      try {
        // Get course details
        const courseRef = doc(db, "courses", enrollment.courseId);
        const courseSnap = await getDoc(courseRef);
        
        if (courseSnap.exists()) {
          const courseData = courseSnap.data();
          
          // Get progress for this course
          const progressRef = doc(db, "progress", `${userId}_${enrollment.courseId}`);
          const progressSnap = await getDoc(progressRef);
          const progress = progressSnap.exists() ? progressSnap.data().progress || 0 : 0;
          
          coursesWithDetails.push({
            id: courseSnap.id,
            ...courseData,
            enrollmentId: enrollment.id,
            enrolledAt: enrollment.enrolledAt || new Date().toISOString(),
            completed: enrollment.completed || false,
            progress: progress,
            lastAccessed: enrollment.lastAccessed || enrollment.enrolledAt
          });
        } else {
          console.log(`Course ${enrollment.courseId} not found in courses collection`);
        }
      } catch (courseError) {
        console.error(`Error fetching course ${enrollment.courseId}:`, courseError);
      }
    }
    
    console.log(`Successfully loaded ${coursesWithDetails.length} courses with details`);
    
    // 3. Calculate statistics
    const totalCourses = coursesWithDetails.length;
    const completedCourses = coursesWithDetails.filter(course => course.completed).length;
    const inProgressCourses = coursesWithDetails.filter(course => 
      !course.completed && course.progress > 0 && course.progress < 100
    ).length;
    
    const totalProgress = coursesWithDetails.reduce((sum, course) => sum + (course.progress || 0), 0);
    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
    
    const totalMinutes = coursesWithDetails.reduce((sum, course) => 
      sum + (course.duration || 0), 0
    );
    
    // Sort by most recently enrolled first
    const sortedCourses = [...coursesWithDetails].sort((a, b) => {
      const dateA = new Date(a.enrolledAt || 0);
      const dateB = new Date(b.enrolledAt || 0);
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

// Alternative simple function if you just want to get enrollments
export const getUserEnrollments = async (userId) => {
  try {
    const enrollmentsRef = collection(db, "enrollments");
    const q = query(enrollmentsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user enrollments:", error);
    return [];
  }
};