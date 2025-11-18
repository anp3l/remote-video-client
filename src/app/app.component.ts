import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UploadProgressService } from './core/services/upload-progress.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  private uploadService = inject(UploadProgressService);

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.uploadService.uploadingCount() > 0) {
      event.preventDefault();
    }
  }
}