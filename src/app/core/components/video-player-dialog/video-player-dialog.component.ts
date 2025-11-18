import { 
  Component, 
  inject,
  ViewChild,
  ElementRef,
  afterNextRender,
  DestroyRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import { Video } from '../../models/video.model';
import { VideoApiService } from '../../services/video-api.service';
import { DurationFormatPipe } from '../../../shared/pipes/duration-format-pipe';

@Component({
  selector: 'app-video-player-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    DurationFormatPipe
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

  private initializePlayer(): void {
    const videoId = this.data.video.id;
    if (!videoId) return;
    
    this.videoApiService.getSignedUrls(videoId).subscribe({
      next: (urls) => {
        const urlParams = new URL(urls.streamUrl).searchParams;
        const queryString = `?expires=${urlParams.get('expires')}&signature=${urlParams.get('signature')}&uid=${urlParams.get('uid')}`;
        
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

        this.player.ready(() => {
          const tech = this.player?.tech({ IWillNotUseThisInPlugins: true }) as any;
          
          if (tech?.vhs?.xhr) {
            tech.vhs.xhr.beforeRequest = (options: any) => {
              if (options.uri.includes(`/videos/stream/${videoId}/`)) {
                if (!options.uri.includes('expires=')) {
                  const separator = options.uri.includes('?') ? '&' : '?';
                  options.uri = options.uri + separator + queryString.substring(1);
                }
              }
              return options;
            };
          }
        });
      },
      error: (error) => {
        console.error('Error getting signed URLs:', error);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
