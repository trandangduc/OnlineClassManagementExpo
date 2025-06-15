import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Card, Header, Button, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TeacherDashboard = ({ navigation }) => {
  const {
    userCourses,
    loading,
    error,
    getCoursesStats,
    clearError
  } = useCourseViewModel();
  
  const { userProfile, handleSignOut, getUserDisplayName, getUserRole } = useAuthViewModel();
  
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (userProfile && !userProfile.isTeacher?.()) {
      Alert.alert(
        'Không có quyền truy cập',
        'Dashboard này chỉ dành cho giảng viên',
        [{ text: 'OK', onPress: () => navigation.navigate('CourseList') }]
      );
    }
  }, [userProfile, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    clearError();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleManageCourses = () => {
    navigation.navigate('ManageCourse');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  const stats = getCoursesStats();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: 'Dashboard Giảng viên',
          style: styles.headerTitle
        }}
        leftComponent={{
          icon: 'person',
          color: '#fff',
          onPress: handleViewProfile
        }}
        rightComponent={{
          icon: 'logout',
          color: '#fff',
          onPress: handleSignOutPress
        }}
        backgroundColor="#2196F3"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Card containerStyle={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleViewProfile}
              activeOpacity={0.7}
            >
              <Avatar
                rounded
                size="medium"
                title={getUserDisplayName()?.charAt(0)?.toUpperCase() || 'T'}
                containerStyle={styles.avatar}
                titleStyle={styles.avatarText}
              />
            </TouchableOpacity>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeGreeting}>
                {getGreeting()}!
              </Text>
              <Text style={styles.welcomeTitle}>
                {getUserDisplayName()}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {getUserRole()} • {userProfile?.email}
              </Text>
            </View>
          </View>
        </Card>
        <View style={styles.statsContainer}>
            <Card containerStyle={styles.statCardInner}>
              <View style={styles.statContent}>
                <Icon name="school" size={28} color="#2196F3" />
                <Text style={styles.statNumber}>{stats.totalCourses}</Text>
                <Text style={styles.statLabel}>Môn học</Text>
              </View>
            </Card>

          <Card containerStyle={styles.statCardInner}>
            <View style={styles.statContent}>
              <Icon name="group" size={28} color="#28a745" />
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Học sinh</Text>
            </View>
          </Card>

          <Card containerStyle={styles.statCardInner}>
            <View style={styles.statContent}>
              <Icon name="trending-up" size={28} color="#ffc107" />
              <Text style={styles.statNumber}>{stats.averageStudentsPerCourse}</Text>
              <Text style={styles.statLabel}>TB/Môn</Text>
            </View>
          </Card>
        </View>

  
        {userCourses.length === 0 && !loading && !error && (
          <Card containerStyle={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Icon name="school" size={64} color="#adb5bd" />
              <Text style={styles.emptyTitle}>Chưa có môn học</Text>
              <Text style={styles.emptyDescription}>
                Bắt đầu hành trình giảng dạy bằng cách tạo môn học đầu tiên của bạn
              </Text>
              <Button
                title="Tạo môn học đầu tiên"
                onPress={handleManageCourses}
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
          </Card>
        )}

        {error && (
          <Card containerStyle={styles.errorCard}>
            <View style={styles.errorContent}>
              <Icon name="error-outline" size={48} color="#dc3545" />
              <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
              <Text style={styles.errorDescription}>{error}</Text>
              <Button
                title="Thử lại"
                onPress={clearError}
                buttonStyle={styles.retryButton}
                titleStyle={styles.retryButtonText}
              />
            </View>
          </Card>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeCard: {
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  actionsCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    flex: 0.45,
    marginBottom: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
    textAlign: 'center',
  },
  recentCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  lastCourseItem: {
    borderBottomWidth: 0,
  },
  courseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F320',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseItemContent: {
    flex: 1,
  },
  courseItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  courseItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseItemSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  courseItemDate: {
    fontSize: 12,
    color: '#adb5bd',
    marginLeft: 4,
  },
  courseItemSubject: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 2,
  },
  courseItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseActionButton: {
    padding: 6,
    marginLeft: 4,
  },
  recentCoursesButtons: {
    marginTop: 12,
  },
  viewAllButton: {
    borderColor: '#2196F3',
    borderWidth: 1,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  createButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 0,
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginTop: 12,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TeacherDashboard;