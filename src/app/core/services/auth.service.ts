import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, SignupRequest, User } from '../models/auth.model';
import { EnvironmentConfig } from '../config/environment.config';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly AUTH_API_URL = EnvironmentConfig.authApiUrl;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  signup(data: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_API_URL}/auth/signup`, data).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_API_URL}/auth/login`, data).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getAccessToken();
    
    if (!refreshToken || !accessToken) {
      // If there are no tokens, local cleanup and redirect
      this.clearAuthData();
      return of(void 0);
    }

    // Call token revocation endpoint
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.post<void>(
      `${this.AUTH_API_URL}/auth/revoke-token`,
      { refreshToken },
      { headers }
    ).pipe(
      tap(() => {
        console.log('✅ Logout successful - token revoked on server');
      }),
      catchError(error => {
        console.error('⚠️ Logout API call failed, clearing local storage anyway', error);
        return of(void 0);
      }),
      tap(() => {
        // Always clean local data, even if API fails
        this.clearAuthData();
      })
    );
  }

  logoutAllDevices(): Observable<any> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      this.clearAuthData();
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.post(
      `${this.AUTH_API_URL}/auth/revoke-all-tokens`,
      {},
      { headers }
    ).pipe(
      tap(() => {
        console.log('✅ All tokens revoked');
        this.clearAuthData();
      }),
      catchError(error => {
        console.error('Error revoking all tokens:', error);
        this.clearAuthData();
        return of(null);
      })
    );
  }

  // Helper method for data cleaning
  private clearAuthData(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('🔄 Refreshing access token...');
    
    return this.http.post<AuthResponse>(
      `${this.AUTH_API_URL}/auth/refresh-token`,
      { refreshToken }
    ).pipe(
      tap(response => {
        console.log('✅ New tokens received');
        // Salva i nuovi token
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        // L'utente rimane lo stesso, non serve aggiornarlo
      }),
      catchError(error => {
        console.error('❌ Refresh token failed:', error);
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if the access token is expired or about to expire (within 30 seconds)
   */
  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const bufferTime = 30 * 1000; // 30 seconds buffer

      return expirationTime - now < bufferTime;
    } catch (error) {
      return true;
    }
  }
}
