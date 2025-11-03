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
import { authService } from './auth';
import { getUserData } from './api';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Get complete user data from Firestore
        const userData = await getUserData();
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsAuthChecked(true);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = async (userData) => {
    // Get fresh user data from Firestore
    const freshUserData = await getUserData();
    setUser(freshUserData || userData);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthChecked) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
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