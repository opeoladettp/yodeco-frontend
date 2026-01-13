import * as faceapi from 'face-api.js';

class BiometricService {
  constructor() {
    this.isInitialized = false;
    this.modelsLoaded = false;
    this.faceDescriptors = new Map(); // Store face descriptors for comparison
  }

  /**
   * Initialize face-api.js with required models
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🔄 Loading face-api.js models...');
      
      // Load models from public directory
      const MODEL_URL = '/models';
      
      // Check if models directory exists
      try {
        const response = await fetch(`${MODEL_URL}/tiny_face_detector_model-weights_manifest.json`);
        if (!response.ok) {
          throw new Error(`Models not found. Please ensure face-api.js models are in ${MODEL_URL}/`);
        }
      } catch (fetchError) {
        console.error('❌ Models directory check failed:', fetchError);
        throw new Error('Face recognition models not found. Please refresh the page and try again.');
      }
      
      console.log('📦 Loading face detection models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      ]);

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('✅ Face-API models loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load face-api models:', error);
      this.isInitialized = false;
      this.modelsLoaded = false;
      return false;
    }
  }

  /**
   * Detect and extract face descriptor from image/video
   */
  async extractFaceDescriptor(imageElement) {
    if (!this.isInitialized) {
      throw new Error('BiometricService not initialized');
    }

    try {
      // Detect face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('No face detected in the image');
      }

      return {
        descriptor: detection.descriptor,
        landmarks: detection.landmarks,
        detection: detection.detection,
        confidence: detection.detection.score
      };
    } catch (error) {
      console.error('Face extraction error:', error);
      throw error;
    }
  }

  /**
   * Compare two face descriptors
   */
  compareFaces(descriptor1, descriptor2, threshold = 0.6) {
    if (!descriptor1 || !descriptor2) {
      return { match: false, distance: 1 };
    }

    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const match = distance < threshold;

    return {
      match,
      distance,
      confidence: Math.max(0, 1 - distance)
    };
  }

  /**
   * Store face descriptor for a user
   */
  storeFaceDescriptor(userId, descriptor) {
    this.faceDescriptors.set(userId, {
      descriptor,
      timestamp: Date.now()
    });
  }

  /**
   * Check if a face matches any stored descriptors
   */
  checkForDuplicateFace(newDescriptor, excludeUserId = null) {
    const matches = [];

    for (const [userId, data] of this.faceDescriptors.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;

      const comparison = this.compareFaces(newDescriptor, data.descriptor);
      if (comparison.match) {
        matches.push({
          userId,
          confidence: comparison.confidence,
          distance: comparison.distance,
          timestamp: data.timestamp
        });
      }
    }

    return matches;
  }

  /**
   * Verify face quality for voting
   */
  async verifyFaceQuality(imageElement) {
    try {
      // Check if models are loaded
      if (!this.isInitialized || !this.modelsLoaded) {
        throw new Error('Face detection models not loaded yet');
      }
      
      // Check video element dimensions
      if (!imageElement.videoWidth || !imageElement.videoHeight) {
        throw new Error('Video element has no dimensions');
      }
      
      console.log(`🔍 Detecting face in ${imageElement.videoWidth}x${imageElement.videoHeight} video`);
      
      // First try a simple face detection without descriptors for better performance
      const detectorOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      });
      
      const simpleDetection = await faceapi
        .detectSingleFace(imageElement, detectorOptions);
      
      if (!simpleDetection) {
        console.log('❌ No face detected with TinyFaceDetector');
        return {
          faceDetected: false,
          confidence: 0,
          isGoodQuality: false,
          issues: ['No face detected in image']
        };
      }
      
      console.log('✅ Face detected, getting full data...');
      
      // If face is detected, get full data
      const faceData = await this.extractFaceDescriptor(imageElement);
      
      // Check face quality criteria
      const quality = {
        faceDetected: true,
        confidence: faceData.confidence,
        isGoodQuality: faceData.confidence > 0.7,
        landmarks: faceData.landmarks,
        issues: []
      };

      // Check confidence threshold
      if (faceData.confidence < 0.5) {
        quality.issues.push('Low face detection confidence');
        quality.isGoodQuality = false;
      }

      // Check if face is too small or too large
      const faceBox = faceData.detection.box;
      const faceArea = faceBox.width * faceBox.height;
      const imageArea = imageElement.videoWidth * imageElement.videoHeight;
      
      if (imageArea > 0) {
        const faceRatio = faceArea / imageArea;

        if (faceRatio < 0.05) {
          quality.issues.push('Face too small in image');
          quality.isGoodQuality = false;
        } else if (faceRatio > 0.8) {
          quality.issues.push('Face too large in image');
          quality.isGoodQuality = false;
        }
      }

      console.log('✅ Face quality check complete:', quality);
      return quality;
    } catch (error) {
      console.warn('Face quality verification error:', error);
      return {
        faceDetected: false,
        confidence: 0,
        isGoodQuality: false,
        issues: [error.message || 'Face detection failed']
      };
    }
  }

  /**
   * Create face signature for backend storage
   */
  createFaceSignature(descriptor) {
    // Convert Float32Array to regular array for JSON serialization
    return {
      data: Array.from(descriptor),
      timestamp: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Restore face descriptor from signature
   */
  restoreFaceDescriptor(signature) {
    if (!signature || !signature.data) return null;
    return new Float32Array(signature.data);
  }

  /**
   * Clear stored face descriptors (for privacy)
   */
  clearStoredDescriptors() {
    this.faceDescriptors.clear();
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      modelsLoaded: this.modelsLoaded,
      storedDescriptors: this.faceDescriptors.size
    };
  }
}

// Create singleton instance
const biometricService = new BiometricService();

export default biometricService;