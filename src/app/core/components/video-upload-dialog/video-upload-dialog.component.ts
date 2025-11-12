import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VideoService } from '../../services/video.service';
import { CATEGORIES } from '../../config/app.config';

@Component({
  selector: 'app-video-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './video-upload-dialog.component.html',
  styleUrls: ['./video-upload-dialog.component.scss']
})
export class VideoUploadDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VideoUploadDialogComponent>);
  private videoService = inject(VideoService);

  categories = CATEGORIES;
  videoFile = signal<File | null>(null);
  thumbnailFile = signal<File | null>(null);
  uploading = signal(false);

  uploadForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    tags: ['']
  });

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.videoFile.set(file);
    }
  }

  onThumbnailFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.thumbnailFile.set(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.uploadForm.valid && this.videoFile()) {
      this.uploading.set(true);
      
      const tags = this.uploadForm.value.tags!
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      const metadata = {
        title: this.uploadForm.value.title!,
        description: this.uploadForm.value.description!,
        category: this.uploadForm.value.category!,
        tags
      };

      try {
        await this.videoService.uploadVideo(
          this.videoFile()!,
          this.thumbnailFile(),
          metadata
        );
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Upload error:', error);
        this.uploading.set(false);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
