// src/api/payment.js
import axios from 'axios';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import PAYMEE_CONFIG from '../config/paymee';

// Generate unique order ID
const generateOrderId = () => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate PayMe configuration
const validateConfig = () => {
  if (!PAYMEE_CONFIG.API_TOKEN || PAYMEE_CONFIG.API_TOKEN === 'your_actual_api_token_here') {
    console.error('PayMe API token is not configured');
    return false;
  }
  if (!PAYMEE_CONFIG.VENDOR_ID || PAYMEE_CONFIG.VENDOR_ID === 'your_vendor_id_here') {
    console.error('PayMe Vendor ID is not configured');
    return false;
  }
  return true;
};

// Initialize PayMe payment
export const initPaymeePayment = async (paymentData) => {
  try {
    // Validate configuration first
    if (!validateConfig()) {
      throw new Error('PayMe configuration is incomplete. Please check your .env file.');
    }

    const { userId, courseId, courseName, amount, userEmail, userName } = paymentData;
    
    const orderId = generateOrderId();
    
    // Prepare payment payload
    const paymentPayload = {
      vendor: PAYMEE_CONFIG.VENDOR_ID,
      amount: parseFloat(amount).toFixed(2), // Ensure proper format
      note: `Achat cours: ${courseName}`,
      first_name: userName.split(' ')[0] || 'Client',
      last_name: userName.split(' ')[1] || 'Learnio',
      email: userEmail,
      phone_number: '20000000',
      return_url: `${PAYMEE_CONFIG.SUCCESS_URL}?order_id=${orderId}`,
      cancel_url: `${PAYMEE_CONFIG.CANCEL_URL}?order_id=${orderId}`,
      // Comment out webhook for now if not configured
      // webhook_url: PAYMEE_CONFIG.WEBHOOK_URL,
      order_id: orderId
    };

    console.log('Sending payload to PayMe:', {
      ...paymentPayload,
      API_TOKEN: PAYMEE_CONFIG.API_TOKEN ? 'Set' : 'Not set'
    });

    // Create transaction record in Firestore
    const transactionRef = doc(db, 'transactions', orderId);
    const transactionData = {
      orderId,
      userId,
      courseId,
      courseName,
      amount: parseFloat(amount),
      currency: 'TND',
      status: 'pending',
      paymentProvider: 'paymee',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paymentDetails: paymentPayload
    };
    
    await setDoc(transactionRef, transactionData);
    console.log('Transaction saved to Firestore:', orderId);

    // Call PayMe API
    const response = await axios.post(
      `${PAYMEE_CONFIG.BASE_URL}/payments/create`,
      paymentPayload,
      {
        headers: {
          'Authorization': `Token ${PAYMEE_CONFIG.API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('PayMe response:', response.data);

    if (response.data && response.data.payment_url) {
      // Update transaction with PayMe transaction ID
      await setDoc(transactionRef, {
        paymeeTransactionId: response.data.id || response.data.transactionId,
        transactionId: response.data.token,
        paymentUrl: response.data.payment_url,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        paymentUrl: response.data.payment_url,
        orderId: orderId,
        transactionId: response.data.token
      };
    }

    throw new Error('Failed to create payment: No payment URL received');
  } catch (error) {
    console.error('PayMe payment error:', error.response?.data || error.message);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid PayMe API credentials. Please check your API token and vendor ID.');
    } else if (error.response?.status === 400) {
      throw new Error(`Bad request to PayMe: ${JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('PayMe server timeout. Please try again.');
    }
    
    throw new Error(`Payment initialization failed: ${error.message}`);
  }
};

// Verify PayMe payment
export const verifyPaymeePayment = async (token) => {
  try {
    if (!validateConfig()) {
      throw new Error('PayMe configuration is incomplete');
    }

    const response = await axios.get(
      `${PAYMEE_CONFIG.BASE_URL}/payments/${token}/check`,
      {
        headers: {
          'Authorization': `Token ${PAYMEE_CONFIG.API_TOKEN}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    throw error;
  }
};

// Save transaction to Firestore
export const saveTransaction = async (transactionData) => {
  try {
    const { orderId, status, paidAt, receivedAmount, paymeeTransactionId } = transactionData;
    
    const transactionRef = doc(db, 'transactions', orderId);
    
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (paidAt) updateData.paidAt = paidAt;
    if (receivedAmount) updateData.receivedAmount = receivedAmount;
    if (paymeeTransactionId) updateData.paymeeTransactionId = paymeeTransactionId;
    
    await setDoc(transactionRef, updateData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Get user transactions
export const getUserTransactions = async (userId) => {
  try {
    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

// Test PayMe connection
export const testPaymeeConnection = async () => {
  try {
    if (!validateConfig()) {
      return { success: false, message: 'Configuration incomplete' };
    }

    const response = await axios.get(
      `${PAYMEE_CONFIG.BASE_URL}/ping`,
      {
        headers: {
          'Authorization': `Token ${PAYMEE_CONFIG.API_TOKEN}`
        }
      }
    );

    return { 
      success: true, 
      message: 'Connection successful',
      data: response.data 
    };
  } catch (error) {
    console.error('PayMe connection test failed:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message,
      status: error.response?.status 
    };
  }
};