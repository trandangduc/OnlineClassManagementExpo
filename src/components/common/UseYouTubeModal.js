import { useState } from 'react';

export const useYouTubeModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [videoData, setVideoData] = useState({
    url: '',
    title: ''
  });

  const showVideo = (url, title = '') => {
    setVideoData({ url, title });
    setIsVisible(true);
  };

  const hideVideo = () => {
    setIsVisible(false);
    setTimeout(() => {
      setVideoData({ url: '', title: '' });
    }, 300);
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  return {
    isVisible,
    videoData,
    showVideo,
    hideVideo,
    isYouTubeUrl
  };
};