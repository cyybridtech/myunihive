/**
 * Cloudinary & Web Image Delivery Optimizer
 * Injects automatic modern format selection (WebP/AVIF) and quality compression
 */
export function optimizeImageUrl(url?: string | null, width = 800): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80';
  }

  // Optimize Cloudinary URLs with dynamic transformations
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
  }

  // Optimize Unsplash images with width & quality
  if (url.includes('images.unsplash.com') && !url.includes('w=')) {
    return `${url}&w=${width}&q=80&auto=format`;
  }

  return url;
}
