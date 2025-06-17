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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SearchBar, Card, Button, Input, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm, Controller } from 'react-hook-form';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  courseTitleValidator, 
  courseDescriptionValidator 
} from '../../utils/validators';
import { formatDate } from '../../utils/helpers';

const COURSE_ITEM_HEIGHT = 280; 

const ManageCourseScreen = ({ navigation }) => {
  const {
    userCourses,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createCourse,
    updateCourse,
    deleteCourse,
    getCoursesStats,
    clearError,
    loadMoreUserCourses,
    hasMoreUserCourses,
    resetPagination
  } = useCourseViewModel();

  const { handleSignOut, userProfile, getUserDisplayName } = useAuthViewModel();
  
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      semester: ''
    }
  });

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return userCourses;
    
    const query = searchQuery.toLowerCase();
    return userCourses.filter(course => 
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.subject?.toLowerCase().includes(query) ||
      course.semester?.toLowerCase().includes(query)
    );
  }, [userCourses, searchQuery]);

  const stats = useMemo(() => getCoursesStats(), [getCoursesStats]);

  useEffect(() => {
    if (userProfile && !userProfile.isTeacher?.()) {
      Alert.alert(
        'Không có quyền truy cập',
        'Chỉ giảng viên mới có thể quản lý môn học',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [userProfile, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearError();
    resetPagination();
    
    try {
      await loadMoreUserCourses(true); 
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [clearError, resetPagination, loadMoreUserCourses]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMoreUserCourses || searchQuery.trim()) {
      return; 
    }

    setLoadingMore(true);
    try {
      await loadMoreUserCourses();
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMoreUserCourses, searchQuery, loadMoreUserCourses]);

  const openCreateModal = useCallback(() => {
    setEditingCourse(null);
    reset({
      title: '',
      description: '',
      subject: '',
      semester: ''
    });
    setModalVisible(true);
  }, [reset]);

  const openEditModal = useCallback((course) => {
    setEditingCourse(course);
    reset({
      title: course.title || '',
      description: course.description || '',
      subject: course.subject || '',
      semester: course.semester || ''
    });
    setModalVisible(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingCourse(null);
    setSubmitting(false);
    reset({
      title: '',
      description: '',
      subject: '',
      semester: ''
    });
  }, [reset]);

  const onSubmit = useCallback(async (data) => {
    try {
      setSubmitting(true);
      const cleanData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        subject: data.subject?.trim() || '',
        semester: data.semester?.trim() || ''
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, cleanData);
        Alert.alert('Thành công', 'Cập nhật môn học thành công!');
      } else {
        await createCourse(cleanData);
        Alert.alert('Thành công', 'Tạo môn học thành công!');
      }
      closeModal();
    } catch (error) {
      console.error('Course submit error:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }, [editingCourse, updateCourse, createCourse, closeModal]);

  const handleDeleteCourse = useCallback((course) => {
    Alert.alert(
      'Xóa môn học',
      `Bạn có chắc muốn xóa môn học "${course.title}"?\n\nTất cả tài liệu và dữ liệu liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(course.id);
              Alert.alert('Thành công', 'Đã xóa môn học thành công!');
            } catch (error) {
              console.error('Delete course error:', error);
              Alert.alert('Lỗi', error.message || 'Không thể xóa môn học');
            }
          }
        }
      ]
    );
  }, [deleteCourse]);

  const handleViewCourse = useCallback((course) => {
    navigation.navigate('CourseDetail', {
      course,
      courseId: course.id
    });
  }, [navigation]);

  const handleManageDocuments = useCallback((course) => {
    navigation.navigate('ManageDocument', {
      course,
      courseId: course.id,
      courseName: course.title
    });
  }, [navigation]);

  const handleSignOutPress = useCallback(() => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: handleSignOut }
      ]
    );
  }, [handleSignOut]);

  const getStudentCount = useCallback((course) => {
    try {
      if (course.getStudentCount && typeof course.getStudentCount === 'function') {
        return course.getStudentCount();
      }
      
      if (course.students && typeof course.students === 'object') {
        return Object.keys(course.students).length;
      }
      
      return 0;
    } catch (error) {
      console.warn('Error getting student count:', error);
      return 0;
    }
  }, []);
  const CourseCard = React.memo(({ course, onView, onEdit, onDelete, onManageDocuments, getStudentCount }) => {
    const studentCount = getStudentCount(course);
    
    return (
      <Card containerStyle={styles.courseCard}>
        <TouchableOpacity
          onPress={() => onView(course)}
          activeOpacity={0.7}
        >
          <View style={styles.courseHeader}>
            <View style={styles.courseTitleContainer}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.title || 'Không có tiêu đề'}
              </Text>
              {course.subject && (
                <Text style={styles.courseSubject}>
                  {course.subject}
                </Text>
              )}
            </View>
            <View style={styles.courseActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(course)}
              >
                <Icon name="edit" size={20} color="#ffc107" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDelete(course)}
              >
                <Icon name="delete" size={20} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.courseDescription} numberOfLines={3}>
            {course.description || 'Không có mô tả'}
          </Text>
          <View style={styles.courseInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Icon name="group" size={16} color="#6c757d" />
                <Text style={styles.infoText}>
                  {studentCount} học sinh
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="event" size={16} color="#6c757d" />
                <Text style={styles.infoText}>
                  {formatDate(course.createdAt)}
                </Text>
              </View>
            </View>
            
            {course.semester && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Icon name="schedule" size={16} color="#6c757d" />
                  <Text style={styles.infoText}>
                    {course.semester}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.courseButtons}>
          <Button
            title="Tài liệu"
            onPress={() => onManageDocuments(course)}
            buttonStyle={[styles.actionButtonStyle, styles.documentsButton]}
            titleStyle={styles.actionButtonText}
            icon={
              <Icon
                name="folder"
                size={16}
                color="#fff"
                style={{ marginRight: 4 }}
              />
            }
          />
        </View>
      </Card>
    );
  });

  const renderCourseItem = useCallback(({ item: course }) => (
    <CourseCard
      course={course}
      onView={handleViewCourse}
      onEdit={openEditModal}
      onDelete={handleDeleteCourse}
      onManageDocuments={handleManageDocuments}
      getStudentCount={getStudentCount}
    />
  ), [handleViewCourse, openEditModal, handleDeleteCourse, handleManageDocuments, getStudentCount]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="school" size={64} color="#adb5bd" />
      <Text style={styles.emptyTitle}>Chưa có môn học nào</Text>
      <Text style={styles.emptyDescription}>
        Bắt đầu bằng cách tạo môn học đầu tiên của bạn
      </Text>
      <Button
        title="Tạo môn học"
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
    </View>
  ), [openCreateModal]);

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
    length: COURSE_ITEM_HEIGHT,
    offset: COURSE_ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item) => item.id || Math.random().toString(), []);

  if (loading && !refreshing && userCourses.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: 'Quản lý môn học',
          style: styles.headerTitle
        }}
        rightComponent={{
          icon: 'logout',
          color: '#fff',
          onPress: handleSignOutPress
        }}
        backgroundColor="#2196F3"
      />

      <View style={styles.content}>
        <Card containerStyle={styles.statsCard}>
          <View style={styles.statsContainer}>
            <Text style={styles.welcomeText}>
              Xin chào, {getUserDisplayName()}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalCourses}</Text>
                <Text style={styles.statLabel}>Môn học</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalStudents}</Text>
                <Text style={styles.statLabel}>Học sinh</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.averageStudentsPerCourse}</Text>
                <Text style={styles.statLabel}>TB/môn</Text>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.topContainer}>
          <SearchBar
            placeholder="Tìm kiếm môn học..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            containerStyle={styles.searchContainer}
            inputContainerStyle={styles.searchInputContainer}
            inputStyle={styles.searchInput}
            searchIcon={{ color: '#2196F3' }}
            clearIcon={{ color: '#2196F3' }}
          />
          <Button
            title="Tạo môn học"
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
            data={filteredCourses}
            renderItem={renderCourseItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            initialNumToRender={8}
            maxToRenderPerBatch={4}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
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
                  {editingCourse ? 'Chỉnh sửa môn học' : 'Tạo môn học mới'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={24} color="#6c757d" />
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="title"
                rules={courseTitleValidator}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Tên môn học *"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    leftIcon={{ type: 'material', name: 'school', color: '#2196F3' }}
                    errorMessage={errors.title?.message}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.inputText}
                    errorStyle={styles.errorTextInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="subject"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Môn học (VD: Toán học, Vật lý...)"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    leftIcon={{ type: 'material', name: 'book', color: '#2196F3' }}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.inputText}
                    errorStyle={styles.errorTextInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="semester"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Học kỳ (VD: HK1 2024-2025)"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    leftIcon={{ type: 'material', name: 'schedule', color: '#2196F3' }}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.inputText}
                    errorStyle={styles.errorTextInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                rules={courseDescriptionValidator}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Mô tả môn học (tùy chọn)"
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
                  title={editingCourse ? 'Cập nhật' : 'Tạo'}
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
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  welcomeText: {
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
    fontSize: 24,
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
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  courseCard: {
    borderRadius: 12,
    marginBottom: 16,
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
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  courseSubject: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  courseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 16,
  },
  courseInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 6,
  },
  courseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonStyle: {
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  documentsButton: {
    backgroundColor: '#2196F3',
  },
  studentsButton: {
    backgroundColor: '#17a2b8',
  },
  actionButtonText: {
    fontSize: 14,
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

export default ManageCourseScreen;