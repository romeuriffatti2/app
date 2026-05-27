import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CertificateResponse, CertificateService, Page } from '../../../services/certificate.service';

@Component({
  selector: 'app-cert-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cert-list.component.html',
  styleUrl: './cert-list.component.css'
})
export class CertListComponent implements OnInit {
  private certService = inject(CertificateService);

  protected certificates = signal<CertificateResponse[]>([]);
  protected page = signal<number>(0);
  protected totalPages = signal<number>(0);
  protected isLoading = signal<boolean>(false);
  protected isActionLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(pageIndex: number = 0) {
    this.isLoading.set(true);
    this.certService.getCertificates(pageIndex, 10).subscribe({
      next: (page: Page<CertificateResponse>) => {
        this.certificates.set(page.content);
        this.page.set(page.number);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        alert('Erro ao carregar os certificados emitidos.');
      }
    });
  }

  onDownload(cert: CertificateResponse) {
    this.isActionLoading.set(true);
    this.certService.downloadCertificate(cert.validationCode).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_${cert.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.isActionLoading.set(false);
      },
      error: () => {
        this.isActionLoading.set(false);
        alert('Erro ao baixar o certificado.');
      }
    });
  }

  onResendEmail(cert: CertificateResponse) {
    if (!confirm(`Deseja reenviar o certificado para ${cert.name}?`)) return;

    this.isActionLoading.set(true);
    this.certService.resendCertificate(cert.validationCode).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        alert('E-mail reenviado com sucesso!');
      },
      error: () => {
        this.isActionLoading.set(false);
        alert('Erro ao reenviar o e-mail. Verifique os logs do servidor.');
      }
    });
  }

  nextPage() {
    if (this.page() < this.totalPages() - 1) {
      this.loadCertificates(this.page() + 1);
    }
  }

  prevPage() {
    if (this.page() > 0) {
      this.loadCertificates(this.page() - 1);
    }
  }
}
