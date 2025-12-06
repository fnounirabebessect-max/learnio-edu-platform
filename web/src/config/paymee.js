// src/config/paymee.js
const PAYMEE_CONFIG = {
  API_TOKEN: process.env.REACT_APP_PAYMEE_API_TOKEN,
  VENDOR_ID: process.env.REACT_APP_PAYMEE_VENDOR_ID,
  BASE_URL: process.env.REACT_APP_PAYMEE_BASE_URL || 'https://sandbox.paymee.tn/api/v2',
  SUCCESS_URL: `${window.location.origin}/payment/success`,
  FAILURE_URL: `${window.location.origin}/payment/failure`,
  CANCEL_URL: `${window.location.origin}/payment/cancel`,
  WEBHOOK_URL: `${window.location.origin}/api/webhook/paymee`
};

export default PAYMEE_CONFIG;