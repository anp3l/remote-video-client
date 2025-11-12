import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  appVersion = '1.0.0';
  
  socialLinks = [
    { icon: 'code', label: 'GitHub', url: 'https://github.com' },
    { icon: 'language', label: 'Website', url: 'https://example.com' },
    { icon: 'email', label: 'Contact', url: 'mailto:info@example.com' }
  ];

  links = {
    about: [
      { label: 'Chi Siamo', url: '/about' },
      { label: 'Blog', url: '/blog' },
      { label: 'Carriere', url: '/careers' }
    ],
    support: [
      { label: 'FAQ', url: '/faq' },
      { label: 'Documentazione', url: '/docs' },
      { label: 'Supporto', url: '/support' }
    ],
    legal: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Termini di Servizio', url: '/terms' },
      { label: 'Cookie Policy', url: '/cookies' }
    ]
  };

  onLinkClick(url: string, event: Event): void {

    if (url.startsWith('/')) {
      event.preventDefault();
      console.log('Navigation to:', url);
    }
  }
  
  getAngularVersion(): string {
    return '20';
  }
}