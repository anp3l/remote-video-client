import { Component, inject, signal, ElementRef, viewChild, ViewEncapsulation } from '@angular/core';
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
import { MatIcon, MatIconModule } from '@angular/material/icon';

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
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './video-upload-dialog.component.html',
  styleUrls: ['./video-upload-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VideoUploadDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VideoUploadDialogComponent>);
  private videoService = inject(VideoService);

  categories = CATEGORIES;
  videoFile = signal<File | null>(null);
  thumbnailFile = signal<File | null>(null);
  uploading = signal(false);
  validationFileError = signal<string | null>(null);
  validationImageError = signal<string | null>(null);
  isValidating = signal(false);
  
  isClosing = signal(false);

  uploadForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    tags: ['']
  });

  async onVideoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      this.videoFile.set(null);
      this.validationFileError.set(null);
      return;
    }

    this.validationFileError.set(null);
    this.isValidating.set(true);

    try {
      const result = await this.videoService.validateVideoFile(file);
      
      if (result.valid) {
        this.videoFile.set(file);
        this.validationFileError.set(null);
        console.log(`Video valido - Durata: ${result.duration?.toFixed(2)}s`);
      } else {
        this.videoFile.set(null);
        this.validationFileError.set(result.reason || 'File non valido');
        input.value = '';
      }
    } catch (error) {
      console.error('Errore durante la validazione del video:', error);
      this.validationFileError.set('Errore durante la validazione del file');
      this.videoFile.set(null);
      input.value = '';
    } finally {
      this.isValidating.set(false);
    }
  }

  async onThumbnailFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.thumbnailFile.set(null);
      return;
    }

    const result = await this.videoService.validateThumbnailFile(file);
    if (result.valid) {
      this.thumbnailFile.set(file);
    } else {
      this.thumbnailFile.set(null);
      this.validationImageError.set(result.reason || 'File immagine non valido');
      input.value = '';
    }
  }

  async onSubmit(event: MouseEvent): Promise<void> {
    if (this.uploadForm.valid && this.videoFile()) {
      this.isClosing.set(true);
      
      // Target position (progress bar)
      this.triggerShrinkAnimation();
      
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

      // Start upload in background
      this.videoService.uploadVideo(
        this.videoFile()!,
        this.thumbnailFile(),
        metadata
      ).catch(error => {
        console.error('Upload error:', error);
      });
      
      // Close after animation
      setTimeout(() => {
        this.dialogRef.close({ 
          started: true,
          metadata 
        });
      }, 600);
    }
  }

  private triggerShrinkAnimation(): void {
    // Target position of the progress bar
    const targetX = window.innerWidth - 220;
    const targetY = window.innerHeight - 43;
    
    const dialogContainer = document.querySelector('.upload-dialog-panel');
    
    if (dialogContainer) {
      const rect = dialogContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Distance between the center of the dialog and the target position
      const deltaX = targetX - centerX;
      const deltaY = targetY - centerY;
      
      (dialogContainer as HTMLElement).style.setProperty('--target-x', `${deltaX}px`);
      (dialogContainer as HTMLElement).style.setProperty('--target-y', `${deltaY}px`);
      
      dialogContainer.classList.add('shrink-to-corner');
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
