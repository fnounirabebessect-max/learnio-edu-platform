// src/api/payment.js - CLEAN WORKING VERSION
import axios from 'axios';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { sendPaymentEmail } from './email';

// Paymee Configuration
const PAYMEE_CONFIG = {
  VENDOR_ID: process.env.REACT_APP_PAYMEE_VENDOR_ID,
  API_KEY: process.env.REACT_APP_PAYMEE_API_KEY || process.env.REACT_APP_PAYMEE_API_TOKEN,
  BASE_URL: 'https://paymee.tn/api/v1',
  SUCCESS_URL: `${window.location.origin}/payment/success`,
  CANCEL_URL: `${window.location.origin}/payment/cancel`,
  FAILURE_URL: `${window.location.origin}/payment/failure`
};

// Validate configuration
export const validatePaymeeConfig = () => {
  const errors = [];
  if (!PAYMEE_CONFIG.VENDOR_ID) errors.push('PAYMEE_VENDOR_ID missing');
  if (!PAYMEE_CONFIG.API_KEY) errors.push('PAYMEE_API_KEY missing');
  return { isValid: errors.length === 0, errors };
};

// Generate unique order ID
const generateOrderId = () => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
};

/**
 * STEP 1: Initialize Payment
 * Creates transaction in Firestore and redirects to Paymee
 */
// src/api/payment.js - ONLY REPLACE THE initPaymeePayment FUNCTION

export const initPaymeePayment = async (paymentData) => {
  try {
    const { userId, cartItems, amount, userEmail, userName } = paymentData;

    // Validation
    if (!userId || !cartItems?.length || amount <= 0) {
      throw new Error('Invalid payment data');
    }

    // Generate order ID
    const orderId = generateOrderId();
    
    // Prepare course data
    const courseIds = cartItems.map(item => item.id);
    const courseNames = cartItems.map(item => item.title || 'Course').join(', ');

    console.log('💳 Creating payment transaction:', { orderId, userId, amount });

    // Create transaction in Firestore FIRST
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      orderId,
      userId,
      courseIds,
      courseNames,
      cartItems: cartItems.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price
      })),
      totalAmount: parseFloat(amount),
      currency: 'DT',
      status: 'pending',
      userEmail,
      userName: userName || userEmail.split('@')[0],
      createdAt: serverTimestamp(),
      paymentMethod: 'paymee',
      type: 'course_purchase'
    });

    console.log('✅ Transaction created in Firestore:', transactionRef.id);

    // ============================================
    // CHANGED: Call Vercel API instead of Paymee directly
    // ============================================
    console.log('📡 Calling Vercel payment API...');

    const response = await axios.post(
      '/api/create-payment',  // ← Your Vercel endpoint (no CORS!)
      {
        orderId,
        userId,
        amount: parseFloat(amount).toFixed(2),
        userEmail,
        userName: userName || userEmail.split('@')[0],
        courseNames
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    // Validate response
    if (!response.data?.paymentUrl) {
      console.error('Invalid API response:', response.data);
      throw new Error('Invalid response from payment API');
    }

    console.log('✅ Payment URL received:', response.data.paymentUrl);

    // Update transaction with payment URL
    await updateDoc(doc(db, 'transactions', transactionRef.id), {
      paymentUrl: response.data.paymentUrl,
      paymeeToken: response.data.token || null
    });

    return {
      success: true,
      paymentUrl: response.data.paymentUrl,
      orderId,
      transactionId: transactionRef.id
    };

  } catch (error) {
    console.error('❌ Payment initialization failed:', error);
    
    // User-friendly error messages
    let errorMessage = error.message;
    
    if (error.response?.status === 401) {
      errorMessage = 'Invalid payment credentials. Please contact support.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Payment service error. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }

    throw new Error(errorMessage);
  }
};

/**
 * STEP 2: Complete Payment After Callback
 * Verifies payment, enrolls user, and sends confirmation email
 */
export const completePaymentAndEnroll = async (orderId, userId) => {
  try {
    console.log('🔄 Processing payment completion:', { orderId, userId });

    // 1. Find transaction in Firestore
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('orderId', '==', orderId), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Transaction not found');
    }

    const transactionDoc = querySnapshot.docs[0];
    const transaction = transactionDoc.data();

    console.log('📋 Transaction found:', transaction);

    // Check if already completed
    if (transaction.status === 'completed') {
      console.log('ℹ️ Transaction already completed');
      return {
        success: true,
        orderId,
        amount: transaction.totalAmount,
        enrolledCourses: transaction.enrolledCourses || transaction.courseIds,
        message: 'Payment already processed'
      };
    }

    // 2. Enroll user in courses
    console.log('📚 Enrolling in courses:', transaction.courseIds);
    
    const { purchaseMultipleCourses } = await import('./course');
    
    const enrollmentResult = await purchaseMultipleCourses(
      userId,
      transaction.cartItems,
      {
        email: transaction.userEmail,
        displayName: transaction.userName,
        totalAmount: transaction.totalAmount,
        currency: 'DT'
      }
    );

    console.log('✅ Enrollment successful:', enrollmentResult);

    // 3. Update transaction status
    await updateDoc(transactionDoc.ref, {
      status: 'completed',
      completedAt: serverTimestamp(),
      enrolledCourses: enrollmentResult.enrolledCourses || transaction.courseIds,
      paymentCompletedAt: new Date().toISOString()
    });

    console.log('✅ Transaction updated to completed');

    // 4. Send confirmation email
    try {
      await sendPaymentEmail({
        orderId,
        userName: transaction.userName,
        userEmail: transaction.userEmail,
        courseNames: transaction.courseNames,
        amount: transaction.totalAmount,
        enrolledCourses: enrollmentResult.enrolledCourses || transaction.courseIds
      });
      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed (non-critical):', emailError);
      // Don't fail the whole process if email fails
    }

    return {
      success: true,
      orderId,
      amount: transaction.totalAmount,
      enrolledCourses: enrollmentResult.enrolledCourses || transaction.courseIds,
      courseNames: transaction.courseNames,
      message: 'Payment completed successfully'
    };

  } catch (error) {
    console.error('❌ Payment completion failed:', error);
    
    // Try to update transaction status to failed
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, where('orderId', '==', orderId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          status: 'failed',
          error: error.message,
          failedAt: serverTimestamp()
        });
      }
    } catch (updateError) {
      console.error('Failed to update transaction status:', updateError);
    }

    return {
      success: false,
      error: error.message,
      orderId
    };
  }
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (userId) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt
    })).sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export default {
  initPaymeePayment,
  completePaymentAndEnroll,
  getUserTransactions,
  validatePaymeeConfig
};