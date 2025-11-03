// api.js - Updated to work with backend API and Firebase Firestore
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db, auth } from './firebase-config';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

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
  const user = auth.currentUser;
  return !!user;
};

export const getToken = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

export const removeToken = () => {
  // Handled by Firebase auth signOut
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

export const setUserData = (userData) => {
  // Handled by Firebase auth
};

// Enhanced error handler
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  let userFriendlyMessage = error.message;
  
  if (error.message.includes('Movie title, rating, and comment are required')) {
    userFriendlyMessage = 'Please fill in all required fields: movie title, rating, and comment.';
  } else if (error.message.includes('Movie ID or Title is required')) {
    userFriendlyMessage = 'Please select a movie first.';
  } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
    userFriendlyMessage = 'Unable to connect to server. Please check your connection and try again.';
  } else if (error.message.includes('401') || error.message.includes('Authentication required')) {
    userFriendlyMessage = 'Your session has expired. Please log in again.';
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

// Reviews API - Integrated with Backend + Firestore
export const reviewsAPI = {
  getAllReviews: async () => {
    // Get from Firestore directly
    try {
      const reviewsCollection = collection(db, 'reviews');
      const reviewsQuery = query(reviewsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(reviewsQuery);
      const reviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { reviews };
    } catch (error) {
      console.error('Firestore get reviews error:', error);
      throw new Error('Failed to fetch reviews from database');
    }
  },

  getMyReviews: async () => {
    // Get from Firestore with user filter
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const reviewsCollection = collection(db, 'reviews');
      const reviewsQuery = query(
        reviewsCollection, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(reviewsQuery);
      const reviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { reviews };
    } catch (error) {
      console.error('Firestore get my reviews error:', error);
      throw new Error('Failed to fetch your reviews');
    }
  },

  createReview: async (reviewData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      console.log('🎯 Sending review data to backend:', reviewData);

      // Get validated data from backend
      const backendResult = await apiCall('/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.uid}`
        },
        body: reviewData
      });

      console.log('✅ Backend response:', backendResult);

      // Save to Firestore with backend-validated data
      const reviewWithUser = {
        ...backendResult.review,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0]
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewWithUser);
      
      return {
        review: {
          id: docRef.id,
          ...reviewWithUser
        }
      };
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  },

  updateReview: async (reviewId, reviewData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Validate with backend
      const backendResult = await apiCall(`/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.uid}`
        },
        body: reviewData
      });

      // Update in Firestore
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, backendResult.updateData);

      return {
        review: {
          id: reviewId,
          ...reviewData,
          ...backendResult.updateData
        }
      };
    } catch (error) {
      console.error('Update review error:', error);
      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Verify with backend
      await apiCall(`/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.uid}`
        }
      });

      // Delete from Firestore
      await deleteDoc(doc(db, 'reviews', reviewId));

      return { success: true };
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    }
  },
};

export default {
  auth: {},
  movies: moviesAPI,
  reviews: reviewsAPI,
  utils: {
    isAuthenticated,
    getToken,
    removeToken,
    getUserData,
    setUserData,
    handleAPIError,
  },
};