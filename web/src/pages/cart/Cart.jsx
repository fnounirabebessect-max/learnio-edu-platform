// src/pages/cart/Cart.jsx
import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { purchaseMultipleCourses } from '../../api/course';
import { useAuth } from '../../context/authContext';
import './Cart.css';

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, getTotal } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const total = getTotal();
  
  const handleCheckout = async () => {
    if (!currentUser) {
      alert('Please log in to complete your purchase.');
      navigate('/login');
      return;
    }
    
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    // Prepare user data
    const userData = {
      email: currentUser.email,
      displayName: currentUser.displayName || currentUser.email.split('@')[0]
    };
    
    try {
      // Purchase all courses in cart
      const paymentResult = await purchaseMultipleCourses(
        currentUser.uid, 
        cartItems, 
        userData
      );
      
      // Clear cart after successful payment initiation
      clearCart();
      
      // Redirect to PayMe
      window.location.href = paymentResult.paymentUrl;
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error: ' + error.message);
    }
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h2>🛒 Your Cart is Empty</h2>
          <p>Add some courses to get started!</p>
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Shopping Cart</h1>
      <p className="cart-subtitle">Review your selected courses before checkout</p>
      
      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="cart-placeholder">
                      {item.title?.charAt(0) || 'C'}
                    </div>
                  )}
                </div>
                <div className="cart-item-details">
                  <h3 className="cart-item-title">{item.title}</h3>
                  <div className="cart-item-price">
                    {item.isFree ? (
                      <span className="price-free">FREE</span>
                    ) : (
                      <span className="price-paid">{item.price} DT</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className="cart-item-remove"
                onClick={() => removeFromCart(item.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2 className="summary-title">Order Summary</h2>
          
          <div className="summary-details">
            <div className="summary-row">
              <span>Items:</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{total} DT</span>
            </div>
            <div className="summary-row total-row">
              <span>Total:</span>
              <span className="cart-total-price">{total} DT</span>
            </div>
          </div>
          
          <div className="cart-actions">
            <button 
              className="btn-continue-shopping"
              onClick={() => navigate('/courses')}
            >
              ← Continue Shopping
            </button>
            
            <div className="checkout-section">
              <button 
                className="btn-clear-cart"
                onClick={clearCart}
              >
                Clear Cart
              </button>
              
              <button 
                className="btn-checkout"
                onClick={handleCheckout}
              >
                🛒 Finalize Purchase ({total} DT)
              </button>
            </div>
          </div>
          
          <div className="cart-security">
            <span className="security-icon">🔒</span>
            <span>Secure checkout • 30-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}