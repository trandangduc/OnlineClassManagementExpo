import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext'; 

const Header = ({ 
  title, 
  leftIcon, 
  rightIcon, 
  onLeftPress, 
  onRightPress,
  showProfile = false,
  backgroundColor = '#2196F3',
  textColor = '#fff'
}) => {
  const { userProfile } = useAuth();

  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.leftContainer}>
          {leftIcon && (
            <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
              <Icon name={leftIcon} size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {showProfile && userProfile && (
            <Text style={[styles.subtitle, { color: textColor + 'CC' }]}>
              {userProfile.getDisplayName?.() || 'Người dùng'}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <Icon name={rightIcon} size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default Header;