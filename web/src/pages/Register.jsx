import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";
import "./Login.css";

const Signup = () => {
  const { register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPwd) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Signup failed. Try again.");
    }

    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== 'auth/cancelled-popup-request' && 
          err.code !== 'auth/popup-closed-by-user') {
        setError("Google sign-up failed. Please try again.");
        console.error(err);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Background Animation */}
      <div className="auth-background">
        <div className="bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="auth-container-full">
        <div className="auth-hero">
          <h1 className="auth-main-title">
            Join <span className="brand-highlight">Learnio</span> Today
          </h1>
          <p className="auth-hero-subtitle">
            Start your learning journey with access to thousands of courses, expert instructors, and a community of passionate learners.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="feature-icon">🚀</span>
              <span>Start Learning Instantly</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">💼</span>
              <span>Boost Your Career</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">🌍</span>
              <span>Join Global Community</span>
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <Card className="auth-card-full">
            <h2 className="auth-form-title">Create Your Account</h2>
            
            <form onSubmit={handleSignup} className="auth-form-full">
              <Input
                label="Email Address"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input-full"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input-full"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
                className="auth-input-full"
              />

              {error && <p className="auth-error-full">{error}</p>}
              
              {loading ? (
                <div className="auth-loader-container">
                  <Loader />
                </div>
              ) : (
                <>
                  <Button 
                    type="submit" 
                    className="auth-btn-primary"
                  >
                    Create Account
                  </Button>
                  
                  <div className="auth-divider">
                    <span>or sign up with</span>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleGoogleSignUp}
                    className="auth-btn-google"
                  >
                    <span className="google-icon">🔍</span>
                    Sign up with Google
                  </Button>
                </>
              )}
            </form>

            <div className="auth-links-full">
              <p className="auth-switch-full">
                Already have an account? <Link to="/login" className="auth-link-highlight">Login here</Link>
              </p>
              <p className="auth-terms">
                By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;