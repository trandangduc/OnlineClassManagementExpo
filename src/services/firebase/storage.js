import { storage } from './config';
import * as FileSystem from 'expo-file-system';

export const storageService = {
  copyFileToTemp: async (sourceUri, fileName) => {
    try {
      const tempDir = `${FileSystem.documentDirectory}temp/`;
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const tempFilePath = `${tempDir}${timestamp}_${sanitizedFileName}`;
      
      await FileSystem.copyAsync({
        from: sourceUri,
        to: tempFilePath
      });
      
      const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
      
      if (!fileInfo.exists) {
        throw new Error('Không thể copy file vào thư mục tạm');
      }
      
      if (fileInfo.size === 0) {
        throw new Error('File copy bị rỗng');
      }
      
      return tempFilePath;
    } catch (error) {
      throw new Error(`Không thể lưu file tạm: ${error.message}`);
    }
  },

  readTempFileAsBlob: async (tempFilePath) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
      if (!fileInfo.exists) {
        throw new Error('File tạm không tồn tại');
      }
      
      const response = await fetch(tempFilePath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('File tạm rỗng');
      }
      
      return blob;
    } catch (error) {
      throw new Error(`Không thể đọc file tạm: ${error.message}`);
    }
  },

  cleanupTempFile: async (tempFilePath) => {
    try {
      if (tempFilePath && await FileSystem.getInfoAsync(tempFilePath).then(info => info.exists)) {
        await FileSystem.deleteAsync(tempFilePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  },

  ensurePdfMimeType: (file) => {
    return {
      ...file,
      type: 'application/pdf'
    };
  },

  uploadFile: async (file, fileName, onProgress, folder = 'documents') => {
    try {
      let fileBlob;
      
      if (file.tempPath) {
        fileBlob = await storageService.readTempFileAsBlob(file.tempPath);
      } else if (file.uri) {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fileBlob = await response.blob();
      } else {
        throw new Error('File không có URI hoặc tempPath');
      }
      
      if (!fileBlob || fileBlob.size === 0) {
        throw new Error('File rỗng hoặc không thể đọc');
      }
      
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const fullPath = `${folder}/${timestamp}_${sanitizedFileName}`;
      
      const reference = storage.ref(fullPath);
      
      const metadata = {
        contentType: 'application/pdf',
        customMetadata: {
          originalName: fileName,
          originalSize: file.size?.toString() || fileBlob.size.toString(),
          uploadedAt: new Date().toISOString(),
          fileType: 'pdf'
        }
      };
      
      const uploadTask = reference.put(fileBlob, metadata);
      
      if (onProgress) {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress));
          },
          (error) => {
            console.error('Upload progress error:', error);
            throw error;
          }
        );
      }
      
      await uploadTask;
      const downloadURL = await reference.getDownloadURL();
      
      const uploadedMetadata = await reference.getMetadata();
      
      if (uploadedMetadata.size < 100) {
        throw new Error(`File upload bị lỗi - size quá nhỏ: ${uploadedMetadata.size} bytes`);
      }
      
      if (file.tempPath) {
        await storageService.cleanupTempFile(file.tempPath);
      }
      
      return downloadURL;
    } catch (error) {
      if (file.tempPath) {
        await storageService.cleanupTempFile(file.tempPath);
      }
      throw new Error(`Lỗi upload file PDF: ${error.message}`);
    }
  },

  uploadFileResumable: async (file, fileName, onProgress, folder = 'documents') => {
    try {
      let fileBlob;
      
      if (file.tempPath) {
        fileBlob = await storageService.readTempFileAsBlob(file.tempPath);
      } else if (file.uri) {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fileBlob = await response.blob();
      } else {
        throw new Error('File không có URI hoặc tempPath');
      }
      
      if (!fileBlob || fileBlob.size === 0) {
        throw new Error('File rỗng hoặc không thể đọc');
      }
      
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const fullPath = `${folder}/${timestamp}_${sanitizedFileName}`;
      
      const reference = storage.ref(fullPath);
      
      const metadata = {
        contentType: 'application/pdf',
        customMetadata: {
          originalName: fileName,
          originalSize: file.size?.toString() || fileBlob.size.toString(),
          uploadedAt: new Date().toISOString(),
          fileType: 'pdf'
        }
      };
      
      return new Promise((resolve, reject) => {
        const uploadTask = reference.put(fileBlob, metadata);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          },
          (error) => {
            console.error('Upload error:', error);
            if (file.tempPath) {
              storageService.cleanupTempFile(file.tempPath);
            }
            reject(new Error(`Lỗi upload PDF: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              
              const uploadedMetadata = await uploadTask.snapshot.ref.getMetadata();
              
              if (uploadedMetadata.size < 100) {
                reject(new Error(`File upload bị lỗi - size quá nhỏ: ${uploadedMetadata.size} bytes`));
                return;
              }
              
              if (file.tempPath) {
                await storageService.cleanupTempFile(file.tempPath);
              }
              
              resolve(downloadURL);
            } catch (error) {
              if (file.tempPath) {
                await storageService.cleanupTempFile(file.tempPath);
              }
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      if (file.tempPath) {
        await storageService.cleanupTempFile(file.tempPath);
      }
      throw error;
    }
  },

  deleteFile: async (fileUrl) => {
    try {
      if (!fileUrl || !fileUrl.includes('firebase')) {
        throw new Error('URL không hợp lệ');
      }
      
      const reference = storage.refFromURL(fileUrl);
      await reference.delete();
      
      return true;
    } catch (error) {
      throw new Error(`Lỗi xóa file: ${error.message}`);
    }
  },

  getDownloadURL: async (fileName, folder = 'documents') => {
    try {
      const reference = storage.ref(`${folder}/${fileName}`);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      throw new Error(`Lỗi lấy URL: ${error.message}`);
    }
  },

  getFileMetadata: async (fileUrl) => {
    try {
      const reference = storage.refFromURL(fileUrl);
      const metadata = await reference.getMetadata();
      return metadata;
    } catch (error) {
      console.error('Get metadata error:', error);
      throw error;
    }
  },

  listFiles: async (folder = 'documents', maxResults = 100) => {
    try {
      const reference = storage.ref(folder);
      const result = await reference.listAll();
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await itemRef.getDownloadURL();
          const metadata = await itemRef.getMetadata();
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url: url,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated
          };
        })
      );
      
      return files;
    } catch (error) {
      throw error;
    }
  },

  generateFileName: (originalName, folder = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const sanitized = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    return `${folder ? folder + '/' : ''}${timestamp}_${random}_${sanitized}`;
  },

  validateFileType: (file, allowedTypes = ['pdf']) => {
    if (!file || !file.name) {
      throw new Error('File không hợp lệ');
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension !== 'pdf') {
      throw new Error('Chỉ chấp nhận file PDF');
    }
    
    return true;
  },

  validateFileSize: (file, maxSizeMB = 50) => {
    if (!file || !file.size) {
      throw new Error('File không hợp lệ');
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`File PDF quá lớn. Kích thước tối đa: ${maxSizeMB}MB`);
    }
    
    return true;
  },

  validateAndPrepareFile: async (file) => {
    try {
      if (!file || !file.uri) {
        throw new Error('File không hợp lệ');
      }
      
      if (!file.size || file.size === 0) {
        throw new Error('File rỗng');
      }
      
      storageService.validateFileSize(file, 50);
      storageService.validateFileType(file);
      
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4));
      
      const pdfHeader = String.fromCharCode(...uint8Array);
      if (!pdfHeader.startsWith('%PDF')) {
        throw new Error('File không phải là PDF hợp lệ');
      }
      
      const tempPath = await storageService.copyFileToTemp(file.uri, file.name);
      
      return {
        ...file,
        tempPath: tempPath,
        isPrepared: true
      };
      
    } catch (error) {
      throw error;
    }
  }
};