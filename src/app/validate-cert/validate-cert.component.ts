import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../api/api';

@Component({
  selector: 'app-validate-cert',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './validate-cert.component.html',
  styleUrl: './validate-cert.component.css'
})
export class ValidateCertComponent {

  private http = inject(HttpClient);
  protected loading = signal<boolean>(false);
  protected error = signal<string>('');
  protected certificate = signal<any>(null);

  validationForm = new FormGroup({
    validationCode: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  onValidate() {
    const code = this.validationForm.controls.validationCode.value;
    if (this.validationForm.invalid || !code.trim()) return;

    this.loading.set(true);
    this.error.set('');
    this.certificate.set(null);

    this.http.get<any>(`${API_BASE_URL}/certificate/validate/${code.trim()}`).subscribe({
      next: (data) => {
        this.certificate.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Código de validação inválido ou certificado não encontrado no sistema. Por favor, verifique o código digitado.');
        this.loading.set(false);
      }
    });
  }

  onDownload(uuid: string) {
    window.open(`${API_BASE_URL}/certificate/download/${uuid}`, '_blank');
  }
}
