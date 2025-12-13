// src/pages/payment/PaymentSuccess.jsx - PRODUCTION READY
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { completePaymentAndEnroll } from '../../api/payment';
import './PaymentPages.css';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    console.log('✅ PaymentSuccess loaded');
    console.log('🔗 URL:', window.location.href);

    const process = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const urlOrderId = params.get('order_id');
        const urlUserId = params.get('user_id');
        const isTest = params.get('test');
        const source = params.get('source');

        console.log('📊 Parameters:', { urlOrderId, urlUserId, isTest, source });

        // TEST MODE
        if (isTest) {
          setOrderId(urlOrderId || 'TEST_ORDER');
          setSuccess(true);
          setMessage('Test payment successful!');
          setEnrolledCourses(['test_course_1', 'test_course_2']);
          setLoading(false);
          
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        // VALIDATE
        if (!urlOrderId || !urlUserId) {
          console.error('Missing order_id or user_id');
          
          // Check for common parameter variations
          const altOrderId = params.get('orderId') || params.get('OrderId');
          const altUserId = params.get('userId') || params.get('UserId');
          
          if (altOrderId && altUserId) {
            console.log('🔍 Found alternative parameter names');
            await completePayment(altOrderId, altUserId);
            return;
          }
          
          throw new Error('Payment information incomplete. Please check your dashboard.');
        }

        // PROCESS PAYMENT
        await completePayment(urlOrderId, urlUserId);

      } catch (error) {
        console.error('❌ Error:', error);
        setSuccess(false);
        setMessage(error.message || 'Payment processing failed');
        setLoading(false);
      }
    };

    const completePayment = async (orderId, userId) => {
      setOrderId(orderId);
      
      try {
        const result = await completePaymentAndEnroll(orderId, userId);
        
        console.log('🎉 Result:', result);
        
        setSuccess(true);
        setMessage(result.message || 'Payment successful!');
        setEnrolledCourses(result.enrolledCourses || []);
        
        // Clean localStorage
        localStorage.removeItem('paymeePendingOrder');
        
        // Auto-redirect
        setTimeout(() => {
          navigate('/dashboard', {
            state: {
              message: 'Payment Successful!',
              enrolledCourses: result.enrolledCourses || [],
              orderId
            }
          });
        }, 5000);
        
      } catch (error) {
        // Handle "already enrolled" as success
        if (error.message.includes('Already enrolled')) {
          setSuccess(true);
          setMessage('You are already enrolled in these courses.');
          setEnrolledCourses(['Courses already enrolled']);
          
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          throw error;
        }
      } finally {
        setLoading(false);
      }
    };

    process();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <h2>Processing Payment...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we complete your enrollment.</p>
          <p className="loading-sub">You will be redirected shortly.</p>
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
            <h2>Payment Successful!</h2>
            <p>{message}</p>
            
            {orderId && (
              <div className="order-info">
                <p><strong>Order ID:</strong> {orderId}</p>
              </div>
            )}
            
            {enrolledCourses.length > 0 && enrolledCourses[0] !== 'Courses already enrolled' && (
              <div className="courses-info">
                <p><strong>Enrolled in {enrolledCourses.length} course(s)</strong></p>
              </div>
            )}
            
            <p className="redirect-info">
              Redirecting to dashboard in 5 seconds...
            </p>
            
            <div className="payment-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard Now
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/courses')}
              >
                Browse Courses
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="error-icon">❌</div>
            <h2>Payment Issue</h2>
            <p>{message}</p>
            
            <div className="recovery-tips">
              <h3>What to do:</h3>
              <ol>
                <li>Check your dashboard - payment might be there</li>
                <li>Wait a few minutes and refresh</li>
                <li>Contact support with any error details</li>
              </ol>
            </div>
            
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
          </>
        )}
      </div>
    </div>
  );
}
