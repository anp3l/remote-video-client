import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Video, VideoMetadata } from '../models/video.model';
import { VideoApiService } from './video-api.service';
import { AppConfig } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private videoApi = inject(VideoApiService);
  private snackBar = inject(MatSnackBar);

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


}
