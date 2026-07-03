import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SecondaryButtonComponent } from "../../buttons/secondary-button/secondary-button.component";
import { MagazineService } from '../../../services/magazine-service.service';
import { CertificateService } from '../../../services/certificate.service';
import { MagazineResponse } from '../../../models/magazine-response.interface';
import { ToastrService } from 'ngx-toastr';
import { CertificateItemRequest, CertificateRequest } from '../../../models/certificate-request.interface';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { PersonService } from '../../../services/person.service';
import { PersonResponse } from '../../../models/person.interface';
import { TemplateService } from '../../../services/template.service';
import { PdfmeTemplate } from '../../../models/template.model';
import { RegPersonFormComponent } from '../reg-person-form/reg-person-form.component';
import { PdfGenerationService } from '../../../services/pdf-generation.service';
import { CertificateMapperService } from '../../../services/certificate-mapper.service';
@Component({
  selector: 'app-gen-cert-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SecondaryButtonComponent, NgxMaskDirective, RegPersonFormComponent],
  providers: [provideNgxMask()],
  templateUrl: './gen-cert-form.component.html',
  styleUrl: './gen-cert-form.component.css',
})
export class GenCertFormComponent implements OnInit {

  private toastr = inject(ToastrService);
  private magazineService = inject(MagazineService);
  private certificateService = inject(CertificateService);
  private personService = inject(PersonService);
  private templateService = inject(TemplateService);
  private pdfService = inject(PdfGenerationService);
  private mapperService = inject(CertificateMapperService);

  protected magazines = signal<MagazineResponse[]>([]);
  protected allPersons = signal<PersonResponse[]>([]);
  protected templates = signal<PdfmeTemplate[]>([]);

  protected currentStep = signal<number>(1);
  protected manualNames = signal<CertificateItemRequest[]>([]);
  protected options1To100 = Array.from({ length: 100 }, (_, i) => i + 1);

  protected recipientMode = signal<'register' | 'search'>('search');
  protected searchName = signal<string>('');
  protected searchCpf = signal<string>('');
  protected searchEmail = signal<string>('');
  protected isConfirmModalOpen = signal<boolean>(false);

  protected filteredPersons = computed(() => {
    const name = this.searchName().toLowerCase().trim();
    const cpf = this.searchCpf().replace(/\D/g, '');
    const email = this.searchEmail().toLowerCase().trim();

    if (!name && !cpf && !email) return [];

    return this.allPersons().filter(p => {
      const matchName = !name || p.name.toLowerCase().includes(name);
      const matchCpf = !cpf || (p.cpf ?? '').replace(/\D/g, '').includes(cpf);
      const matchEmail = !email || p.email.toLowerCase().includes(email);
      return matchName && matchCpf && matchEmail;
    });
  });

  protected certificadoForm = new FormGroup({
    generationType: new FormControl('manual', Validators.required),
    templateId: new FormControl<number | null>(null, Validators.required),
    magazine: new FormControl('', Validators.required),
    volume: new FormControl(''),
    number: new FormControl(''),
    evaluationId: new FormControl(''),
    cpf: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    dossieTitle: new FormControl(''),
    articleTitle: new FormControl(''),
    publishMonth: new FormControl(''),
    publishYear: new FormControl(''),
    doi: new FormControl(''),
    accessLink: new FormControl('')
  });

  private errorMessages: Record<string, any> = {
    generationType: { required: 'Selecione a modalidade' },
    templateId: { required: 'Selecione um template' },
    magazine: { required: 'Selecione uma revista' }
  };

  get selectedTemplateType(): string {
    const templateId = this.certificadoForm.get('templateId')?.value;
    if (!templateId) return '';
    const template = this.templates().find(t => t.id === Number(templateId));
    return template?.type || '';
  }

  ngOnInit() {
    this.getMagazines();
    this.getPersons();

    this.certificadoForm.get('magazine')?.valueChanges.subscribe(magIdStr => {
      if (magIdStr) {
        this.getTemplatesForMagazine(Number(magIdStr));
      } else {
        this.templates.set([]);
        this.certificadoForm.get('templateId')?.setValue(null);
      }
    });
  }

  private getMagazines(): void {
    this.magazineService.getAllMagazines().subscribe({
      next: (res) => this.magazines.set(res),
      error: () => this.toastr.error("Não foi possível carregar as revistas"),
    });
  }

