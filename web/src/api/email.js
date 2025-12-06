// src/api/email.js
import axios from 'axios';

// Send payment confirmation email
export const sendPaymentEmail = async (emailData) => {
  try {
    const { 
      to, 
      userName, 
      courseName, 
      amount, 
      transactionId, 
      paymeeTransactionId 
    } = emailData;

    // In production, use your email service API
    // For now, we'll simulate sending an email
    console.log('Payment Email Details:', {
      to,
      subject: 'Reçu de paiement - Learnio',
      html: `
        <p>Bonjour ${userName},</p>
        <p>Merci pour votre achat : <strong>Achat cours: ${courseName}</strong>.</p>
        <p>Montant : ${amount} DT</p>
        <p>ID transaction Paymee : ${paymeeTransactionId}</p>
        <p>Vous pouvez maintenant accéder au cours dans votre espace étudiant.</p>
        <p>Transaction ID: ${transactionId}</p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};