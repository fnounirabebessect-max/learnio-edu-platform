// src/pages/checkout/Checkout.jsx - ULTRA CLEAN
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { useCart } from '../../context/CartContext';
import { initPaymeePayment } from '../../api/payment';
import './Checkout.css';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const { cartItems: items, totalAmount: total } = location.state || {};
    
    if (!items?.length) {
      navigate('/cart');
      return;
    }
    
    if (!currentUser) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    setCartItems(items);
    setTotalAmount(total || items.reduce((sum, item) => sum + (item.price || 0), 0));
  }, [location, currentUser, navigate]);

  const handlePayWithPaymee = async () => {
    try {
      setLoading(true);

      const paymentData = {
        userId: currentUser.uid,
        cartItems,
        amount: totalAmount,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0]
      };

      console.log('💳 Initiating Paymee payment...');
      const result = await initPaymeePayment(paymentData);

      if (result.success && result.paymentUrl) {
        console.log('✅ Redirecting to Paymee...');
        clearCart();
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('Payment initialization failed');
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      alert(`Payment Error: ${error.message}\n\nPlease try again or contact support.`);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price % 1 === 0 ? price : price.toFixed(2);
  };

  if (!cartItems.length) {
    return (
      <div className="checkout-container">
        <div className="checkout-card">
          <div className="loading-spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1 className="checkout-title">Checkout</h1>
        
        {/* Order Summary */}
        <div className="checkout-summary">
          <h2>
            <span className="summary-icon">📦</span>
            Order Summary
          </h2>
          
          <div className="order-items">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="order-item">
                <div className="order-item-details">
                  <span className="item-title">{item.title || 'Course'}</span>
                  {item.instructor && (
                    <span className="item-instructor">by {item.instructor}</span>
                  )}
                </div>
                <span className="item-price">{formatPrice(item.price || 0)} DT</span>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <span>Total:</span>
            <span className="total-amount">{formatPrice(totalAmount)} DT</span>
          </div>
        </div>
        
        {/* Payment Button */}
        <div className="checkout-actions">
          <button 
            className="btn-back"
            onClick={() => navigate('/cart')}
            disabled={loading}
          >
            ← Back to Cart
          </button>
          
          <button 
            className="btn-pay-with-paymee"
            onClick={handlePayWithPaymee}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Processing...
              </>
            ) : (
              <>
                <span className="pay-icon">💳</span>
                Pay with Paymee - {formatPrice(totalAmount)} DT
              </>
            )}
          </button>
        </div>
        
        {/* Security Badge */}
        <div className="security-notice">
          <div className="security-icons">
            <span className="security-icon">🔒</span>
            <span className="security-icon">🛡️</span>
            <span className="security-icon">✅</span>
          </div>
          <p>Secure Payment • SSL Encrypted • PCI Compliant</p>
        </div>
      </div>
    </div>
  );
}