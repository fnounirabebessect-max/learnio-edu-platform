// functions/index.js - Firebase Cloud Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({origin: true});

admin.initializeApp();

/**
 * Cloud Function: Create Paymee Payment
 * This proxies the Paymee API call to avoid CORS issues
 */
exports.createPaymeePayment = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const {
        orderId,
        userId,
        amount,
        firstName,
        lastName,
        email,
        phone,
        note,
        returnUrl,
        cancelUrl,
        failUrl
      } = req.body;

      // Validate required fields
      if (!orderId || !userId || !amount || !email) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['orderId', 'userId', 'amount', 'email']
        });
      }

      // Get Paymee credentials from environment
      const PAYMEE_VENDOR_ID = functions.config().paymee.vendor_id;
      const PAYMEE_API_KEY = functions.config().paymee.api_key;

      if (!PAYMEE_VENDOR_ID || !PAYMEE_API_KEY) {
        console.error('Paymee credentials not configured');
        return res.status(500).json({ 
          error: 'Payment gateway not configured' 
        });
      }

      // Prepare Paymee payload
      const paymeePayload = {
        vendor: PAYMEE_VENDOR_ID,
        amount: parseFloat(amount).toFixed(2),
        note: note || `Learnio Order ${orderId}`,
        first_name: firstName || 'User',
        last_name: lastName || 'Learnio',
        email: email,
        phone: phone || '+21620000000',
        order_id: orderId,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        fail_url: failUrl
      };

      console.log('Calling Paymee API for order:', orderId);

      // Call Paymee API
      const response = await axios.post(
        'https://paymee.tn/api/v1/createPayment',
        paymeePayload,
        {
          headers: {
            'Authorization': PAYMEE_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Paymee response received:', response.data);

      // Check if payment URL exists
      if (response.data && response.data.payment_url) {
        return res.status(200).json({
          success: true,
          payment_url: response.data.payment_url,
          token: response.data.token,
          orderId: orderId
        });
      } else {
        throw new Error('No payment URL in response');
      }

    } catch (error) {
      console.error('Paymee API Error:', error);
      
      // Handle different error types
      let errorMessage = 'Payment initialization failed';
      let statusCode = 500;

      if (error.response) {
        // Paymee API returned an error
        statusCode = error.response.status;
        errorMessage = error.response.data?.message || error.response.statusText;
        console.error('Paymee error response:', error.response.data);
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Payment gateway timeout';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  });
});

/**
 * Cloud Function: Verify Paymee Payment (Optional)
 * Use this to verify payment status with Paymee
 */
exports.verifyPaymeePayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      const PAYMEE_API_KEY = functions.config().paymee.api_key;

      const response = await axios.get(
        `https://paymee.tn/api/v1/payments/${token}/check`,
        {
          headers: {
            'Authorization': PAYMEE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.status(200).json({
        success: true,
        data: response.data
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});