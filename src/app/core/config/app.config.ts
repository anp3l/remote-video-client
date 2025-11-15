export const AppConfig = {
  apiBaseUrl: 'http://localhost:3070',
  defaultViewMode: 'grid' as const,
  itemsPerPage: 20,
  
  // Video validation
  maxVideoSizeMB: 2048,
  maxVideoDurationSeconds: 3600, 
  supportedVideoFormats: [
    'video/mp4',
    'video/quicktime',      // MOV
    'video/x-msvideo'       // AVI
  ],
  supportedVideoExtensions: ['mp4', 'mov', 'avi'],
  
  // Image/Thumbnail validation
  maxThumbnailSizeMB: 10,
  supportedImageFormats: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
  ],
  supportedImageExtensions: ['jpeg', 'jpg', 'png', 'webp'],
} as const;

export const CATEGORIES = [
  'Programming',
  'Photography',
  'Cooking',
  'Fitness',
  'Music',
  'Travel',
  'Business',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];

// Helper per convertire MB in bytes
export const MB_TO_BYTES = 1024 * 1024;
