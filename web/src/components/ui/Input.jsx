import React from "react";
import "./Input.css";

const Input = ({ label, type = "text", placeholder, value, onChange, required }) => {
  return (
    <div className="input-group-ui">
      {label && <label>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default Input;
