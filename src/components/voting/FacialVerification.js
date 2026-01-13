import React, { useState, useRef, useEffect } from 'react';
import biometricService from '../../services/biometricService';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './FacialVerification.css';

const FacialVerification = ({ onVerificationComplete, onCancel, awardId }) => {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, initializing, capturing, processing, success, failed
  const [errorMessage, setErrorMessage] = useState('');
  const [stream, setStream] = useState(null);
  const [faceQuality, setFaceQuality] = useState(null);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    initializeBiometricService();
    
    return () => {
      // Cleanup camera stream and intervals on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeBiometricService = async () => {
    setVerificationStatus('initializing');
    setInitializationProgress(0);
    
    try {
      console.log('🚀 Initializing biometric service...');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setInitializationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const initialized = await biometricService.initialize();
      
      clearInterval(progressInterval);
      setInitializationProgress(100);
      
      if (!initialized) {
        throw new Error('Failed to initialize biometric service');
      }
      
      console.log('✅ Biometric service initialized successfully');
      
      setTimeout(() => {
        setVerificationStatus('idle');
      }, 500);
      
    } catch (error) {
      console.error('❌ Biometric initialization error:', error);
      setErrorMessage('Failed to initialize biometric verification. Please refresh and try again.');
      setVerificationStatus('failed');
    }
  };

  const startCamera = async () => {
    try {
      setErrorMessage('');
      setVerificationStatus('capturing');
      
      console.log('🎥 Starting camera setup...');
      
      // First get camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Camera access granted, now setting up video element...');
      setStream(mediaStream);
      setIsCapturing(true); // Set this AFTER getting camera access
      
      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try multiple ways to get the video element
      let videoElement = null;
      
      // Method 1: Use ref
      if (videoRef.current) {
        videoElement = videoRef.current;
        console.log('✅ Video element found via ref');
      }
      
      // Method 2: Query DOM directly
      if (!videoElement) {
        videoElement = document.querySelector('.camera-video');
        if (videoElement) {
          console.log('✅ Video element found via DOM query');
          videoRef.current = videoElement; // Update ref
        }
      }
      
      // Method 3: Wait and retry
      if (!videoElement) {
        console.log('⏳ Video element not found, waiting and retrying...');
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          videoElement = document.querySelector('.camera-video') || videoRef.current;
          if (videoElement) {
            console.log(`✅ Video element found on attempt ${attempt + 1}`);
            videoRef.current = videoElement;
            break;
          }
        }
      }
      
      if (!videoElement) {
        // Stop the stream since we can't use it
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error('Video element could not be created. Please try refreshing the page.');
      }
      
      console.log('🎬 Setting up video stream...');
      videoElement.srcObject = mediaStream;
      
      // Simplified video setup
      const setupVideo = () => {
        return new Promise((resolve) => {
          let resolved = false;
          
          const cleanup = () => {
            videoElement.removeEventListener('loadedmetadata', onReady);
            videoElement.removeEventListener('canplay', onReady);
            videoElement.removeEventListener('playing', onReady);
          };
          
          const onReady = () => {
            if (!resolved) {
              resolved = true;
              cleanup();
              console.log('✅ Video ready for face detection');
              resolve(true);
            }
          };
          
          // Listen for video ready events
          videoElement.addEventListener('loadedmetadata', onReady);
          videoElement.addEventListener('canplay', onReady);
          videoElement.addEventListener('playing', onReady);
          
          // Shorter timeout
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              cleanup();
              console.log('⚠️ Video timeout - proceeding anyway');
              resolve(false);
            }
          }, 3000);
          
          // Try to play the video
          videoElement.play().catch(err => {
            console.warn('Video autoplay blocked:', err);
          });
        });
      };
      
      // Setup video
      await setupVideo();
      
      console.log('🎬 Starting face detection...');
      
      // Start detection
      setTimeout(() => {
        startRealTimeFaceDetection();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Camera access error:', error);
      
      let errorMsg = 'Unable to access camera. ';
      
      if (error.message.includes('Video element')) {
        errorMsg = 'Video setup failed. Please refresh the page and try again.';
      } else if (error.name === 'NotAllowedError') {
        errorMsg += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMsg += 'Camera is being used by another application.';
      } else {
        errorMsg += 'Please check camera permissions and try again.';
      }
      
      setErrorMessage(errorMsg);
      setVerificationStatus('failed');
    }
  };

  const startRealTimeFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    console.log('🔍 Starting real-time face detection...');

    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      
      // Check if video element exists and has some data
      if (video && video.srcObject && stream && stream.active) {
        try {
          // Check video dimensions and readiness
          const videoReady = video.readyState >= 2 || video.videoWidth > 0;
          const hasVideoDimensions = video.videoWidth > 0 && video.videoHeight > 0;
          
          console.log(`📹 Video status: ready=${videoReady}, dimensions=${video.videoWidth}x${video.videoHeight}, readyState=${video.readyState}`);
          
          if (videoReady && hasVideoDimensions) {
            console.log('🔍 Attempting face detection...');
            const quality = await biometricService.verifyFaceQuality(video);
            setFaceQuality(quality);
            
            if (quality.faceDetected) {
              console.log('👤 Face detected with confidence:', quality.confidence);
            } else {
              console.log('❌ No face detected:', quality.issues);
            }
          } else {
            // Video data not ready yet, show loading state
            setFaceQuality({
              faceDetected: false,
              confidence: 0,
              isGoodQuality: false,
              issues: [`Loading video feed... (${video.videoWidth}x${video.videoHeight}, readyState: ${video.readyState})`]
            });
          }
        } catch (error) {
          console.warn('⚠️ Face detection error (will retry):', error.message);
          
          // Check if it's a model loading issue
          if (error.message.includes('model') || error.message.includes('initialize')) {
            setFaceQuality({
              faceDetected: false,
              confidence: 0,
              isGoodQuality: false,
              issues: ['Loading face detection models...']
            });
          } else {
            // Other detection errors
            setFaceQuality({
              faceDetected: false,
              confidence: 0,
              isGoodQuality: false,
              issues: [`Detection error: ${error.message}`]
            });
          }
        }
      } else {
        // Video stream not available
        console.log('📹 Video stream not ready, stream active:', stream?.active);
        setFaceQuality({
          faceDetected: false,
          confidence: 0,
          isGoodQuality: false,
          issues: ['Connecting to camera...']
        });
      }
    }, 2000); // Increased interval to 2 seconds for better performance
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setIsCapturing(false);
    setFaceQuality(null);
    setVerificationStatus('idle');
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setErrorMessage('Video or canvas not available. Please try restarting the camera.');
      return;
    }

    const video = videoRef.current;
    
    // Check if video has any data at all
    if (!video.srcObject || video.readyState < 2) {
      setErrorMessage('Video not ready. Please wait for the camera to load or click "Click to Start Video" if available.');
      return;
    }

    setVerificationStatus('processing');
    
    try {
      console.log('🔍 Starting face capture and verification...');
      
      // Try to play video if paused
      if (video.paused) {
        try {
          await video.play();
        } catch (playError) {
          console.warn('Could not play video for capture:', playError);
          // Continue anyway, might still work
        }
      }
      
      // Extract face descriptor from video
      const faceData = await biometricService.extractFaceDescriptor(video);
      
      // Verify face quality
      const quality = await biometricService.verifyFaceQuality(video);
      
      if (!quality.isGoodQuality) {
        throw new Error(`Poor image quality: ${quality.issues.join(', ')}`);
      }

      console.log('✅ Face captured successfully, checking for duplicates...');

      // Check for duplicate faces (prevent multiple voting)
      const duplicateCheck = await checkForDuplicateVoter(faceData.descriptor);
      
      if (duplicateCheck.isDuplicate) {
        throw new Error(`This person has already voted. Previous vote detected with ${(duplicateCheck.confidence * 100).toFixed(1)}% confidence.`);
      }

      console.log('✅ No duplicates found, storing biometric data...');

      // Store biometric data for this vote
      await storeBiometricData(faceData.descriptor);
      
      setVerificationStatus('success');
      stopCamera();
      
      console.log('✅ Biometric verification completed successfully');
      
      // Call success callback with verification data
      onVerificationComplete({
        verified: true,
        timestamp: new Date().toISOString(),
        biometricHash: generateBiometricHash(faceData.descriptor),
        confidence: faceData.confidence,
        faceQuality: quality
      });
      
    } catch (error) {
      console.error('❌ Biometric verification failed:', error);
      
      let errorMsg = error.message || 'Biometric verification failed. Please try again.';
      
      // Provide more specific error messages
      if (error.message.includes('No face detected')) {
        errorMsg = 'No face detected in the image. Please ensure your face is clearly visible and try again.';
      } else if (error.message.includes('model') || error.message.includes('initialize')) {
        errorMsg = 'Face detection models are still loading. Please wait a moment and try again.';
      } else if (error.message.includes('Poor image quality')) {
        errorMsg = error.message + ' Please adjust your position and lighting.';
      }
      
      setErrorMessage(errorMsg);
      setVerificationStatus('failed');
    }
  };

  const checkForDuplicateVoter = async (faceDescriptor) => {
    try {
      // Create face signature for backend comparison
      const faceSignature = biometricService.createFaceSignature(faceDescriptor);
      
      // Send to backend for duplicate checking
      const response = await api.post('/votes/check-biometric-duplicate', {
        faceSignature,
        awardId
      });
      
      return response.data;
    } catch (error) {
      console.error('Duplicate check error:', error);
      // If backend check fails, do local check as fallback
      const localMatches = biometricService.checkForDuplicateFace(faceDescriptor, user.id);
      return {
        isDuplicate: localMatches.length > 0,
        confidence: localMatches.length > 0 ? localMatches[0].confidence : 0,
        matches: localMatches
      };
    }
  };

  const storeBiometricData = async (faceDescriptor) => {
    try {
      // Store locally for immediate comparison
      biometricService.storeFaceDescriptor(user.id, faceDescriptor);
      
      // Store in backend for persistent duplicate prevention
      const faceSignature = biometricService.createFaceSignature(faceDescriptor);
      
      await api.post('/votes/store-biometric-data', {
        faceSignature,
        awardId,
        userId: user.id
      });
      
    } catch (error) {
      console.error('Failed to store biometric data:', error);
      // Don't fail verification if storage fails, but log the error
    }
  };

  const generateBiometricHash = (descriptor) => {
    // Create a hash from the face descriptor for audit purposes
    const descriptorArray = Array.from(descriptor);
    const hashInput = descriptorArray.join(',');
    
    // Simple hash function (in production, use a proper crypto hash)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  };

  const handleRetry = () => {
    setErrorMessage('');
    setFaceQuality(null);
    if (isCapturing) {
      startRealTimeFaceDetection();
    }
    setVerificationStatus(isCapturing ? 'capturing' : 'idle');
  };

  const getFaceQualityIndicator = () => {
    if (!faceQuality) return null;
    
    if (!faceQuality.faceDetected) {
      return { status: 'error', message: 'No face detected' };
    }
    
    if (faceQuality.isGoodQuality) {
      return { status: 'success', message: 'Good face quality' };
    }
    
    return { 
      status: 'warning', 
      message: faceQuality.issues[0] || 'Improve face positioning' 
    };
  };

  const qualityIndicator = getFaceQualityIndicator();

  return (
    <div className="facial-verification">
      <div className="verification-header">
        <h3>Facial Recognition Verification</h3>
        <p>Facial recognition prevents multiple voting by the same person</p>
      </div>

      <div className="verification-content">
        {verificationStatus === 'initializing' && (
          <div className="initialization-status">
            <div className="initialization-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${initializationProgress}%` }}
              ></div>
            </div>
            <p>Loading facial recognition models... {initializationProgress}%</p>
          </div>
        )}

        {!isCapturing && verificationStatus === 'idle' && (
          <div className="start-verification">
            <div className="verification-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="verification-info">
              <h4>Why Facial Recognition?</h4>
              <ul>
                <li>Prevents multiple voting by the same person</li>
                <li>Ensures election integrity and fairness</li>
                <li>Your facial data is processed locally and securely</li>
                <li>No personal images are stored permanently</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                // Add a small delay to ensure video element is rendered
                setTimeout(startCamera, 200);
              }}
              className="btn btn-primary start-camera-btn"
            >
              Start Facial Recognition
            </button>
          </div>
        )}

        {isCapturing && (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              onClick={() => {
                // Manual video play trigger for browsers that block autoplay
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(err => console.warn('Manual play failed:', err));
                }
              }}
            />
            <div className="camera-overlay">
              <div className="face-guide">
                <div className={`face-outline ${qualityIndicator?.status || ''}`}></div>
              </div>
              {qualityIndicator && (
                <div className={`quality-indicator ${qualityIndicator.status}`}>
                  <span className="quality-message">{qualityIndicator.message}</span>
                </div>
              )}
              
              {/* Manual video start button for troubleshooting */}
              {videoRef.current && videoRef.current.paused && (
                <div className="manual-video-controls">
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.play().then(() => {
                          console.log('✅ Manual video play successful');
                          if (!detectionIntervalRef.current) {
                            startRealTimeFaceDetection();
                          }
                        }).catch(err => {
                          console.error('❌ Manual video play failed:', err);
                          setErrorMessage('Unable to start video. Please check camera permissions.');
                        });
                      }
                    }}
                    className="btn btn-primary manual-play-btn"
                  >
                    ▶ Click to Start Video
                  </button>
                </div>
              )}
              
              {/* Debug info */}
              <div className="camera-debug-info">
                <small>
                  Video Ready: {videoRef.current?.readyState >= 2 ? '✅' : '❌'} | 
                  Stream Active: {stream?.active ? '✅' : '❌'} | 
                  Models Loaded: {biometricService.getStatus().modelsLoaded ? '✅' : '❌'} |
                  Playing: {videoRef.current && !videoRef.current.paused ? '✅' : '❌'}
                </small>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {verificationStatus === 'processing' && (
          <div className="processing-status">
            <div className="spinner"></div>
            <p>Analyzing facial features and checking for duplicates...</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="success-status">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
            </div>
            <p>Facial recognition verification successful!</p>
            <p className="success-details">Identity confirmed - you may proceed to vote</p>
          </div>
        )}

        {verificationStatus === 'failed' && (
          <div className="error-status">
            <div className="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </div>
            <p className="error-message">{errorMessage}</p>
            <div className="error-actions">
              <button 
                onClick={handleRetry}
                className="btn btn-secondary retry-btn"
              >
                Try Again
              </button>
              {errorMessage.includes('Video component not ready') && (
                <button 
                  onClick={() => {
                    console.log('🔄 Forcing component refresh...');
                    setVerificationStatus('idle');
                    setErrorMessage('');
                    // Force a small delay before allowing retry
                    setTimeout(() => {
                      console.log('✅ Component ready for retry');
                    }, 500);
                  }}
                  className="btn btn-primary refresh-btn"
                >
                  Refresh Component
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="verification-actions">
        {isCapturing && verificationStatus === 'capturing' && (
          <>
            <button 
              onClick={captureAndVerify}
              className={`btn btn-primary capture-btn ${!qualityIndicator?.status || qualityIndicator.status !== 'success' ? 'disabled' : ''}`}
              disabled={!qualityIndicator?.status || qualityIndicator.status !== 'success'}
            >
              Verify & Continue
            </button>
            
            {/* Force detection button for troubleshooting */}
            {(!faceQuality || faceQuality.issues.includes('Loading video feed...') || faceQuality.issues.includes('Connecting to camera...')) && (
              <button 
                onClick={() => {
                  console.log('🔄 Force starting face detection...');
                  startRealTimeFaceDetection();
                }}
                className="btn btn-secondary force-detection-btn"
              >
                Force Start Detection
              </button>
            )}
            
            {/* Manual face detection test */}
            {videoRef.current && stream && stream.active && (
              <button 
                onClick={async () => {
                  console.log('🧪 Testing face detection manually...');
                  try {
                    const video = videoRef.current;
                    console.log(`📹 Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
                    console.log(`📹 Video readyState: ${video.readyState}`);
                    console.log(`📹 Models loaded: ${biometricService.getStatus().modelsLoaded}`);
                    
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                      const quality = await biometricService.verifyFaceQuality(video);
                      console.log('🧪 Manual detection result:', quality);
                      setFaceQuality(quality);
                    } else {
                      console.log('❌ Video dimensions are 0, cannot detect face');
                    }
                  } catch (error) {
                    console.error('🧪 Manual detection error:', error);
                  }
                }}
                className="btn btn-warning test-detection-btn"
              >
                Test Face Detection
              </button>
            )}
            
            <button 
              onClick={stopCamera}
              className="btn btn-secondary cancel-btn"
            >
              Cancel
            </button>
          </>
        )}

        {(verificationStatus === 'idle' || verificationStatus === 'failed') && (
          <button 
            onClick={onCancel}
            className="btn btn-secondary cancel-btn"
          >
            Skip Verification
          </button>
        )}
      </div>

      <div className="verification-privacy">
        <p className="privacy-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM12 17C10.9 17 10 16.1 10 15S10.9 13 12 13 14 13.9 14 15 13.1 17 12 17Z" fill="currentColor"/>
          </svg>
          Your facial data is processed locally and used only for duplicate prevention. No images are permanently stored.
        </p>
      </div>
    </div>
  );
};

export default FacialVerification;