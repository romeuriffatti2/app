import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-validate-cert',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="page-container">
      <div class="login-card" style="margin: 2rem auto; max-width: 600px; padding: 2rem;">
        <h2 style="text-align: center; color: #333;">Validar Certificado</h2>
        <p style="text-align: center; color: #666; margin-bottom: 1.5rem;">
          Insira o código de validação para verificar a autenticidade do certificado.
        </p>
        
        <div class="form-group">
          <label for="validationCode">Código de Validação (UUID)</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="validationCode" [(ngModel)]="validationCode" 
                   placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                   style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;">
            <button (click)="onValidate()" [disabled]="loading || !validationCode"
                    style="padding: 0.75rem 1.5rem; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
              {{ loading ? 'Validando...' : 'Validar' }}
            </button>
          </div>
        </div>

        @if (error) {
          <div style="margin-top: 1rem; padding: 1rem; background-color: #f8d7da; color: #721c24; border-radius: 4px; text-align: center;">
            {{ error }}
          </div>
        }

        @if (certificate()) {
          <div style="margin-top: 2rem; padding: 1.5rem; border: 1px solid #28a745; border-radius: 8px; background-color: #f1f8f4;">
            <h3 style="color: #28a745; margin-top: 0;">Certificado Válido!</h3>
            <hr style="border: 0; border-top: 1px solid #dee2e6; margin: 1rem 0;">
            <p><strong>Nome:</strong> {{ certificate().name }}</p>
            <p><strong>Revista:</strong> {{ certificate().magazineName }}</p>
            <p><strong>Data de Emissão:</strong> {{ certificate().createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            <p><strong>Código:</strong> <small>{{ certificate().validationCode }}</small></p>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .page-container {
      padding-top: 80px; /* Adjust based on navbar height */
      min-height: 100vh;
      background-color: #f4f7f6;
    }
  `]
})
export class ValidateCertComponent {
  private http = inject(HttpClient);
  
  validationCode = '';
  loading = false;
  error = '';
  certificate = signal<any>(null);

  onValidate() {
    this.loading = true;
    this.error = '';
    this.certificate.set(null);

    this.http.get<any>(`http://localhost:8080/api/certificate/validate/${this.validationCode}`).subscribe({
      next: (data) => {
        this.certificate.set(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Código de validação inválido ou certificado não encontrado.';
        this.loading = false;
      }
    });
  }
}
