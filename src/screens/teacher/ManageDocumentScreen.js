import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SearchBar, Card, Button, Input, ButtonGroup } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm, Controller } from 'react-hook-form';
import * as DocumentPicker from 'expo-document-picker';
import { useDocumentViewModel } from '../../viewmodels/DocumentViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  documentTitleValidator, 
  documentDescriptionValidator,
  urlValidator 
} from '../../utils/validators';
import { 
  formatDate, 
  formatFileSize, 
  getDocumentIcon, 
  getDocumentColor 
} from '../../utils/helpers';

const DOCUMENT_ITEM_HEIGHT = 200; 

const ManageDocumentScreen = ({ route, navigation }) => {
  const { course, courseId, courseName } = route.params;
  const { userProfile } = useAuthViewModel();
  const { canManageCourse } = useCourseViewModel();
  const {
    documents,
    loading,
    uploadProgress,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByType,
    getDocumentStats,
    searchDocuments,
    canManageDocument,
    clearError,
    loadMoreDocuments,
    hasMoreDocuments,
    resetPagination,
    allDocuments 
  } = useDocumentViewModel(courseId);

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [documentType, setDocumentType] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const documentTypes = ['PDF', 'Video', 'Link'];
  const typeMapping = ['pdf', 'video', 'link'];
  const canManage = canManageCourse(course);
  const filteredDocuments = useMemo(() => {
    let filteredDocs = documents;
    if (selectedType !== 'all') {
      filteredDocs = getDocumentsByType(selectedType);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        doc.title?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.uploaderName?.toLowerCase().includes(query)
      );
    }
    
    return filteredDocs;
  }, [documents, selectedType, searchQuery, getDocumentsByType]);
  const stats = useMemo(() => getDocumentStats(), [getDocumentStats]);

  const watchedType = typeMapping[documentType];

  useEffect(() => {
    navigation.setOptions({
      headerTitle: courseName ? `Quản lý tài liệu - ${courseName}` : 'Quản lý tài liệu',
      headerTitleStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    });
  }, [navigation, courseName]);

  useEffect(() => {
    if (userProfile && !canManage) {
      Alert.alert(
        'Không có quyền truy cập',
        'Chỉ giảng viên của môn học mới có thể quản lý tài liệu',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [userProfile, canManage, navigation]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      url: ''
    }
  });
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearError();
    resetPagination();
    
    try {
      await loadMoreDocuments(true);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [clearError, resetPagination, loadMoreDocuments]);
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMoreDocuments || searchQuery.trim() || selectedType !== 'all') {
      return; 
    }

    setLoadingMore(true);
    try {
      await loadMoreDocuments();
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMoreDocuments, searchQuery, selectedType, loadMoreDocuments]);

  const openCreateModal = useCallback(() => {
    setEditingDocument(null);
    setDocumentType(0);
    setSelectedFile(null);
    reset({
      title: '',
      description: '',
      url: ''
    });
    setModalVisible(true);
  }, [reset]);

  const openEditModal = useCallback((document) => {
    setEditingDocument(document);
    const typeIndex = typeMapping.indexOf(document.type);
    setDocumentType(typeIndex >= 0 ? typeIndex : 0);
    setSelectedFile(null);
    reset({
      title: document.title || '',
      description: document.description || '',
      url: document.url || ''
    });
    setModalVisible(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingDocument(null);
    setDocumentType(0);
    setSelectedFile(null);
    setSubmitting(false);
    reset({
      title: '',
      description: '',
      url: ''
    });
  }, [reset]);

  const handleViewDocument = useCallback(async (document) => {
    try {
      if (!document.url) {
        Alert.alert('Lỗi', 'Tài liệu không có URL hợp lệ');
        return;
      }

      const url = document.url.trim();
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        Alert.alert('Lỗi', 'URL không hợp lệ');
        return;
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lỗi', 'Không thể mở liên kết này');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Lỗi', 'Không thể mở tài liệu');
    }
  }, []);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const fileObj = {
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          name: file.name || `document_${Date.now()}.pdf`,
          size: file.size || 0
        };

        setSelectedFile(fileObj);
        const fileName = fileObj.name.replace(/\.[^/.]+$/, "");
        setValue('title', fileName);
        setValue('url', '');
        
        Alert.alert('Thành công', `Đã chọn file: ${fileObj.name}`);
      } else if (result.canceled) {
        console.log('User cancelled document picker');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn file. Vui lòng thử lại.');
    }
  }, [setValue]);

  const onSubmit = useCallback(async (data) => {
    try {
      setSubmitting(true);
      const docType = typeMapping[documentType];
      
      if (!data.title?.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên tài liệu');
        return;
      }
      if (docType === 'pdf') {
        if (!selectedFile && !data.url?.trim()) {
          Alert.alert('Lỗi', 'Vui lòng chọn file PDF hoặc nhập URL');
          return;
        }
      } else {
        if (!data.url?.trim()) {
          Alert.alert('Lỗi', 'Vui lòng nhập URL');
          return;
        }
      }
      if (data.url?.trim() && !(docType === 'pdf' && selectedFile)) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(data.url.trim())) {
          Alert.alert('Lỗi', 'URL phải bắt đầu với http:// hoặc https://');
          return;
        }
      }

      const documentData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        type: docType,
        url: selectedFile ? '' : (data.url?.trim() || '') 
      };

      if (editingDocument) {
        await updateDocument(editingDocument.id, documentData);
        Alert.alert('Thành công', 'Cập nhật tài liệu thành công!');
      } else {
        await createDocument(documentData, selectedFile);
        Alert.alert('Thành công', 'Tạo tài liệu thành công!');
      }

      closeModal();
    } catch (error) {
      console.error('Document submit error:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }, [documentType, selectedFile, editingDocument, updateDocument, createDocument, closeModal]);

  const handleDeleteDocument = useCallback((document) => {
    if (!canManageDocument(document)) {
      Alert.alert('Lỗi', 'Bạn không có quyền xóa tài liệu này');
      return;
    }

    Alert.alert(
      'Xóa tài liệu',
      `Bạn có chắc muốn xóa tài liệu "${document.title}"?\n\nHành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(document.id, document.url);
              Alert.alert('Thành công', 'Đã xóa tài liệu thành công!');
            } catch (error) {
              console.error('Delete document error:', error);
              Alert.alert('Lỗi', error.message || 'Không thể xóa tài liệu');
            }
          }
        }
      ]
    );
  }, [canManageDocument, deleteDocument]);

  const handleTypeFilter = useCallback((type) => {
    setSelectedType(type);
    setSearchQuery('');
  }, []);
  const FilterTab = React.memo(({ type, label, count, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterTab, isActive && styles.activeFilterTab]}
      onPress={() => onPress(type)}
    >
      <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  ));

  const renderFilterTab = useCallback(({ item }) => (
    <FilterTab
      type={item.type}
      label={item.label}
      count={item.count}
      isActive={selectedType === item.type}
      onPress={handleTypeFilter}
    />
  ), [selectedType, handleTypeFilter]);
  const DocumentCard = React.memo(({ 
    document, 
    onView, 
    onEdit, 
    onDelete, 
    canManageThis 
  }) => (
    <Card containerStyle={styles.documentCard}>
      <View style={styles.documentHeader}>
        <TouchableOpacity 
          style={styles.documentTitleContainer}
          onPress={() => onView(document)}
          activeOpacity={0.7}
        >
          <Icon
            name={getDocumentIcon(document.type)}
            size={24}
            color={getDocumentColor(document.type)}
            style={styles.documentIcon}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.documentTitle} numberOfLines={2}>
              {document.title || 'Không có tiêu đề'}
            </Text>
            {canManageThis && (
              <Text style={styles.ownerIndicator}>
                Bạn đã tạo
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        {canManageThis && (
          <View style={styles.documentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(document)}
            >
              <Icon name="edit" size={20} color="#ffc107" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(document)}
            >
              <Icon name="delete" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {document.description ? (
        <Text style={styles.documentDescription} numberOfLines={3}>
          {document.description}
        </Text>
      ) : null}

      <View style={styles.documentFooter}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentDate}>
            {formatDate(document.createdAt)}
          </Text>
          {document.uploaderName && (
            <Text style={styles.uploaderName}>
              Đăng bởi: {document.uploaderName}
            </Text>
          )}
          {document.size > 0 && (
            <Text style={styles.documentSize}>
              {formatFileSize(document.size)}
            </Text>
          )}
        </View>
        <View style={styles.typeContainer}>
          <Text style={[styles.typeText, { color: getDocumentColor(document.type) }]}>
            {document.type?.toUpperCase() || 'FILE'}
          </Text>
        </View>
      </View>
    </Card>
  ));

  const renderDocumentItem = useCallback(({ item: document }) => {
    const canManageThis = canManageDocument(document);
    
    return (
      <DocumentCard
        document={document}
        onView={handleViewDocument}
        onEdit={openEditModal}
        onDelete={handleDeleteDocument}
        canManageThis={canManageThis}
      />
    );
  }, [canManageDocument, handleViewDocument, openEditModal, handleDeleteDocument]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-open" size={64} color="#adb5bd" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? 'Thử tìm kiếm với từ khóa khác'
          : 'Bắt đầu bằng cách tạo tài liệu đầu tiên'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Tạo tài liệu"
          onPress={openCreateModal}
          buttonStyle={styles.emptyCreateButton}
          titleStyle={styles.emptyCreateButtonText}
          icon={
            <Icon
              name="add"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
          }
        />
      )}
    </View>
  ), [searchQuery, openCreateModal]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  }, [loadingMore]);
  const getItemLayout = useCallback((data, index) => ({
    length: DOCUMENT_ITEM_HEIGHT,
    offset: DOCUMENT_ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item) => item.id || Math.random().toString(), []);

  if (loading && !refreshing && documents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card containerStyle={styles.statsCard}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Tổng quan tài liệu</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Tổng</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: '#dc3545'}]}>{stats.pdf}</Text>
                <Text style={styles.statLabel}>PDF</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: '#28a745'}]}>{stats.video}</Text>
                <Text style={styles.statLabel}>Video</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: '#ffc107'}]}>{stats.link}</Text>
                <Text style={styles.statLabel}>Link</Text>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.topContainer}>
          <SearchBar
            placeholder="Tìm kiếm tài liệu..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            containerStyle={styles.searchContainer}
            inputContainerStyle={styles.searchInputContainer}
            inputStyle={styles.searchInput}
            searchIcon={{ color: '#2196F3' }}
            clearIcon={{ color: '#2196F3' }}
          />

          <Button
            title="Tạo tài liệu"
            onPress={openCreateModal}
            buttonStyle={styles.createButton}
            titleStyle={styles.createButtonText}
            icon={
              <Icon
                name="add"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            }
          />
        </View>

        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { type: 'all', label: 'Tất cả', count: stats.total },
              { type: 'pdf', label: 'PDF', count: stats.pdf },
              { type: 'video', label: 'Video', count: stats.video },
              { type: 'link', label: 'Link', count: stats.link },
            ]}
            renderItem={renderFilterTab}
            keyExtractor={(item) => item.type}
            contentContainerStyle={styles.filterList}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={2}
            removeClippedSubviews={false}
          />
        </View>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.uploadContainer}>
            <Text style={styles.uploadText}>Đang upload: {uploadProgress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Thử lại"
              onPress={clearError}
              buttonStyle={styles.retryButton}
              titleStyle={styles.retryButtonText}
            />
          </View>
        ) : (
          <FlatList
            data={filteredDocuments}
            renderItem={renderDocumentItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            
            // Pagination
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
            
            // Refresh control
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
                tintColor="#2196F3"
              />
            }
            
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingDocument ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={24} color="#6c757d" />
                </TouchableOpacity>
              </View>

              <View style={styles.typeSelectionContainer}>
                <Text style={styles.typeLabel}>Loại tài liệu:</Text>
                <ButtonGroup
                  onPress={setDocumentType}
                  selectedIndex={documentType}
                  buttons={documentTypes}
                  containerStyle={styles.buttonGroupContainer}
                  selectedButtonStyle={styles.selectedButton}
                  selectedTextStyle={styles.selectedButtonText}
                  textStyle={styles.buttonGroupText}
                />
              </View>

              {watchedType === 'pdf' && !editingDocument && (
                <View style={styles.filePickerContainer}>
                  <Button
                    title={selectedFile ? `✓ ${selectedFile.name}` : "Chọn file từ thiết bị"}
                    onPress={pickDocument}
                    buttonStyle={styles.filePickerButton}
                    titleStyle={styles.filePickerButtonText}
                    icon={
                      <Icon
                        name={selectedFile ? "check-circle" : "attach-file"}
                        size={20}
                        color="#2196F3"
                        style={{ marginRight: 8 }}
                      />
                    }
                    type="outline"
                  />
                  <Text style={styles.helpText}>
                    📄 {selectedFile ? 'File đã chọn. URL sẽ tự động tạo sau khi upload.' : 'Chọn file từ thiết bị hoặc nhập URL PDF bên dưới'}
                  </Text>
                </View>
              )}

              <Controller
                control={control}
                name="title"
                rules={documentTitleValidator}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Tên tài liệu *"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    leftIcon={{ type: 'material', name: 'title', color: '#2196F3' }}
                    errorMessage={errors.title?.message}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.inputText}
                    errorStyle={styles.errorTextInput}
                  />
                )}
              />

              {/* URL field - only show when no file is selected for PDF, or for video/link types */}
              {(watchedType !== 'pdf' || !selectedFile) && (
                <Controller
                  control={control}
                  name="url"
                  rules={watchedType === 'pdf' && selectedFile ? {} : urlValidator}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder={
                        watchedType === 'video' ? "https://youtube.com/watch?v=..." : 
                        watchedType === 'pdf' ? "https://example.com/document.pdf" : 
                        "https://example.com"
                      }
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="url"
                      autoCapitalize="none"
                      leftIcon={{ type: 'material', name: 'link', color: '#2196F3' }}
                      errorMessage={errors.url?.message}
                      containerStyle={styles.inputContainer}
                      inputStyle={styles.inputText}
                      errorStyle={styles.errorTextInput}
                    />
                  )}
                />
              )}

              <Controller
                control={control}
                name="description"
                rules={documentDescriptionValidator}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Mô tả tài liệu (tùy chọn)"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={4}
                    leftIcon={{ type: 'material', name: 'description', color: '#2196F3' }}
                    containerStyle={styles.inputContainer}
                    inputStyle={[styles.inputText, styles.textAreaInput]}
                    errorStyle={styles.errorTextInput}
                  />
                )}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Hủy"
                  onPress={closeModal}
                  buttonStyle={styles.cancelButton}
                  titleStyle={styles.cancelButtonText}
                  type="outline"
                  disabled={submitting}
                />
                <Button
                  title={editingDocument ? 'Cập nhật' : 'Tạo'}
                  onPress={handleSubmit(onSubmit)}
                  buttonStyle={styles.submitButton}
                  titleStyle={styles.submitButtonText}
                  loading={submitting}
                  disabled={submitting}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
    color: '#212529',
  },
  createButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterList: {
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterTab: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  uploadContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  uploadText: {
    color: '#0c5460',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#bee5eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17a2b8',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  documentCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  documentIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    lineHeight: 22,
    marginBottom: 2,
  },
  ownerIndicator: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  documentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 12,
    marginLeft: 36,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentDate: {
    fontSize: 12,
    color: '#adb5bd',
    marginBottom: 2,
  },
  uploaderName: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: '#adb5bd',
  },
  typeContainer: {
    alignItems: 'flex-end',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCreateButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#6c757d',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  typeSelectionContainer: {
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  buttonGroupContainer: {
    borderRadius: 8,
    borderColor: '#2196F3',
    height: 40,
  },
  selectedButton: {
    backgroundColor: '#2196F3',
  },
  selectedButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonGroupText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  filePickerContainer: {
    marginBottom: 16,
  },
  filePickerButton: {
    borderColor: '#2196F3',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  filePickerButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#212529',
  },
  textAreaInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorTextInput: {
    fontSize: 12,
    color: '#dc3545',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    borderColor: '#6c757d',
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageDocumentScreen;