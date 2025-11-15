import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Video, ViewMode, SortBy } from '../../models/video.model';
import { VideoService } from '../../services/video.service';

import { LibraryHeaderComponent } from '../library-header/library-header.component';
import { VideoGridComponent } from '../video-grid/video-grid.component';
import { VideoUploadDialogComponent } from '../video-upload-dialog/video-upload-dialog.component';
import { VideoEditDialogComponent } from '../video-edit-dialog/video-edit-dialog.component';
import { VideoPlayerDialogComponent } from '../video-player-dialog/video-player-dialog.component';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog.component';

@Component({
  selector: 'app-video-library',
  standalone: true,
  imports: [
    CommonModule,
    LibraryHeaderComponent,
    VideoGridComponent,
  ],
  templateUrl: './video-library.component.html',
  styleUrls: ['./video-library.component.scss']
})
export class VideoLibraryComponent {
  private videoService = inject(VideoService);
  private dialog = inject(MatDialog);

  searchQuery = signal('');
  categoryFilter = signal('all');
  sortBy = signal<SortBy>('date');
  viewMode = signal<ViewMode>('grid');

  videos = this.videoService.videos;
  loading = this.videoService.loading;
  categories = this.videoService.categories;

  filteredVideos = computed(() => {
    let filtered = [...this.videos()];

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (this.categoryFilter() !== 'all') {
      filtered = filtered.filter(v => v.category === this.categoryFilter());
    }

    filtered.sort((a, b) => {
      switch (this.sortBy()) {
        case 'date':
          return b.uploadDate.getTime() - a.uploadDate.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

    return filtered;
  });

  videoCount = computed(() => this.videos().length);
  filteredCount = computed(() => this.filteredVideos().length);

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  onCategoryFilterChange(category: string): void {
    this.categoryFilter.set(category);
  }

  onSortByChange(sortBy: SortBy): void {
    this.sortBy.set(sortBy);
  }

  onViewModeChange(viewMode: ViewMode): void {
    this.viewMode.set(viewMode);
  }

  refreshVideos(): void {
      this.videoService.loadVideos();
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(VideoUploadDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      panelClass: 'upload-dialog-panel',
      disableClose: false
    });
  }

  openEditDialog(video: Video): void {
    this.dialog.open(VideoEditDialogComponent, {
      width: '800px',
      data: { video }
    });
  }

  openPlayerDialog(video: Video): void {
    this.dialog.open(VideoPlayerDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: false,
      data: { 
        video
      }
    });
  }


  openDeleteDialog(video: Video): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '500px',
      data: { video }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.videoService.deleteVideo(video.id);
      }
    });
  }

  downloadVideo(video: Video): void {
    this.videoService.downloadVideo(video.id, video.title);
  }
}