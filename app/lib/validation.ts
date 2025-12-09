import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving safe formatting
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  // Configure DOMPurify to allow only safe HTML tags and attributes
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });

  return clean;
}

/**
 * Validate and sanitize Steam Workshop URL
 * Ensures the URL is from Steam Workshop and is properly formatted
 */
export function validateWorkshopURL(url: string): { valid: boolean; sanitized: string; error?: string } {
  if (!url) {
    return { valid: true, sanitized: '' };
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Check if it's a valid URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch (error) {
    return { valid: false, sanitized: '', error: 'Invalid URL format' };
  }

  // Only allow Steam Workshop URLs
  const allowedHosts = [
    'steamcommunity.com',
    'www.steamcommunity.com'
  ];

  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return { valid: false, sanitized: '', error: 'URL must be from Steam Workshop (steamcommunity.com)' };
  }

  // Ensure it's a workshop URL
  if (!parsedUrl.pathname.includes('/sharedfiles/filedetails/')) {
    return { valid: false, sanitized: '', error: 'URL must be a Steam Workshop item' };
  }

  // Ensure HTTPS protocol
  if (parsedUrl.protocol !== 'https:') {
    parsedUrl.protocol = 'https:';
  }

  // Remove any dangerous query parameters
  const allowedParams = ['id'];
  const sanitizedParams = new URLSearchParams();
  allowedParams.forEach(param => {
    const value = parsedUrl.searchParams.get(param);
    if (value) {
      // Ensure the id is numeric only
      if (param === 'id' && /^\d+$/.test(value)) {
        sanitizedParams.set(param, value);
      }
    }
  });

  // Reconstruct the URL with sanitized parameters
  const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}?${sanitizedParams.toString()}`;

  return { valid: true, sanitized: sanitizedUrl };
}

/**
 * Validate game name
 * Ensures the name is not empty and doesn't contain malicious content
 */
export function validateGameName(name: string): { valid: boolean; sanitized: string; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, sanitized: '', error: 'Game name is required' };
  }

  const trimmed = name.trim();

  // Check length
  if (trimmed.length < 3) {
    return { valid: false, sanitized: '', error: 'Game name must be at least 3 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, sanitized: '', error: 'Game name must be less than 100 characters' };
  }

  // Remove any HTML tags
  const sanitized = trimmed.replace(/<[^>]*>/g, '');

  return { valid: true, sanitized };
}

/**
 * Validate description
 * Sanitizes description to prevent XSS
 */
export function validateDescription(description: string): { valid: boolean; sanitized: string; error?: string } {
  if (!description) {
    return { valid: true, sanitized: '' };
  }

  const trimmed = description.trim();

  // Check length
  if (trimmed.length > 500) {
    return { valid: false, sanitized: '', error: 'Description must be less than 500 characters' };
  }

  // Remove any HTML tags
  const sanitized = trimmed.replace(/<[^>]*>/g, '');

  return { valid: true, sanitized };
}

/**
 * Validate template name
 * Ensures the template name is safe and properly formatted
 */
export function validateTemplateName(name: string): { valid: boolean; sanitized: string; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, sanitized: '', error: 'Template name is required' };
  }

  const trimmed = name.trim();

  // Check length
  if (trimmed.length < 3) {
    return { valid: false, sanitized: '', error: 'Template name must be at least 3 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, sanitized: '', error: 'Template name must be less than 50 characters' };
  }

  // Remove any HTML tags
  const sanitized = trimmed.replace(/<[^>]*>/g, '');

  return { valid: true, sanitized };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

/**
 * Validate nation tag (HOI4 uses 3-letter codes)
 */
export function validateNationTag(tag: string): boolean {
  if (!tag || typeof tag !== 'string') return false;
  const tagPattern = /^[A-Z]{3}$/;
  return tagPattern.test(tag.toUpperCase());
}

/**
 * Validate Discord ID  
 */
export function validateDiscordId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const discordIdPattern = /^\d{17,19}$/;
  return discordIdPattern.test(id);
}

/**
 * Validate array of UUIDs
 */
export function validateUUIDArray(uuids: unknown): uuids is string[] {
  if (!Array.isArray(uuids)) return false;
  if (uuids.length === 0 || uuids.length > 100) return false;
  return uuids.every(uuid => validateUUID(uuid));
}

/**
 * Validate news title
 */
export function validateNewsTitle(title: string): { valid: boolean; sanitized: string; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, sanitized: '', error: 'Title is required' };
  }
  const trimmed = title.trim();
  if (trimmed.length < 3 || trimmed.length > 200) {
    return { valid: false, sanitized: '', error: 'Title must be between 3 and 200 characters' };
  }
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  return { valid: true, sanitized };
}

/**
 * Validate news excerpt
 */
export function validateNewsExcerpt(excerpt: string): { valid: boolean; sanitized: string; error?: string } {
  if (!excerpt || !excerpt.trim()) {
    return { valid: false, sanitized: '', error: 'Excerpt is required' };
  }
  const trimmed = excerpt.trim();
  if (trimmed.length < 10 || trimmed.length > 500) {
    return { valid: false, sanitized: '', error: 'Excerpt must be between 10 and 500 characters' };
  }
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  return { valid: true, sanitized };
}

/**
 * Validate news content
 */
export function validateNewsContent(content: string): { valid: boolean; sanitized: string; error?: string } {
  if (!content || !content.trim()) {
    return { valid: false, sanitized: '', error: 'Content is required' };
  }
  const trimmed = content.trim();
  if (trimmed.length < 10) {
    return { valid: false, sanitized: '', error: 'Content must be at least 10 characters' };
  }
  if (trimmed.length > 50000) {
    return { valid: false, sanitized: '', error: 'Content must be less than 50,000 characters' };
  }
  const sanitized = sanitizeHTML(trimmed);
  return { valid: true, sanitized };
}

/**
 * Validate news category
 */
export function validateNewsCategory(category: string): boolean {
  const validCategories = ['Tournament', 'Update', 'Announcement'];
  return validCategories.includes(category);
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; sanitized: string; error?: string } {
  if (!username || !username.trim()) {
    return { valid: false, sanitized: '', error: 'Username is required' };
  }
  const trimmed = username.trim();
  const usernamePattern = /^[a-zA-Z0-9_\- ]{3,32}$/;
  if (!usernamePattern.test(trimmed)) {
    return {
      valid: false,
      sanitized: '',
      error: 'Username must be 3-32 characters and contain only letters, numbers, spaces, hyphens, and underscores'
    };
  }
  return { valid: true, sanitized: trimmed };
}

