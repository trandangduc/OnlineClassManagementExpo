import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, initializing } = useAuth();
  if (initializing) {
    return <LoadingSpinner text="Đang khởi tạo..." />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;