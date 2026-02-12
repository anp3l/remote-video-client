import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs';

/**
 * An Angular HTTP interceptor that adds an Authorization
 * header to requests if a valid token is available.
 *
 * The interceptor will skip adding the token for requests
 * to the PUBLIC auth endpoints (login, signup, password reset).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  const publicEndpoints = [
    '/auth/login',
    '/auth/signup',
    '/auth/refresh-token'
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublicEndpoint) {
    return next(req);
  }

  const token = authService.getAccessToken();

  // Preventive deadline control
  if (token && authService.isAccessTokenExpired()) {
    console.log('🔄 Token about to expire, refreshing preemptively...');
    
    return authService.refreshAccessToken().pipe(
      switchMap(() => {
        const newToken = authService.getAccessToken();
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });
        return next(clonedReq);
      }),
      catchError(error => {
        console.error('❌ Preemptive refresh failed');
        return next(req);
      })
    );
  }

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
