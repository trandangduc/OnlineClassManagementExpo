export const COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  secondary: '#FF9800',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  
  background: '#f8f9fa',
  surface: '#ffffff',
  border: '#e9ecef',
};

export const SIZES = {
  fontXS: 12,
  fontSM: 14,
  fontMD: 16,
  fontLG: 18,
  fontXL: 20,
  fontXXL: 24,
  fontHuge: 32,
  
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  radiusXS: 4,
  radiusSM: 8,
  radiusMD: 12,
  radiusLG: 16,
  radiusXL: 20,
  radiusRound: 50,
};

export const DOCUMENT_TYPES = {
  PDF: 'pdf',
  VIDEO: 'video',
  LINK: 'link'
};

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher'
};

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  DOCUMENTS: 'documents'
};

export const CACHE_KEYS = {
  COURSES: 'cached_courses',
  DOCUMENTS: 'cached_documents',
  USER_PROFILE: 'cached_user_profile'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  UNKNOWN_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại.',
  PERMISSION_DENIED: 'Bạn không có quyền thực hiện hành động này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
  VALIDATION_ERROR: 'Dữ liệu nhập vào không hợp lệ.'
};