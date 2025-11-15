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
      // Mostra errore (puoi usare snackbar o segnale dedicato)
      this.validationImageError.set(result.reason || 'File immagine non valido');
      input.value = '';
    }
  }


  async onSubmit(event: MouseEvent): Promise<void> {
    if (this.uploadForm.valid && this.videoFile()) {
      // Trigger fly animation before closing
      this.triggerFlyAnimation(event.currentTarget as HTMLElement);
      
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

      // Start upload in background (non-blocking)
      this.videoService.uploadVideo(
        this.videoFile()!,
        this.thumbnailFile(),
        metadata
      ).catch(error => {
        console.error('Upload error:', error);
      });
      
      // Small delay to let the animation start, then close dialog
      setTimeout(() => {
        this.dialogRef.close({ 
          started: true,
          metadata 
        });
      }, 150);
    }
  }

  private triggerFlyAnimation(button: HTMLElement): void {
    
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    const endX = window.innerWidth - 220;
    const endY = window.innerHeight - 43;
    
    const style = {
      left: `${startX}px`,
      top: `${startY}px`,
      transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
      opacity: '1'
    };
    
    this.flyingIconStyle.set(style);
    this.showFlyingIcon.set(true);
    
    setTimeout(() => {
      this.flyingIconStyle.set({
        left: `${endX}px`,
        top: `${endY}px`,
        transform: 'translate(-50%, -50%) scale(0.3) rotate(360deg)',
        opacity: '0'
      });
    }, 10);
    
    setTimeout(() => {
      this.showFlyingIcon.set(false);
    }, 2550);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
