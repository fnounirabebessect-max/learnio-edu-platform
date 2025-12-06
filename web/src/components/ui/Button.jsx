import React from "react";
import "./Button.css";

const Button = ({ children, onClick, type = "button", variant = "primary", disabled }) => {
  return (
    <button
      type={type}
      className={`btn-ui ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
