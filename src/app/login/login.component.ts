import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Login</h2>
        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" [(ngModel)]="credentials.email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" [(ngModel)]="credentials.password" name="password" required>
          </div>
          <button type="submit" class="submit-btn" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
          @if (error) {
            <p class="error-msg">{{ error }}</p>
          }
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f4f7f6;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    h2 { text-align: center; color: #333; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; color: #666; }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .submit-btn {
      width: 100%;
      padding: 0.75rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 1rem;
    }
    .submit-btn:disabled { background-color: #ccc; }
    .error-msg { color: #dc3545; text-align: center; margin-top: 1rem; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = { email: '', password: '' };
  loading = false;
  error = '';

  onLogin() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.error = 'E-mail ou senha inválidos';
        this.loading = false;
      }
    });
  }
}
