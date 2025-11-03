import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from './auth';

const Login = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.login(formData.email, formData.password);
      if (result.success) {
        onAuthSuccess(result.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Welcome to MovieReview</h2>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className="auth-error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              className="auth-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-info">
          <p><strong>Secure Authentication:</strong> Your account information is stored securely in Firebase.</p>
          <p><strong>Data Privacy:</strong> We only store your basic profile information and movie reviews.</p>
        </div>

        <div className="auth-switch">
          <p>Don't have an account?</p>
          <Link to="/register" className="auth-switch-btn">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;