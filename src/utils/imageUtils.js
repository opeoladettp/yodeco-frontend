/**
 * Utility function to get the proper image URL for display
 * Handles both full URLs and S3 object keys
 * @param {string} imageUrl - The image URL or S3 object key
 * @returns {string|null} - The proper URL for displaying the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  console.log('getImageUrl input:', imageUrl);
  
  // If it's already a full URL, check if it needs domain correction
  if (imageUrl.startsWith('http')) {
    console.log('Full URL detected:', imageUrl);
    
    // Fix incorrect domain in existing URLs
    if (imageUrl.includes('yodeco.duckdns.org/api/media/download/') || 
        imageUrl.includes('www.yodeco.duckdns.org/api/media/download/')) {
      const correctedUrl = imageUrl.replace(
        /https?:\/\/(www\.)?yodeco\.duckdns\.org\/api\/media\/download\//,
        'https://yodeco-backend.duckdns.org/api/media/download/'
      );
      console.log('Corrected URL:', correctedUrl);
      return correctedUrl;
    }
    
    // If it's already a correct backend URL or S3 URL, return as-is
    return imageUrl;
  }
  
  // If it's an S3 object key (contains uploads/), construct the backend media URL
  if (imageUrl.includes('uploads/')) {
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://yodeco-backend.duckdns.org/api';
    const fullUrl = `${apiBaseUrl}/media/download/${imageUrl}`;
    console.log('Backend media URL constructed:', fullUrl);
    return fullUrl;
  }
  
  // For other cases, assume it's an S3 key and construct backend media URL
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://yodeco-backend.duckdns.org/api';
  const fullUrl = `${apiBaseUrl}/media/download/${imageUrl}`;
  console.log('Default backend media URL constructed:', fullUrl);
  return fullUrl;
};

export default getImageUrl;