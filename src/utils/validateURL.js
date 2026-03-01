'use client';

export default function validateURL(url) {
    if (!url) {
      return 'Website URL is required';
    }
  
    // Basic URL structure validation
    try {
      // Ensure URL has protocol (add https if missing)
      const parsedUrl = new URL(url.includes('://') ? url : `https://${url}`);
      
      // Validate protocol (only http/https allowed)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return 'Only http:// and https:// protocols are allowed';
      }
      
      // Validate domain structure
      const domainParts = parsedUrl.hostname.split('.');
      if (domainParts.length < 2) {
        return 'Invalid domain format (must contain at least one dot)';
      }
      
      // Validate TLD (top-level domain)
      const tld = domainParts[domainParts.length - 1];
      const validTlds = [
        // Common Commercial
        'com', 'org', 'net', 'biz', 'info', 'pro', 'name', 'co', 'io', 'ai',
      
        // Tech & Startup
        'app', 'dev', 'tech', 'cloud', 'digital', 'systems', 'software', 'solutions', 'site', 'xyz', 'online',
      
        // Popular Country-Code (ccTLDs)
        'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'in', 'sg', 'cn', 'ru', 'br', 'za',
        'ae', 'hk', 'kr', 'tw', 'my', 'id', 'ph', 'vn', 'th', 'nz', 'pl', 'tr',
        'es', 'it', 'nl', 'se', 'no', 'dk', 'ch', 'be', 'fi', 'pt', 'ie', 'cz',
        'cl', 'ar', 'mx', 'co', 'il', 'ir', 'pk', 'bd', 'lk', 'ng', 'ke',
      
        // Modern gTLDs
        'store', 'shop', 'agency', 'group', 'company', 'enterprises', 'inc', 'llc',
        'capital', 'ventures', 'partners', 'media', 'marketing', 'design', 'studio',
      
        // Finance/Legal
        'finance', 'money', 'bank', 'law', 'legal', 'accountants',
      
        // Real Estate & Services
        'estate', 'property', 'homes', 'services', 'repair', 'cleaning', 'care',
      
        // Education
        'edu', 'academy', 'school', 'university', 'training', 'college', 'institute'
      ];
      
      
      if (!validTlds.includes(tld.toLowerCase())) {
        return 'Please use a standard top-level domain (.com, .org, etc.)';
      }
      
      // Validate no IP addresses
      if (/^\d+\.\d+\.\d+\.\d+$/.test(parsedUrl.hostname)) {
        return 'IP addresses are not allowed for company websites';
      }
      
      // Validate no special characters in domain
      if (!/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(parsedUrl.hostname)) {
        return 'Domain name contains invalid characters';
      }
      
      // Validate no suspicious paths (optional)
      const suspiciousPaths = ['admin', 'login', 'wp-admin', 'cpanel'];
      if (suspiciousPaths.some(path => parsedUrl.pathname.includes(path))) {
        return 'URL contains suspicious path elements';
      }
      
      // Validate no query parameters (optional)
      if (parsedUrl.search) {
        return 'URL should not contain query parameters';
      }
      
      // Validate no ports (optional)
      if (parsedUrl.port) {
        return 'URL should not contain port numbers';
      }
      
    } catch (e) {
      return 'Invalid URL format';
    }
    
    return ''; // No errors = valid URL
  };
  