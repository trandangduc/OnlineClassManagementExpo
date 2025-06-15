import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import { useAuthViewModel } from '../../viewmodels/AuthViewModel';
import { emailValidator, passwordValidator } from '../../utils/validators';

const LoginScreen = ({ navigation }) => {
  const { 
    handleSignIn, 
    error, 
    isLoading
  } = useAuthViewModel();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      await handleSignIn(data.email, data.password);
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Quản lý lớp học trực tuyến</Text>
          </View>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              rules={emailValidator}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Email"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={{ 
                    type: 'material', 
                    name: 'email',
                    color: '#2196F3'
                  }}
                  errorMessage={errors.email?.message}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  errorStyle={styles.errorText}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={passwordValidator}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Mật khẩu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="password"
                  leftIcon={{ 
                    type: 'material', 
                    name: 'lock',
                    color: '#2196F3'
                  }}
                  errorMessage={errors.password?.message}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  errorStyle={styles.errorText}
                />
              )}
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Đăng Nhập"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              buttonStyle={styles.loginButton}
              titleStyle={styles.buttonText}
              loadingProps={{ color: '#FFFFFF' }}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Chưa có tài khoản? Đăng ký ngay"
              type="clear"
              onPress={() => navigation.navigate('Register')}
              titleStyle={styles.linkText}
              containerStyle={styles.linkContainer}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputText: {
    fontSize: 16,
    color: '#212529',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorMessage: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#2196F3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  linkContainer: {
    marginTop: 8,
  },
  linkText: {
    color: '#2196F3',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LoginScreen;