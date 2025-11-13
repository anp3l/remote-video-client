import { Component, inject, signal, ElementRef, viewChild } from '@angular/core';
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
  styleUrls: ['./video-upload-dialog.component.scss']
})
export class VideoUploadDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VideoUploadDialogComponent>);
  private videoService = inject(VideoService);

  // Ref to the submit animated button
  submitButton = viewChild<ElementRef>('submitBtn');

  categories = CATEGORIES;
  videoFile = signal<File | null>(null);
  thumbnailFile = signal<File | null>(null);
  uploading = signal(false);
  validationError = signal<string | null>(null);
  isValidating = signal(false);
  
  // animation fly-to-corner
  showFlyingIcon = signal(false);
  flyingIconStyle = signal<any>({});

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
      this.validationError.set(null);
      return;
    }

    this.validationError.set(null);
    this.isValidating.set(true);

    try {
      const result = await this.videoService.validateVideoFile(file);
      
      if (result.valid) {
        this.videoFile.set(file);
        this.validationError.set(null);
        console.log(`Video valido - Durata: ${result.duration?.toFixed(2)}s`);
      } else {
        this.videoFile.set(null);
        this.validationError.set(result.reason || 'File non valido');
        input.value = '';
      }
    } catch (error) {
      console.error('Errore durante la validazione del video:', error);
      this.validationError.set('Errore durante la validazione del file');
      this.videoFile.set(null);
      input.value = '';
    } finally {
      this.isValidating.set(false);
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
      // Trigger fly animation before upload
      this.triggerFlyAnimation();
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
        
        // Wait until the animation ends before closing
        await new Promise(resolve => setTimeout(resolve, 600));
        
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Upload error:', error);
        this.uploading.set(false);
        this.showFlyingIcon.set(false);
      }
    }
  }

  private triggerFlyAnimation(): void {
    const button = this.submitButton()?.nativeElement;
    if (!button) return;

    // Obtaion position
    const rect = button.getBoundingClientRect();
    
    // Starting position
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    // Arrival position
    const endX = window.innerWidth - 220; // Posizione del popup
    const endY = window.innerHeight - 50;
    
    // Initial style
    this.flyingIconStyle.set({
      left: `${startX}px`,
      top: `${startY}px`,
      '--end-x': `${endX - startX}px`,
      '--end-y': `${endY - startY}px`
    });
    
    // Show the icon
    this.showFlyingIcon.set(true);
    
    // Hide after animation
    setTimeout(() => {
      this.showFlyingIcon.set(false);
    }, 800);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
