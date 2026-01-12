import React, { useState, useRef } from 'react';
import api from '../../services/api';
import './ImageUpload.css';

const ImageUpload = ({ 
  onUploadSuccess, 
  onUploadError, 
  currentImageUrl = null,
  disabled = false,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`File type not supported. Please use: ${acceptedTypes.join(', ')}`);
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      throw new Error(`File too large. Maximum size is ${maxSizeMB}MB`);
    }
  };

  const uploadFile = async (file) => {
    try {
      validateFile(file);
      setIsUploading(true);

      // Get presigned URL
      const presignedResponse = await api.post('/media/presigned-upload', {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size
      });

      const { uploadUrl, objectKey } = presignedResponse.data.data;

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      onUploadSuccess && onUploadSuccess({
        objectKey,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadUrl: uploadResponse.url
      });

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError && onUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!disabled && !isUploading) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadSuccess && onUploadSuccess(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="image-upload__input"
        disabled={disabled || isUploading}
      />

      {previewUrl ? (
        <div className="image-upload__preview">
          <div className="image-upload__preview-container">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="image-upload__preview-image"
            />
            <div className="image-upload__preview-overlay">
              <button
                type="button"
                onClick={handleClick}
                disabled={disabled || isUploading}
                className="image-upload__preview-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="image-upload__preview-button image-upload__preview-button--remove"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`image-upload__dropzone ${
            dragActive ? 'image-upload__dropzone--active' : ''
          } ${disabled || isUploading ? 'image-upload__dropzone--disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {isUploading ? (
            <div className="image-upload__uploading">
              <div className="image-upload__spinner"></div>
              <div className="image-upload__uploading-text">
                <div>Uploading image...</div>
                <div className="image-upload__uploading-subtext">Please wait</div>
              </div>
            </div>
          ) : (
            <div className="image-upload__content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="image-upload__icon">
                <path
                  d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <div className="image-upload__text">
                <div className="image-upload__primary-text">
                  Drop an image here or click to browse
                </div>
                <div className="image-upload__secondary-text">
                  Supports: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
                </div>
                <div className="image-upload__secondary-text">
                  Maximum size: {formatFileSize(maxSizeBytes)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;