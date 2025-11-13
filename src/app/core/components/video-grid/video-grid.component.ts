import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Video, ViewMode } from '../../models/video.model';
import { VideoCardComponent } from '../video-card/video-card.component';
import { VideoService } from '../../services/video.service';


@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    VideoCardComponent
  ],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.scss']
})
export class VideoGridComponent {
  private videoService = inject(VideoService);
  @Input({ required: true }) videos!: Video[];
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) viewMode!: ViewMode;
  @Input() searchQuery = '';
  @Input() categoryFilter = 'all';

  @Output() videoPlay = new EventEmitter<Video>();
  @Output() videoEdit = new EventEmitter<Video>();
  @Output() videoDelete = new EventEmitter<Video>();
  @Output() uploadClick = new EventEmitter<void>();

  ngOnInit() {
    this.videoService.loadVideos();
  }

  onVideoPlay(video: Video): void {
    this.videoPlay.emit(video);
  }

  onVideoEdit(video: Video): void {
    this.videoEdit.emit(video);
  }

  onVideoDelete(video: Video): void {
    this.videoDelete.emit(video);
  }

  onUploadClick(): void {
    this.uploadClick.emit();
  }

  get hasFilters(): boolean {
    return !!this.searchQuery || this.categoryFilter !== 'all';
  }
}