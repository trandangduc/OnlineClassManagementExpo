import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { emailValidator, passwordValidator } from '../utils/validators';

const LoginForm = ({ onSubmit, loading = false, error = '' }) => {
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

  return (
    <View style={styles.container}>
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
        title="Đăng Nhập"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={loading}
        buttonStyle={styles.submitButton}
        titleStyle={styles.submitButtonText}
        loadingProps={{ color: '#FFFFFF' }}
        icon={
          !loading ? (
            <Icon
              name="login"
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default LoginForm;