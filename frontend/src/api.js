// api.js - Updated to work with backend API and Firebase Auth
import { auth } from './firebase-config';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get Firebase ID token for authenticated requests
  let idToken = null;
  const currentUser = auth.currentUser;
  if (currentUser) {
    idToken = await currentUser.getIdToken();
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add Authorization header if user is authenticated
  if (idToken) {
    config.headers['Authorization'] = `Bearer ${idToken}`;
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    let data;
    const responseText = await response.text();
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error(`Server returned invalid JSON: ${response.status}`);
    }
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (data.success === false) {
      const errorMessage = data.error || data.message || 'Request failed';
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    
    if (error.name === 'TypeError') {
      throw new Error('Network error. Please check your connection and ensure the server is running.');
    }
    
    throw error;
  }
}

// Utility functions
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getUserData = () => {
  const user = auth.currentUser;
  if (user) {
    return {
      id: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL
    };
  }
  return null;
};

// Enhanced error handler
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  let userFriendlyMessage = error.message;
  
  if (error.message.includes('Movie ID or Title is required')) {
    userFriendlyMessage = 'Please select a movie first.';
  } else if (error.message.includes('Rating must be between 1 and 5')) {
    userFriendlyMessage = 'Please select a rating between 1 and 5 stars.';
  } else if (error.message.includes('Comment is required')) {
    userFriendlyMessage = 'Please write a comment for your review.';
  } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
    userFriendlyMessage = 'Unable to connect to server. Please check your connection and try again.';
  } else if (error.message.includes('401') || error.message.includes('Authentication required')) {
    userFriendlyMessage = 'Your session has expired. Please log in again.';
  } else if (error.message.includes('403') || error.message.includes('Not authorized')) {
    userFriendlyMessage = 'You are not authorized to perform this action.';
  } else if (error.message.includes('404') || error.message.includes('not found')) {
    userFriendlyMessage = 'The requested resource was not found.';
  }
  
  return userFriendlyMessage;
};

// Movies API
export const moviesAPI = {
  getAllMovies: async () => {
    return apiCall('/movies');
  },

  searchMovies: async (query) => {
    return apiCall(`/movies/search?query=${encodeURIComponent(query)}`);
  },

  getMovieDetails: async (movieId) => {
    return apiCall(`/movies/${movieId}`);
  }
};

// Reviews API - Now fully handled by backend with Firebase Auth
export const reviewsAPI = {
  getAllReviews: async () => {
    return apiCall('/reviews');
  },

  getMyReviews: async () => {
    return apiCall('/my-reviews');
  },

  createReview: async (reviewData) => {
    return apiCall('/reviews', {
      method: 'POST',
      body: reviewData
    });
  },

  updateReview: async (reviewId, reviewData) => {
    return apiCall(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: reviewData
    });
  },

  deleteReview: async (reviewId) => {
    return apiCall(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  },
};

export default {
  movies: moviesAPI,
  reviews: reviewsAPI,
  utils: {
    isAuthenticated,
    getCurrentUser,
    getUserData,
    handleAPIError,
  },
};