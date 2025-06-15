import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Card, Button, Badge, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDocumentViewModel } from '../../viewmodels/DocumentViewModel';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, getDocumentIcon, getDocumentColor } from '../../utils/helpers';

const CourseDetailScreen = ({ route, navigation }) => {
  const { course, courseId } = route.params;
  const { userProfile } = useAuthViewModel();
  const { leaveCourse, getCourseById, canManageCourse } = useCourseViewModel();
  const {
    documents,
    loading,
    error,
    getDocumentStats
  } = useDocumentViewModel(courseId || course?.id);

  const [refreshing, setRefreshing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(course);

  useEffect(() => {
    if (courseId) {
      const updatedCourse = getCourseById(courseId);
      if (updatedCourse) {
        setCurrentCourse(updatedCourse);
      }
    }
  }, [courseId, getCourseById]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: currentCourse?.title || 'Chi tiết môn học',
      headerTitleStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    });
  }, [navigation, currentCourse]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLeaveCourse = () => {
    if (!userProfile?.isStudent?.()) {
      Alert.alert('Thông báo', 'Chỉ học sinh mới có thể rời khỏi môn học');
      return;
    }

    Alert.alert(
      'Rời khỏi môn học',
      `Bạn có chắc muốn rời khỏi môn học "${currentCourse.title}"?\n\nBạn sẽ không thể truy cập tài liệu và nội dung của môn học này nữa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời khỏi',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCourse(currentCourse.id);
              Alert.alert('Thành công', 'Đã rời khỏi môn học', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Leave course error:', error);
              Alert.alert('Lỗi', error.message || 'Không thể rời khỏi môn học');
            }
          }
        }
      ]
    );
  };

  const handleViewDocuments = () => {
    navigation.navigate('Documents', { 
      course: currentCourse,
      courseId: currentCourse.id,
      courseName: currentCourse.title
    });
  };

  const getStudentCount = () => {
    try {
      if (currentCourse.getStudentCount && typeof currentCourse.getStudentCount === 'function') {
        return currentCourse.getStudentCount();
      }
      
      if (currentCourse.students && typeof currentCourse.students === 'object') {
        return Object.keys(currentCourse.students).length;
      }
      
      return 0;
    } catch (error) {
      console.warn('Error getting student count:', error);
      return 0;
    }
  };

  const renderDocumentTypeCard = (type, count, title) => {
    const icon = getDocumentIcon(type);
    const color = getDocumentColor(type);

    return (
      <TouchableOpacity
        style={styles.docTypeCard}
        onPress={handleViewDocuments}
        activeOpacity={0.7}
      >
        <View style={[styles.docTypeIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <Text style={styles.docTypeCount}>{count}</Text>
        <Text style={styles.docTypeTitle}>{title}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (!currentCourse) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy thông tin môn học</Text>
          <Button
            title="Quay lại"
            onPress={() => navigation.goBack()}
            buttonStyle={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const docStats = getDocumentStats();
  const isStudent = userProfile?.isStudent?.();
  const canManage = canManageCourse(currentCourse);
  const isEnrolled = currentCourse.isStudentEnrolled ? currentCourse.isStudentEnrolled(userProfile?.uid) : false;

  return (
    <SafeAreaView style={styles.container}>
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
        <Card containerStyle={styles.courseCard}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{currentCourse.title}</Text>
            <View style={styles.badges}>
              {isEnrolled && (
                <Badge
                  value="Đã tham gia"
                  status="success"
                  containerStyle={styles.badgeContainer}
                />
              )}
              {canManage && (
                <Badge
                  value="Quản lý"
                  status="primary"
                  containerStyle={[styles.badgeContainer, { marginLeft: 8 }]}
                />
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.courseDescription}>
            {currentCourse.description || 'Không có mô tả'}
          </Text>

          <View style={styles.courseInfoContainer}>
            <View style={styles.courseInfoRow}>
              <View style={styles.infoItem}>
                <Icon name="person" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  Giảng viên: {currentCourse.teacherName || 'Không xác định'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="group" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  {getStudentCount()} học sinh
                </Text>
              </View>
            </View>

            {currentCourse.subject && (
              <View style={styles.courseInfoRow}>
                <View style={styles.infoItem}>
                  <Icon name="book" size={20} color="#2196F3" />
                  <Text style={styles.infoText}>
                    Môn học: {currentCourse.subject}
                  </Text>
                </View>
                {currentCourse.semester && (
                  <View style={styles.infoItem}>
                    <Icon name="schedule" size={20} color="#2196F3" />
                    <Text style={styles.infoText}>
                      Học kỳ: {currentCourse.semester}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.courseInfoRow}>
              <View style={styles.infoItem}>
                <Icon name="event" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  Tạo: {formatDate(currentCourse.createdAt)}
                </Text>
              </View>
              {currentCourse.updatedAt && currentCourse.updatedAt !== currentCourse.createdAt && (
                <View style={styles.infoItem}>
                  <Icon name="update" size={20} color="#2196F3" />
                  <Text style={styles.infoText}>
                    Cập nhật: {formatDate(currentCourse.updatedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Card containerStyle={styles.documentsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tài liệu môn học</Text>
            <TouchableOpacity onPress={handleViewDocuments}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.docTypesContainer}>
              {renderDocumentTypeCard('pdf', docStats.pdf, 'PDF')}
              {renderDocumentTypeCard('video', docStats.video, 'Video')}
              {renderDocumentTypeCard('link', docStats.link, 'Link')}
            </View>
          )}

          <Divider style={styles.divider} />

          <Button
            title="Xem tất cả tài liệu"
            onPress={handleViewDocuments}
            icon={
              <Icon
                name="folder-open"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            }
            buttonStyle={styles.viewDocumentsButton}
            titleStyle={styles.buttonText}
          />
        </Card>

        {isStudent && isEnrolled && (
          <Card containerStyle={styles.actionsCard}>
            <Text style={styles.cardTitle}>Hành động</Text>
            <Button
              title="Rời khỏi môn học"
              onPress={handleLeaveCourse}
              icon={
                <Icon
                  name="exit-to-app"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
              }
              buttonStyle={styles.leaveButton}
              titleStyle={styles.buttonText}
              containerStyle={canManage ? styles.buttonSpacing : {}}
            />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  courseCard: {
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
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
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    marginTop: 2,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#e9ecef',
  },
  courseDescription: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 16,
  },
  courseInfoContainer: {
    marginTop: 8,
  },
  courseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
  },
  documentsCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  docTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  docTypeCard: {
    alignItems: 'center',
    flex: 1,
    padding: 16,
  },
  docTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  docTypeCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  docTypeTitle: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  viewDocumentsButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
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
  leaveButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonSpacing: {
    marginTop: 12,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
});

export default CourseDetailScreen;