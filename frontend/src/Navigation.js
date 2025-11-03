// Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/movies">🎬 MovieReview Hub</Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/movies" 
            className={`nav-link ${location.pathname === '/movies' ? 'active' : ''}`}
          >
            Movies
          </Link>
          <Link 
            to="/my-reviews" 
            className={`nav-link ${location.pathname === '/my-reviews' ? 'active' : ''}`}
          >
            My Reviews
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
          >
            About
          </Link>
          <div className="user-menu">
            <span className="user-greeting">Hello, {user?.name}</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;