import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";
import "./Login.css";

const Login = () => {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Incorrect email or password.");
      console.error(err);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== 'auth/cancelled-popup-request' && 
          err.code !== 'auth/popup-closed-by-user') {
        setError("Google sign-in failed. Please try again.");
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
            Welcome Back to <span className="brand-highlight">Learnio</span>
          </h1>
          <p className="auth-hero-subtitle">
            Continue your learning journey with access to thousands of courses, expert instructors, and a community of passionate learners.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="feature-icon">🎓</span>
              <span>Access 200+ Courses</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">👨‍🏫</span>
              <span>Learn from Experts</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">📜</span>
              <span>Earn Certificates</span>
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <Card className="auth-card-full">
            <h2 className="auth-form-title">Login to Your Account</h2>
            
            <form onSubmit={handleLogin} className="auth-form-full">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input-full"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                    Login to Learnio
                  </Button>
                  
                  <div className="auth-divider">
                    <span>or continue with</span>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleGoogleSignIn}
                    className="auth-btn-google"
                  >
                    <span className="google-icon">🔍</span>
                    Sign in with Google
                  </Button>
                </>
              )}
            </form>

            <div className="auth-links-full">
              <p className="auth-switch-full">
                New to Learnio? <Link to="/signup" className="auth-link-highlight">Create an account</Link>
              </p>
              <p className="auth-switch-full">
                <Link to="/forgot-password" className="auth-link">Forgot your password?</Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;