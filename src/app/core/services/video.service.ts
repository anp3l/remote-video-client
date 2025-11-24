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

  /**
   * Load all videos from the local server.
   * Subscribes to the video API to fetch all videos.
   * Sets the loading state to true until the data is loaded.
   * If the data is loaded successfully, sets the videos state to the loaded videos.
   * If an error occurs, sets the loading state to false and displays an error message.
   */
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

  /**
   * Uploads a video to the server.
   * Registers the upload with the upload progress service and emits progress events.
   * If the upload is successful, adds the uploaded video to the list of videos and marks it as uploaded.
   * If an error occurs during the upload, updates the upload progress service with the error message.
   * @param videoFile The video file to be uploaded.
   * @param thumbnailFile The thumbnail file to be uploaded, or null if no thumbnail is provided.
   * @param metadata The metadata of the video to be uploaded.
   * @returns A promise that resolves to the uploaded video when the upload is successful, or rejects with an error if the upload fails.
   */
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

            setTimeout(() => {
              this.uploadProgressService.removeUpload(tempId);
            }, 2000);
            
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

/**
 * Validates a video file to ensure it's a supported video format, doesn't exceed the maximum allowed size and duration.
 * @param file The video file to be validated.
 * @param maxSize The maximum allowed size of the video file in bytes.
 * @param maxDuration The maximum allowed duration of the video file in seconds.
 * @returns A promise that resolves to a VideoValidationResult object. The object contains the original file, a boolean indicating whether the file is valid, and an optional reason string if the file is not valid.
 */
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

/**
 * Validates a thumbnail file to ensure it's a supported image format and doesn't exceed the maximum allowed size.
 * @param file The thumbnail file to be validated.
 * @param maxSize The maximum allowed size of the thumbnail file in bytes.
 * @param supportedFormats The supported image formats.
 * @returns A promise that resolves to an object containing a boolean indicating whether the file is valid and an optional reason string if the file is not valid.
 */
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

/**
 * Updates a video with the given id.
 * @param id The id of the video to be updated.
 * @param updates The updates to be applied to the video.
 * @returns A promise that resolves to the updated video when the update is successful, or rejects with an error if the update fails.
 */
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

  /**
   * Deletes a video with the given id.
   * Subscribes to the video API to delete the video.
   * If the video is deleted successfully, updates the videos state to exclude the deleted video and displays a success message.
   * If an error occurs, displays an error message.
   * @param id The id of the video to be deleted.
   * @returns A promise that resolves to void when the deletion is successful, or rejects with an error if the deletion fails.
   */
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

  /**
   * Downloads a video with the given id and title.
   * Subscribes to the video API to get the video download URL.
   * If the video is downloaded successfully, creates a link to download the video as a blob.
   * If an error occurs, displays an error message.
   * @param id The id of the video to be downloaded.
   * @param title The title of the video to be used as the filename.
   */
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

  /**
   * Formats a duration given in seconds to a string in the format of "X hours, Y minutes and Z seconds".
   * If the duration is less than an hour, only minutes and seconds are displayed.
   * If the duration is less than a minute, only seconds are displayed.
   * @param seconds The duration given in seconds.
   * @returns A string representation of the duration.
   */
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

/**
 * Checks if a given video format is supported by the application.
 * @param type The video format type to be checked.
 * @returns True if the video format is supported, false otherwise.
 */
  private isSupportedVideoFormat(
    type: string
  ): type is typeof AppConfig.supportedVideoFormats[number] {
    return (AppConfig.supportedVideoFormats as readonly string[]).includes(type);
  }

/**
 * Checks if a given thumbnail format is supported by the application.
 * @param type The thumbnail format type to be checked.
 * @returns True if the thumbnail format is supported, false otherwise.
 */
  private isSupportedThumbFormat(
    type: string
  ): type is typeof AppConfig.supportedImageFormats[number] {
    return (AppConfig.supportedImageFormats as readonly string[]).includes(type);
  }

}
