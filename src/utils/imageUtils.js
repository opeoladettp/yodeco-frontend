/**
 * Utility function to get the proper image URL for display
 * Routes all images through backend media service for proper CORS handling
 * @param {string} imageUrl - The image URL or S3 object key
 * @returns {string|null} - The proper URL for displaying the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  console.log('getImageUrl input:', imageUrl);
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://api.yodeco.ng/api';
  
  // If it's already a backend media URL with the correct domain, return as-is
  if (imageUrl.includes('/api/media/download/')) {
    // Fix incorrect domain in existing URLs (support old domains and frontend domain)
    if (imageUrl.includes('yodeco.duckdns.org/api/media/download/') || 
        imageUrl.includes('www.yodeco.duckdns.org/api/media/download/') ||
        imageUrl.includes('yodeco-backend.duckdns.org/api/media/download/') ||
        imageUrl.includes('portal.yodeco.ng/api/media/download/')) {
      const correctedUrl = imageUrl.replace(
        /https?:\/\/(www\.)?(yodeco|yodeco-backend|portal\.yodeco)\.(?:duckdns\.org|ng)\/api\/media\/download\//,
        `${apiBaseUrl}/media/download/`
      );
      console.log('Corrected domain URL from:', imageUrl, 'to:', correctedUrl);
      return correctedUrl;
    }
    
    // If it already has the correct domain (api.yodeco.ng), return as-is
    if (imageUrl.includes('api.yodeco.ng/api/media/download/')) {
      console.log('URL already has correct domain:', imageUrl);
      return imageUrl;
    }
    
    // If it has /api/media/download/ but no domain, add the correct domain
    if (imageUrl.startsWith('/api/media/download/')) {
      const correctedUrl = `${apiBaseUrl.replace('/api', '')}${imageUrl}`;
      console.log('Added domain to relative URL:', correctedUrl);
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
  
  // If it's an S3 object key (no protocol), construct the backend media URL
  const backendUrl = `${apiBaseUrl}/media/download/${imageUrl}`;
  console.log('Backend media URL constructed:', backendUrl);
  return backendUrl;
};

export default getImageUrl;