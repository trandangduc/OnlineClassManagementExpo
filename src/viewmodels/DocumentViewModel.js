import { useState, useEffect } from 'react';
import { database, storage } from '../services/firebase/config';
import { storageService } from '../services/firebase/storage';
import { Document } from '../models/Document';
import CacheService from '../services/cache/CacheService';
import { useAuth } from '../contexts/AuthContext';
import { 
  isValidUrl, 
  searchVietnamese, 
  sortByProperty, 
  isYouTubeUrl,
  getFileExtension
} from '../utils/helpers';

export const useDocumentViewModel = (courseId) => {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (!courseId) return;

    let unsubscribe;
    const setupDocumentStream = async () => {
      try {
        setLoading(true);
        const cachedDocs = await CacheService.getDocuments(courseId);
        if (cachedDocs && cachedDocs.length > 0) {
          setDocuments(cachedDocs);
          setLoading(false);
        }

        const documentsRef = database.ref('documents').orderByChild('courseId').equalTo(courseId);
        
        unsubscribe = documentsRef.on('value', async (snapshot) => {
          try {
            if (snapshot.exists()) {
              const docsData = [];
              snapshot.forEach((childSnapshot) => {
                const docData = {
                  id: childSnapshot.key,
                  ...childSnapshot.val()
                };
                docsData.push(Document.fromDatabase(docData));
              });
              
              const sortedDocs = sortByProperty(docsData, 'createdAt', 'desc');
              
              setDocuments(sortedDocs);
              await CacheService.setDocuments(courseId, sortedDocs);
            } else {
              setDocuments([]);
            }
            setLoading(false);
          } catch (error) {
            console.error('Document data processing error:', error);
            setError('Không thể xử lý dữ liệu tài liệu');
            setLoading(false);
          }
        }, (error) => {
          console.error('Document stream error:', error);
          setError('Không thể tải danh sách tài liệu');
          setLoading(false);
        });
      } catch (error) {
        console.error('Setup document stream error:', error);
        setError('Có lỗi xảy ra');
        setLoading(false);
      }
    };

    setupDocumentStream();

    return () => {
      if (unsubscribe) {
        database.ref('documents').orderByChild('courseId').equalTo(courseId).off('value', unsubscribe);
      }
    };
  }, [courseId]);

  const uploadFile = async (file, fileName, fileType = 'pdf') => {
    try {
      setError('');
      setUploadProgress(0);

      if (!file) {
        throw new Error('Chưa chọn file');
      }

      // Sử dụng storageService validation thay vì helpers
      const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
      storageService.validateFileType(file, allowedTypes);
      storageService.validateFileSize(file, 10);

      const downloadURL = await storageService.uploadFileResumable(
        file, 
        fileName, 
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        },
        `documents/${courseId}`
      );
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 2000);
      
      return downloadURL;
    } catch (error) {
      console.error('Upload file error:', error);
      setError(error.message || 'Không thể upload file');
      setUploadProgress(0);
      throw error;
    }
  };

  const createDocument = async (documentData, file = null) => {
    try {
      setError('');
      
      if (!documentData.title?.trim()) {
        throw new Error('Tên tài liệu không được để trống');
      }
      
      if (!courseId) {
        throw new Error('Không tìm thấy môn học');
      }

      if (!userProfile) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      let fileUrl = documentData.url;
      if (file && documentData.type === 'pdf') {
        fileUrl = await uploadFile(file, documentData.title, 'pdf');
      }

      if (documentData.type === 'link' || documentData.type === 'video') {
        if (!fileUrl || !isValidUrl(fileUrl)) {
          throw new Error('URL không hợp lệ');
        }
      }

      const documentsRef = database.ref('documents');
      const newDocumentRef = documentsRef.push();
      const documentId = newDocumentRef.key;
      
      const newDocument = new Document(
        documentId,
        documentData.title.trim(),
        documentData.type,
        fileUrl,
        courseId,
        userProfile.uid
      );
      
      if (documentData.description) {
        newDocument.description = documentData.description.trim();
      }

      newDocument.uploaderName = userProfile.name || userProfile.getDisplayName?.() || 'Unknown User';
      newDocument.uploaderEmail = userProfile.email;

      // Thêm file size nếu có file
      if (file && file.size) {
        newDocument.size = file.size;
      }

      await newDocumentRef.set(newDocument.toDatabase());

      return newDocument;
    } catch (error) {
      console.error('Create document error:', error);
      const errorMessage = error.message || 'Không thể tạo tài liệu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateDocument = async (documentId, updateData) => {
    try {
      setError('');
      
      if (!documentId) {
        throw new Error('ID tài liệu không hợp lệ');
      }
      
      if (!updateData.title?.trim()) {
        throw new Error('Tên tài liệu không được để trống');
      }

      if ((updateData.type === 'link' || updateData.type === 'video') && updateData.url) {
        if (!isValidUrl(updateData.url)) {
          throw new Error('URL không hợp lệ');
        }
      }
      
      const updates = {
        title: updateData.title.trim(),
        description: updateData.description?.trim() || '',
        updatedAt: Date.now()
      };

      if (updateData.url) {
        updates.url = updateData.url;
      }
      if (updateData.type) {
        updates.type = updateData.type;
      }
      
      const documentRef = database.ref(`documents/${documentId}`);
      await documentRef.update(updates);

      console.log('Document updated:', documentId);
        
    } catch (error) {
      console.error('Update document error:', error);
      const errorMessage = error.message || 'Không thể cập nhật tài liệu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteDocument = async (documentId, documentUrl) => {
    try {
      setError('');
      
      if (!documentId) {
        throw new Error('ID tài liệu không hợp lệ');
      }

      // Xóa file từ storage nếu là Firebase URL
      if (documentUrl && documentUrl.includes('firebase')) {
        try {
          await storageService.deleteFile(documentUrl);
          console.log('File deleted from storage');
        } catch (storageError) {
          console.warn('Could not delete file from storage:', storageError);
        }
      }

      const documentRef = database.ref(`documents/${documentId}`);
      await documentRef.remove();

      console.log('Document deleted:', documentId);
        
    } catch (error) {
      console.error('Delete document error:', error);
      setError('Không thể xóa tài liệu');
      throw error;
    }
  };

  const downloadDocument = async (documentUrl, fileName) => {
    try {
      setError('');
      
      if (!documentUrl) {
        throw new Error('URL tài liệu không hợp lệ');
      }

      if (typeof window !== 'undefined') {
        window.open(documentUrl, '_blank');
      } else {
        console.log('Downloading:', fileName, documentUrl);
      }
      
    } catch (error) {
      console.error('Download document error:', error);
      setError('Không thể tải xuống tài liệu');
      throw error;
    }
  };

  const getDocumentDetails = async (documentId) => {
    try {
      setError('');
      
      if (!documentId) {
        throw new Error('ID tài liệu không hợp lệ');
      }
      
      const documentRef = database.ref(`documents/${documentId}`);
      const snapshot = await documentRef.once('value');
      
      if (snapshot.exists()) {
        const docData = {
          id: snapshot.key,
          ...snapshot.val()
        };
        return Document.fromDatabase(docData);
      } else {
        throw new Error('Không tìm thấy tài liệu');
      }
      
    } catch (error) {
      console.error('Get document details error:', error);
      setError('Không thể tải thông tin tài liệu');
      throw error;
    }
  };

  const getDocumentsByType = (type) => {
    return documents.filter(doc => doc.type === type);
  };

  const getPDFDocuments = () => {
    return getDocumentsByType('pdf');
  };

  const getVideoDocuments = () => {
    return getDocumentsByType('video');
  };

  const getLinkDocuments = () => {
    return getDocumentsByType('link');
  };

  const getDocumentById = (documentId) => {
    return documents.find(doc => doc.id === documentId);
  };

  const canManageDocument = (document) => {
    return userProfile && (
      userProfile.uid === document.uploadedBy ||
      (userProfile.isTeacher && userProfile.isTeacher())
    );
  };

  const getDocumentStats = () => {
    return {
      total: documents.length,
      pdf: getPDFDocuments().length,
      video: getVideoDocuments().length,
      link: getLinkDocuments().length
    };
  };

  const searchDocuments = (query) => {
    if (!query || !query.trim()) {
      return documents;
    }

    return documents.filter(doc => 
      searchVietnamese(doc.title, query) ||
      searchVietnamese(doc.description, query) ||
      searchVietnamese(doc.uploaderName, query)
    );
  };

  const getRecentDocuments = (limit = 5) => {
    return sortByProperty(documents, 'createdAt', 'desc').slice(0, limit);
  };

  return {
    documents,
    selectedDocument,
    loading,
    uploadProgress,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    uploadFile,
    getDocumentDetails,
    setSelectedDocument,
    setError,
    clearError: () => setError(''),
    getDocumentsByType,
    getPDFDocuments,
    getVideoDocuments,
    getLinkDocuments,
    getDocumentById,
    canManageDocument,
    getDocumentStats,
    searchDocuments,
    getRecentDocuments,
    isValidUrl
  };
};