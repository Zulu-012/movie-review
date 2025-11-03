// auth.js - Firebase Authentication utilities
import { auth as firebaseAuth, googleProvider } from './firebase-config';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

class AuthService {
  constructor() {
    this.user = null;
    this.initAuthStateListener();
  }

  initAuthStateListener() {
    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        this.user = {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL
        };
      } else {
        this.user = null;
      }
    });
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;

      this.user = {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL
      };

      return {
        success: true,
        user: this.user
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Google sign-in failed');
    }
  }

  async logout() {
    try {
      await signOut(firebaseAuth);
      this.user = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }
}

export const auth = new AuthService();