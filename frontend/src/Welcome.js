import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="welcome-container">
      <nav className="navbar welcome-navbar">
        <div className="nav-container">
          <div className="nav-brand">
            🎬 MovieReview Hub
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/register" className="nav-link">
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      <div className="welcome-background">
        <div className="welcome-overlay">
          <div className="welcome-content">
            <h1 className="welcome-title">🎬 MovieReview Hub</h1>
            <p className="welcome-subtitle">
              Discover, Review, and Share Your Favorite Movies
            </p>
            <p className="welcome-description">
              Join our community of movie enthusiasts. Rate films, write reviews, 
              and explore what others are watching.
            </p>
            
            <div className="welcome-buttons">
              <Link to="/login" className="welcome-btn primary">
                Sign In
              </Link>
              <Link to="/register" className="welcome-btn secondary">
                Create Account
              </Link>
            </div>

            <div className="welcome-features">
              <div className="feature">
                <span className="feature-icon">⭐</span>
                <h3>Rate Movies</h3>
                <p>Share your ratings from 1 to 5 stars</p>
              </div>
              <div className="feature">
                <span className="feature-icon">💬</span>
                <h3>Write Reviews</h3>
                <p>Express your thoughts and opinions</p>
              </div>
              <div className="feature">
                <span className="feature-icon">👥</span>
                <h3>Join Community</h3>
                <p>Connect with other movie lovers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;