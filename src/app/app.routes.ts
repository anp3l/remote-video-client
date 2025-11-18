import { Routes } from '@angular/router';
import { LoginComponent } from './core/components/login/login.component';
import { SignupComponent } from './core/components/signup/signup.component';
import { VideoLibraryComponent } from './core/components/video-library/video-library.component';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

 {
    path: '',
    component: VideoLibraryComponent,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '' }
];
