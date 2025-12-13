// src/pages/checkout/Checkout.jsx - WITH TEST MODE
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { useCart } from '../../context/CartContext';
import { initPaymeePayment, validatePaymeeConfig } from '../../api/payment';
import './Checkout.css';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [configError, setConfigError] = useState('');
  const [testMode, setTestMode] = useState(false);
  
  useEffect(() => {
    // Validate PayMe configuration on component mount
    const configValidation = validatePaymeeConfig();
    if (!configValidation.isValid) {
      setConfigError(configValidation.errors.join(', '));
    }
    
    // Get cart items from location state
    const { cartItems: locationCartItems, totalAmount: locationTotalAmount } = location.state || {};
    
    if (!locationCartItems || locationCartItems.length === 0) {
      navigate('/cart');
      return;
    }
    
    if (!currentUser) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    setCartItems(locationCartItems);
    setTotalAmount(locationTotalAmount || 0);
    
    // Check URL for test mode
    const params = new URLSearchParams(location.search);
    if (params.get('test') === 'true') {
      setTestMode(true);
      console.log('🧪 TEST MODE ENABLED');
    }
  }, [location, currentUser, navigate]);
  
  const handlePaymeePayment = async () => {
    if (!currentUser) {
      alert('Please log in to continue.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      navigate('/cart');
      return;
    }
    
    // Check configuration
    const configValidation = validatePaymeeConfig();
    if (!configValidation.isValid) {
      alert(`PayMe configuration error: ${configValidation.errors.join(', ')}\n\nPlease check your .env file or contact administrator.`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare payment data
      const paymentData = {
        userId: currentUser.uid,
        cartItems: cartItems.map(item => ({
          id: item.id || '',
          title: item.title || 'Course',
          price: item.price || 0,
          instructor: item.instructor || '',
          image: item.image || ''
        })),
        amount: totalAmount,
        userEmail: currentUser.email || '',
        email: currentUser.email || '',
        userName: currentUser.displayName || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      };
      
      console.log('🚀 Initiating PayMe payment...');
      console.log('User:', currentUser.uid);
      console.log('Amount:', totalAmount);
      console.log('Items:', cartItems.length);
      console.log('Cart Items:', cartItems);
      
      // Call PayMe API
      const paymentResult = await initPaymeePayment(paymentData);
      
      if (paymentResult.success && paymentResult.paymentUrl) {
        console.log('✅ Payment initiated successfully');
        console.log('Order ID:', paymentResult.orderId);
        console.log('Payment URL:', paymentResult.paymentUrl);
        
        // Clear cart when payment is initiated
        clearCart();
        
        // Store order info in localStorage for backup
        localStorage.setItem('lastOrder', JSON.stringify({
          orderId: paymentResult.orderId,
          amount: totalAmount,
          timestamp: new Date().toISOString(),
          userId: currentUser.uid,
          cartItems: cartItems
        }));
        
        // Redirect to PayMe payment page
        console.log('🔗 Redirecting to Paymee...');
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error('Failed to create payment session. No payment URL received.');
      }
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      console.error('Error stack:', error.stack);
      
      let errorMessage = error.message;
      
      // Provide user-friendly error messages
      if (error.message.includes('API credentials')) {
        errorMessage = `
          PayMe API credentials are invalid or missing.
          
          Please ensure:
          1. You have valid PayMe API credentials
          2. They are correctly added to your .env.local file
          3. The server has been restarted after adding credentials
          
          Contact support if you need help with credentials.
        `;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'PayMe server is not responding. Please try again in a moment.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      alert(`Payment Error: ${errorMessage}`);
      setLoading(false);
    }
  };

  // NEW: Test enrollment without payment
  const handleTestEnrollment = async () => {
    if (!currentUser) {
      alert('Please log in to continue.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      navigate('/cart');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🧪 Starting test enrollment...');
      console.log('User:', currentUser.uid);
      console.log('Cart items:', cartItems);
      
      // Generate test order ID
      const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Import the course API
      const { purchaseMultipleCourses } = await import('../../api/course');
      
      // Prepare cart items
      const testCartItems = cartItems.map(item => ({
        id: item.id,
        title: item.title || 'Course',
        price: item.price || 0
      }));
      
      // Prepare user data
      const userData = {
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        totalAmount: totalAmount,
        currency: 'DT'
      };
      
      console.log('📚 Enrolling in courses...');
      console.log('Course IDs:', cartItems.map(item => item.id));
      
      // Call purchaseMultipleCourses directly (bypasses payment)
      const result = await purchaseMultipleCourses(
        currentUser.uid,
        testCartItems,
        userData
      );
      
      console.log('✅ Enrollment result:', result);
      
      // Clear cart
      clearCart();
      
      // Save to localStorage for debugging
      localStorage.setItem('lastTestEnrollment', JSON.stringify({
        orderId: orderId,
        userId: currentUser.uid,
        enrolledCourses: result.enrolledCourses,
        timestamp: new Date().toISOString(),
        result: result
      }));
      
      // Redirect to success page with test data
      navigate('/payment/success', {
        state: {
          test: true,
          orderId: orderId,
          userId: currentUser.uid,
          enrolledCourses: result.enrolledCourses || cartItems.map(item => item.id),
          message: 'Test enrollment successful!'
        }
      });
      
    } catch (error) {
      console.error('❌ Test enrollment failed:', error);
      console.error('Error details:', error.message);
      
      // Show detailed error
      alert(`Test Enrollment Failed:\n\n${error.message}\n\nCheck browser console for details.`);
      
      // Save error to localStorage for debugging
      localStorage.setItem('lastTestError', JSON.stringify({
        error: error.message,
        stack: error.stack,
        userId: currentUser?.uid,
        timestamp: new Date().toISOString(),
        cartItems: cartItems
      }));
      
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };
  
  const formatPrice = (price) => {
    return price % 1 === 0 ? price : price.toFixed(2);
  };
  
  // If still loading or redirecting, show loading
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-card">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
          <button 
            className="btn-back"
            onClick={() => navigate('/cart')}
          >
            ← Back to Cart
          </button>
        </div>
      </div>
    );
  }
  
  const displayTotal = totalAmount > 0 ? totalAmount : calculateTotal();
  const formattedTotal = formatPrice(displayTotal);
  
  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1 className="checkout-title">
          {testMode ? '🧪 Test Checkout Mode' : 'Secure Checkout'}
        </h1>
        
        {testMode && (
          <div className="test-mode-banner">
            <div className="test-icon">🧪</div>
            <div className="test-content">
              <h3>Test Mode Enabled</h3>
              <p>Payment is bypassed. Courses will be enrolled immediately.</p>
              <p className="test-warning">For development and testing only!</p>
            </div>
          </div>
        )}
        
        {/* Configuration error warning */}
        {configError && (
          <div className="config-error">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>PayMe Configuration Required</h3>
              <p>{configError}</p>
              <p className="error-instructions">
                To fix this, add your PayMe credentials to the <code>.env.local</code> file.
              </p>
            </div>
          </div>
        )}
        
        <div className="checkout-summary">
          <h2>
            <span className="summary-icon">📦</span>
            Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h2>
          <div className="order-items">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="order-item">
                <div className="order-item-details">
                  <span className="item-title">{item.title || 'Unnamed Course'}</span>
                  {item.instructor && (
                    <span className="item-instructor">by {item.instructor}</span>
                  )}
                </div>
                <span className="item-price">{formatPrice(item.price || 0)} DT</span>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <span>Total Amount:</span>
            <span className="total-amount">{formattedTotal} DT</span>
          </div>
        </div>
        
        <div className="user-info">
          <h2>
            <span className="user-icon">👤</span>
            Billing Information
          </h2>
          <div className="info-item">
            <span>Name:</span>
            <span className="user-value">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}</span>
          </div>
          <div className="info-item">
            <span>Email:</span>
            <span className="user-value">{currentUser?.email}</span>
          </div>
          <div className="info-item">
            <span>User ID:</span>
            <span className="user-value user-id">{currentUser?.uid}</span>
          </div>
        </div>
        
        <div className="payment-options">
          <h2>
            <span className="payment-icon">💳</span>
            Payment Method
          </h2>
          
          {testMode ? (
            <div className="test-payment-info">
              <div className="test-method-icon">🧪</div>
              <div className="test-method-info">
                <h3>Test Mode - No Payment Required</h3>
                <p>Courses will be enrolled immediately without payment processing.</p>
                <p className="test-note">Use this for testing the enrollment flow.</p>
              </div>
            </div>
          ) : (
            <div className="payment-methods">
              <div className="payment-method active">
                <div className="method-icon">
                  <img 
                    src="https://paymee.tn/images/logo.png" 
                    alt="PayMe" 
                    className="paymee-logo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = '🏦';
                    }}
                  />
                </div>
                <div className="method-info">
                  <h3>PayMe Payment Gateway</h3>
                  <p>Secure online payment - Cards, e-wallets, and mobile money</p>
                  <p className="method-note">You will be redirected to PayMe's secure payment page</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="payment-instructions">
            <div className="instruction-icon">ℹ️</div>
            <div className="instruction-content">
              <p><strong>Important:</strong> Do not close or refresh this page during payment. You will be automatically redirected back after payment completion.</p>
              <p className="instruction-small">Payment processing may take a few moments. A confirmation email will be sent upon successful payment.</p>
            </div>
          </div>
        </div>
        
        <div className="checkout-actions">
          <button 
            className="btn-back"
            onClick={() => navigate('/cart')}
            disabled={loading}
          >
            ← Back to Cart
          </button>
          
          <div className="payment-buttons">
            {testMode ? (
              // TEST MODE BUTTONS
              <>
                <button 
                  className="btn-test-enroll"
                  onClick={handleTestEnrollment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <span className="test-icon-small">🧪</span>
                      Test Enrollment ({formattedTotal} DT)
                    </>
                  )}
                </button>
                
                <button 
                  className="btn-switch-mode"
                  onClick={() => {
                    setTestMode(false);
                    navigate('/checkout', { state: { cartItems, totalAmount } });
                  }}
                >
                  Switch to Real Payment
                </button>
              </>
            ) : (
              // REAL PAYMENT BUTTONS
              <>
                <button 
                  className="btn-paymee"
                  onClick={handlePaymeePayment}
                  disabled={loading || configError}
                  title={configError ? 'Fix configuration to enable payment' : 'Proceed to PayMe payment'}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Connecting to PayMe...
                    </>
                  ) : configError ? (
                    <>
                      <span className="error-icon-small">⚠️</span>
                      Configuration Required
                    </>
                  ) : (
                    <>
                      <span className="pay-icon">💳</span>
                      Pay with PayMe ({formattedTotal} DT)
                    </>
                  )}
                </button>
                
                <button 
                  className="btn-test-mode"
                  onClick={() => {
                    setTestMode(true);
                    navigate('/checkout?test=true', { state: { cartItems, totalAmount } });
                  }}
                >
                  🧪 Enable Test Mode
                </button>
              </>
            )}
            
            <div className="payment-help">
              <p>Need help? <button 
                className="btn-help"
                onClick={() => alert('For payment issues, contact:\n\nSupport Email: support@learnio.com\nPayMe Support: support@paymee.tn\n\nPlease have your order ID ready.')}
              >
                Contact Support
              </button></p>
            </div>
          </div>
        </div>
        
        <div className="security-notice">
          <div className="security-icons">
            <span className="security-icon">🔒</span>
            <span className="security-icon">🛡️</span>
            <span className="security-icon">✅</span>
          </div>
          <div className="security-message">
            <p>256-bit SSL Encryption • PCI DSS Compliant • Secure Payment Processing</p>
            <p className="guarantee">30-day money-back guarantee • Instant course access after payment</p>
          </div>
        </div>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <details>
              <summary>Debug Information</summary>
              <div className="debug-content">
                <p><strong>User ID:</strong> {currentUser?.uid}</p>
                <p><strong>Items:</strong> {cartItems.length}</p>
                <p><strong>Total:</strong> {formattedTotal} DT</p>
                <p><strong>Test Mode:</strong> {testMode ? '✅ Enabled' : '❌ Disabled'}</p>
                <p><strong>Cart Items:</strong></p>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
                  {JSON.stringify(cartItems, null, 2)}
                </pre>
                <button 
                  className="btn-debug"
                  onClick={() => {
                    console.log('🧪 Debug Info:');
                    console.log('User:', currentUser);
                    console.log('Cart Items:', cartItems);
                    console.log('Total:', formattedTotal);
                    console.log('LocalStorage lastOrder:', localStorage.getItem('lastOrder'));
                    console.log('LocalStorage lastTestError:', localStorage.getItem('lastTestError'));
                    alert('Debug info logged to console. Check browser developer tools.');
                  }}
                >
                  Log Debug Info to Console
                </button>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}