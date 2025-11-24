import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Video } from '../../models/video.model';
import { VideoService } from '../../services/video.service';
import { CATEGORIES } from '../../config/app.config';

@Component({
  selector: 'app-video-edit-dialog',
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
  templateUrl: './video-edit-dialog.component.html',
  styleUrls: ['./video-edit-dialog.component.scss']
})
export class VideoEditDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VideoEditDialogComponent>);
  private videoService = inject(VideoService);
  data = inject<{ video: Video }>(MAT_DIALOG_DATA);

  categories = CATEGORIES;
  saving = signal(false);

  editForm = this.fb.group({
    title: [this.data.video.title, Validators.required],
    description: [this.data.video.description],
    category: [this.data.video.category, Validators.required],
    tags: [this.data.video.tags.join(', ')]
  });

/**
 * Submits the edited video form data to the video service.
 * If the form is valid, it sets the saving state to true and updates the video.
 * If the update is successful, it closes the dialog with a true value.
 * If the update fails, it logs an error and sets the saving state to false.
 */
  async onSubmit(): Promise<void> {
    if (this.editForm.valid) {
      this.saving.set(true);
      
      const tags = this.editForm.value.tags!
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      const updates = {
        title: this.editForm.value.title!,
        description: this.editForm.value.description!,
        category: this.editForm.value.category!,
        tags
      };

      try {
        await this.videoService.updateVideo(this.data.video.id, updates);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Update error:', error);
        this.saving.set(false);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
