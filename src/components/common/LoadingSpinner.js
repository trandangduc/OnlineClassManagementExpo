import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const LoadingSpinner = ({ 
  size = 'large', 
  color = '#2196F3', 
  text = 'Đang tải...', 
  showText = true,
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {showText && (
        <Text style={[styles.text, { color }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingSpinner;