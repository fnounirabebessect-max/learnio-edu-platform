// src/config/paymee.js - V2 CONFIG
const PAYMEE_CONFIG = {
  // v2 uses only API_TOKEN (no VENDOR_ID needed)
  API_TOKEN: process.env.REACT_APP_PAYMEE_API_TOKEN || '',
  
  // v2 API endpoints
  BASE_URL: process.env.REACT_APP_PAYMEE_BASE_URL || 'https://sandbox.paymee.tn/api/v2',
  
  // Your Firebase Hosting URLs (HTTPS!)
  SUCCESS_URL: 'https://learnio-edu-platform.web.app/payment/success',
  CANCEL_URL: 'https://learnio-edu-platform.web.app/payment/cancel',
  
  // Webhook URL (Firebase Cloud Functions - we'll set this up)
  WEBHOOK_URL: process.env.REACT_APP_PAYMEE_WEBHOOK_URL || '',
};

// Validate
if (!PAYMEE_CONFIG.API_TOKEN) {
  console.warn('⚠️ Paymee API Token missing');
}

export default PAYMEE_CONFIG;