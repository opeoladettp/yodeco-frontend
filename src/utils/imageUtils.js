/**
 * Utility function to get the proper image URL for display
 * Handles both full URLs and S3 object keys
 * @param {string} imageUrl - The image URL or S3 object key
 * @returns {string|null} - The proper URL for displaying the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Use backend media download route for S3 object keys
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return `${apiBaseUrl}/media/download/${imageUrl}`;
};

export default getImageUrl;