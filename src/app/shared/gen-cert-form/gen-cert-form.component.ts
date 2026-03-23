import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecondaryButtonComponent } from "../secondary-button/secondary-button.component";
import { MagazineService } from '../../services/magazine-service.service';
import { CertificateService } from '../../services/certificate.service';
import { MagazineResponse } from '../../models/magazine-response.interface';
import { IssuerResponse } from '../../models/issuer.interface';
import { ToastrService } from 'ngx-toastr';
import { CertificateItemRequest, CertificateRequest } from '../../models/certificate-request.interface';
import { IssuerService } from '../../services/issuer.service';

@Component({
  selector: 'app-gen-cert-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SecondaryButtonComponent],
  templateUrl: './gen-cert-form.component.html',
  styleUrl: './gen-cert-form.component.css',
})
export class GenCertFormComponent {

  private toastr = inject(ToastrService);
  private magazineService = inject(MagazineService);
  private issuerService = inject(IssuerService);
  private certificateService = inject(CertificateService);

  protected magazines = signal<MagazineResponse[]>([]);

  protected currentStep = signal<number>(1);
  protected manualNames = signal<CertificateItemRequest[]>([]);

  protected certificadoForm = new FormGroup({
    generationType: new FormControl('manual', Validators.required),
    certificationType: new FormControl('', Validators.required),
    magazine: new FormControl('', Validators.required),
    volume: new FormControl(''),
    number: new FormControl(''),
    manualName: new FormControl(''),
    
    // Metadados dinâmicos
    evaluationId: new FormControl(''),
    cpf: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    dossieTitle: new FormControl(''),
    articleTitle: new FormControl(''),
    publishMonthYear: new FormControl(''),
    doi: new FormControl(''),
    accessLink: new FormControl('')
  });

  private errorMessages: Record<string, any> = {
    generationType: { required: 'Selecione a modalidade' },
    certificationType: { required: 'Selecione o tipo de certificado' },
    magazine: { required: 'Selecione uma revista' }
  };

  ngOnInit() {
    this.getMagazines();
  }


  private getMagazines(): void {
    this.magazineService.getAllMagazines().subscribe({
      next: (res) => this.magazines.set(res),
      error: () => this.toastr.error("Não foi possível carregar as revistas"),
    });
  }

  protected getErrorMessage(field: string): string | null {
    const control = this.certificadoForm.get(field);

    if (!control || !control.touched) return null;

    const errors = control.errors;
    if (!errors) return null;

    const fieldErrors = this.errorMessages[field];

    for (const errorKey in errors) {
      if (fieldErrors?.[errorKey]) {
        return fieldErrors[errorKey];
      }
    }

    return null;
  }

  protected nextStep(): void {
    const fields = ['generationType', 'certificationType', 'magazine'];
    let isValid = true;

    fields.forEach(field => {
      const control = this.certificadoForm.get(field);
      if (control?.invalid) {
        control.markAsTouched();
        isValid = false;
      }
    });

    if (isValid) {
      this.currentStep.set(2);
    }
  }

  protected prevStep(): void {
    this.currentStep.set(1);
  }

  protected addManualName(event?: Event): void {
    event?.preventDefault(); // 🔥 evita qualquer comportamento do form
    event?.stopPropagation();

    const control = this.certificadoForm.get('manualName');
    const name = control?.value?.trim();

    if (!name) return;

    const newItem: CertificateItemRequest = {
      name,
      validationCode: crypto.randomUUID(),
      metadata: {
        evaluationId: this.certificadoForm.get('evaluationId')?.value || null,
        cpf: this.certificadoForm.get('cpf')?.value || null,
        startDate: this.certificadoForm.get('startDate')?.value || null,
        endDate: this.certificadoForm.get('endDate')?.value || null,
        dossieTitle: this.certificadoForm.get('dossieTitle')?.value || null,
        articleTitle: this.certificadoForm.get('articleTitle')?.value || null,
        publishMonthYear: this.certificadoForm.get('publishMonthYear')?.value || null,
        doi: this.certificadoForm.get('doi')?.value || null,
        accessLink: this.certificadoForm.get('accessLink')?.value || null
      }
    };

    this.manualNames.update(list => [...list, newItem]);
    control?.setValue('');
  }

  protected removeManualName(code: string): void {
    this.manualNames.update(list => list.filter(n => n.validationCode !== code));
  }

  protected onGenerateCerificationForm(): void {

    // 🔒 proteção contra submit fora da etapa 2
    if (this.currentStep() !== 2) return;

    if (this.manualNames().length === 0) {
      this.toastr.warning("Adicione pelo menos um nome.");
      return
    }

    const request: CertificateRequest = {
      magazineId: Number(this.certificadoForm.get('magazine')?.value),
      type: this.certificadoForm.get('certificationType')?.value || '',
      volume: this.certificadoForm.get('volume')?.value || '',
      number: this.certificadoForm.get('number')?.value || '',
      certificates: this.manualNames()
    };

    this.certificateService.generateCertificates(request).subscribe({
      next: (blob: Blob) => {
        this.toastr.success("Certificados gerados com sucesso!");

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'certificados.pdf';
        link.click();
        window.URL.revokeObjectURL(url);

        this.certificadoForm.reset({ generationType: 'manual' });
        this.manualNames.set([]);
        this.currentStep.set(1);
      },
      error: () => {
        this.toastr.error("Erro ao gerar certificados.");
      }
    });
  }
}