  private getTemplatesForMagazine(magazineId: number): void {
    this.templateService.listMyTemplates(magazineId).subscribe({
      next: (res) => {
        this.templates.set(res);
      },
      error: () => this.toastr.error("Não foi possível carregar os templates da revista"),
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
    const fields = ['generationType', 'templateId', 'magazine'];
    let isValid = true;
    fields.forEach(field => {
      const control = this.certificadoForm.get(field);
      control?.invalid ? (control.markAsTouched(), isValid = false) : null;
    });
    isValid ? this.currentStep.set(2) : null;
  }

  protected prevStep(): void {
    this.currentStep.set(1);
  }

  protected onPersonRegistered(person: PersonResponse): void {
    // Insere a nova pessoa na lista local sem nova chamada HTTP
    this.allPersons.update(list => [...list, person]);
  }

  protected addPersonFromSearch(person: PersonResponse): void {
    this.addPersonToList(person.name, person.cpf, person.email, person.id);
    this.searchName.set('');
    this.searchCpf.set('');
    this.searchEmail.set('');
  }

  private addPersonToList(name: string, cpf?: string | null, email?: string | null, personId?: number | null): void {
    if (this.manualNames().some(n => n.name === name && n.metadata?.cpf === cpf)) {
      this.toastr.warning("Esta pessoa já foi adicionada.");
      return;
    }

    const newItem: CertificateItemRequest = {
      name,
      cpf: cpf || undefined,
      email: email || undefined,
      personId: personId || undefined,
      validationCode: crypto.randomUUID(),
      metadata: {
        evaluationId: this.certificadoForm.get('evaluationId')?.value || null,
        cpf: cpf || this.certificadoForm.get('cpf')?.value || null,
        startDate: this.certificadoForm.get('startDate')?.value || null,
        endDate: this.certificadoForm.get('endDate')?.value || null,
        dossieTitle: this.certificadoForm.get('dossieTitle')?.value || null,
        articleTitle: this.certificadoForm.get('articleTitle')?.value || null,
        publishMonth: this.certificadoForm.get('publishMonth')?.value || null,
        publishYear: this.certificadoForm.get('publishYear')?.value || null,
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

    const templateId = Number(this.certificadoForm.get('templateId')?.value);
    const selectedTemplate = this.templates().find(t => t.id === templateId);
    const type = selectedTemplate?.type || '';

    if (type === 'aceite' || type === 'publicacao') {
      this.isConfirmModalOpen.set(true);
    } else {
      this.executeGeneration();
    }
  }

  protected closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
  }

  protected confirmGeneration(): void {
    this.isConfirmModalOpen.set(false);
    
    const sharedCode = crypto.randomUUID();
    this.manualNames().forEach(item => {
       item.validationCode = sharedCode;
    });

    this.executeGeneration();
  }

  private executeGeneration(): void {
    const templateId = Number(this.certificadoForm.get('templateId')?.value);
    const selectedTemplate = this.templates().find(t => t.id === templateId);
    const type = selectedTemplate?.type || '';

    const request: CertificateRequest = {
      magazineId: Number(this.certificadoForm.get('magazine')?.value),
      type: type,
      templateId: templateId,
      volume: this.certificadoForm.get('volume')?.value || '',
      number: this.certificadoForm.get('number')?.value || '',
      certificates: this.manualNames()
    };

    // Usa o template selecionado que já foi carregado
    this.templateService.getById(request.magazineId, templateId).subscribe({
      next: async (res) => {
        try {
          if (!res.jsonSchema) {
            this.toastr.error("Template não possui um layout configurado.");
            return;
          }

          const templateJson = JSON.parse(res.jsonSchema);

          // 1. Mapeia os dados usando o CertificateMapperService (isola OCP)
          const pdfInputs = this.mapperService.mapToPdfInputs(request, templateJson, this.magazines());

          // 2. Gera os PDFs via PdfGenerationService (isola DIP/SRP)
          const { mergedPdfBlob, individualPdfsBase64 } = await this.pdfService.generateCertificates(templateJson, pdfInputs);

          // 3. Força download local do arquivo
          this.pdfService.downloadBlob(mergedPdfBlob, 'certificados.pdf');

          // 4. Acopla os Base64 nos dados da requisição para envio por email
          request.certificates.forEach((cert, index) => {
            cert.pdfBase64 = individualPdfsBase64[type === 'aceite' || type === 'publicacao' ? 0 : index];
          });

          // 5. Salva e processa no backend
          this.certificateService.generateCertificates(request).subscribe({
            next: () => {
              this.toastr.success("Certificados gerados e processados com sucesso!");
              this.certificadoForm.reset({ generationType: 'manual' });
              this.manualNames.set([]);
              this.currentStep.set(1);
            },
            error: () => {
              this.toastr.error("Erro ao comunicar com o servidor.");
            }
          });

        } catch (e) {
          console.error(e);
          this.toastr.error("Erro ao gerar PDF localmente.");
        }
      },
      error: () => {
        this.toastr.error("Erro ao buscar o template para o certificado.");
      }
    });
  }
}