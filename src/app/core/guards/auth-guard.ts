import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard to protect routes from unauthorized access.
 * If the user is logged in, the guard will allow access to the route.
 * If the user is not logged in, the guard will redirect to the login page with the return URL as a parameter.
 * @param route The route to be protected.
 * @param state The current state of the router.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};