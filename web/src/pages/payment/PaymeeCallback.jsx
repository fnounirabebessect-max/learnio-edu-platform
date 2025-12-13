// src/pages/payment/PaymeeCallback.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentPages.css'; // Reuse the same CSS

export default function PaymeeCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('🔄 PAYMEE CALLBACK PAGE LOADED');
    
    // Capture ALL possible data from URL
    const fullUrl = window.location.href;
    const searchParams = location.search;
    const hashParams = location.hash;
    
    // Parse URL parameters
    const params = new URLSearchParams(searchParams);
    const allParams = {};
    
    // Get ALL parameters
    params.forEach((value, key) => {
      allParams[key] = value;
    });
    
    // Also check hash for parameters
    if (hashParams) {
      const hashParamsObj = new URLSearchParams(hashParams.replace('#', ''));
      hashParamsObj.forEach((value, key) => {
        allParams[`hash_${key}`] = value;
      });
    }
    
    // Debug information
    const debugData = {
      timestamp: new Date().toISOString(),
      fullUrl: fullUrl,
      searchParams: searchParams,
      hashParams: hashParams,
      allParams: allParams,
      location: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: location.state
      }
    };
    
    console.log('📊 DEBUG - All callback data:', debugData);
    setDebugInfo(JSON.stringify(debugData, null, 2));
    
    // Save to localStorage for recovery
    localStorage.setItem('paymeeCallbackDebug', JSON.stringify(debugData, null, 2));
    localStorage.setItem('lastPaymeeCallback', new Date().toISOString());
    
    // Try to extract important parameters
    const orderId = allParams.order_id || allParams.orderId || allParams.hash_order_id;
    const userId = allParams.user_id || allParams.userId || allParams.hash_user_id;
    const token = allParams.token || allParams.payment_token || allParams.hash_token;
    const status = allParams.status || allParams.payment_status || allParams.hash_status;
    
    console.log('🔍 Extracted parameters:', { orderId, userId, token, status });
    
    // Check for backup data in localStorage
    const pendingOrder = localStorage.getItem('paymeePendingOrder');
    if (pendingOrder) {
      console.log('📦 Found pending order in localStorage:', JSON.parse(pendingOrder));
    }
    
    // Determine where to redirect
    if (orderId && userId) {
      console.log('✅ Has orderId and userId, redirecting to success page');
      
      // Redirect to success page with ALL parameters
      const successUrl = `/payment/success?order_id=${orderId}&user_id=${userId}${
        token ? `&token=${token}` : ''
      }${
        status ? `&status=${status}` : ''
      }`;
      
      console.log('🔗 Redirecting to:', successUrl);
      navigate(successUrl);
      
    } else if (pendingOrder) {
      // Try to use localStorage backup
      console.log('⚠️ No URL parameters, using localStorage backup');
      const orderData = JSON.parse(pendingOrder);
      navigate(`/payment/success?order_id=${orderData.orderId}&user_id=${orderData.userId}&source=localStorage`);
      
    } else {
      // No data found, go to success page with debug info
      console.log('❌ No payment data found, redirecting with debug info');
      navigate('/payment/success', {
        state: {
          debug: true,
          callbackData: debugData,
          message: 'Payment completed but data not received'
        }
      });
    }
    
  }, [location, navigate]);

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="loading-spinner"></div>
        <h2>Processing Payment Return...</h2>
        <p>Please wait while we process your payment information.</p>
        <p className="loading-sub">Do not close or refresh this page.</p>
        
        <div className="debug-section">
          <details>
            <summary>Show Debug Information</summary>
            <div className="debug-content">
              <p><strong>URL:</strong> {window.location.href}</p>
              <p><strong>Parameters found:</strong></p>
              <pre style={{ fontSize: '12px', textAlign: 'left' }}>
                {debugInfo}
              </pre>
              
              <div className="debug-actions">
                <button 
                  className="btn-debug"
                  onClick={() => {
                    // Force redirect to success page
                    navigate('/payment/success', {
                      state: {
                        force: true,
                        debug: true,
                        callbackUrl: window.location.href
                      }
                    });
                  }}
                >
                  Force Continue to Success Page
                </button>
                
                <button 
                  className="btn-debug-secondary"
                  onClick={() => {
                    // Check localStorage
                    const pending = localStorage.getItem('paymeePendingOrder');
                    const callback = localStorage.getItem('paymeeCallbackDebug');
                    alert(
                      `LocalStorage Check:\n\n` +
                      `Pending Order: ${pending ? 'Found' : 'Not found'}\n` +
                      `Callback Debug: ${callback ? 'Found' : 'Not found'}`
                    );
                  }}
                >
                  Check LocalStorage
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}