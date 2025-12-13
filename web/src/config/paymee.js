// src/config/paymee.js
const PAYMEE_CONFIG = {
  // Required for v1
  API_TOKEN: process.env.REACT_APP_PAYMEE_API_TOKEN || '',
  VENDOR_ID: process.env.REACT_APP_PAYMEE_VENDOR_ID || '',
  
  // URLs
  BASE_URL: process.env.REACT_APP_PAYMEE_BASE_URL || 'https://sandbox.paymee.tn/api/v1',
  SUCCESS_URL: process.env.REACT_APP_PAYMEE_SUCCESS_URL || 'http://localhost:3000/payment/success',
  CANCEL_URL: process.env.REACT_APP_PAYMEE_CANCEL_URL || 'http://localhost:3000/payment/cancel',
};

// Log warnings if missing
if (!PAYMEE_CONFIG.API_TOKEN) {
  console.warn('⚠️ REACT_APP_PAYMEE_API_TOKEN is missing in .env.local');
}
if (!PAYMEE_CONFIG.VENDOR_ID) {
  console.warn('⚠️ REACT_APP_PAYMEE_VENDOR_ID is missing in .env.local');
}

export default PAYMEE_CONFIG;