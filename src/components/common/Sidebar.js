import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { Avatar, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext'; 

const { width } = Dimensions.get('window');

const Sidebar = ({ visible, onClose, navigation }) => {
  const { userProfile, isTeacher, isStudent, signOut } = useAuth(); 

  const menuItems = [
    ...(isStudent ? [
      {
        id: 'courses',
        title: 'Môn học',
        icon: 'school',
        route: 'CourseList'
      },
      {
        id: 'profile',
        title: 'Thông tin cá nhân',
        icon: 'person',
        route: 'Profile'
      }
    ] : []),
    ...(isTeacher ? [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        route: 'Dashboard'
      },
      {
        id: 'manage-courses',
        title: 'Quản lý môn học',
        icon: 'school',
        route: 'ManageCourse'
      },
      {
        id: 'profile',
        title: 'Thông tin cá nhân',
        icon: 'person',
        route: 'Profile'
      }
    ] : []),
    {
      id: 'settings',
      title: 'Cài đặt',
      icon: 'settings',
      route: 'Settings'
    },
    {
      id: 'help',
      title: 'Trợ giúp',
      icon: 'help',
      route: 'Help'
    }
  ];

  const handleMenuPress = (item) => {
    onClose();
    if (navigation && item.route) {
      navigation.navigate(item.route);
    }
  };

  const handleLogout = async () => {
    try {
      onClose();
      await signOut(); 
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBackground} onPress={onClose} />
        
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.profileSection}>
              <Avatar
                rounded
                size="large"
                title={userProfile?.getDisplayName?.()?.charAt(0)?.toUpperCase() || 'U'}
                containerStyle={styles.avatar}
                titleStyle={styles.avatarText}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>
                  {userProfile?.getDisplayName?.() || 'Người dùng'}
                </Text>
                <Text style={styles.userEmail}>
                  {userProfile?.email || ''}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {isTeacher ? 'Giảng viên' : 'Học sinh'}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.menuSection}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Icon 
                      name={item.icon} 
                      size={24} 
                      color="#2196F3" 
                      style={styles.menuIcon}
                    />
                    <Text style={styles.menuText}>{item.title}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#adb5bd" />
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={styles.divider} />
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Icon name="logout" size={24} color="#dc3545" style={styles.menuIcon} />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <View style={styles.appInfo}>
              <Text style={styles.appName}>Class Management</Text>
              <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: width * 0.8,
    maxWidth: 300,
    backgroundColor: '#fff',
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginBottom: 12,
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    backgroundColor: '#e9ecef',
    height: 1,
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
  },
  appInfo: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 20,
  },
  appName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: '#adb5bd',
  },
});

export default Sidebar;