import { Component, VERSION } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { EnvironmentConfig } from '../../../core/config/environment.config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss']
})
export class AppFooterComponent {
  currentYear = new Date().getFullYear();
  angularVersion = VERSION.major;
  
  readonly config = EnvironmentConfig;

  socialLinks = [
    { 
      icon: 'code', 
      label: 'Source Code (GitHub)', 
      url: this.config.portfolio.repoUrl 
    },
    { 
      icon: 'person', 
      label: 'My GitHub Profile', 
      url: this.config.portfolio.githubUrl 
    }
  ];
}
