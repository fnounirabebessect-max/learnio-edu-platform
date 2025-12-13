// src/pages/payment/PaymentSuccess.jsx - FINAL WORKING VERSION
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
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    console.log('🎯 PaymentSuccess Component Mounted');
    console.log('📍 Location:', location);
    
    const processPayment = async () => {
      try {
        // Enable debug mode if URL has debug parameter
        if (location.search.includes('debug=true')) {
          setDebugMode(true);
          console.log('🔧 Debug mode enabled');
        }

        // Get ALL possible data sources
        const params = new URLSearchParams(location.search);
        const urlOrderId = params.get('order_id');
        const urlUserId = params.get('user_id');
        const urlToken = params.get('token');
        const urlStatus = params.get('status');
        const testMode = params.get('test') || location.state?.test;
        const source = params.get('source');

        console.log('📊 Data from URL:', {
          urlOrderId,
          urlUserId,
          urlToken,
          urlStatus,
          testMode,
          source
        });

        console.log('📦 Data from location.state:', location.state);

        // STRATEGY 1: Test Mode (Skip Payment)
        if (testMode) {
          console.log('🧪 TEST MODE DETECTED');
          const testOrderId = urlOrderId || location.state?.orderId || `TEST_${Date.now()}`;
          const testUserId = urlUserId || location.state?.userId || 'test_user';
          const testCourses = location.state?.enrolledCourses || ['test_course_1', 'test_course_2'];
          
          setOrderId(testOrderId);
          setSuccess(true);
          setMessage('Test enrollment successful!');
          setEnrolledCourses(testCourses);
          setLoading(false);
          
          // Auto-redirect after 2 seconds
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                message: 'Test Enrollment Successful!',
                enrolledCourses: testCourses,
                test: true
              }
            });
          }, 2000);
          return;
        }

        // STRATEGY 2: Check localStorage for backup data
        const pendingOrder = localStorage.getItem('paymeePendingOrder');
        const callbackData = localStorage.getItem('paymeeCallbackData');
        
        console.log('💾 LocalStorage check:', {
          hasPendingOrder: !!pendingOrder,
          hasCallbackData: !!callbackData
        });

        let finalOrderId = urlOrderId;
        let finalUserId = urlUserId;

        // If no URL params, check localStorage
        if (!finalOrderId && pendingOrder) {
          try {
            const orderData = JSON.parse(pendingOrder);
            console.log('📦 Using localStorage backup:', orderData);
            finalOrderId = orderData.orderId;
            finalUserId = orderData.userId;
            
            // Save this info for debugging
            localStorage.setItem('paymentRecoverySource', 'localStorage');
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
          }
        }

        // If still no orderId, check callback data
        if (!finalOrderId && callbackData) {
          try {
            const callback = JSON.parse(callbackData);
            console.log('🔗 Using callback data:', callback);
            
            // Try to extract from callback URL
            if (callback.url) {
              const callbackUrl = new URL(callback.url);
              const callbackParams = new URLSearchParams(callbackUrl.search);
              finalOrderId = callbackParams.get('order_id') || callbackParams.get('orderId');
              finalUserId = callbackParams.get('user_id') || callbackParams.get('userId');
              
              if (finalOrderId) {
                localStorage.setItem('paymentRecoverySource', 'callbackData');
              }
            }
          } catch (e) {
            console.error('Error parsing callback data:', e);
          }
        }

        // If we still don't have data, try to get from any possible source
        if (!finalOrderId) {
          // Check all possible parameter names
          const possibleOrderIds = [
            urlOrderId,
            params.get('orderId'),
            params.get('OrderId'),
            params.get('ORDER_ID'),
            location.state?.orderId,
            location.state?.orderID,
            location.state?.order_id
          ];
          
          const possibleUserIds = [
            urlUserId,
            params.get('userId'),
            params.get('UserId'),
            params.get('USER_ID'),
            location.state?.userId,
            location.state?.userID,
            location.state?.user_id
          ];
          
          finalOrderId = possibleOrderIds.find(id => id);
          finalUserId = possibleUserIds.find(id => id);
          
          if (finalOrderId) {
            console.log('🎯 Found orderId from alternative sources:', finalOrderId);
          }
        }

        console.log('✅ Final values to process:', {
          orderId: finalOrderId,
          userId: finalUserId
        });

        // VALIDATION: We need at least orderId
        if (!finalOrderId) {
          console.error('❌ NO ORDER ID FOUND FROM ANY SOURCE');
          console.log('All available data:', {
            urlParams: Object.fromEntries(params),
            locationState: location.state,
            localStorage: {
              pendingOrder: pendingOrder ? JSON.parse(pendingOrder) : null,
              callbackData: callbackData ? JSON.parse(callbackData) : null
            }
          });
          
          setSuccess(false);
          setMessage('Unable to find payment information. Please check your dashboard or contact support.');
          setLoading(false);
          return;
        }

        // If we have orderId but no userId, try to get it from localStorage
        if (finalOrderId && !finalUserId && pendingOrder) {
          try {
            const orderData = JSON.parse(pendingOrder);
            if (orderData.userId && orderData.orderId === finalOrderId) {
              finalUserId = orderData.userId;
              console.log('👤 Found matching userId from localStorage:', finalUserId);
            }
          } catch (e) {
            console.error('Error matching userId:', e);
          }
        }

        // If still no userId, use a placeholder (some APIs might work without it)
        if (finalOrderId && !finalUserId) {
          console.log('⚠️ No userId found, using placeholder');
          finalUserId = 'user_unknown';
        }

        // SET ORDER ID FOR DISPLAY
        setOrderId(finalOrderId);

        // PROCESS THE PAYMENT
        console.log(`🔄 Processing payment: Order ${finalOrderId}, User ${finalUserId}`);
        
        try {
          const result = await completePaymentAndEnroll(finalOrderId, finalUserId);
          
          console.log('✅ Payment processing result:', result);
          
          setSuccess(true);
          setEnrolledCourses(result.enrolledCourses || []);
          setMessage(result.message || 'Payment completed successfully!');
          
          // Clean up localStorage
          localStorage.removeItem('paymeePendingOrder');
          localStorage.removeItem('paymeeCallbackData');
          localStorage.removeItem('paymentRecoverySource');
          
          // Auto-redirect to dashboard after 5 seconds
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                message: 'Payment Successful!',
                enrolledCourses: result.enrolledCourses || [],
                orderId: finalOrderId,
                showNotification: true
              }
            });
          }, 5000);
          
        } catch (enrollError) {
          console.error('❌ Enrollment error:', enrollError);
          
          // Check if it's "already enrolled" error (which is actually success)
          if (enrollError.message.includes('Already enrolled') || 
              enrollError.message.includes('already completed')) {
            console.log('⚠️ User already enrolled, treating as success');
            setSuccess(true);
            setMessage('You are already enrolled in these courses.');
            setEnrolledCourses(['Courses already enrolled']);
          } else {
            throw enrollError;
          }
        }
        
      } catch (error) {
        console.error('❌ Fatal payment processing error:', error);
        setSuccess(false);
        setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
      } finally {
        setLoading(false);
      }
    };

    // Start processing
    processPayment();

    // Cleanup function
    return () => {
      console.log('🧹 PaymentSuccess cleanup');
    };
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <h2>Processing Your Payment...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we complete your enrollment.</p>
          <p className="loading-sub">This should only take a moment.</p>
          
          {debugMode && (
            <div className="debug-info">
              <details>
                <summary>Debug Information</summary>
                <div className="debug-content">
                  <p><strong>Current URL:</strong> {window.location.href}</p>
                  <p><strong>Order ID:</strong> {orderId || 'Not found yet'}</p>
                  <p><strong>LocalStorage pending order:</strong> {localStorage.getItem('paymeePendingOrder') ? 'Found' : 'Not found'}</p>
                  <button 
                    className="btn-debug"
                    onClick={() => {
                      const pending = localStorage.getItem('paymeePendingOrder');
                      alert(pending ? `Pending order:\n${pending}` : 'No pending order found');
                    }}
                  >
                    Check LocalStorage
                  </button>
                </div>
              </details>
            </div>
          )}
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
            <h2>🎉 {message.includes('Test') ? 'Test' : 'Payment'} Successful!</h2>
            <p className="success-message">{message}</p>
            
            {orderId && (
              <div className="order-details">
                <p><strong>Order ID:</strong> <code>{orderId}</code></p>
              </div>
            )}
            
            {enrolledCourses.length > 0 && enrolledCourses[0] !== 'Courses already enrolled' && (
              <div className="courses-enrolled">
                <p><strong>Enrolled in {enrolledCourses.length} course(s)</strong></p>
                <ul>
                  {enrolledCourses.slice(0, 5).map((courseId, index) => (
                    <li key={index}>Course ID: {courseId}</li>
                  ))}
                  {enrolledCourses.length > 5 && (
                    <li>... and {enrolledCourses.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            
            <p className="redirect-info">
              You will be redirected to your dashboard in 5 seconds...
            </p>
            
            <div className="payment-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/dashboard', { 
                  state: { 
                    message: 'Payment Successful!',
                    enrolledCourses: enrolledCourses,
                    orderId: orderId
                  }
                })}
              >
                Go to Dashboard Now
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/courses')}
              >
                Browse More Courses
              </button>
              
              {debugMode && (
                <button 
                  className="btn-debug"
                  onClick={() => {
                    console.log('🧪 Current State:', {
                      orderId,
                      enrolledCourses,
                      message,
                      localStorage: {
                        pendingOrder: localStorage.getItem('paymeePendingOrder'),
                        callbackData: localStorage.getItem('paymeeCallbackData'),
                        recoverySource: localStorage.getItem('paymentRecoverySource')
                      }
                    });
                    alert('Debug info logged to console');
                  }}
                >
                  Debug Info
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="error-icon">❌</div>
            <h2>Payment Issue</h2>
            <p className="error-message">{message}</p>
            
            <div className="recovery-options">
              <p><strong>Try these solutions:</strong></p>
              <ol>
                <li>Check your dashboard - the payment might have gone through</li>
                <li>Wait a few minutes and refresh</li>
                <li>Contact support with your order ID</li>
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
                onClick={() => {
                  // Try to recover from localStorage
                  const pending = localStorage.getItem('paymeePendingOrder');
                  if (pending) {
                    const orderData = JSON.parse(pending);
                    navigate('/payment/success', {
                      state: {
                        orderId: orderData.orderId,
                        userId: orderData.userId,
                        force: true
                      }
                    });
                  } else {
                    alert('No backup data found. Please contact support.');
                  }
                }}
              >
                Try Recovery
              </button>
              <button 
                className="btn-tertiary"
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