import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../api/api';
import { ValidationService } from '../services/validation.service';

type SearchMode = 'code' | 'email';

@Component({
  selector: 'app-validate-cert',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './validate-cert.component.html',
  styleUrl: './validate-cert.component.css'
})
export class ValidateCertComponent {
  private validationService = inject(ValidationService);
  private http = inject(HttpClient);
  protected searchMode = signal<SearchMode>('code');
  protected loading = signal<boolean>(false);
  protected error = signal<string>('');
  protected certificate = signal<any>(null);
  protected emailLoading = signal<boolean>(false);
  protected emailSent = signal<boolean>(false);
  protected emailError = signal<string>('');
  protected showConfirmModal = signal<boolean>(false);
  protected showRateLimitModal = signal<boolean>(false);

  validationForm = new FormGroup({
    validationCode: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  emailForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    })
  });

  protected setMode(mode: SearchMode): void {
    this.searchMode.set(mode);
    this.error.set('');
    this.certificate.set(null);
    this.emailSent.set(false);
    this.emailError.set('');
    this.showConfirmModal.set(false);
    this.showRateLimitModal.set(false);
  }

  protected onValidate(): void {
    const code = this.validationForm.controls.validationCode.value;
    if (this.validationForm.invalid || !code.trim()) return;

    this.loading.set(true);
    this.error.set('');
    this.certificate.set(null);

    this.validationService.validateCertificateByCode(code).subscribe({
      next: (data) => {
        this.certificate.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Código de validação inválido ou certificado não encontrado no sistema. Por favor, verifique o código digitado.');
        this.loading.set(false);
      }
    });
  }

  protected onDownload(uuid: string): void {
    window.open(`${API_BASE_URL}/certificate/download/${uuid}`, '_blank');
  }

  protected onRequestSend(): void {
    if (this.emailForm.invalid) return;
    this.showConfirmModal.set(true);
  }

  protected onConfirmSend(): void {
    this.showConfirmModal.set(false);
    this.executeSend();
  }

  protected closeConfirmModal(): void {
    this.showConfirmModal.set(false);
  }

  protected closeRateLimitModal(): void {
    this.showRateLimitModal.set(false);
  }

  private executeSend(): void {
    const email = this.emailForm.controls.email.value.trim().toLowerCase();

    this.emailLoading.set(true);
    this.emailSent.set(false);
    this.emailError.set('');

    this.validationService.sendByEmail(email).subscribe({
      next: () => {
        this.emailLoading.set(false);
        this.emailSent.set(true);
        this.emailForm.reset();
      },
      error: (err) => {
        this.emailLoading.set(false);
        if (err.status === 429) {
          this.showRateLimitModal.set(true);
        } else {
          this.emailError.set('Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.');
        }
      }
    });
  }
}
