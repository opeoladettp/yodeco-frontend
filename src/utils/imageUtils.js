/**
 * Utility function to get the proper image URL for display
 * Handles both full URLs and S3 object keys
 * @param {string} imageUrl - The image URL or S3 object key
 * @returns {string|null} - The proper URL for displaying the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  console.log('getImageUrl input:', imageUrl);
  
  // If it's already a full URL (including S3 URLs), return as is
  if (imageUrl.startsWith('http')) {
    console.log('Full URL detected, returning as-is:', imageUrl);
    return imageUrl;
  }
  
  // If it's an S3 object key (contains uploads/), construct the S3 URL directly
  if (imageUrl.includes('uploads/')) {
    const cdnUrl = process.env.REACT_APP_CDN_URL || 'https://bvp-storage.s3.eu-north-1.amazonaws.com';
    const fullUrl = `${cdnUrl}/${imageUrl}`;
    console.log('S3 URL constructed:', fullUrl);
    return fullUrl;
  }
  
  // For other cases, assume it's an S3 key and try to construct the URL
  const cdnUrl = process.env.REACT_APP_CDN_URL || 'https://bvp-storage.s3.eu-north-1.amazonaws.com';
  const fullUrl = `${cdnUrl}/${imageUrl}`;
  console.log('Default S3 URL constructed:', fullUrl);
  return fullUrl;
};

export default getImageUrl;