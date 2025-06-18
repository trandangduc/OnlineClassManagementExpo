import { useState, useEffect, useCallback, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 20;

export const useDocumentViewModel = (courseId) => {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [hasMoreDocuments, setHasMoreDocuments] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [paginatedDocuments, setPaginatedDocuments] = useState([]);

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
              
              if (!initialLoadComplete) {
                initializePagination(sortedDocs);
                setInitialLoadComplete(true);
              }
            } else {
              setDocuments([]);
              setPaginatedDocuments([]);
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

  const initializePagination = useCallback((docsData) => {
    setPaginatedDocuments(docsData.slice(0, ITEMS_PER_PAGE));
    setHasMoreDocuments(docsData.length > ITEMS_PER_PAGE);
    setDocumentsPage(1);
  }, []);

  useEffect(() => {
    if (initialLoadComplete && documents.length > 0) {
      resetPagination();
    }
  }, [documents, initialLoadComplete]);

  const loadMoreDocuments = useCallback(async (reset = false) => {
    if (loading && !reset) return;

    try {
      if (reset) {
        const firstPage = documents.slice(0, ITEMS_PER_PAGE);
        setPaginatedDocuments(firstPage);
        setDocumentsPage(1);
        setHasMoreDocuments(documents.length > ITEMS_PER_PAGE);
      } else {
        const currentPage = documentsPage;
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const newDocuments = documents.slice(startIndex, endIndex);
        
        if (newDocuments.length > 0) {
          setPaginatedDocuments(prev => [...prev, ...newDocuments]);
          setDocumentsPage(prev => prev + 1);
          setHasMoreDocuments(endIndex < documents.length);
        } else {
          setHasMoreDocuments(false);
        }
      }
    } catch (err) {
      console.error('Error loading more documents:', err);
      setError('Không thể tải thêm tài liệu');
    }
  }, [documents, documentsPage, loading]);

  const resetPagination = useCallback(() => {
    setPaginatedDocuments(documents.slice(0, ITEMS_PER_PAGE));
    setDocumentsPage(1);
    setHasMoreDocuments(documents.length > ITEMS_PER_PAGE);
  }, [documents]);

  const getDocumentsByType = useCallback((type) => {
    return paginatedDocuments.filter(doc => doc.type === type);
  }, [paginatedDocuments]);

  const getPDFDocuments = useCallback(() => {
    return getDocumentsByType('pdf');
  }, [getDocumentsByType]);

  const getVideoDocuments = useCallback(() => {
    return getDocumentsByType('video');
  }, [getDocumentsByType]);

  const getLinkDocuments = useCallback(() => {
    return getDocumentsByType('link');
  }, [getDocumentsByType]);

  const getDocumentById = useCallback((documentId) => {
    return documents.find(doc => doc.id === documentId); 
  }, [documents]);

  const canManageDocument = useCallback((document) => {
    return userProfile && (
      userProfile.uid === document.uploadedBy ||
      (userProfile.isTeacher && userProfile.isTeacher())
    );
  }, [userProfile]);

  const getDocumentStats = useCallback(() => {
    return {
      total: documents.length,
      pdf: documents.filter(doc => doc.type === 'pdf').length,
      video: documents.filter(doc => doc.type === 'video').length,
      link: documents.filter(doc => doc.type === 'link').length
    };
  }, [documents]);

  const searchDocuments = useCallback((query) => {
    if (!query || !query.trim()) {
      return paginatedDocuments;
    }
    return documents.filter(doc => 
      searchVietnamese(doc.title, query) ||
      searchVietnamese(doc.description, query) ||
      searchVietnamese(doc.uploaderName, query)
    );
  }, [documents, paginatedDocuments]);

  const getRecentDocuments = useCallback((limit = 5) => {
    return sortByProperty(documents, 'createdAt', 'desc').slice(0, limit);
  }, [documents]);

  const uploadFile = async (file, fileName, fileType = 'pdf') => {
    try {
      setError('');
      setUploadProgress(0);

      if (!file) {
        throw new Error('Chưa chọn file');
      }

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

      if (file && file.size) {
        newDocument.size = file.size;
      }

      setPaginatedDocuments(prev => [newDocument, ...prev]);

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

      setPaginatedDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, ...updateData, updatedAt: Date.now() }
            : doc
        )
      );
      
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

      setPaginatedDocuments(prev => prev.filter(doc => doc.id !== documentId));
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

  return {
    documents: paginatedDocuments,
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
    isValidUrl,
    loadMoreDocuments,
    hasMoreDocuments,
    resetPagination,
    documentsPage,
    allDocuments: documents,
    totalDocuments: documents.length
  };
};