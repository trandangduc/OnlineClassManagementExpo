import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import CourseListScreen from '../screens/student/CourseListScreen';
import CourseDetailScreen from '../screens/student/CourseDetailScreen';
import DocumentScreen from '../screens/student/DocumentScreen';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import ManageCourseScreen from '../screens/teacher/ManageCourseScreen';
import ManageDocumentScreen from '../screens/teacher/ManageDocumentScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const StudentStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseList" component={CourseListScreen} />
      <Stack.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Chi tiết môn học',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="Documents" 
        component={DocumentScreen}
        options={{
          headerShown: true,
          headerTitle: 'Tài liệu',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};
const TeacherStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={TeacherDashboard} />
      <Stack.Screen name="ManageCourseMain" component={ManageCourseScreen} />
      <Stack.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Chi tiết môn học',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="ManageDocument" 
        component={ManageDocumentScreen}
        options={{
          headerShown: true,
          headerTitle: 'Quản lý tài liệu',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="Documents" 
        component={DocumentScreen}
        options={{
          headerShown: true,
          headerTitle: 'Tài liệu',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  const { isTeacher, isStudent } = useAuth();

  if (isTeacher) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = 'dashboard';
            } else if (route.name === 'Courses') {
              iconName = 'school';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e1e1e1',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={TeacherStackNavigator}
          options={{
            tabBarLabel: 'Dashboard',
          }}
          initialParams={{ screen: 'Dashboard' }}
        />
        <Tab.Screen 
          name="Courses" 
          component={TeacherStackNavigator}
          options={{
            tabBarLabel: 'Môn học',
          }}
          initialParams={{ screen: 'ManageCourseMain' }}
        />
      </Tab.Navigator>
    );
  }

  if (isStudent) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Courses') {
              iconName = 'school';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e1e1e1',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Courses" 
          component={StudentStackNavigator}
          options={{
            tabBarLabel: 'Môn học',
          }}
        />
      </Tab.Navigator>
    );
  }

  return null;
};

export default TabNavigator;