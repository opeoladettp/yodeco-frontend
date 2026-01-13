/**
 * Utility function to get the proper image URL for display
 * Handles both full URLs and S3 object keys
 * @param {string} imageUrl - The image URL or S3 object key
 * @returns {string|null} - The proper URL for displaying the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL (including S3 URLs), return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If it's an S3 object key, construct the S3 URL
  if (imageUrl.includes('uploads/')) {
    const cdnUrl = process.env.REACT_APP_CDN_URL || 'https://bvp-storage.s3.eu-north-1.amazonaws.com';
    return `${cdnUrl}/${imageUrl}`;
  }
  
  // Use backend media download route for other cases
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return `${apiBaseUrl}/media/download/${imageUrl}`;
};

export default getImageUrl;