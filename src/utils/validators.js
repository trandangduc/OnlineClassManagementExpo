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
