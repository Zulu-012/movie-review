// auth.js - Firebase Authentication service with email/password
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase-config';

class AuthService {
  constructor() {
    this.user = null;
    this.authStateListeners = [];
    this.initAuthStateListener();
  }

  initAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      
      if (user) {
        // Store/update user in Firestore
        await this.storeUserInFirestore(user);
        
        // Get complete user data from Firestore
        const userData = await this.getUserFromFirestore(user.uid);
        this.user = userData;
      } else {
        this.user = null;
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => {
        listener(this.user);
      });
    });
  }

  async storeUserInFirestore(firebaseUser) {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.photoURL || '',
        provider: 'email',
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Check if user already exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          displayName: firebaseUser.displayName || userDoc.data().displayName,
          photoURL: firebaseUser.photoURL || userDoc.data().photoURL
        });
        console.log('✅ User updated in Firestore:', firebaseUser.uid);
      } else {
        // Create new user
        await setDoc(userRef, userData);
        console.log('✅ New user stored in Firestore:', firebaseUser.uid);
      }
    } catch (error) {
      console.error('Error storing user in Firestore:', error);
    }
  }

  async getUserFromFirestore(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userData.uid,
          name: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
          provider: userData.provider,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      return null;
    }
  }

  onAuthStateChange(listener) {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  isAuthenticated() {
    return !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  async register(email, password, name) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update user profile with display name
      if (name) {
        await updateProfile(user, {
          displayName: name
        });
      }

      console.log('Registration successful:', user);
      
      // User will be stored in Firestore via auth state listener
      const userData = await this.getUserFromFirestore(user.uid);
      
      return {
        success: true,
        user: userData || {
          id: user.uid,
          name: name || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  }

  async login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      console.log('Login successful:', user);
      
      // User will be stored in Firestore via auth state listener
      const userData = await this.getUserFromFirestore(user.uid);
      
      return {
        success: true,
        user: userData || {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  }

  async logout() {
    try {
      await signOut(auth);
      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }
}

export const authService = new AuthService();