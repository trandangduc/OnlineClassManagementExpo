import React, { createContext, useContext, useEffect, useState } from 'react';
import { database } from '../services/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../models/User';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setUserProfile(User.fromDatabase(userData));
        console.log('Restored session:', userData.email);
      }
    } catch (error) {
      console.error('Session restore error:', error);
    } finally {
      setInitializing(false);
    }
  };

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

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('Signing in with database...');
      const hashedPassword = await hashPassword(password);
      const snapshot = await database.ref('users')
        .orderByChild('email')
        .equalTo(email.toLowerCase().trim())
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
      const userWithId = { ...userData, uid: userKey };
      setUser(userWithId);
      setUserProfile(User.fromDatabase(userWithId));
    
      await AsyncStorage.setItem('currentUser', JSON.stringify(userWithId));
      return { user: userWithId };
      
    } catch (error) {
      console.error('Sign in error:', error);

    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, role = 'student', profileData = {}) => {
    
    try {
      setLoading(true);
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
      const hashedPassword = await hashPassword(password);
      const uid = generateUID();
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
      const userForState = { ...userData };
      delete userForState.password;
      setUser(userForState);
      setUserProfile(User.fromDatabase(userForState));
      await AsyncStorage.setItem('currentUser', JSON.stringify(userForState));
      return { user: userForState };
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      setUser(null);
      setUserProfile(null);
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const value = {
    user,
    userProfile,
    loading,
    initializing,
    signIn,
    signUp,
    signOut: signOutUser,
    isAuthenticated: !!user,
    isTeacher: userProfile?.isTeacher() || false,
    isStudent: userProfile?.isStudent() || true
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};