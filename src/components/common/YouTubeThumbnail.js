import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const YouTubeThumbnail = ({ videoUrl, title, onPress, style }) => {
  const extractVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnailUrl = (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const thumbnailUrl = getThumbnailUrl(videoUrl);

  if (!thumbnailUrl) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.errorContainer, style]} 
        onPress={onPress}
      >
        <Icon name="error-outline" size={32} color="#dc3545" />
        <Text style={styles.errorText}>Không thể tải thumbnail</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <View style={styles.playButton}>
          <Icon name="play-arrow" size={32} color="#fff" />
        </View>
      </View>

      <View style={styles.youtubeLogo}>
        <Text style={styles.youtubeText}>YouTube</Text>
      </View>

      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  youtubeLogo: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  youtubeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default YouTubeThumbnail;