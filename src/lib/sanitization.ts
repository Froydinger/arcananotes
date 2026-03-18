import DOMPurify from 'dompurify';

// Strict DOMPurify configuration for enhanced security
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'img', 'div', 'span', 'h1', 'blockquote'],
  ALLOWED_ATTR: ['src', 'alt', 'class'],
  ALLOW_DATA_ATTR: false, // We'll manually allow specific data attributes
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
  KEEP_CONTENT: true,
  SANITIZE_DOM: true,
};

/**
 * Validates if a URL is safe for image insertion
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Only allow https, data, and blob URLs
    const allowedProtocols = ['https:', 'data:', 'blob:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // For data URLs, ensure they're images and don't contain scripts
    if (urlObj.protocol === 'data:') {
      const dataPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i;
      if (!dataPattern.test(url)) {
        return false;
      }
      
      // Check for potential script injection in SVG data URLs
      if (url.toLowerCase().includes('script') || url.toLowerCase().includes('javascript')) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes image URL and attributes
 */
export function sanitizeImageUrl(url: string, alt?: string): { url: string; alt: string } {
  if (!isValidImageUrl(url)) {
    throw new Error('Invalid or unsafe image URL');
  }
  
  return {
    url: url,
    alt: alt ? DOMPurify.sanitize(alt, { ALLOWED_TAGS: [], KEEP_CONTENT: true }) : ''
  };
}



/**
 * Main content sanitization function
 */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  
  // Apply strict DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(content, SANITIZE_CONFIG);
  
  // Additional validation: remove any remaining script-like content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitized;
  
  // Remove any elements with javascript: URLs
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.value.toLowerCase().includes('javascript:') || attr.value.toLowerCase().includes('data:text/html')) {
        element.removeAttribute(attr.name);
      }
    });
  });
  
  return tempDiv.innerHTML;
}

/**
 * Sanitize content for display
 */
export function sanitizeForDisplay(content: string): string {
  if (!content) return '';
  
  return DOMPurify.sanitize(content, SANITIZE_CONFIG);
}