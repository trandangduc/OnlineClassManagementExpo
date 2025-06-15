import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

const Card = ({ 
  children, 
  style, 
  onPress, 
  disabled = false,
  shadow = true,
  padding = 16,
  margin = 8,
  borderRadius = 12,
  backgroundColor = '#fff'
}) => {
  const cardStyles = [
    styles.container,
    {
      padding,
      margin,
      borderRadius,
      backgroundColor,
    },
    shadow && styles.shadow,
    style,
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 0,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Card;