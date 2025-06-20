import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  courseTitleValidator, 
  courseDescriptionValidator 
} from '../../utils/validators';

const CourseForm = ({ 
  onSubmit, 
  initialData = null, 
  loading = false, 
  error = '',
  submitButtonTitle = 'Tạo môn học'
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      subject: initialData?.subject || '',
      semester: initialData?.semester || ''
    }
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="title"
        rules={courseTitleValidator}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Tên môn học *"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            leftIcon={{ 
              type: 'material', 
              name: 'school',
              color: '#2196F3'
            }}
            errorMessage={errors.title?.message}
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            errorStyle={styles.errorText}
            disabled={loading}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        rules={courseDescriptionValidator}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Mô tả môn học (tùy chọn)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            leftIcon={{ 
              type: 'material', 
              name: 'description',
              color: '#2196F3'
            }}
            errorMessage={errors.description?.message}
            containerStyle={styles.inputContainer}
            inputStyle={[styles.inputText, styles.textAreaInput]}
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
        title={submitButtonTitle}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        disabled={loading}
        buttonStyle={styles.submitButton}
        titleStyle={styles.submitButtonText}
        loadingProps={{ color: '#FFFFFF' }}
        icon={
          !loading ? (
            <Icon
              name={initialData ? "edit" : "add"}
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
    marginBottom: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#212529',
  },
  textAreaInput: {
    textAlignVertical: 'top',
    minHeight: 80,
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

export default CourseForm;