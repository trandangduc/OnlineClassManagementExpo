import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native';
import { SearchBar, Card, Button, Badge, Header } from 'react-native-elements';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const CourseListScreen = ({ navigation }) => {
  const {
    userCourses,
    availableCourses,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    joinCourse,
    clearError
  } = useCourseViewModel();
  
  const { userProfile, handleSignOut, getUserDisplayName, getUserRole } = useAuthViewModel();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('enrolled');

  useEffect(() => {
    if (userProfile) {
      console.log('User profile loaded:', userProfile.email, getUserRole());
    }
  }, [userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    clearError();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleJoinCourse = async (courseId, courseTitle) => {
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
  };

  const handleCoursePress = (course) => {
    if (!course || !course.id) {
      Alert.alert('Lỗi', 'Thông tin môn học không hợp lệ');
      return;
    }

    navigation.navigate('CourseDetail', { 
      course,
      courseId: course.id 
    });
  };

  const handleSignOutPress = () => {
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
  };

  const getStudentCount = (course) => {
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
  };

  const renderCourseItem = ({ item: course }) => {
    const isEnrolled = activeTab === 'enrolled';
    const studentCount = getStudentCount(course);
    
    return (
      <TouchableOpacity
        onPress={() => handleCoursePress(course)}
        activeOpacity={0.7}
      >
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
            
            {!isEnrolled && userProfile?.isStudent?.() && (
              <Button
                title="Tham gia"
                onPress={() => handleJoinCourse(course.id, course.title)}
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
    );
  };

  const renderEmptyComponent = () => (
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
  );

  const currentCourses = activeTab === 'enrolled' ? userCourses : availableCourses;

  if (loading && !refreshing) {
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
            onPress={() => setActiveTab('enrolled')}
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
              onPress={() => setActiveTab('available')}
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
            data={currentCourses}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.id || Math.random().toString()}
            ListEmptyComponent={renderEmptyComponent}
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
});

export default CourseListScreen;