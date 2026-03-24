import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../api/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: { email: string; password: any }) {
    return this.http.post<any>(`${API_BASE_URL}/auth/login`, credentials).pipe(
      tap(response => {
        sessionStorage.setItem('token', response.token);
        this.isAuthenticatedSignal.set(true);
      })
    );
  }

  logout() {
    sessionStorage.removeItem('token');
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  hasToken(): boolean {
    return !!sessionStorage.getItem('token');
  }

  isAuthenticated() {
    return this.isAuthenticatedSignal();
  }
}
