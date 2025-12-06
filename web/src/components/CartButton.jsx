// src/components/CartButton.jsx
import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './CartButton.css';

export default function CartButton() {
  const { getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();
  const total = getTotal();
  
  return (
    <Link to="/cart" className="cart-button">
      <span className="cart-icon">🛒</span>
      {itemCount > 0 && (
        <span className="cart-badge">{itemCount}</span>
      )}
      {total > 0 && (
        <span className="cart-total">{total} DT</span>
      )}
    </Link>
  );
}