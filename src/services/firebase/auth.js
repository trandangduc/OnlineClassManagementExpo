import { database } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const generateUID = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const hashPassword = async (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }

  return Math.abs(hash).toString();
};

export const authService = {
  signIn: async (email, password) => {
    try {
      const hashedPassword = await hashPassword(password);
      const emailLower = email.toLowerCase().trim();
      
      const snapshot = await database.ref('users')
        .orderByChild('email')
        .equalTo(emailLower)
        .once('value');
      
      if (!snapshot.exists()) {
        throw new Error('Không tìm thấy tài khoản với email này');
      }
      
      const users = snapshot.val();
      const userKey = Object.keys(users)[0];
      const userData = users[userKey];
      
      if (userData.password !== hashedPassword) {
        throw new Error('Mật khẩu không chính xác');
      }
      
      if (userData.isActive === false) {
        throw new Error('Tài khoản đã bị khóa');
      }
      
      await database.ref(`users/${userKey}`).update({
        lastLogin: new Date().toISOString()
      });
      
      const userResult = { ...userData, uid: userKey };
      delete userResult.password;
      
      return { user: userResult };
      
    } catch (error) {
      console.error('Sign in error:', error);
    }
  },

  signUp: async (email, password, role = 'student', profileData = {}) => {
    try {
      const emailLower = email.toLowerCase().trim();
      
      const existingUser = await database.ref('users')
        .orderByChild('email')
        .equalTo(emailLower)
        .once('value');
      
      if (existingUser.exists()) {
        throw new Error('Email này đã được sử dụng');
      }
      
      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc');
      }
      
      if (password.length < 6) {
        throw new Error('Mật khẩu tối thiểu 6 ký tự');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ');
      }
      
      const uid = generateUID();
      const hashedPassword = await hashPassword(password);
      
      const userData = {
        uid,
        email: emailLower,
        password: hashedPassword,
        role: role,
        name: profileData.name || '',
        phone: profileData.phone || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        ...profileData
      };
      
      await database.ref(`users/${uid}`).set(userData);
      
      const userResult = { ...userData };
      delete userResult.password;
      
      return { user: userResult };
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const savedUser = await AsyncStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  saveCurrentUser: async (user) => {
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Save current user error:', error);
    }
  },

  updateUserProfile: async (uid, updates) => {
    try {
      await database.ref(`users/${uid}`).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  getUserProfile: async (uid) => {
    try {
      const snapshot = await database.ref(`users/${uid}`).once('value');
      if (snapshot.exists()) {
        const userData = snapshot.val();
        delete userData.password; 
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword: (password) => {
    return password && password.length >= 6;
  }
};