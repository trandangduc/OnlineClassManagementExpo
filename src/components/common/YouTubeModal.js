import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const YouTubeModal = ({ visible, onClose, videoUrl, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const extractVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getEmbedUrl = (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;
    
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&showinfo=0&controls=1&fs=1`;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const handleClose = () => {
    setLoading(true);
    setError(false);
    onClose();
  };

  if (!embedUrl) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color="#dc3545" />
            <Text style={styles.errorTitle}>URL không hợp lệ</Text>
            <Text style={styles.errorMessage}>
              Không thể phát video từ link này
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Icon name="play-circle-outline" size={24} color="#fff" />
              <Text style={styles.title} numberOfLines={1}>
                {title || 'Video YouTube'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={handleClose}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Video Container */}
          <View style={styles.videoContainer}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={styles.loadingText}>Đang tải video...</Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorVideoContainer}>
                <Icon name="error-outline" size={48} color="#dc3545" />
                <Text style={styles.errorTitle}>Không thể tải video</Text>
                <Text style={styles.errorMessage}>
                  Vui lòng kiểm tra kết nối internet và thử lại
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setError(false);
                    setLoading(true);
                  }}
                >
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView
                source={{ uri: embedUrl }}
                style={styles.webview}
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
                onError={handleError}
                allowsFullscreenVideo={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={false}
                scalesPageToFit={true}
                mixedContentMode="compatibility"
              />
            )}
          </View>

        
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.95,
    height: screenHeight * 0.8,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeIconButton: {
    padding: 4,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    margin: 20,
  },
  errorVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fullCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
  },
  fullCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default YouTubeModal;