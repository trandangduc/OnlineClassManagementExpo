import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Button, ButtonGroup } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  emailValidator, 
  passwordValidator, 
  confirmPasswordValidator, 
  nameValidator, 
  phoneValidator 
} from '../utils/validators';
import { getRoleDisplayName } from '../utils/helpers';

const RegisterForm = ({ onSubmit, loading = false, error = '' }) => {
  const [selectedRole, setSelectedRole] = useState(0);
  const roles = [getRoleDisplayName('student'), getRoleDisplayName('teacher')];
  
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

  const handleFormSubmit = (data) => {
    const role = selectedRole === 0 ? 'student' : 'teacher';
    const profileData = {
      name: data.name.trim(),
      phone: data.phone.trim()
    };
    onSubmit({
      email: data.email,
      password: data.password,
      role,
      profileData
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.roleContainer}>
        <Text style={styles.roleLabel}>Bạn là:</Text>
        <ButtonGroup
          onPress={setSelectedRole}
          selectedIndex={selectedRole}
          buttons={roles}
          containerStyle={styles.buttonGroupContainer}
          selectedButtonStyle={styles.selectedButton}
          selectedTextStyle={styles.selectedButtonText}
          textStyle={styles.buttonGroupText}
          disabled={loading}
        />
      </View>

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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        )}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={20} color="#dc3545" />
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      ) : null}

      <Button
        title="Đăng Ký"
        onPress={handleSubmit(handleFormSubmit)}
        loading={loading}
        disabled={loading}
        buttonStyle={styles.submitButton}
        titleStyle={styles.submitButtonText}
        loadingProps={{ color: '#FFFFFF' }}
        icon={
          !loading ? (
            <Icon
              name="person-add"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonGroupContainer: {
    borderRadius: 8,
    borderColor: '#2196F3',
    height: 45,
  },
  selectedButton: {
    backgroundColor: '#2196F3',
  },
  selectedButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonGroupText: {
    color: '#2196F3',
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default RegisterForm;