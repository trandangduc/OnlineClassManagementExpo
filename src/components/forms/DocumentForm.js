import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Input, Button, ButtonGroup } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DocumentForm = ({ 
  onSubmit, 
  initialData = null, 
  loading = false, 
  error = '',
  submitButtonTitle = 'Tạo tài liệu'
}) => {
  const [documentType, setDocumentType] = useState(() => {
    if (initialData?.type) {
      const typeMapping = { pdf: 0, video: 1, link: 2 };
      return typeMapping[initialData.type] || 0;
    }
    return 0;
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const documentTypes = ['PDF', 'Video', 'Link'];
  const typeMapping = ['pdf', 'video', 'link'];

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      url: initialData?.url || ''
    }
  });

  const currentType = typeMapping[documentType];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });

      if (result && result[0]) {
        setSelectedFile(result[0]);
        setValue('title', result[0].name.replace('.pdf', ''));
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Lỗi', 'Không thể chọn file');
      }
    }
  };

  const handleFormSubmit = (data) => {
    if (currentType === 'pdf' && !initialData && !selectedFile) {
      Alert.alert('Lỗi', 'Vui lòng chọn file PDF');
      return;
    }
    
    if ((currentType === 'video' || currentType === 'link') && !data.url?.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập URL');
      return;
    }

    const documentData = {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      type: currentType,
      url: data.url?.trim() || ''
    };

    onSubmit(documentData, selectedFile);
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.typeContainer}>
        <Text style={styles.typeLabel}>Loại tài liệu:</Text>
        <ButtonGroup
          onPress={setDocumentType}
          selectedIndex={documentType}
          buttons={documentTypes}
          containerStyle={styles.buttonGroupContainer}
          selectedButtonStyle={styles.selectedButton}
          selectedTextStyle={styles.selectedButtonText}
          textStyle={styles.buttonGroupText}
          disabled={loading}
        />
      </View>

      {currentType === 'pdf' && !initialData && (
        <View style={styles.filePickerContainer}>
          <Button
            title={selectedFile ? `Đã chọn: ${selectedFile.name}` : "Chọn file PDF"}
            onPress={pickDocument}
            buttonStyle={styles.filePickerButton}
            titleStyle={styles.filePickerButtonText}
            icon={
              <Icon
                name="attach-file"
                size={20}
                color="#2196F3"
                style={{ marginRight: 8 }}
              />
            }
            type="outline"
            disabled={loading}
          />
        </View>
      )}

      <Controller
        control={control}
        name="title"
        rules={{
          required: 'Tên tài liệu là bắt buộc',
          minLength: {
            value: 2,
            message: 'Tên tài liệu tối thiểu 2 ký tự'
          },
          maxLength: {
            value: 100,
            message: 'Tên tài liệu tối đa 100 ký tự'
          }
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Tên tài liệu"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            leftIcon={{ 
              type: 'material', 
              name: 'title',
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

      {(currentType === 'video' || currentType === 'link') && (
        <Controller
          control={control}
          name="url"
          rules={{
            required: 'URL là bắt buộc',
            validate: value => validateUrl(value) || 'URL không hợp lệ'
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder={currentType === 'video' ? "URL video (YouTube, Vimeo...)" : "URL liên kết"}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              keyboardType="url"
              autoCapitalize="none"
              leftIcon={{ 
                type: 'material', 
                name: 'link',
                color: '#2196F3'
              }}
              errorMessage={errors.url?.message}
              containerStyle={styles.inputContainer}
              inputStyle={styles.inputText}
              errorStyle={styles.errorText}
              disabled={loading}
            />
          )}
        />
      )}

      <Controller
        control={control}
        name="description"
        rules={{
          maxLength: {
            value: 500,
            message: 'Mô tả tối đa 500 ký tự'
          }
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Mô tả tài liệu (tùy chọn)"
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
        onPress={handleSubmit(handleFormSubmit)}
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
  typeContainer: {
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  buttonGroupContainer: {
    borderRadius: 8,
    borderColor: '#2196F3',
    height: 40,
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
  filePickerContainer: {
    marginBottom: 16,
  },
  filePickerButton: {
    borderColor: '#2196F3',
    borderWidth: 1,
    borderRadius: 8,
  },
  filePickerButtonText: {
    color: '#2196F3',
    fontSize: 14,
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

export default DocumentForm;