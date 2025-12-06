// src/pages/payment/PaymentFailure.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentPages.css';

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="error-icon">❌</div>
        <h2>Payment Failed</h2>
        <p>Your payment was not completed successfully.</p>
        <p>Please try again or contact support if the issue persists.</p>
        <div className="payment-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/courses')}
          >
            Back to Courses
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}