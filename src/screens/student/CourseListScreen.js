import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SearchBar, Card, Button, Badge, Header } from 'react-native-elements';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const ITEMS_PER_PAGE = 20;
const COURSE_ITEM_HEIGHT = 220; 

const CourseListScreen = ({ navigation }) => {
  const {
    userCourses,
    availableCourses,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    joinCourse,
    clearError,
    loadMoreUserCourses,
    loadMoreAvailableCourses,
    hasMoreUserCourses,
    hasMoreAvailableCourses,
    resetPagination
  } = useCourseViewModel();
  
  const { userProfile, handleSignOut, getUserDisplayName, getUserRole } = useAuthViewModel();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('enrolled');
  const [loadingMore, setLoadingMore] = useState(false);

  const currentCourses = useMemo(() => {
    return activeTab === 'enrolled' ? userCourses : availableCourses;
  }, [activeTab, userCourses, availableCourses]);

  const hasMoreData = useMemo(() => {
    return activeTab === 'enrolled' ? hasMoreUserCourses : hasMoreAvailableCourses;
  }, [activeTab, hasMoreUserCourses, hasMoreAvailableCourses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return currentCourses;
    
    return currentCourses.filter(course => 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentCourses, searchQuery]);

  useEffect(() => {
    if (userProfile) {
      console.log('User profile loaded:', userProfile.email, getUserRole());
    }
  }, [userProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearError();
    resetPagination();
    
    try {
      if (activeTab === 'enrolled') {
        await loadMoreUserCourses(true);
      } else {
        await loadMoreAvailableCourses(true);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, clearError, resetPagination, loadMoreUserCourses, loadMoreAvailableCourses]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMoreData || searchQuery.trim()) {
      return; 
    }

    setLoadingMore(true);
    try {
      if (activeTab === 'enrolled') {
        await loadMoreUserCourses();
      } else {
        await loadMoreAvailableCourses();
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMoreData, searchQuery, activeTab, loadMoreUserCourses, loadMoreAvailableCourses]);

  const handleTabChange = useCallback((newTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      setSearchQuery(''); 
    }
  }, [activeTab, setSearchQuery]);

  const handleJoinCourse = useCallback(async (courseId, courseTitle) => {
    try {
      if (!userProfile) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      Alert.alert(
        'Tham gia môn học',
        `Bạn có muốn tham gia môn học "${courseTitle}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Tham gia', 
            onPress: async () => {
              try {
                await joinCourse(courseId);
                Alert.alert('Thành công', 'Đã tham gia môn học thành công!');
                setActiveTab('enrolled');
              } catch (error) {
                console.error('Join course error:', error);
                Alert.alert('Lỗi', error.message || 'Không thể tham gia môn học');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }, [userProfile, joinCourse]);

  const handleCoursePress = useCallback((course) => {
    if (!course || !course.id) {
      Alert.alert('Lỗi', 'Thông tin môn học không hợp lệ');
      return;
    }

    navigation.navigate('CourseDetail', { 
      course,
      courseId: course.id 
    });
  }, [navigation]);

  const handleSignOutPress = useCallback(() => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          onPress: async () => {
            try {
              await handleSignOut();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể đăng xuất');
            }
          }
        }
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

  const renderCourseItem = useCallback(({ item: course }) => {
    const isEnrolled = activeTab === 'enrolled';
    const studentCount = getStudentCount(course);
    
    return (
      <CourseCard
        course={course}
        isEnrolled={isEnrolled}
        studentCount={studentCount}
        onPress={() => handleCoursePress(course)}
        onJoin={() => handleJoinCourse(course.id, course.title)}
        showJoinButton={!isEnrolled && userProfile?.isStudent?.()}
        loading={loading}
      />
    );
  }, [activeTab, getStudentCount, handleCoursePress, handleJoinCourse, userProfile, loading]);

  const CourseCard = React.memo(({ course, isEnrolled, studentCount, onPress, onJoin, showJoinButton, loading }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.courseCard}>
        <View style={styles.courseHeader}>
          <View style={styles.courseTitleContainer}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {course.title || 'Không có tiêu đề'}
            </Text>
            {isEnrolled && (
              <Badge
                value="Đã tham gia"
                status="success"
                containerStyle={styles.badgeContainer}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>
        
        <Text style={styles.courseDescription} numberOfLines={3}>
          {course.description || 'Không có mô tả'}
        </Text>
        
        <View style={styles.courseFooter}>
          <View style={styles.courseInfo}>
            <Text style={styles.teacherName}>
              Giảng viên: {course.teacherName || 'Không xác định'}
            </Text>
            <Text style={styles.studentCount}>
              {studentCount} học sinh
            </Text>
            {course.subject && (
              <Text style={styles.courseSubject}>
                Môn: {course.subject}
              </Text>
            )}
          </View>
          
          {showJoinButton && (
            <Button
              title="Tham gia"
              onPress={onJoin}
              buttonStyle={styles.joinButton}
              titleStyle={styles.joinButtonText}
              disabled={loading}
            />
          )}
        </View>
        
        <Text style={styles.createdDate}>
          Tạo: {formatDate(course.createdAt)}
        </Text>
      </Card>
    </TouchableOpacity>
  ));

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {activeTab === 'enrolled' 
          ? 'Chưa tham gia môn học nào' 
          : 'Không có môn học khả dụng'
        }
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'enrolled'
          ? userProfile?.isStudent?.()
            ? 'Hãy tham gia các môn học để bắt đầu học tập'
            : 'Hãy tạo môn học mới để bắt đầu giảng dạy'
          : 'Hiện tại không có môn học nào để tham gia'
        }
      </Text>
      
      {activeTab === 'enrolled' && userProfile?.isTeacher?.() && (
        <Button
          title="Tạo môn học mới"
          onPress={() => navigation.navigate('CreateCourse')}
          buttonStyle={styles.createCourseButton}
          titleStyle={styles.createCourseButtonText}
        />
      )}
    </View>
  ), [activeTab, userProfile, navigation]);

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

  if (loading && !refreshing && currentCourses.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: 'Môn Học',
          style: styles.headerTitle
        }}
        leftComponent={{
          icon: 'person',
          color: '#fff',
          onPress: () => navigation.navigate('Profile')
        }}
        rightComponent={{
          icon: 'logout',
          color: '#fff',
          onPress: handleSignOutPress
        }}
        backgroundColor="#2196F3"
      />

      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>
          Xin chào, {getUserDisplayName()}
        </Text>
        <Text style={styles.roleText}>
          {getUserRole()}
        </Text>
      </View>

      <View style={styles.content}>
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

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'enrolled' && styles.activeTab
            ]}
            onPress={() => handleTabChange('enrolled')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'enrolled' && styles.activeTabText
            ]}>
              {userProfile?.isTeacher?.() ? 'Môn dạy' : 'Đã tham gia'} ({userCourses.length})
            </Text>
          </TouchableOpacity>
          
          {userProfile?.isStudent?.() && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'available' && styles.activeTab
              ]}
              onPress={() => handleTabChange('available')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'available' && styles.activeTabText
              ]}>
                Khả dụng ({availableCourses.length})
              </Text>
            </TouchableOpacity>
          )}
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
            initialNumToRender={10}
            maxToRenderPerBatch={5}
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
  userInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  roleText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
    color: '#212529',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  activeTabText: {
    color: '#fff',
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
    marginBottom: 12,
  },
  courseTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 16,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  studentCount: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  courseSubject: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  joinButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createdDate: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  createCourseButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createCourseButtonText: {
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
});

export default CourseListScreen;