export const AppConfig = {
  apiBaseUrl: 'http://localhost:3070',
  defaultViewMode: 'grid' as const,
  itemsPerPage: 20,
  supportedVideoFormats: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ],
  supportedImageFormats: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  maxVideoSizeMB: 2048,
  maxThumbnailSizeMB: 10,
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
