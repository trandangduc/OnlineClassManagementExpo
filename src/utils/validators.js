export const emailValidator = {
  required: 'Email là bắt buộc',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email không hợp lệ'
  }
};

export const passwordValidator = {
  required: 'Mật khẩu là bắt buộc',
  minLength: {
    value: 6,
    message: 'Mật khẩu tối thiểu 6 ký tự'
  },
  maxLength: {
    value: 50,
    message: 'Mật khẩu tối đa 50 ký tự'
  }
};

export const confirmPasswordValidator = (password) => ({
  required: 'Xác nhận mật khẩu là bắt buộc',
  validate: value => value === password || 'Mật khẩu xác nhận không khớp'
});

export const nameValidator = {
  required: 'Họ tên là bắt buộc',
  minLength: {
    value: 2,
    message: 'Họ tên tối thiểu 2 ký tự'
  },
  maxLength: {
    value: 50,
    message: 'Họ tên tối đa 50 ký tự'
  },
  pattern: {
    value: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/,
    message: 'Họ tên chỉ chứa chữ cái và khoảng trắng'
  }
};

export const phoneValidator = {
  required: 'Số điện thoại là bắt buộc',
  pattern: {
    value: /^[0-9]{10,11}$/,
    message: 'Số điện thoại không hợp lệ (10-11 chữ số)'
  }
};

export const courseTitleValidator = {
  required: 'Tên môn học là bắt buộc',
  minLength: {
    value: 2,
    message: 'Tên môn học tối thiểu 2 ký tự'
  },
  maxLength: {
    value: 100,
    message: 'Tên môn học tối đa 100 ký tự'
  }
};

export const courseDescriptionValidator = {
  maxLength: {
    value: 500,
    message: 'Mô tả tối đa 500 ký tự'
  }
};

export const documentTitleValidator = {
  required: 'Tên tài liệu là bắt buộc',
  minLength: {
    value: 2,
    message: 'Tên tài liệu tối thiểu 2 ký tự'
  },
  maxLength: {
    value: 100,
    message: 'Tên tài liệu tối đa 100 ký tự'
  }
};

export const documentDescriptionValidator = {
  maxLength: {
    value: 500,
    message: 'Mô tả tối đa 500 ký tự'
  }
};

export const urlValidator = {
  required: 'URL là bắt buộc',
  pattern: {
    value: /^https?:\/\/.+/,
    message: 'URL phải bắt đầu với http:// hoặc https://'
  }
};

export const videoUrlValidator = {
  required: 'URL video là bắt buộc',
  validate: (value) => {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(value)) {
      return 'URL phải bắt đầu với http:// hoặc https://';
    }
    
    const videoPatterns = [
      /youtube\.com\/watch\?v=.+/,
      /youtu\.be\/.+/,
      /vimeo\.com\/.+/,
      /dailymotion\.com\/video\/.+/,
      /facebook\.com\/.*\/videos\/.+/,
      /\.mp4$/,
      /\.avi$/,
      /\.mov$/,
      /\.wmv$/,
      /\.flv$/,
      /\.webm$/
    ];
    
    const isValidVideo = videoPatterns.some(pattern => pattern.test(value));
    if (!isValidVideo) {
      return 'URL không phải là video hợp lệ (YouTube, Vimeo, hoặc file video)';
    }
    
    return true;
  }
};
export const searchValidator = {
  minLength: {
    value: 1,
    message: 'Từ khóa tìm kiếm tối thiểu 1 ký tự'
  },
  maxLength: {
    value: 100,
    message: 'Từ khóa tìm kiếm tối đa 100 ký tự'
  }
};

export const validateVietnameseName = (value) => {
  if (!value) return true;
  const vietnamesePattern = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
  return vietnamesePattern.test(value) || 'Chỉ được chứa chữ cái và khoảng trắng';
};

export const validateEducationalEmail = (value) => {
  if (!value) return true;
  const eduDomains = ['.edu', '.edu.vn', '.ac.vn'];
  const isEduEmail = eduDomains.some(domain => value.toLowerCase().includes(domain));
  return isEduEmail || 'Email phải từ tổ chức giáo dục (.edu, .edu.vn, .ac.vn)';
};

export const validatePasswordWithNumber = (value) => {
  if (!value) return true;
  const hasNumber = /\d/.test(value);
  return hasNumber || 'Mật khẩu phải chứa ít nhất 1 số';
};

export const validatePasswordWithUppercase = (value) => {
  if (!value) return true;
  const hasUppercase = /[A-Z]/.test(value);
  return hasUppercase || 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
};

export const validatePasswordWithSpecialChar = (value) => {
  if (!value) return true;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  return hasSpecialChar || 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
};

export const validateFileSize = (maxSizeMB) => {
  return (file) => {
    if (!file) return true;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes || `File không được vượt quá ${maxSizeMB}MB`;
  };
};

export const validateFileType = (allowedTypes) => {
  return (file) => {
    if (!file) return true;
    const fileName = file.name || file.uri || '';
    const extension = fileName.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension) || `Chỉ chấp nhận file: ${allowedTypes.join(', ')}`;
  };
};

export const validateYouTubeUrl = (value) => {
  if (!value) return true;
  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/;
  return youtubePattern.test(value) || 'URL YouTube không hợp lệ';
};

export const validateVietnamesePhone = (value) => {
  if (!value) return true;
  
  const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
  
  const patterns = [
    /^0[3|5|7|8|9][0-9]{8}$/, 
    /^02[4|8][0-9]{8}$/, 
    /^02[0-9]{2}[0-9]{7}$/ 
  ];
  
  const isValid = patterns.some(pattern => pattern.test(cleanPhone));
  return isValid || 'Số điện thoại Việt Nam không hợp lệ';
};

export const getValidationRules = (fieldType, options = {}) => {
  switch (fieldType) {
    case 'email':
      return emailValidator;
    case 'password':
      return passwordValidator;
    case 'confirmPassword':
      return confirmPasswordValidator(options.password);
    case 'name':
      return nameValidator;
    case 'phone':
      return phoneValidator;
    case 'courseTitle':
      return courseTitleValidator;
    case 'courseDescription':
      return courseDescriptionValidator;
    case 'documentTitle':
      return documentTitleValidator;
    case 'documentDescription':
      return documentDescriptionValidator;
    case 'url':
      return urlValidator;
    case 'videoUrl':
      return videoUrlValidator;
    case 'search':
      return searchValidator;
    default:
      return {};
  }
};