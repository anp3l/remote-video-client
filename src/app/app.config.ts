import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

interface CustomApplicationConfig extends ApplicationConfig {
  useLocalServer: boolean;
  apiBaseUrl: string;
  defaultViewMode: 'grid' | 'list';
  itemsPerPage: number;
  supportedVideoFormats: string[];
  supportedImageFormats: string[];
  maxVideoSizeMB: number;
  maxVideoDurationSeconds: number;
  maxThumbnailSizeMB: number;
}

export const appConfig: CustomApplicationConfig = {
  useLocalServer: false,
  apiBaseUrl: 'http://localhost:3001/api',
  defaultViewMode: 'grid' as 'grid' | 'list',
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
  maxVideoSizeMB: 100 * 1024 * 1024,
  maxVideoDurationSeconds: 120,
  maxThumbnailSizeMB: 10,
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
