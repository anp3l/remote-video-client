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
  private uploadProgressService = inject(UploadProgressService); // ← AGGIUNGI QUESTO
  private readonly MAX_SIZE_BYTES = AppConfig.maxVideoSizeMB * MB_TO_BYTES;
  private readonly MAX_DURATION_SECONDS = AppConfig.maxVideoDurationSeconds;
  private readonly MAX_THUMBNAIL_SIZE_BYTES = AppConfig.maxThumbnailSizeMB * MB_TO_BYTES;


  // Signals 🎯
  videos = signal<Video[]>([]);
  loading = signal(false);

  // Computed Signals
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
            
            // Show success message
            this.snackBar.open('Video caricato! Elaborazione in corso...', 'Chiudi', {
              duration: 3000
            });
            
            resolve(newVideo);
          }
        },
        error: (error) => {
          this.uploadProgressService.updateProgress(tempId, {
            status: 'error',
            errorMessage: error.message || 'Errore durante il caricamento'
          });
          
          this.snackBar.open('Errore durante il caricamento', 'Chiudi', {
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

  validateThumbnailFile(
    file: File,
    maxSize = this.MAX_THUMBNAIL_SIZE_BYTES,
    supportedFormats = AppConfig.supportedImageFormats
  ): Promise<{ valid: boolean; reason?: string }> {
    return new Promise((resolve) => {
      // Verifica tipo MIME immagine supportato
      if (!file.type.startsWith('image/')) {
        resolve({ valid: false, reason: `Il file "${file.name}" non è un'immagine valida.` });
        return;
      }

      if (!this.isSupportedThumbFormat(file.type)) {
        resolve({
          valid: false,
          reason: `Formato immagine non supportato. Formati accettati: ${AppConfig.supportedImageExtensions.map(ext => ext.toUpperCase()).join(', ')}`,
        });
        return;
      }

      // Verifica dimensione massima
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / MB_TO_BYTES;
        const fileSizeMB = (file.size / MB_TO_BYTES).toFixed(2);
        resolve({
          valid: false,
          reason: `Il file "${file.name}" supera il limite di ${maxSizeMB}MB (dimensione: ${fileSizeMB}MB).`,
        });
        return;
      }

      // Se tutte le condizioni passano
      resolve({ valid: true });
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
    if (secs > 0 && hours === 0) {
      parts.push(`${secs} ${secs === 1 ? 'secondo' : 'secondi'}`);
    }

    return parts.join(' e ') || '0 secondi';
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
