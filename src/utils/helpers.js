export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  } else {
    return formatDate(dateObj);
  }
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


export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

export const isVideoFile = (filename) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const extension = getFileExtension(filename);
  return videoExtensions.includes(extension);
};

export const isYouTubeUrl = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

export const getYouTubeVideoId = (url) => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const getYouTubeThumbnail = (videoId, quality = 'medium') => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  const qualityString = qualityMap[quality] || 'mqdefault';
  return `https://img.youtube.com/vi/${videoId}/${qualityString}.jpg`;
};
export const removeDiacritics = (str) => {
  if (!str) return '';
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const searchVietnamese = (text, query) => {
  if (!text || !query) return false;
  
  const normalizedText = removeDiacritics(text.toLowerCase());
  const normalizedQuery = removeDiacritics(query.toLowerCase());
  
  return normalizedText.includes(normalizedQuery);
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

export const handleAsyncOperation = async (asyncFn, setLoading, setError) => {
  try {
    setLoading(true);
    setError('');
    const result = await asyncFn();
    return result;
  } catch (error) {
    setError(error.message || 'Có lỗi xảy ra');
    throw error;
  } finally {
    setLoading(false);
  }
};

export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const timestampToDate = (timestamp) => {
  if (!timestamp) return '';
  return formatDate(new Date(timestamp));
};

export const getCurrentTimestamp = () => {
  return Date.now();
};


export const isToday = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

export const isYesterday = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateObj.toDateString() === yesterday.toDateString();
};

export const getAge = (birthDate) => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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

export const groupByProperty = (array, property) => {
  return array.reduce((groups, item) => {
    const key = item[property];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

export const getUniqueValues = (array) => {
  return [...new Set(array)];
};

export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

export const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};