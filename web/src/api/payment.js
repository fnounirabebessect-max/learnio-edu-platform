// src/api/payment.js - PRODUCTION READY
import axios from 'axios';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Configuration
const PAYMEE_CONFIG = {
  API_TOKEN: process.env.REACT_APP_PAYMEE_API_TOKEN || '',
  VENDOR_ID: process.env.REACT_APP_PAYMEE_VENDOR_ID || '',
  BASE_URL: process.env.REACT_APP_PAYMEE_BASE_URL || 'https://sandbox.paymee.tn/api/v1',
  SUCCESS_URL: process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_PAYMEE_SUCCESS_URL || 'https://learnio-platform.vercel.app/payment/success')
    : 'http://localhost:3000/payment/success',
  CANCEL_URL: process.env.NODE_ENV === 'production'
    ? (process.env.REACT_APP_PAYMEE_CANCEL_URL || 'https://learnio-platform.vercel.app/payment/cancel')
    : 'http://localhost:3000/payment/cancel',
};

// Generate unique order ID
const generateOrderId = () => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate configuration
export const validatePaymeeConfig = () => {
  const errors = [];
  
  if (!PAYMEE_CONFIG.API_TOKEN) errors.push('API_TOKEN missing');
  if (!PAYMEE_CONFIG.VENDOR_ID) errors.push('VENDOR_ID missing');
  
  return { isValid: errors.length === 0, errors };
};

