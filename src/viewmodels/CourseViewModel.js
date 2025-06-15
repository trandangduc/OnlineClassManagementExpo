import { useState, useEffect } from 'react';
import { database } from '../services/firebase/config';
import { Course } from '../models/Course';
import CacheService from '../services/cache/CacheService';
import { useAuth } from '../contexts/AuthContext';
import { searchVietnamese, sortByProperty } from '../utils/helpers';

export const useCourseViewModel = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const setupCourseStream = async () => {
      try {
        setLoading(true);
        const cachedCourses = await CacheService.getCourses();
        if (cachedCourses && cachedCourses.length > 0) {
          setCourses(cachedCourses);
          setLoading(false);
        }

        const coursesRef = database.ref('courses');
        
        unsubscribe = coursesRef.on('value', async (snapshot) => {
          try {
            if (snapshot.exists()) {
              const coursesData = [];
              snapshot.forEach((childSnapshot) => {
                const courseData = {
                  id: childSnapshot.key,
                  ...childSnapshot.val()
                };
                coursesData.push(Course.fromDatabase(courseData));
              });
              
              const sortedCourses = sortByProperty(coursesData, 'createdAt', 'desc');
              
              setCourses(sortedCourses);
              await CacheService.setCourses(sortedCourses);
            } else {
              setCourses([]);
            }
            setLoading(false);
          } catch (error) {
            console.error('Course data processing error:', error);
            setError('Không thể xử lý dữ liệu môn học');
            setLoading(false);
          }
        }, (error) => {
          console.error('Course stream error:', error);
          setError('Không thể tải danh sách môn học');
          setLoading(false);
        });
      } catch (error) {
        console.error('Setup course stream error:', error);
        setError('Có lỗi xảy ra');
        setLoading(false);
      }
    };

    setupCourseStream();

    return () => {
      if (unsubscribe) {
        database.ref('courses').off('value', unsubscribe);
      }
    };
  }, []);

  const createCourse = async (courseData) => {
    try {
      setError('');
      
      if (!courseData.title?.trim()) {
        throw new Error('Tên môn học không được để trống');
      }
      
      if (!userProfile) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      const coursesRef = database.ref('courses');
      const newCourseRef = coursesRef.push();
      const courseId = newCourseRef.key;
      
      const newCourse = new Course(
        courseId,
        courseData.title.trim(),
        courseData.description?.trim() || '',
        userProfile.uid,
        userProfile.name || userProfile.getDisplayName?.() || 'Unknown Teacher'
      );
      
      if (courseData.subject) {
        newCourse.subject = courseData.subject.trim();
      }
      if (courseData.semester) {
        newCourse.semester = courseData.semester.trim();
      }
      if (courseData.year) {
        newCourse.year = courseData.year;
      }
      
      await newCourseRef.set(newCourse.toDatabase());
      
      console.log('Course created:', courseId);
      return newCourse;
      
    } catch (error) {
      console.error('Create course error:', error);
      const errorMessage = error.message || 'Không thể tạo môn học';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCourse = async (courseId, updateData) => {
    try {
      setError('');
      
      if (!updateData.title?.trim()) {
        throw new Error('Tên môn học không được để trống');
      }
      
      if (!courseId) {
        throw new Error('ID môn học không hợp lệ');
      }
      
      const updates = {
        title: updateData.title.trim(),
        description: updateData.description?.trim() || '',
        updatedAt: Date.now()
      };
      
      if (updateData.subject !== undefined) {
        updates.subject = updateData.subject.trim();
      }
      if (updateData.semester !== undefined) {
        updates.semester = updateData.semester.trim();
      }
      if (updateData.year !== undefined) {
        updates.year = updateData.year;
      }
      
      const courseRef = database.ref(`courses/${courseId}`);
      await courseRef.update(updates);
      
      console.log('Course updated:', courseId);
      
    } catch (error) {
      console.error('Update course error:', error);
      const errorMessage = error.message || 'Không thể cập nhật môn học';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      setError('');
      
      if (!courseId) {
        throw new Error('ID môn học không hợp lệ');
      }
      
      const courseRef = database.ref(`courses/${courseId}`);
      await courseRef.remove();
      const documentsRef = database.ref('documents');
      const documentsQuery = documentsRef.orderByChild('courseId').equalTo(courseId);
      
      const snapshot = await documentsQuery.once('value');
      
      if (snapshot.exists()) {
        const deletePromises = [];
        snapshot.forEach((childSnapshot) => {
          deletePromises.push(
            database.ref(`documents/${childSnapshot.key}`).remove()
          );
        });
        
        await Promise.all(deletePromises);
        console.log('Course documents deleted');
      }
      
      console.log('Course deleted:', courseId);
      
    } catch (error) {
      console.error('Delete course error:', error);
      setError('Không thể xóa môn học');
      throw error;
    }
  };

  const joinCourse = async (courseId) => {
    try {
      setError('');
      
      if (!userProfile) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      if (!courseId) {
        throw new Error('ID môn học không hợp lệ');
      }
      
      const studentData = {
        uid: userProfile.uid,
        name: userProfile.name || userProfile.getDisplayName?.() || 'Unknown Student',
        email: userProfile.email,
        joinedAt: Date.now(),
        isActive: true
      };
      
      const studentRef = database.ref(`courses/${courseId}/students/${userProfile.uid}`);
      await studentRef.set(studentData);
      
      console.log('Joined course:', courseId);
        
    } catch (error) {
      console.error('Join course error:', error);
      const errorMessage = error.message || 'Không thể tham gia môn học';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const leaveCourse = async (courseId) => {
    try {
      setError('');
      
      if (!userProfile) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      if (!courseId) {
        throw new Error('ID môn học không hợp lệ');
      }
      
      const studentRef = database.ref(`courses/${courseId}/students/${userProfile.uid}`);
      await studentRef.remove();
      
      console.log('Left course:', courseId);
        
    } catch (error) {
      console.error('Leave course error:', error);
      const errorMessage = error.message || 'Không thể rời khỏi môn học';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getCourseDetails = async (courseId) => {
    try {
      setError('');
      
      if (!courseId) {
        throw new Error('ID môn học không hợp lệ');
      }
      
      const courseRef = database.ref(`courses/${courseId}`);
      const snapshot = await courseRef.once('value');
      
      if (snapshot.exists()) {
        const courseData = {
          id: snapshot.key,
          ...snapshot.val()
        };
        return Course.fromDatabase(courseData);
      } else {
        throw new Error('Không tìm thấy môn học');
      }
      
    } catch (error) {
      console.error('Get course details error:', error);
      setError('Không thể tải thông tin môn học');
      throw error;
    }
  };

  const filteredCourses = courses.filter(course => {
    const query = searchQuery.trim();
    if (!query) return true;
    
    return (
      searchVietnamese(course.title, query) ||
      searchVietnamese(course.description, query) ||
      searchVietnamese(course.teacherName, query) ||
      searchVietnamese(course.subject, query)
    );
  });

  const getUserCourses = () => {
    if (!userProfile) return [];
    
    if (userProfile.isTeacher()) {
      return filteredCourses.filter(course => course.teacherId === userProfile.uid);
    } else {
      return filteredCourses.filter(course => 
        course.isStudentEnrolled && course.isStudentEnrolled(userProfile.uid)
      );
    }
  };

  const getAvailableCourses = () => {
    if (!userProfile || !userProfile.isStudent()) return [];
    
    return filteredCourses.filter(course => 
      !course.isStudentEnrolled || !course.isStudentEnrolled(userProfile.uid)
    );
  };

  const getCourseById = (courseId) => {
    return courses.find(course => course.id === courseId);
  };

  const canManageCourse = (course) => {
    return userProfile && 
           userProfile.isTeacher && 
           userProfile.isTeacher() && 
           course.teacherId === userProfile.uid;
  };

  const getCoursesStats = () => {
    const userCourses = getUserCourses();
    const totalStudents = userCourses.reduce((sum, course) => {
      const studentCount = course.getStudentCount ? course.getStudentCount() : 0;
      return sum + studentCount;
    }, 0);
    
    return {
      totalCourses: userCourses.length,
      totalStudents,
      averageStudentsPerCourse: userCourses.length > 0 ? Math.round(totalStudents / userCourses.length) : 0
    };
  };

  const getAllCourses = () => {
    return filteredCourses;
  };

  const searchCourses = (query) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    courses: filteredCourses,
    userCourses: getUserCourses(),
    availableCourses: getAvailableCourses(),
    allCourses: getAllCourses(),
    selectedCourse,
    loading,
    error,
    searchQuery,
    createCourse,
    updateCourse,
    deleteCourse,
    joinCourse,
    leaveCourse,
    getCourseDetails,
    setSelectedCourse,
    setSearchQuery: searchCourses,
    clearSearch,
    setError,
    clearError: () => setError(''),
    getCourseById,
    canManageCourse,
    getCoursesStats
  };
};