import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheService {
  constructor() {
    this.CACHE_KEYS = {
      COURSES: 'cached_courses',
      DOCUMENTS: 'cached_documents',
      USER_PROFILE: 'cached_user_profile'
    };
  }

  async setCourses(courses) {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.COURSES, JSON.stringify(courses));
    } catch (error) {
      console.error('Error caching courses:', error);
    }
  }

  async getCourses() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.COURSES);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached courses:', error);
      return null;
    }
  }

  async setDocuments(courseId, documents) {
    try {
      await AsyncStorage.setItem(`${this.CACHE_KEYS.DOCUMENTS}_${courseId}`, JSON.stringify(documents));
    } catch (error) {
      console.error('Error caching documents:', error);
    }
  }

  async getDocuments(courseId) {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_KEYS.DOCUMENTS}_${courseId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached documents:', error);
      return null;
    }
  }

  async setUserProfile(profile) {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error caching user profile:', error);
    }
  }

  async getUserProfile() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached user profile:', error);
      return null;
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cached_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default new CacheService();