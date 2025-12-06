// src/pages/payment/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { handlePaymentSuccess, verifyPaymeePayment } from '../../api/course';
import './PaymentPages.css';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const orderId = params.get('order_id');

        if (!token || !orderId) {
          throw new Error('Invalid payment parameters');
        }

        // Verify payment with PayMe
        const paymentResult = await verifyPaymeePayment(token);
        
        if (paymentResult.status === 'paid') {
          // Handle successful payment
          const result = await handlePaymentSuccess(orderId, paymentResult);
          
          setSuccess(true);
          setCourseId(result.courseId);
          
          // Redirect to course after 5 seconds
          setTimeout(() => {
            navigate(`/courses/${result.courseId}`);
          }, 5000);
        } else {
          throw new Error('Payment not completed');
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <h2>Processing your payment...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we verify your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        {success ? (
          <>
            <div className="success-icon">✅</div>
            <h2>🎉 Payment Successful!</h2>
            <p>Your enrollment has been confirmed.</p>
            <p>A payment confirmation has been sent to your email.</p>
            <p>You will be redirected to the course in 5 seconds...</p>
            <div className="payment-actions">
              {courseId && (
                <button 
                  className="btn-primary"
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  Go to Course Now
                </button>
              )}
              <button 
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="error-icon">❌</div>
            <h2>Payment Failed</h2>
            <p>There was an issue processing your payment. Please try again.</p>
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
          </>
        )}
      </div>
    </div>
  );
}