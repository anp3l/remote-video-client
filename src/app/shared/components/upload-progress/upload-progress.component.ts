import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UploadProgressService } from '../../../core/services/upload-progress.service';

@Component({
  selector: 'app-upload-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss']
})
export class UploadProgressComponent {
  uploadService = inject(UploadProgressService);
  isExpanded = signal(false);

  uploadingUploads = computed(() =>
    this.uploadService.activeUploads().filter(u => u.status === 'uploading')
  );

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'uploading': return 'cloud_upload';
      case 'processing': return 'hourglass_top';
      case 'uploaded': return 'check_circle';
      case 'error': return 'error';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'uploading': return 'primary';
      case 'processing': return 'accent';
      case 'uploaded': return 'success';
      case 'error': return 'warn';
      default: return '';
    }
  }

  removeUpload(id: string): void {
    this.uploadService.removeUpload(id);
  }
}
