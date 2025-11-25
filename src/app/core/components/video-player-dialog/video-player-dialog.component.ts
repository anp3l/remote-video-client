import { 
  Component, 
  inject,
  ViewChild,
  ElementRef,
  afterNextRender,
  DestroyRef,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import videojs from 'video.js';
import 'jb-videojs-hls-quality-selector';
import type Player from 'video.js/dist/types/player';
import { Video } from '../../models/video.model';
import { VideoApiService } from '../../services/video-api.service';
import { DurationFormatPipe } from '../../../shared/pipes/duration-format-pipe';
import { interval, takeWhile } from 'rxjs';
import { FileSizePipe } from '../../../shared/pipes/file-size-pipe';

@Component({
  selector: 'app-video-player-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    DurationFormatPipe,
    FileSizePipe
  ],
  templateUrl: './video-player-dialog.component.html',
  styleUrls: ['./video-player-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VideoPlayerDialogComponent {
  @ViewChild('videoPlayer', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;
  
  private dialogRef = inject(MatDialogRef<VideoPlayerDialogComponent>);
  private videoApiService = inject(VideoApiService);
  private destroyRef = inject(DestroyRef);
  
  data = inject<{ video: Video }>(MAT_DIALOG_DATA);
  
  private player?: Player;
  private currentQueryString = signal<string>('');
  private isAlive = signal(true);

  constructor() {
    afterNextRender(() => {
      this.initializePlayer();
    });
    
    this.destroyRef.onDestroy(() => {
      if (this.player) {
        this.player.dispose();
        this.player = undefined;
      }
    });
  }

/**
 * Initializes the video player by subscribing to the signed URLs for the video.
 * Once the signed URLs are received, the video player is created with the given options.
 * The video player is then configured to use the Video.js library with the given options.
 * The Video.js library is used to play the video.
 * The video player is then configured to use the given controls, such as the play button, pause button, and volume control.
 */
  private initializePlayer(): void {
    const videoId = this.data.video.id;
    if (!videoId) return;
    
    this.videoApiService.getSignedUrls(videoId).subscribe({
      next: (urls) => {
        const urlParams = new URL(urls.streamUrl).searchParams;
        this.updateQueryString(urlParams);
        
        this.player = videojs(this.videoElement.nativeElement, {
          controls: true,
          preload: 'auto',
          poster: urls.thumbnailUrl,
          playbackRates: [0.5, 1, 1.5, 2],
          fluid: false,
          responsive: true,
          aspectRatio: '16:9',
          fill: false,
          disablePictureInPicture: true,
          controlBar: {
            pictureInPictureToggle: false
          },
          sources: [
            {
              src: urls.streamUrl,
              type: 'application/x-mpegURL',
            },
          ],
        });

        (this.player as any).hlsQualitySelector();

        this.player.ready(() => {
          this.setupXhrInterceptor(videoId);
        });

        // Avvia il polling per refresh token
        this.startTokenRefreshPolling(videoId, urls.expiresAt);
      },
      error: (error) => {
        console.error('Error getting signed URLs:', error);
      }
    });
  }
/**
 * Sets up the XHR interceptor for the video player.
 * This is used to add the expiration query parameter to the video stream URL.
 * @param videoId The ID of the video to be played.
 */
private setupXhrInterceptor(videoId: string): void {
    const tech = this.player?.tech({ IWillNotUseThisInPlugins: true }) as any;
    
    if (tech?.vhs?.xhr) {
      tech.vhs.xhr.beforeRequest = (options: any) => {
        if (options.uri.includes(`/videos/stream/${videoId}/`)) {
          if (!options.uri.includes('expires=')) {
            const separator = options.uri.includes('?') ? '&' : '?';
            options.uri = options.uri + separator + this.currentQueryString().substring(1);
          }
        }
        return options;
      };
    }
  }

/**
 * Updates the current query string with the new expiration, signature, and UID.
 * @param urlParams The URL parameters object containing the expiration, signature, and UID.
 */
  private updateQueryString(urlParams: URLSearchParams): void {
    const queryString = `?expires=${urlParams.get('expires')}&signature=${urlParams.get('signature')}&uid=${urlParams.get('uid')}`;
    this.currentQueryString.set(queryString);
  }

  /**
   * Starts a polling interval to refresh the signed token for a video stream URL.
   * The polling interval checks every 60 seconds and refreshes the token if the time left to expiration is less than 5 minutes.
   * @param videoId The ID of the video to be played.
   * @param initialExpiresAt The initial expiration time of the signed token in milliseconds.
   */
  private startTokenRefreshPolling(videoId: string, initialExpiresAt: number): void {
    let currentExpiresAt = initialExpiresAt;

    // Check every 60 seconds
    interval(60000)
      .pipe(takeWhile(() => this.isAlive()))
      .subscribe(() => {
        const timeLeft = currentExpiresAt - Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // If time left is less than 5 minutes, refresh token
        if (timeLeft < fiveMinutes) {
          console.log('Refreshing signed token...');
          
          this.videoApiService.refreshSignedToken(videoId).subscribe({
            next: (newToken) => {
              // Update query string with new token
              const urlParams = new URLSearchParams();
              urlParams.set('expires', newToken.expires);
              urlParams.set('signature', newToken.signature);
              urlParams.set('uid', newToken.uid);
              
              this.updateQueryString(urlParams);
              currentExpiresAt = newToken.expiresAt;
              
              console.log('Token refreshed successfully, new expiry:', new Date(currentExpiresAt));
            },
            error: (error) => {
              console.error('Error refreshing token:', error);
            }
          });
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
