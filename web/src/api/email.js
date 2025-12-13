// src/api/email.js
export const sendPaymentEmail = async (emailData) => {
  try {
    // For now, log to console
    // In production, connect to SendGrid, Mailgun, etc.
    console.log('📧 Payment email details:', emailData);
    
    return { success: true, message: 'Email logged' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: error.message };
  }
};
