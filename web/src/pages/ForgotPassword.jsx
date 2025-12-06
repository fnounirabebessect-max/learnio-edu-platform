import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Link } from "react-router-dom";

import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";

import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      setMessage({
        type: "success",
        text: "A reset link has been sent to your email ✔",
      });

      setEmail("");
    } catch (error) {
      console.error(error);

      let msg = "An error occurred. Please try again.";

      if (error.code === "auth/user-not-found") {
        msg = "No account found with this email.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Invalid email address.";
      }

      setMessage({
        type: "error",
        text: msg,
      });
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <Card title="Reset your password 🔒">
        <p className="forgot-subtitle">
          Enter your email and we will send you a reset link.
        </p>

        {message && (
          <p className={`auth-message ${message.type}`}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleReset}>
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {loading ? (
            <Loader />
          ) : (
            <Button type="submit">Send Reset Email</Button>
          )}
        </form>

        <p className="auth-switch">
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;
