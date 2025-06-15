import React, { useState } from 'react';
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
import { 
  emailValidator, 
  passwordValidator, 
  confirmPasswordValidator, 
  nameValidator, 
  phoneValidator 
} from '../../utils/validators';

const RegisterScreen = ({ navigation }) => {
  const { 
    handleSignUp, 
    error, 
    isLoading
  } = useAuthViewModel();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: ''
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const role = 'student'; 
      const profileData = {
        name: data.name.trim(),
        phone: data.phone.trim()
      };

      await handleSignUp(data.email, data.password, role, profileData);
      Alert.alert(
        'Đăng ký thành công!', 
        'Tài khoản học sinh đã được tạo thành công.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Đăng ký thất bại', error.message);
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
            <Text style={styles.title}>Đăng Ký Học Sinh</Text>
            <Text style={styles.subtitle}>Tạo tài khoản học sinh mới</Text>
          </View>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="name"
              rules={nameValidator}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Họ và tên"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoComplete="name"
                  leftIcon={{ 
                    type: 'material', 
                    name: 'person',
                    color: '#2196F3'
                  }}
                  errorMessage={errors.name?.message}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  errorStyle={styles.errorText}
                />
              )}
            />

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
              name="phone"
              rules={phoneValidator}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Số điện thoại"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  leftIcon={{ 
                    type: 'material', 
                    name: 'phone',
                    color: '#2196F3'
                  }}
                  errorMessage={errors.phone?.message}
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
                  autoComplete="new-password"
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

            <Controller
              control={control}
              name="confirmPassword"
              rules={confirmPasswordValidator(password)}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Xác nhận mật khẩu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="new-password"
                  leftIcon={{ 
                    type: 'material', 
                    name: 'lock-outline',
                    color: '#2196F3'
                  }}
                  errorMessage={errors.confirmPassword?.message}
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
              title="Đăng Ký"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              buttonStyle={styles.registerButton}
              titleStyle={styles.buttonText}
              loadingProps={{ color: '#FFFFFF' }}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Đã có tài khoản? Đăng nhập"
              type="clear"
              onPress={() => navigation.navigate('Login')}
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
    paddingTop: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  registerButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#28a745',
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

export default RegisterScreen;