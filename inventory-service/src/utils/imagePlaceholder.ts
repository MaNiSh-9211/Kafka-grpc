/**
 * Image Placeholder Generator
 * 
 * Generates unique placeholder images for products when no image is available.
 * Uses a deterministic approach to generate consistent images based on product ID.
 */

import { createHash } from 'crypto';

/**
 * Generate a unique placeholder image URL based on product ID
 * 
 * Uses services like placeholder.com or generates a unique identifier
 * that can be used with image generation services.
 * 
 * @param productId - Product ID or SKU
 * @param width - Image width (default: 400)
 * @param height - Image height (default: 400)
 * @returns Base64 encoded placeholder image or URL
 */
export function generatePlaceholderImage(
  productId: string,
  width: number = 400,
  height: number = 400
): string {
  // Generate a deterministic seed from product ID
  const hash = createHash('md5').update(productId).digest('hex');
  
  // Use the hash to generate consistent colors and patterns
  const seed = parseInt(hash.substring(0, 8), 16);
  
  // Generate colors from hash
  const hue = seed % 360;
  const saturation = 50 + (seed % 30); // 50-80%
  const lightness = 40 + (seed % 20); // 40-60%
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${hash.substring(0, 6)}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, ${saturation}%, ${lightness}%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness + 10}%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${hash.substring(0, 6)})"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
        ${productId.substring(0, 8).toUpperCase()}
      </text>
    </svg>
  `.trim();
  
  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get product image URL or generate placeholder
 * 
 * @param product - Product object with imageBase64, imageUrl, and id/sku
 * @returns Image URL (base64 data URL or external URL)
 */
export function getProductImage(product: {
  imageBase64?: string;
  imageUrl?: string;
  id?: string;
  sku?: string;
  _id?: any;
}): string {
  // Priority: imageBase64 > imageUrl > generated placeholder
  if (product.imageBase64) {
    // If it's already a data URL, return as is
    if (product.imageBase64.startsWith('data:')) {
      return product.imageBase64;
    }
    // Otherwise, assume it's base64 and create data URL
    return `data:image/png;base64,${product.imageBase64}`;
  }
  
  if (product.imageUrl) {
    return product.imageUrl;
  }
  
  // Generate placeholder using product ID or SKU
  const identifier = product.id || product.sku || product._id?.toString() || 'default';
  return generatePlaceholderImage(identifier);
}

