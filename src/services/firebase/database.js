import { database } from './config';

export const databaseService = {
  createUser: async (uid, userData) => {
    try {
      const userWithTimestamp = {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      return await database.ref(`users/${uid}`).set(userWithTimestamp);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  getUser: async (uid) => {
    try {
      const snapshot = await database.ref(`users/${uid}`).once('value');
      const userData = snapshot.val();
      if (userData) {
        delete userData.password; 
      }
      return userData;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  updateUser: async (uid, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return await database.ref(`users/${uid}`).update(updateData);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const snapshot = await database.ref('users').once('value');
      const users = snapshot.val() || {};
      Object.keys(users).forEach(uid => {
        if (users[uid].password) {
          delete users[uid].password;
        }
      });
      
      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  },

  createCourse: async (courseId, courseData) => {
    try {
      const courseWithTimestamp = {
        ...courseData,
        id: courseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        students: {},
        documents: {}
      };
      return await database.ref(`courses/${courseId}`).set(courseWithTimestamp);
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
  },

  getCourse: async (courseId) => {
    try {
      const snapshot = await database.ref(`courses/${courseId}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Get course error:', error);
      throw error;
    }
  },

  getCourses: () => {
    return database.ref('courses');
  },

  getAllCourses: async () => {
    try {
      const snapshot = await database.ref('courses').once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Get all courses error:', error);
      throw error;
    }
  },

  updateCourse: async (courseId, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return await database.ref(`courses/${courseId}`).update(updateData);
    } catch (error) {
      console.error('Update course error:', error);
      throw error;
    }
  },

  deleteCourse: async (courseId) => {
    try {
      return await database.ref(`courses/${courseId}`).remove();
    } catch (error) {
      console.error('Delete course error:', error);
      throw error;
    }
  },

  createDocument: async (documentId, documentData) => {
    try {
      const docWithTimestamp = {
        ...documentData,
        id: documentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return await database.ref(`documents/${documentId}`).set(docWithTimestamp);
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  },

  getDocument: async (documentId) => {
    try {
      const snapshot = await database.ref(`documents/${documentId}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  getDocuments: (courseId) => {
    return database.ref('documents').orderByChild('courseId').equalTo(courseId);
  },

  getAllDocuments: async () => {
    try {
      const snapshot = await database.ref('documents').once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Get all documents error:', error);
      throw error;
    }
  },

  updateDocument: async (documentId, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return await database.ref(`documents/${documentId}`).update(updateData);
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  },

  deleteDocument: async (documentId) => {
    try {
      return await database.ref(`documents/${documentId}`).remove();
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },

  joinCourse: async (courseId, studentId) => {
    try {
      const joinData = {
        joinedAt: new Date().toISOString(),
        isActive: true
      };
      
      await database.ref(`courses/${courseId}/students/${studentId}`).set(joinData);
      
      await database.ref(`users/${studentId}/enrolledCourses/${courseId}`).set(joinData);
      
      console.log(`Student ${studentId} joined course ${courseId}`);
      return true;
    } catch (error) {
      console.error('Join course error:', error);
      throw error;
    }
  },

  leaveCourse: async (courseId, studentId) => {
    try {
      await database.ref(`courses/${courseId}/students/${studentId}`).remove();
      
      await database.ref(`users/${studentId}/enrolledCourses/${courseId}`).remove();
      
      console.log(`Student ${studentId} left course ${courseId}`);
      return true;
    } catch (error) {
      console.error('Leave course error:', error);
      throw error;
    }
  },

  getCourseStudents: async (courseId) => {
    try {
      const snapshot = await database.ref(`courses/${courseId}/students`).once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Get course students error:', error);
      throw error;
    }
  },

  getStudentCourses: async (studentId) => {
    try {
      const snapshot = await database.ref(`users/${studentId}/enrolledCourses`).once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Get student courses error:', error);
      throw error;
    }
  },

  generateId: (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  listenToCourses: (callback) => {
    return database.ref('courses').on('value', callback);
  },

  listenToDocuments: (courseId, callback) => {
    return database.ref('documents').orderByChild('courseId').equalTo(courseId).on('value', callback);
  },

  listenToUser: (uid, callback) => {
    return database.ref(`users/${uid}`).on('value', callback);
  },

  removeCourseListener: () => {
    database.ref('courses').off();
  },

  removeDocumentListener: (courseId) => {
    database.ref('documents').orderByChild('courseId').equalTo(courseId).off();
  },

  removeUserListener: (uid) => {
    database.ref(`users/${uid}`).off();
  }
};