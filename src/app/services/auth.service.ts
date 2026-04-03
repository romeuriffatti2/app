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
        if (response.role) {
          sessionStorage.setItem('role', response.role);
        }
        this.isAuthenticatedSignal.set(true);
      })
    );
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
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

  /**
   * Retorna a role do usuário logado.
   * Tenta primeiro o sessionStorage (salvo no login),
   * se não existir, decodifica o JWT manualmente.
   */
  getRole(): string | null {
    const stored = sessionStorage.getItem('role');
    if (stored) return stored;

    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // O Spring Security usa "roles" como array no claim padrão
      const authorities: string[] = payload.roles || payload.authorities || [];
      const roleEntry = authorities.find((a: string) => a.startsWith('ROLE_'));
      return roleEntry ? roleEntry.replace('ROLE_', '') : null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isClient(): boolean {
    return this.getRole() === 'CLIENT';
  }
}
