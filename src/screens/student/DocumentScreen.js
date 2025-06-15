import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { SearchBar, Card, Button, Badge, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDocumentViewModel } from '../../viewmodels/DocumentViewModel';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import { useCourseViewModel } from '../../viewmodels/CourseViewModel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import YouTubeModal from '../../components/common/YouTubeModal'; 
import { useYouTubeModal } from '../../components/common/UseYouTubeModal';
import { 
  formatDate, 
  formatFileSize, 
  getDocumentIcon, 
  getDocumentColor,
  isYouTubeUrl 
} from '../../utils/helpers';

const DocumentScreen = ({ route, navigation }) => {
  const { course, courseId, courseName } = route.params;
  const { userProfile } = useAuthViewModel();
  const { canManageCourse } = useCourseViewModel();
  const {
    documents,
    loading,
    error,
    downloadDocument,
    deleteDocument,
    getDocumentsByType,
    searchDocuments,
    canManageDocument,
    clearError
  } = useDocumentViewModel(courseId);

  const { isVisible, videoData, showVideo, hideVideo } = useYouTubeModal();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); 

  const isTeacher = userProfile?.isTeacher?.();
  const canManage = canManageCourse(course);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: courseName ? `Tài liệu - ${courseName}` : 'Tài liệu',
      headerTitleStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      },
      headerRight: () => canManage ? (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleAddDocument}
        >
          <Icon name="add" size={24} color="#2196F3" />
        </TouchableOpacity>
      ) : null
    });
  }, [navigation, courseName, canManage]);

  const onRefresh = async () => {
    setRefreshing(true);
    clearError();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddDocument = () => {
    navigation.navigate('AddDocument', {
      course,
      courseId: courseId
    });
  };

  const handleDocumentPress = async (document) => {
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
      
      if (isYouTubeUrl(url)) {
        showVideo(url, document.title);
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
  };

  const handleDocumentLongPress = (document) => {
    if (!canManageDocument(document)) {
      return;
    }

    const options = ['Chỉnh sửa', 'Xóa', 'Hủy'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: document.title,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleEditDocument(document);
          } else if (buttonIndex === 1) {
            handleDeleteDocument(document);
          }
        }
      );
    } else {
      Alert.alert(
        document.title,
        'Chọn hành động',
        [
          { text: 'Chỉnh sửa', onPress: () => handleEditDocument(document) },
          { 
            text: 'Xóa', 
            style: 'destructive',
            onPress: () => handleDeleteDocument(document) 
          },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    }
  };

  const handleEditDocument = (document) => {
    navigation.navigate('EditDocument', {
      document,
      course,
      courseId
    });
  };

  const handleDeleteDocument = (document) => {
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
              Alert.alert('Thành công', 'Đã xóa tài liệu');
            } catch (error) {
              console.error('Delete document error:', error);
              Alert.alert('Lỗi', error.message || 'Không thể xóa tài liệu');
            }
          }
        }
      ]
    );
  };

  const getFilteredDocuments = () => {
    let filteredDocs = documents;
    if (selectedType !== 'all') {
      filteredDocs = getDocumentsByType(selectedType);
    }
    if (searchQuery.trim()) {
      filteredDocs = searchDocuments(searchQuery);
      if (selectedType !== 'all') {
        filteredDocs = filteredDocs.filter(doc => doc.type === selectedType);
      }
    }

    return filteredDocs;
  };

  const getDocumentIconWithYouTube = (type, url) => {
    if (isYouTubeUrl(url)) {
      return 'smart-display';
    }
    return getDocumentIcon(type);
  };

  const getDocumentColorWithYouTube = (type, url) => {
    if (isYouTubeUrl(url)) {
      return '#ff0000';
    }
    return getDocumentColor(type);
  };

  const renderFilterTab = (type, label, count) => {
    const isActive = selectedType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.filterTab, isActive && styles.activeFilterTab]}
        onPress={() => setSelectedType(type)}
      >
        <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDocumentItem = ({ item: document }) => {
    const canManageThis = canManageDocument(document);
    const isYouTubeVideo = isYouTubeUrl(document.url);
    
    return (
      <Card containerStyle={styles.documentCard}>
        <TouchableOpacity
          onPress={() => handleDocumentPress(document)}
          onLongPress={() => handleDocumentLongPress(document)}
          activeOpacity={0.7}
        >
          <View style={styles.documentHeader}>
            <View style={styles.documentTitleContainer}>
              <Icon
                name={getDocumentIconWithYouTube(document.type, document.url)}
                size={24}
                color={getDocumentColorWithYouTube(document.type, document.url)}
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
                {isYouTubeVideo && (
                  <Text style={styles.youtubeIndicator}>
                    Video YouTube
                  </Text>
                )}
              </View>
            </View>
            <Badge
              value={isYouTubeVideo ? 'YOUTUBE' : (document.type?.toUpperCase() || 'FILE')}
              badgeStyle={[
                styles.typeBadge,
                { backgroundColor: getDocumentColorWithYouTube(document.type, document.url) }
              ]}
              textStyle={styles.badgeText}
            />
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

            <View style={styles.documentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDocumentPress(document)}
              >
                <Icon 
                  name={isYouTubeVideo ? "play-arrow" : "open-in-new"} 
                  size={20} 
                  color={isYouTubeVideo ? "#ff0000" : "#2196F3"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-open" size={64} color="#adb5bd" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? 'Thử tìm kiếm với từ khóa khác'
          : 'Giảng viên chưa upload tài liệu nào cho môn học này'
        }
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  const filteredDocuments = getFilteredDocuments();
  const allCount = documents.length;
  const pdfCount = getDocumentsByType('pdf').length;
  const videoCount = getDocumentsByType('video').length;
  const linkCount = getDocumentsByType('link').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SearchBar
          placeholder="Tìm kiếm tài liệu..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          containerStyle={styles.searchContainer}
          inputContainerStyle={styles.searchInputContainer}
          inputStyle={styles.searchInput}
          searchIcon={{
            type: 'material',
            name: 'search',
            color: '#2196F3'
          }}
          clearIcon={{
            type: 'material', 
            name: 'clear',
            color: '#2196F3'
          }}
        />

        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { type: 'all', label: 'Tất cả', count: allCount },
              { type: 'pdf', label: 'PDF', count: pdfCount },
              { type: 'video', label: 'Video', count: videoCount },
              { type: 'link', label: 'Link', count: linkCount },
            ]}
            renderItem={({ item }) => renderFilterTab(item.type, item.label, item.count)}
            keyExtractor={(item) => item.type}
            contentContainerStyle={styles.filterList}
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
            data={filteredDocuments}
            renderItem={renderDocumentItem}
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
      <YouTubeModal
        visible={isVisible}
        onClose={hideVideo}
        videoUrl={videoData.url}
        title={videoData.title}
      />
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
  headerButton: {
    marginRight: 16,
    padding: 4,
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
  youtubeIndicator: {
    fontSize: 12,
    color: '#ff0000',
    fontWeight: '500',
    marginTop: 2,
  },
  typeBadge: {
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
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
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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

export default DocumentScreen;