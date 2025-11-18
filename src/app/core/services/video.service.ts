import { Injectable, inject, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Video, VideoMetadata } from '../models/video.model';
import { VideoApiService } from './video-api.service';
import { UploadProgressService } from './upload-progress.service';
import { AppConfig, MB_TO_BYTES } from '../config/app.config';

export interface VideoValidationResult {
  file: File;
  valid: boolean;
  reason?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private videoApi = inject(VideoApiService);
  private snackBar = inject(MatSnackBar);
  private uploadProgressService = inject(UploadProgressService);
  private readonly MAX_SIZE_BYTES = AppConfig.maxVideoSizeMB * MB_TO_BYTES;
  private readonly MAX_DURATION_SECONDS = AppConfig.maxVideoDurationSeconds;
  private readonly MAX_THUMBNAIL_SIZE_BYTES = AppConfig.maxThumbnailSizeMB * MB_TO_BYTES;


  videos = signal<Video[]>([]);
  loading = signal(false);

  videoCount = computed(() => this.videos().length);
  categories = computed(() => {
    const cats = new Set(this.videos().map(v => v.category));
    return Array.from(cats);
  });

  constructor() {}

  loadVideos(): void {
    this.loading.set(true);
    
    this.videoApi.getAllVideos().subscribe({
      next: (videos) => {
        this.videos.set(videos);
        this.loading.set(false);
        this.snackBar.open('Videos loaded from local server', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Server connection error:', error);
        this.loading.set(false);
        this.snackBar.open(
          'Unable to connect to the local server.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  uploadVideo(
    videoFile: File,
    thumbnailFile: File | null,
    metadata: VideoMetadata
  ): Promise<Video> {
    const tempId = `temp_${Date.now()}`;
    
    // Register the upload
    this.uploadProgressService.addUpload(tempId, videoFile.name, metadata.title);

    return new Promise((resolve, reject) => {
      this.videoApi.uploadVideo(videoFile, thumbnailFile, metadata).subscribe({
        next: (event) => {
          if (event.type === 'progress') {
            // Update progress percentage
            this.uploadProgressService.updateProgress(tempId, {
              progress: event.progress!
            });
          } else if (event.type === 'complete') {
            // Upload completed - server responded with videoStatus: "inProgress"
            const newVideo = event.video!;
            
            // Update to 100% and mark as uploaded
            this.uploadProgressService.updateProgress(tempId, {
              id: newVideo.id,
              status: 'uploaded',
              progress: 100
            });

            // Add video to list (will show with videoStatus: "inProgress" in app-card)
            this.videos.update(current => [newVideo, ...current]);
            
            resolve(newVideo);
          }
        },
        error: (error) => {
          this.uploadProgressService.updateProgress(tempId, {
            status: 'error',
            errorMessage: error.message || 'Error during upload'
          });
          this.snackBar.open('Error during upload', 'Close', {
            duration: 5000
          });
          reject(error);
        }
      });
    });
  }

  validateVideoFile(
    file: File,
    maxSize = this.MAX_SIZE_BYTES,
    maxDuration = this.MAX_DURATION_SECONDS
  ): Promise<VideoValidationResult> {
    return new Promise((resolve) => {
      // 1. Check if it's a video file
      if (!file.type.startsWith('video/')) {
        resolve({
          file,
          valid: false,
          reason: `The file "${file.name}" is not a supported video.`,
        });
        return;
      }

      // 2. Check if the MIME type is supported
      if (!this.isSupportedVideoFormat(file.type)) {
        resolve({
          file,
          valid: false,
          reason: `Unsupported video format. Accepted formats: ${AppConfig.supportedVideoExtensions.map(ext => ext.toUpperCase()).join(', ')}`,
        });
        return;
      }

      // 3. Create video element to extract metadata
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);

        const duration = video.duration;
        const tooLong = duration > maxDuration;
        const tooBig = file.size > maxSize;
        const invalidDuration = !isFinite(duration) || isNaN(duration) || duration === 0;

        if (invalidDuration) {
          resolve({
            file,
            valid: false,
            reason: `The video "${file.name}" has an invalid duration (likely unsupported codec).`,
          });
        } else if (tooBig) {
          const maxSizeMB = maxSize / MB_TO_BYTES;
          const fileSizeMB = (file.size / MB_TO_BYTES).toFixed(2);
          resolve({
            file,
            valid: false,
           reason: `The file "${file.name}" exceeds the size limit of ${maxSizeMB}MB (size: ${fileSizeMB}MB).`,
          });
        } else if (tooLong) {
          const maxDurationFormatted = this.formatDuration(maxDuration);
          const videoDurationFormatted = this.formatDuration(Math.floor(duration));
          resolve({
            file,
            valid: false,
            reason: `The video "${file.name}" exceeds the maximum allowed duration of ${maxDurationFormatted} (duration: ${videoDurationFormatted}).`,
          });
        } else {
          resolve({
            file,
            valid: true,
            duration
          });
        }
      };

      video.onerror = () => {
        console.warn(`Unreadable video or unsupported codec: ${file.name}`);
        resolve({
          file,
          valid: false,
          reason: `The video "${file.name}" cannot be read — it may use an unsupported codec or format.`,
        });
      };

      video.src = URL.createObjectURL(file);
    });
  }

  validateThumbnailFile(
    file: File,
    maxSize = this.MAX_THUMBNAIL_SIZE_BYTES,
    supportedFormats = AppConfig.supportedImageFormats
  ): Promise<{ valid: boolean; reason?: string }> {
    return new Promise((resolve) => {
      // Check supported image MIME type
      if (!file.type.startsWith('image/')) {
        resolve({ valid: false, reason: `The file "${file.name}" is not a valid image.` });
        return;
      }

      if (!this.isSupportedThumbFormat(file.type)) {
        resolve({
          valid: false,
          reason: `Unsupported image format. Accepted formats: ${AppConfig.supportedImageExtensions.map(ext => ext.toUpperCase()).join(', ')}`,
        });
        return;
      }

      // Check max size
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / MB_TO_BYTES;
        const fileSizeMB = (file.size / MB_TO_BYTES).toFixed(2);
        resolve({
          valid: false,
          reason: `The file "${file.name}" exceeds the size limit of ${maxSizeMB}MB (size: ${fileSizeMB}MB).`,
        });
        return;
      }

      // All checks passed
      resolve({ valid: true });
    });
  }

  updateVideo(id: string, updates: Partial<VideoMetadata>): Promise<Video> {
    return new Promise((resolve, reject) => {
      this.videoApi.updateVideo(id, updates).subscribe({
        next: (updatedVideo) => {
          this.videos.update(current =>
            current.map(v => {
              if (v.id === id) {
                return { ...v, ...updatedVideo };
              }
              return v;
            })
          );
          this.snackBar.open('Video updated successfully!', 'Close', {
            duration: 3000
          });
          resolve(updatedVideo);
        },
        error: (error) => {
          this.snackBar.open('Error updating video', 'Close', {
            duration: 5000
          });
          reject(error);
        }
      });
    });
  }

  deleteVideo(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.videoApi.deleteVideo(id).subscribe({
        next: () => {
          this.videos.update(current => current.filter(v => v.id !== id));
          this.snackBar.open('Video deleted successfully!', 'Close', {
            duration: 3000
          });
          resolve();
        },
        error: (error) => {
          this.snackBar.open('Error deleting video', 'Close', {
            duration: 5000
          });
          reject(error);
        }
      });
    });
  }

  downloadVideo(id: string, title: string): void {
    this.videoApi.getVideoDownload(id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;

        let filename = title;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches?.[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);

      },
      error: (error) => {
        console.error('Download error:', error);
        this.snackBar.open('Error during download', 'Close', {
          duration: 5000
        });
      }
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }
    if (secs > 0 && hours === 0) {
      parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
    }

    return parts.join(' and ') || '0 seconds';
  }

  private isSupportedVideoFormat(
    type: string
  ): type is typeof AppConfig.supportedVideoFormats[number] {
    return (AppConfig.supportedVideoFormats as readonly string[]).includes(type);
  }

  private isSupportedThumbFormat(
    type: string
  ): type is typeof AppConfig.supportedImageFormats[number] {
    return (AppConfig.supportedImageFormats as readonly string[]).includes(type);
  }

}
