/**
 * Utility function to get the proper image URL for display
 * Routes all images through backend media service for proper CORS handling
 * @param {string} imageUrl - The image URL or S3 object key
 * @returns {string|null} - The proper URL for displaying the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  console.log('getImageUrl input:', imageUrl);
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://yodeco-backend.duckdns.org/api';
  
  // If it's already a backend media URL, return as-is
  if (imageUrl.includes('/api/media/download/')) {
    // Fix incorrect domain in existing URLs
    if (imageUrl.includes('yodeco.duckdns.org/api/media/download/') || 
        imageUrl.includes('www.yodeco.duckdns.org/api/media/download/')) {
      const correctedUrl = imageUrl.replace(
        /https?:\/\/(www\.)?yodeco\.duckdns\.org\/api\/media\/download\//,
        'https://yodeco-backend.duckdns.org/api/media/download/'
      );
      console.log('Corrected backend URL:', correctedUrl);
      return correctedUrl;
    }
    return imageUrl;
  }
  
  // If it's a direct S3 URL, extract the object key and route through backend
  if (imageUrl.startsWith('https://') && imageUrl.includes('.s3.')) {
    // Extract object key from S3 URL
    // Format: https://bucket.s3.region.amazonaws.com/path/to/file.ext
    const urlParts = imageUrl.split('.amazonaws.com/');
    if (urlParts.length === 2) {
      const objectKey = urlParts[1];
      const backendUrl = `${apiBaseUrl}/media/download/${objectKey}`;
      console.log('S3 URL converted to backend URL:', backendUrl);
      return backendUrl;
    }
  }
  
  // If it's an S3 object key, construct the backend media URL
  const backendUrl = `${apiBaseUrl}/media/download/${imageUrl}`;
  console.log('Backend media URL constructed:', backendUrl);
  return backendUrl;
};

export default getImageUrl;