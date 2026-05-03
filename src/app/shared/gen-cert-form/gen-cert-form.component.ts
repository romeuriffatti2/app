import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SecondaryButtonComponent } from "../secondary-button/secondary-button.component";
import { MagazineService } from '../../services/magazine-service.service';
import { CertificateService } from '../../services/certificate.service';
import { MagazineResponse } from '../../models/magazine-response.interface';
import { ToastrService } from 'ngx-toastr';
import { CertificateItemRequest, CertificateRequest } from '../../models/certificate-request.interface';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { PersonService } from '../../services/person.service';
import { PersonResponse } from '../../models/person.interface';

@Component({
  selector: 'app-gen-cert-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SecondaryButtonComponent, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './gen-cert-form.component.html',
  styleUrl: './gen-cert-form.component.css',
})
export class GenCertFormComponent implements OnInit {

  private toastr = inject(ToastrService);
  private magazineService = inject(MagazineService);
  private certificateService = inject(CertificateService);
  private personService = inject(PersonService);

  protected magazines = signal<MagazineResponse[]>([]);
  protected allPersons = signal<PersonResponse[]>([]);

  protected currentStep = signal<number>(1);
  protected manualNames = signal<CertificateItemRequest[]>([]);
  protected options1To100 = Array.from({ length: 100 }, (_, i) => i + 1);

  // Recipient selection state
  protected recipientMode = signal<'manual' | 'search'>('manual');
  protected searchQuery = signal<string>('');

  protected filteredPersons = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];
    return this.allPersons().filter(p => 
      p.name.toLowerCase().includes(query) || p.cpf.includes(query)
    );
  });

  protected certificadoForm = new FormGroup({
    generationType: new FormControl('manual', Validators.required),
    certificationType: new FormControl('', Validators.required),
    magazine: new FormControl('', Validators.required),
    volume: new FormControl(''),
    number: new FormControl(''),
    manualName: new FormControl(''),
    manualCpf: new FormControl(''),
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
    this.getPersons();
  }

  private getMagazines(): void {
    this.magazineService.getAllMagazines().subscribe({
      next: (res) => this.magazines.set(res),
      error: () => this.toastr.error("Não foi possível carregar as revistas"),
    });
  }

  private getPersons(): void {
    this.personService.getAllPersons().subscribe({
      next: (res) => this.allPersons.set(res),
      error: () => this.toastr.error("Não foi possível carregar as pessoas"),
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
    event?.preventDefault(); 
    event?.stopPropagation();

    const nameControl = this.certificadoForm.get('manualName');
    const cpfControl = this.certificadoForm.get('manualCpf');
    const name = nameControl?.value?.trim();
    const cpf = cpfControl?.value?.trim();

    if (!name) {
      this.toastr.warning("Nome é obrigatório.");
      return;
    }

    this.addPersonToList(name, cpf);

    nameControl?.setValue('');
    cpfControl?.setValue('');
  }

  protected addPersonFromSearch(person: PersonResponse): void {
    this.addPersonToList(person.name, person.cpf);
    this.searchQuery.set('');
  }

  private addPersonToList(name: string, cpf?: string | null): void {
    if (this.manualNames().some(n => n.name === name && n.metadata?.cpf === cpf)) {
      this.toastr.warning("Esta pessoa já foi adicionada.");
      return;
    }

    const newItem: CertificateItemRequest = {
      name,
      validationCode: crypto.randomUUID(),
      metadata: {
        evaluationId: this.certificadoForm.get('evaluationId')?.value || null,
        cpf: cpf || this.certificadoForm.get('cpf')?.value || null,
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
  }

  protected removeManualName(code: string): void {
    this.manualNames.update(list => list.filter(n => n.validationCode !== code));
  }

  protected onGenerateCerificationForm(): void {
    if (this.currentStep() !== 2) return;

    if (this.manualNames().length === 0) {
      this.toastr.warning("Adicione pelo menos um nome.");
      return;
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