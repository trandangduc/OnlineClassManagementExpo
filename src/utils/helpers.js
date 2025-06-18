export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};


export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Mật khẩu là bắt buộc' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu tối thiểu 6 ký tự' };
  }
  
  if (password.length > 50) {
    return { isValid: false, message: 'Mật khẩu tối đa 50 ký tự' };
  }
  
  return { isValid: true, message: 'Mật khẩu hợp lệ' };
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};


export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};



export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

export const isYouTubeUrl = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};
export const searchVietnamese = (text, query) => {
  if (!text || !query) return false;
  
  const normalizedText = removeDiacritics(text.toLowerCase());
  const normalizedQuery = removeDiacritics(query.toLowerCase());
  
  return normalizedText.includes(normalizedQuery);
};


export const getDocumentIcon = (type) => {
  switch (type) {
    case 'pdf':
      return 'picture-as-pdf';
    case 'video':
      return 'play-circle-outline';
    case 'link':
      return 'link';
    case 'image':
      return 'image';
    case 'document':
      return 'description';
    default:
      return 'insert-drive-file';
  }
};

export const getDocumentColor = (type) => {
  switch (type) {
    case 'pdf':
      return '#dc3545';
    case 'video':
      return '#28a745';
    case 'link':
      return '#ffc107';
    case 'image':
      return '#17a2b8';
    case 'document':
      return '#6c757d';
    default:
      return '#6c757d';
  }
};

export const getRoleDisplayName = (role) => {
  switch (role) {
    case 'student':
      return 'Học sinh';
    case 'teacher':
      return 'Giảng viên';
    case 'admin':
      return 'Quản trị viên';
    default:
      return 'Không xác định';
  }
};

export const sortByProperty = (array, property, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};