import { useState, useEffect, useCallback, useMemo } from 'react';
import { database } from '../services/firebase/config';
import { Course } from '../models/Course';
import CacheService from '../services/cache/CacheService';
import { useAuth } from '../contexts/AuthContext';
import { searchVietnamese, sortByProperty } from '../utils/helpers';

const ITEMS_PER_PAGE = 10;

export const useCourseViewModel = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userCoursesPage, setUserCoursesPage] = useState(1);
  const [availableCoursesPage, setAvailableCoursesPage] = useState(1);
  const [hasMoreUserCourses, setHasMoreUserCourses] = useState(true);
  const [hasMoreAvailableCourses, setHasMoreAvailableCourses] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [paginatedUserCourses, setPaginatedUserCourses] = useState([]);
  const [paginatedAvailableCourses, setPaginatedAvailableCourses] = useState([]);

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
              
              if (!initialLoadComplete) {
                initializePagination(sortedCourses);
                setInitialLoadComplete(true);
              }
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

  const getFilteredCourses = useCallback((coursesData) => {
    return coursesData.filter(course => {
      const query = searchQuery.trim();
      if (!query) return true;
      
      return (
        searchVietnamese(course.title, query) ||
        searchVietnamese(course.description, query) ||
        searchVietnamese(course.teacherName, query) ||
        searchVietnamese(course.subject, query)
      );
    });
  }, [searchQuery]);

  const getUserCoursesFromAll = useCallback((coursesData) => {
    if (!userProfile) return [];
    
    const filtered = getFilteredCourses(coursesData);
    
    if (userProfile.isTeacher()) {
      return filtered.filter(course => course.teacherId === userProfile.uid);
    } else {
      return filtered.filter(course => 
        course.isStudentEnrolled && course.isStudentEnrolled(userProfile.uid)
      );
    }
  }, [userProfile, getFilteredCourses]);

  const getAvailableCoursesFromAll = useCallback((coursesData) => {
    if (!userProfile || !userProfile.isStudent()) return [];
    
    const filtered = getFilteredCourses(coursesData);
    
    return filtered.filter(course => 
      !course.isStudentEnrolled || !course.isStudentEnrolled(userProfile.uid)
    );
  }, [userProfile, getFilteredCourses]);

  const initializePagination = useCallback((coursesData) => {
    const userCourses = getUserCoursesFromAll(coursesData);
    const availableCourses = getAvailableCoursesFromAll(coursesData);
    
    setPaginatedUserCourses(userCourses.slice(0, ITEMS_PER_PAGE));
    setPaginatedAvailableCourses(availableCourses.slice(0, ITEMS_PER_PAGE));
    
    setHasMoreUserCourses(userCourses.length > ITEMS_PER_PAGE);
    setHasMoreAvailableCourses(availableCourses.length > ITEMS_PER_PAGE);
    setUserCoursesPage(1);
    setAvailableCoursesPage(1);
  }, [getUserCoursesFromAll, getAvailableCoursesFromAll]);

  useEffect(() => {
    if (initialLoadComplete && courses.length > 0) {
      resetPagination();
    }
  }, [courses, searchQuery, userProfile]);

  const loadMoreUserCourses = useCallback(async (reset = false) => {
    if (loading && !reset) return;

    try {
      const allUserCourses = getUserCoursesFromAll(courses);
      
      if (reset) {
        const firstPage = allUserCourses.slice(0, ITEMS_PER_PAGE);
        setPaginatedUserCourses(firstPage);
        setUserCoursesPage(1);
        setHasMoreUserCourses(allUserCourses.length > ITEMS_PER_PAGE);
      } else {
        const currentPage = userCoursesPage;
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const newCourses = allUserCourses.slice(startIndex, endIndex);
        
        if (newCourses.length > 0) {
          setPaginatedUserCourses(prev => [...prev, ...newCourses]);
          setUserCoursesPage(prev => prev + 1);
          setHasMoreUserCourses(endIndex < allUserCourses.length);
        } else {
          setHasMoreUserCourses(false);
        }
      }
    } catch (err) {
      console.error('Error loading more user courses:', err);
      setError('Không thể tải thêm môn học');
    }
  }, [courses, userCoursesPage, loading, getUserCoursesFromAll]);

  const loadMoreAvailableCourses = useCallback(async (reset = false) => {
    if (loading && !reset) return;

    try {
      const allAvailableCourses = getAvailableCoursesFromAll(courses);
      
      if (reset) {
        const firstPage = allAvailableCourses.slice(0, ITEMS_PER_PAGE);
        setPaginatedAvailableCourses(firstPage);
        setAvailableCoursesPage(1);
        setHasMoreAvailableCourses(allAvailableCourses.length > ITEMS_PER_PAGE);
      } else {
        const currentPage = availableCoursesPage;
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const newCourses = allAvailableCourses.slice(startIndex, endIndex);
        
        if (newCourses.length > 0) {
          setPaginatedAvailableCourses(prev => [...prev, ...newCourses]);
          setAvailableCoursesPage(prev => prev + 1);
          setHasMoreAvailableCourses(endIndex < allAvailableCourses.length);
        } else {
          setHasMoreAvailableCourses(false);
        }
      }
    } catch (err) {
      console.error('Error loading more available courses:', err);
      setError('Không thể tải thêm môn học khả dụng');
    }
  }, [courses, availableCoursesPage, loading, getAvailableCoursesFromAll]);

  const resetPagination = useCallback(() => {
    const allUserCourses = getUserCoursesFromAll(courses);
    const allAvailableCourses = getAvailableCoursesFromAll(courses);
    
    setPaginatedUserCourses(allUserCourses.slice(0, ITEMS_PER_PAGE));
    setUserCoursesPage(1);
    setHasMoreUserCourses(allUserCourses.length > ITEMS_PER_PAGE);
    
    setPaginatedAvailableCourses(allAvailableCourses.slice(0, ITEMS_PER_PAGE));
    setAvailableCoursesPage(1);
    setHasMoreAvailableCourses(allAvailableCourses.length > ITEMS_PER_PAGE);
  }, [courses, getUserCoursesFromAll, getAvailableCoursesFromAll]);

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

      const courseToJoin = paginatedAvailableCourses.find(c => c.id === courseId);
      if (courseToJoin) {
        setPaginatedAvailableCourses(prev => prev.filter(c => c.id !== courseId));
        setPaginatedUserCourses(prev => [courseToJoin, ...prev]);
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
      const courseToRevert = paginatedUserCourses.find(c => c.id === courseId);
      if (courseToRevert) {
        setPaginatedUserCourses(prev => prev.filter(c => c.id !== courseId));
        setPaginatedAvailableCourses(prev => [courseToRevert, ...prev]);
      }
      
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

  const filteredCourses = useMemo(() => getFilteredCourses(courses), [courses, getFilteredCourses]);
  
  const userCourses = useMemo(() => getUserCoursesFromAll(courses), [courses, getUserCoursesFromAll]);
  
  const availableCourses = useMemo(() => getAvailableCoursesFromAll(courses), [courses, getAvailableCoursesFromAll]);

  const getCourseById = useCallback((courseId) => {
    return courses.find(course => course.id === courseId);
  }, [courses]);

  const canManageCourse = useCallback((course) => {
    return userProfile && 
           userProfile.isTeacher && 
           userProfile.isTeacher() && 
           course.teacherId === userProfile.uid;
  }, [userProfile]);

  const getCoursesStats = useCallback(() => {
    const totalStudents = userCourses.reduce((sum, course) => {
      const studentCount = course.getStudentCount ? course.getStudentCount() : 0;
      return sum + studentCount;
    }, 0);
    
    return {
      totalCourses: userCourses.length,
      totalStudents,
      averageStudentsPerCourse: userCourses.length > 0 ? Math.round(totalStudents / userCourses.length) : 0
    };
  }, [userCourses]);

  const searchCourses = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    courses: filteredCourses,
    userCourses: paginatedUserCourses, 
    availableCourses: paginatedAvailableCourses, 
    allCourses: filteredCourses,
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
    getCoursesStats,
    loadMoreUserCourses,
    loadMoreAvailableCourses,
    hasMoreUserCourses,
    hasMoreAvailableCourses,
    resetPagination,
    userCoursesPage,
    availableCoursesPage
  };
};