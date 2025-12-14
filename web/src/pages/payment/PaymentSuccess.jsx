// src/pages/payment/PaymentSuccess.jsx - CLEAN VERSION
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { completePaymentAndEnroll } from '../../api/payment';
import './PaymentPages.css';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const processPaymentCompletion = async () => {
      try {
        // Get order ID and user ID from URL parameters
        const params = new URLSearchParams(location.search);
        const orderId = params.get('order_id');
        const userId = params.get('user_id');

        console.log('🔄 Payment callback received:', { orderId, userId });

        if (!orderId || !userId) {
          throw new Error('Missing payment information in callback');
        }

        // Complete payment and enroll user
        const paymentResult = await completePaymentAndEnroll(orderId, userId);
        
        setResult(paymentResult);

        // Auto-redirect to dashboard after success
        if (paymentResult.success) {
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                paymentSuccess: true,
                enrolledCourses: paymentResult.enrolledCourses,
                orderId
              }
            });
          }, 5000);
        }

      } catch (error) {
        console.error('❌ Payment completion error:', error);
        setResult({
          success: false,
          error: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure URL parameters are ready
    const timer = setTimeout(processPaymentCompletion, 500);
    return () => clearTimeout(timer);
    
  }, [location, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <h2>Processing Your Payment...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we finalize your enrollment.</p>
          <p className="loading-sub">This may take a few moments.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (result?.success) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <div className="success-icon">✅</div>
          <h2>🎉 Payment Successful!</h2>
          
          <div className="success-details">
            <p>Your payment has been processed successfully.</p>
            
            {result.enrolledCourses?.length > 0 && (
              <div className="enrolled-courses">
                <h3>📚 Enrolled Courses:</h3>
                <ul>
                  {result.enrolledCourses.map((courseId, index) => (
                    <li key={index}>
                      {result.courseNames?.split(', ')[index] || `Course ${index + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.amount && (
              <div className="payment-details">
                <p><strong>Order ID:</strong> {result.orderId}</p>
                <p><strong>Amount Paid:</strong> {result.amount} DT</p>
              </div>
            )}
            
            <div className="redirect-info">
              <p>✉️ A confirmation email has been sent to your inbox.</p>
              <p>Redirecting to dashboard in 5 seconds...</p>
            </div>
          </div>
          
          <div className="payment-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/courses')}
            >
              Browse More Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="error-icon">❌</div>
        <h2>Payment Processing Issue</h2>
        <p>{result?.error || 'An error occurred while processing your payment.'}</p>
        <p>Please check your dashboard or contact support if you were charged.</p>
        
        <div className="payment-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Check Dashboard
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/support')}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}