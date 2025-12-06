// src/pages/payment/PaymentCancel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentPages.css';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="warning-icon">⚠️</div>
        <h2>Payment Cancelled</h2>
        <p>Your payment was cancelled.</p>
        <p>No charges were made to your account.</p>
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