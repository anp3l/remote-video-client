import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UploadProgressComponent } from './shared/components/upload-progress/upload-progress.component';
import { AppFooterComponent } from './shared/components/app-footer/app-footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {}