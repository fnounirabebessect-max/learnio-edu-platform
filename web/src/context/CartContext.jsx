// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const CartContext = createContext(null);

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  
  // Load cart from localStorage on start
  useEffect(() => {
    const savedCart = localStorage.getItem('learnio_shopping_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('learnio_shopping_cart');
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('learnio_shopping_cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  // Add course to cart
  const addToCart = (course) => {
    // Check if already in cart
    if (!cartItems.find(item => item.id === course.id)) {
      const newCartItem = {
        id: course.id,
        title: course.title,
        price: course.price || 0,
        image: course.image || course.thumbnailUrl,
        isFree: course.isFree || false
      };
      
      setCartItems([...cartItems, newCartItem]);
      return true;
    }
    return false;
  };
  
  // Remove course from cart
  const removeFromCart = (courseId) => {
    setCartItems(cartItems.filter(item => item.id !== courseId));
  };
  
  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('learnio_shopping_cart');
  };
  
  // Calculate total price
  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.isFree ? 0 : item.price), 0);
  };
  
  // Count items
  const getItemCount = () => cartItems.length;
  
  // Check if course is in cart
  const isInCart = (courseId) => {
    return cartItems.some(item => item.id === courseId);
  };
  
  // Value object to be provided
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getTotal,
    getItemCount,
    isInCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};