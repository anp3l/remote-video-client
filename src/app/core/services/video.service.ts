import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Video, VideoMetadata } from '../models/video.model';
import { VideoApiService } from './video-api.service';
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
  private readonly MAX_SIZE_BYTES = AppConfig.maxVideoSizeMB * MB_TO_BYTES;
  private readonly MAX_DURATION_SECONDS = AppConfig.maxVideoDurationSeconds;

  // Signals 🎯
  videos = signal<Video[]>([]);
  loading = signal(false);

  // Computed Signals
  videoCount = computed(() => this.videos().length);
  categories = computed(() => {
    const cats = new Set(this.videos().map(v => v.category));
    return Array.from(cats);
  });

  constructor() {
      this.loadVideos();
  }

  loadVideos(): void {
    this.loading.set(true);
    
    this.videoApi.getAllVideos().subscribe({
      next: (videos) => {
        this.videos.set(videos);
        this.loading.set(false);
        this.snackBar.open('Video caricati dal server locale', 'Chiudi', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Errore connessione server:', error);
        this.loading.set(false);
        this.snackBar.open(
          'Impossibile connettersi al server locale.',
          'Chiudi',
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
    return new Promise((resolve, reject) => {
      this.videoApi.uploadVideo(videoFile, thumbnailFile, metadata).subscribe({
        next: (newVideo) => {
          this.videos.update(current => [newVideo, ...current]);
          this.snackBar.open('Video caricato con successo!', 'Chiudi', {
            duration: 3000
          });
          resolve(newVideo);
        },
        error: (error) => {
          this.snackBar.open('Errore durante il caricamento', 'Chiudi', {
            duration: 5000
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Validates a video file before upload
   * Checks: file type, size, duration, and codec compatibility
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
          reason: `Il file "${file.name}" non è un video supportato.`,
        });
        return;
      }

      // 2. Check if the MIME type is supported
      if (!this.isSupportedVideoFormat(file.type)) {
          resolve({
            file,
            valid: false,
            reason: `Formato video non supportato. Formati accettati: ${AppConfig.supportedVideoExtensions.join(', ').toUpperCase()}`,
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
            reason: `Il video "${file.name}" ha una durata non valida (potrebbe essere un codec non supportato).`,
          });
        } else if (tooBig) {
          const maxSizeMB = maxSize / MB_TO_BYTES;
          const fileSizeMB = (file.size / MB_TO_BYTES).toFixed(2);
          resolve({
            file,
            valid: false,
            reason: `Il file "${file.name}" supera il limite di ${maxSizeMB}MB (dimensione: ${fileSizeMB}MB).`,
          });
        } else if (tooLong) {
          const maxDurationFormatted = this.formatDuration(maxDuration);
          const videoDurationFormatted = this.formatDuration(Math.floor(duration));
          resolve({
            file,
            valid: false,
            reason: `Il video "${file.name}" supera la durata massima di ${maxDurationFormatted} (durata: ${videoDurationFormatted}).`,
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
        console.warn(`Video non leggibile o codec non supportato: ${file.name}`);
        resolve({
          file,
          valid: false,
          reason: `Il video "${file.name}" non può essere letto — potrebbe usare un codec o formato non supportato.`,
        });
      };

      video.src = URL.createObjectURL(file);
    });
  }

  updateVideo(id: string, updates: Partial<VideoMetadata>): Promise<Video> {
    return new Promise((resolve, reject) => {
      this.videoApi.updateVideo(id, updates).subscribe({
        next: (updatedVideo) => {
          this.videos.update(current =>
            current.map(v => v.id === id ? updatedVideo : v)
          );
          this.snackBar.open('Video aggiornato con successo!', 'Chiudi', {
            duration: 3000
          });
          resolve(updatedVideo);
        },
        error: (error) => {
          this.snackBar.open('Errore durante l\'aggiornamento', 'Chiudi', {
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
          this.snackBar.open('Video eliminato con successo!', 'Chiudi', {
            duration: 3000
          });
          resolve();
        },
        error: (error) => {
          this.snackBar.open('Errore durante l\'eliminazione', 'Chiudi', {
            duration: 5000
          });
          reject(error);
        }
      });
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'ora' : 'ore'}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`);
    }
    if (secs > 0 && hours === 0) { // Mostra i secondi solo se non ci sono ore
      parts.push(`${secs} ${secs === 1 ? 'secondo' : 'secondi'}`);
    }

    return parts.join(' e ') || '0 secondi';
  }

  /**
   * Type guard to check if a string is a supported video format
   */
  private isSupportedVideoFormat(
    type: string
  ): type is typeof AppConfig.supportedVideoFormats[number] {
    return (AppConfig.supportedVideoFormats as readonly string[]).includes(type);
  }

}



