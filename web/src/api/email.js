// src/api/email.js - CLEAN EMAIL CONFIGURATION
import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Get these from: https://dashboard.emailjs.com/
const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_ru3h2ps',
  TEMPLATE_ID: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_t1lzgh9',
  PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'RU_fGxBoBMDb-NuU6'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

/**
 * Send payment confirmation email
 */
export const sendPaymentEmail = async (emailData) => {
  try {
    const { orderId, userName, userEmail, courseNames, amount, enrolledCourses } = emailData;
    
    console.log('📧 Sending confirmation email to:', userEmail);
    
    // Format course list
    const courseList = enrolledCourses?.map((courseId, index) => {
      const courseName = courseNames?.split(', ')[index] || `Course ${index + 1}`;
      return `• ${courseName}`;
    }).join('\n') || 'Enrolled courses';
    
    // Prepare email template parameters
    const templateParams = {
      to_email: userEmail,
      user_name: userName || userEmail.split('@')[0],
      order_id: orderId,
      order_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      amount: `${amount} DT`,
      course_list: courseList,
      dashboard_url: `${window.location.origin}/dashboard`
    };
    
    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );
    
    console.log('✅ Email sent successfully:', response);
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Log to Firestore for manual retry
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebase');
      
      await addDoc(collection(db, 'pending_emails'), {
        ...emailData,
        error: error.message,
        attemptedAt: serverTimestamp(),
        status: 'failed'
      });
      
      console.log('📝 Email failure logged to Firestore for retry');
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    // Don't throw - email failure shouldn't break payment flow
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmail = async (testEmail = 'your-email@gmail.com') => {
  try {
    const testData = {
      orderId: `TEST_${Date.now()}`,
      userName: 'Test User',
      userEmail: testEmail,
      courseNames: 'React Masterclass, Node.js Fundamentals',
      amount: 149.99,
      enrolledCourses: ['course_1', 'course_2']
    };
    
    console.log('🧪 Testing email with data:', testData);
    return await sendPaymentEmail(testData);
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendPaymentEmail,
  testEmail
};