import React from 'react';
import { Link } from 'react-router-dom';
import { useFeatureTabs } from '../hooks/useFeatureTabs';
import './Home.css';
import heroGif from '../assets/learnio-hero.gif';

const Home = () => {
  useFeatureTabs(); // Initialize the tab functionality

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Learn, Grow, <span className="highlight">Succeed</span>
          </h1>
          <p className="hero-subtitle">
            Learnio is your gateway to excellence, offering high-quality courses taught by industry experts.
          </p>
          <Link to="/courses" className="cta-button">
            Explore Courses
          </Link>
        </div>
        <div className="hero-image">
                    <div className="placeholder-image">
            {/* Replace the cap emoji with your GIF */}
            <img 
              src={heroGif} 
              alt="Learnio Animation" 
              className="hero-gif"
            />
          </div>
        </div>
      </section>

      {/* SEPARATOR */}
      <div className="section-separator"></div>

      {/* ABOUT SECTION */}
      <section className="about-section">
        <div className="about-content">
          <h2>About Learnio</h2>
          <p>
            <strong>Learnio</strong> is an online learning platform that helps students and the general public 
            take various courses in a simple and enjoyable way. It allows you to discover lessons, 
            take quizzes, and earn certificates upon successful completion of courses. Payments are 
            processed easily and securely, giving everyone the opportunity to learn at their own pace.
          </p>
        </div>
      </section>

      {/* SEPARATOR */}
      <div className="section-separator"></div>

      {/* STATS SECTION */}
      <section className="stats-section">
        <h2>Learnio in Numbers</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">200+</div>
            <div className="stat-label">Available Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Enrolled Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Expert Instructors</div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - INTERACTIVE HORIZONTAL */}
      <section className="features-section">
        <div className="features-container">
          <h2>Why Choose Learnio?</h2>
          <div className="features-horizontal">
            <div className="feature-tabs">
              <div className="feature-tab active" data-tab="courses">
                <div className="tab-icon">📚</div>
                <span>Diverse Courses</span>
              </div>
              <div className="feature-tab" data-tab="instructors">
                <div className="tab-icon">🎯</div>
                <span>Expert Instructors</span>
              </div>
              <div className="feature-tab" data-tab="certified">
                <div className="tab-icon">🏆</div>
                <span>Get Certified</span>
              </div>
              <div className="feature-tab" data-tab="payments">
                <div className="tab-icon">💳</div>
                <span>Secure Payments</span>
              </div>
            </div>
            
            <div className="feature-content">
              <div className="content-item active" id="courses-content">
                <h3>Diverse Courses</h3>
                <p>From programming to design, business to personal development</p>
              </div>
              <div className="content-item" id="instructors-content">
                <h3>Expert Instructors</h3>
                <p>Learn from industry professionals with real-world experience</p>
              </div>
              <div className="content-item" id="certified-content">
                <h3>Get Certified</h3>
                <p>Earn certificates to showcase your skills and achievements</p>
              </div>
              <div className="content-item" id="payments-content">
                <h3>Secure Payments</h3>
                <p>Safe and easy payment processing for all courses</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;