import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validate-cert',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="validation-layout">
      <!-- Minimal Navbar -->
      <nav class="cert-navbar">
        <div class="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>CERT</span>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <div class="hero-section">
          <h1>Portal de Autenticidade do Certificado</h1>
          <p class="subtitle">
            O CERT fornece uma infraestrutura criptográfica segura para a emissão e validação de certificados para 
            revistas científicas e editores. Este sistema garante que o documento seja incorruptível e autêntico.
          </p>
        </div>

        <div class="validation-card">
          <div class="card-header">
            <h2>Validar Certificado</h2>
            <p>Insira o código UUID exclusivo fornecido no seu certificado para verificar os detalhes emitidos.</p>
          </div>

          <div class="form-group">
            <label for="validationCode">Código de Autenticidade (UUID)</label>
            <div class="input-group">
              <input type="text" id="validationCode" [(ngModel)]="validationCode" 
                     placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                     (keyup.enter)="onValidate()">
              <button class="btn-validate" (click)="onValidate()" [disabled]="loading || !validationCode">
                @if(loading) {
                  <span class="spinner"></span> Validando...
                } @else {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Consultar
                }
              </button>
            </div>
          </div>

          @if (error) {
            <div class="alert alert-error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ error }}
            </div>
          }

          @if (certificate()) {
            <div class="success-result">
              <div class="success-header">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>Certificado Verificado e Autêntico</h3>
              </div>
              
              <div class="cert-details">
                <div class="detail-row">
                  <span class="label">Proprietário do Certificado</span>
                  <span class="value main-value">{{ certificate().name }}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Revista Emissora</span>
                  <span class="value">{{ certificate().magazineResponse?.name || 'N/A' }}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Data de Emissão</span>
                  <span class="value">{{ certificate().createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Tipo do Certificado</span>
                  <span class="value type-badge">{{ certificate().type }}</span>
                </div>

                @if (certificate().volume || certificate().number) {
                  <div class="detail-row">
                    <span class="label">Edição/Volume</span>
                    <span class="value">Vol. {{ certificate().volume || '-' }}, Num. {{ certificate().number || '-' }}</span>
                  </div>
                }

                <div class="detail-row">
                  <span class="label">Código de Autenticidade (UUID)</span>
                  <span class="value uuid-value">{{ certificate().validationCode }}</span>
                </div>
              </div>

              <div class="actions">
                <button class="btn-download" (click)="onDownload(certificate().validationCode)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 16V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V16M16 12L12 16M12 16L8 12M12 16V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Baixar Certificado em PDF
                </button>
              </div>
            </div>
          }
        </div>
      </main>

      <!-- Footer -->
      <footer class="cert-footer">
        <div class="footer-content">
          <div class="footer-brand">CERT</div>
          <p>
            O CERT é a solução líder para gestão de autenticidade em documentos acadêmicos e científicos. 
            Nosso sistema previne fraudes e assegura a validade das certificações geradas por instituições parceiras.
          </p>
          <div class="footer-copyright">
            &copy; 2026 CERT. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      min-height: 100vh;
      background-color: var(--bg-color, #0F172A);
      color: #F8FAFC;
    }
    .validation-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: var(--primary-font), sans-serif;
    }
    .cert-navbar {
      background-color: #1E293B;
      padding: 1rem 2rem;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #38BDF8;
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: 1px;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 1.5rem;
    }
    .hero-section {
      text-align: center;
      max-width: 600px;
      margin-bottom: 3rem;
    }
    .hero-section h1 {
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 1rem;
      color: #F8FAFC;
      line-height: 1.2;
    }
    .hero-section .subtitle {
      font-size: 1rem;
      color: #94A3B8;
      line-height: 1.6;
    }
    .validation-card {
      background-color: #1E293B;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 650px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .card-header {
      margin-bottom: 2rem;
    }
    .card-header h2 {
      font-size: 1.5rem;
      color: #F8FAFC;
      margin-bottom: 0.5rem;
    }
    .card-header p {
      color: #94A3B8;
      font-size: 0.95rem;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #E2E8F0;
      font-size: 0.95rem;
    }
    .input-group {
      display: flex;
      gap: 0.75rem;
    }
    .input-group input {
      flex: 1;
      padding: 0.875rem 1rem;
      background-color: #0F172A;
      border: 1px solid #475569;
      border-radius: 6px;
      color: #F8FAFC;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .input-group input:focus {
      outline: none;
      border-color: #38BDF8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    .btn-validate {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0 1.5rem;
      background-color: #2563EB;
      color: #FFF;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-validate:hover:not([disabled]) {
      background-color: #1D4ED8;
    }
    .btn-validate[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #FFF;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .alert-error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #FCA5A5;
      border-radius: 6px;
      font-size: 0.95rem;
    }
    .success-result {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #334155;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .success-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .success-header h3 {
      font-size: 1.25rem;
      color: #34D399; /* Emerald 400 */
      margin: 0;
    }
    .cert-details {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background-color: #0F172A;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #1E293B;
    }
    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .detail-row .label {
      font-size: 0.85rem;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-row .value {
      font-size: 1.05rem;
      color: #F8FAFC;
    }
    .detail-row .main-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: #38BDF8;
    }
    .type-badge {
      display: inline-block;
      align-self: flex-start;
      padding: 0.25rem 0.75rem;
      background-color: rgba(56, 189, 248, 0.15);
      color: #7DD3FC;
      border-radius: 9999px;
      font-size: 0.85rem !important;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    .uuid-value {
      font-family: monospace;
      color: #94A3B8 !important;
      font-size: 0.9rem !important;
    }
    .actions {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
    }
    .btn-download {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #10B981;
      color: #FFF;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-download:hover {
      background-color: #059669;
    }
    .cert-footer {
      background-color: #0F172A;
      border-top: 1px solid #1E293B;
      padding: 2.5rem 2rem;
      text-align: center;
      margin-top: auto;
    }
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .footer-brand {
      color: #38BDF8;
      font-weight: 800;
      letter-spacing: 2px;
    }
    .footer-content p {
      color: #64748B;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .footer-copyright {
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #475569;
    }
    @media (max-width: 640px) {
      .input-group { flex-direction: column; }
      .btn-validate { padding: 0.875rem; }
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
    if (!this.validationCode || this.validationCode.trim() === '') return;
    
    this.loading = true;
    this.error = '';
    this.certificate.set(null);

    this.http.get<any>(`http://localhost:8080/api/certificate/validate/${this.validationCode}`).subscribe({
      next: (data) => {
        this.certificate.set(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Código de validação inválido ou certificado não encontrado no sistema. Por favor, verifique o código digitado.';
        this.loading = false;
      }
    });
  }

  onDownload(uuid: string) {
    window.open(`http://localhost:8080/api/certificate/download/${uuid}`, '_blank');
  }
}
