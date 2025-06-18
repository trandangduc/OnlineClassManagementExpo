import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, validatePassword, isValidPhone } from '../utils/helpers';
import { getRoleDisplayName } from '../utils/helpers';

export const useAuthViewModel = () => {
  const { 
    signIn, 
    signUp, 
    signOut, 
    user, 
    userProfile, 
    loading: authLoading,
    isAuthenticated,
    isTeacher,
    isStudent,
    updateProfile
  } = useAuth();
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (email, password) => {
    try {
      setError('');
      setIsLoading(true);

      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc');
      }
      
      if (!isValidEmail(email)) {
        throw new Error('Email không hợp lệ');
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }
      
      await signIn(email.trim(), password);
      console.log('Sign in successful via ViewModel');
      
    } catch (error) {
      console.error('Sign in error in ViewModel:', error);
      const errorMessage = getErrorMessage(error.message);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email, password, role, profileData) => {
    try {
      setError('');
      setIsLoading(true);

      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc');
      }
      
      if (!isValidEmail(email)) {
        throw new Error('Email không hợp lệ');
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }
      
      if (profileData?.name && profileData.name.trim().length < 2) {
        throw new Error('Tên tối thiểu 2 ký tự');
      }
      
      if (profileData?.phone && !isValidPhone(profileData.phone)) {
        throw new Error('Số điện thoại không hợp lệ');
      }
      
      const cleanProfileData = {
        ...profileData,
        name: profileData?.name?.trim() || '',
        phone: profileData?.phone?.trim() || ''
      };
      
      await signUp(email.trim(), password, role || 'student', cleanProfileData);
      console.log('Sign up successful via ViewModel');
      
    } catch (error) {
      console.error('Sign up error in ViewModel:', error);
      const errorMessage = getErrorMessage(error.message);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError('');
      setIsLoading(true);
      await signOut();
      console.log('Sign out successful via ViewModel');
    } catch (error) {
      console.error('Sign out error in ViewModel:', error);
      setError('Đăng xuất thất bại');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const validateName = (name) => {
    return name && name.trim().length >= 2;
  };

  const getErrorMessage = (errorMessage) => {
    if (errorMessage.includes('Email này đã được sử dụng')) {
      return 'Email đã được sử dụng';
    }
    if (errorMessage.includes('Không tìm thấy tài khoản')) {
      return 'Không tìm thấy tài khoản này';
    }
    if (errorMessage.includes('Mật khẩu không chính xác')) {
      return 'Mật khẩu không chính xác';
    }
    if (errorMessage.includes('Mật khẩu quá yếu')) {
      return 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
    }
    if (errorMessage.includes('Email không hợp lệ')) {
      return 'Email không hợp lệ';
    }
    if (errorMessage.includes('Tài khoản đã bị khóa')) {
      return 'Tài khoản đã bị vô hiệu hóa';
    }
    
    return errorMessage || 'Có lỗi xảy ra, vui lòng thử lại';
  };

  const getUserDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    if (userProfile?.getDisplayName) {
      return userProfile.getDisplayName();
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Người dùng';
  };

  const getUserRole = () => {
    if (userProfile?.role) {
      return getRoleDisplayName(userProfile.role);
    }
    return getRoleDisplayName('student');
  };

  return {
    user,
    userProfile,
    error,
    isLoading: isLoading || authLoading,
    isAuthenticated,
    isStudent,
    isTeacher,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    validateEmail: isValidEmail,
    validatePassword: (password) => validatePassword(password).isValid,
    validatePhone: isValidPhone,
    validateName,
    setError,
    clearError: () => setError(''),
    getUserDisplayName,
    getUserRole
  };
};