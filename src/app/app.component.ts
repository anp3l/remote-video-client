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
/**
 * Prevents the user from leaving the page if there are ongoing uploads.
 * If there are ongoing uploads, prevents the default unload behavior and
 * displays a message asking the user to confirm that they want to leave
 * the page.
 * @param event The BeforeUnloadEvent.
 */
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.uploadService.uploadingCount() > 0) {
      event.preventDefault();
    }
  }
}