// Initialize payment
export const initPaymeePayment = async (paymentData) => {
  try {
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Success URL: ${PAYMEE_CONFIG.SUCCESS_URL}`);
    
    const config = validatePaymeeConfig();
    if (!config.isValid) throw new Error(config.errors.join(', '));

    const { userId, cartItems, amount, userEmail, userName } = paymentData;
    const orderId = generateOrderId();
    
    // Prepare data
    const cleanUserName = userName || 'User';
    const cleanUserEmail = userEmail || 'user@example.com';
    const firstName = cleanUserName.split(' ')[0] || 'Client';
    const lastName = cleanUserName.split(' ')[1] || 'Learnio';
    const courseNames = cartItems?.slice(0, 2).map(item => item.title).join(', ') || 'Course';
    const courseIds = cartItems?.map(item => item.id) || [];
    
    // PRODUCTION-READY return URLs
    const returnUrl = `${PAYMEE_CONFIG.SUCCESS_URL}?order_id=${orderId}&user_id=${userId}&source=paymee`;
    const cancelUrl = `${PAYMEE_CONFIG.CANCEL_URL}?order_id=${orderId}`;
    
    console.log('🔗 Using return_url:', returnUrl);
    console.log('🔗 Using cancel_url:', cancelUrl);

    // Paymee payload
    const paymentPayload = {
      vendor: PAYMEE_CONFIG.VENDOR_ID,
      amount: parseFloat(amount).toFixed(2),
      note: `Learnio: ${courseNames}${cartItems?.length > 2 ? '...' : ''}`,
      first_name: firstName,
      last_name: lastName,
      email: cleanUserEmail,
      phone_number: '20000000',
      return_url: returnUrl,
      cancel_url: cancelUrl,
      order_id: orderId
    };

    // 1. Save to Firestore
    const paymentsRef = collection(db, 'payments');
    const paymentRecord = {
      userId,
      courseIds,
      totalAmount: parseFloat(amount),
      currency: 'TND',
      status: 'pending',
      orderId,
      userEmail: cleanUserEmail,
      userName: cleanUserName,
      returnUrl,
      createdAt: serverTimestamp()
    };

    const paymentDoc = await addDoc(paymentsRef, paymentRecord);
    const paymentId = paymentDoc.id;

    // 2. Save transaction
    const transactionRef = doc(db, 'transactions', orderId);
    await setDoc(transactionRef, {
      orderId,
      userId,
      courseIds,
      amount: parseFloat(amount),
      currency: 'TND',
      status: 'pending',
      paymentProvider: 'paymee',
      paymentId,
      userEmail: cleanUserEmail,
      userName: cleanUserName,
      returnUrl,
      createdAt: serverTimestamp()
    });

    // 3. Backup to localStorage (for development only)
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('paymeePendingOrder', JSON.stringify({
        orderId, userId, amount, courseIds,
        timestamp: new Date().toISOString()
      }));
    }

    // 4. Call Paymee API
    console.log('📡 Calling Paymee API...');
    const response = await axios.post(
      `${PAYMEE_CONFIG.BASE_URL}/payments/create`,
      paymentPayload,
      {
        headers: {
          'Authorization': `Token ${PAYMEE_CONFIG.API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ Paymee response:', response.data);

    // Get payment URL
    let paymentUrl = response.data.payment_url || 
                    (response.data.data && response.data.data.payment_url);
    
    if (!paymentUrl && response.data.token) {
      paymentUrl = `https://sandbox.paymee.tn/gateway/${response.data.token}`;
    }

    if (!paymentUrl) throw new Error('No payment URL received');

    // Update with payment URL
    await setDoc(transactionRef, {
      paymentUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('🎉 Payment ready! URL:', paymentUrl);

    return {
      success: true,
      paymentUrl,
      orderId,
      paymentId,
      returnUrl
    };

  } catch (error) {
    console.error('❌ Payment error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Payment failed');
  }
};

// Complete payment
export const completePaymentAndEnroll = async (orderId, userId) => {
  try {
    console.log(`✅ Completing order ${orderId}`);

    // Get transaction
    const transactionRef = doc(db, 'transactions', orderId);
    const transactionDoc = await getDoc(transactionRef);
    
    if (!transactionDoc.exists()) {
      // Try development backup
      if (process.env.NODE_ENV === 'development') {
        const pending = localStorage.getItem('paymeePendingOrder');
        if (pending) {
          const data = JSON.parse(pending);
          if (data.orderId === orderId) {
            console.log('📦 Using development backup');
            await setDoc(transactionRef, {
              orderId,
              userId,
              courseIds: data.courseIds,
              amount: data.amount,
              status: 'completed',
              paidAt: serverTimestamp(),
              fromBackup: true
            });
            
            return await enrollUser(userId, data.courseIds, data.amount);
          }
        }
      }
      throw new Error(`Order ${orderId} not found`);
    }

    const data = transactionDoc.data();
    
    // Already completed?
    if (data.status === 'completed') {
      return {
        success: true,
        alreadyCompleted: true,
        orderId,
        message: 'Already processed'
      };
    }

    // Mark as completed
    await setDoc(transactionRef, {
      status: 'completed',
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update payment
    if (data.paymentId) {
      const paymentRef = doc(db, 'payments', data.paymentId);
      await setDoc(paymentRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // Enroll user
    if (data.courseIds?.length > 0) {
      return await enrollUser(userId, data.courseIds, data.amount);
    }

    return {
      success: true,
      orderId,
      message: 'Payment completed'
    };

  } catch (error) {
    console.error('❌ Completion error:', error);
    throw error;
  }
};

// Helper: Enroll user
const enrollUser = async (userId, courseIds, amount) => {
  try {
    const { purchaseMultipleCourses } = await import('./course');
    
    const cartItems = courseIds.map((id, index) => ({
      id,
      title: `Course ${index + 1}`,
      price: amount / courseIds.length
    }));

    const userData = {
      email: '',
      displayName: '',
      totalAmount: amount,
      currency: 'TND'
    };

    const result = await purchaseMultipleCourses(userId, cartItems, userData);
    
    return {
      success: true,
      enrolledCourses: result.enrolledCourses || courseIds,
      message: 'Enrollment successful'
    };
  } catch (error) {
    if (error.message.includes('Already enrolled')) {
      return {
        success: true,
        enrolledCourses: courseIds,
        message: 'Already enrolled'
      };
    }
    throw error;
  }
};

// Test connection
export const testPaymeeConnection = async () => {
  try {
    const testPayload = {
      vendor: PAYMEE_CONFIG.VENDOR_ID,
      amount: "1.00",
      note: "Connection test",
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      phone_number: "20000000",
      return_url: PAYMEE_CONFIG.SUCCESS_URL + "?test=true",
      cancel_url: PAYMEE_CONFIG.CANCEL_URL,
      order_id: `TEST_${Date.now()}`
    };

    const response = await axios.post(
      `${PAYMEE_CONFIG.BASE_URL}/payments/create`,
      testPayload,
      {
        headers: {
          'Authorization': `Token ${PAYMEE_CONFIG.API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { 
      success: true, 
      message: 'Connection successful',
      data: response.data 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || error.message 
    };
  }
};

export default {
  initPaymeePayment,
  completePaymentAndEnroll,
  testPaymeeConnection,
  validatePaymeeConfig
};
