import { Component, Input, Output, EventEmitter, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { Video } from '../../models/video.model';
import { VideoApiService } from '../../services/video-api.service';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of, Subscription, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DurationFormatPipe } from '../../../shared/pipes/duration-format-pipe';
import { FileSizePipe } from '../../../shared/pipes/file-size-pipe';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    DurationFormatPipe,
    FileSizePipe
  ],
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss']
})
export class VideoCardComponent {
  private videoApiService = inject(VideoApiService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) video!: Video;
  @Output() play = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  private videoStatusCache = signal<Record<string, string>>({});
  private staticThumbnailCache = signal<Record<string, string>>({});
  private animatedThumbnailCache = signal<Record<string, string>>({});
  private pollingSubscriptions = new Map<string, Subscription>();

  onPlay(): void {
    this.play.emit();
  }

  onDownload(): void {
    this.download.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

/**
 * Checks if the video has been uploaded to the server.
 *
 * If the video has an ID, it will poll the server for the video's status until it is uploaded.
 * If the video has not been uploaded, it will return false.
 * If the video has been uploaded, it will return true.
 * @param video The video to be checked.
 * @returns True if the video has been uploaded, false otherwise.
 */
  isVideoUploaded(video: Video): boolean {
    const id = video.id;
    if (!id) return false;

    const status = this.videoStatusCache()[id];
    if (status === 'uploaded') return true;

    if (!this.pollingSubscriptions.has(id)) {
      const sub = this.videoApiService.pollUntilUploaded(id, 10000).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((newStatus) => {
          if (this.videoStatusCache()[id] !== newStatus) {
            this.videoStatusCache.update(cache => ({
              ...cache,
              [id]: newStatus
            }));
          }
        }),
        switchMap((newStatus) => {
          if (newStatus !== 'uploaded') return of(null);
          
          const staticUrl = this.videoApiService.getThumbnailUrl(id);
          const animatedUrl = this.videoApiService.getAnimatedThumbnailUrl(id);
          
          return forkJoin({
            staticThumb: this.http.get(staticUrl, { responseType: 'blob' }),
            animated: this.http.get(animatedUrl, { responseType: 'blob' }),
            duration: this.videoApiService.getVideoDuration(id)
          }).pipe(
            tap(({ staticThumb, animated, duration }) => {
              const staticBlobUrl = URL.createObjectURL(staticThumb);
              const animatedBlobUrl = URL.createObjectURL(animated);
              
              this.staticThumbnailCache.update(cache => ({
                ...cache,
                [id]: staticBlobUrl
              }));
              
              this.animatedThumbnailCache.update(cache => ({
                ...cache,
                [id]: animatedBlobUrl
              }));
              
              // Preload images
              const preloadStatic = new Image();
              preloadStatic.src = staticBlobUrl;
              const preloadAnimated = new Image();
              preloadAnimated.src = animatedBlobUrl;

              this.video = { ...this.video, duration: duration };
            }),
            catchError(() => of(null))
          );
        }),
        catchError(() => of(null))
      ).subscribe({
        complete: () => {
          this.pollingSubscriptions.delete(id);
        }
      });

      this.pollingSubscriptions.set(id, sub);
    }

    return false;
  }
  
/**
 * Returns the static thumbnail URL for the given video.
 * The static thumbnail URL is stored in a cache and is only retrieved from the cache.
 * If the video ID is not found in the cache, an empty string is returned.
 * @param video The video object for which to retrieve the static thumbnail URL.
 * @returns The static thumbnail URL for the given video.
 */
  resolveThumbnail(video: Video): string {
    return this.staticThumbnailCache()[video.id!];
  }


  swapToAnimated(event: MouseEvent, video: Video): void {
    const img = event.target as HTMLImageElement;
    const id = video.id;
    if (id && this.animatedThumbnailCache()[id]) {
      img.src = this.animatedThumbnailCache()[id];
    }
  }

  swapToStatic(event: MouseEvent, video: Video): void {
    const img = event.target as HTMLImageElement;
    const id = video.id;
    if (id && this.staticThumbnailCache()[id]) {
      img.src = this.staticThumbnailCache()[id];
    }
  }

  getVideoTitle(video: Video): string {
    const baseName = video.title?.replace(/\.[^/.]+$/, '') || 'Video';
    return video.title || baseName;
  }
}
