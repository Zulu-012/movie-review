// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './Welcome';
import Login from './Login';
import Register from './Register';
import Movies from './movies';
import MyReviews from './MyReviews';
import About from './About';
import Navigation from './Navigation';
import { isAuthenticated, getUserData } from './api'; // Fixed import
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUserData());
    }
    setIsAuthChecked(true);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  if (!isAuthChecked) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {user && <Navigation user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/movies" replace /> : <Welcome />
            } 
          />
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/movies" replace /> : 
              <Login onAuthSuccess={handleAuthSuccess} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/movies" replace /> : 
              <Register onAuthSuccess={handleAuthSuccess} />
            } 
          />
          <Route 
            path="/movies" 
            element={user ? <Movies /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/my-reviews" 
            element={user ? <MyReviews /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/about" 
            element={<About />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;