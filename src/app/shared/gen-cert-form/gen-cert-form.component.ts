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
import { TemplateService } from '../../services/template.service';
import { generate } from '@pdfme/generator';
import { text, image, barcodes } from '@pdfme/schemas';
import { getDefaultFont } from '@pdfme/common';
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
  private templateService = inject(TemplateService);

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
    manualEmail: new FormControl(''),
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
    const emailControl = this.certificadoForm.get('manualEmail');
    const name = nameControl?.value?.trim();
    const cpf = cpfControl?.value?.trim();
    const email = emailControl?.value?.trim();

    if (!name) {
      this.toastr.warning("Nome é obrigatório.");
      return;
    }

    this.addPersonToList(name, cpf, email);

    nameControl?.setValue('');
    cpfControl?.setValue('');
    emailControl?.setValue('');
  }

  protected addPersonFromSearch(person: PersonResponse): void {
    this.addPersonToList(person.name, person.cpf, person.email, person.id);
    this.searchQuery.set('');
  }

  private addPersonToList(name: string, cpf?: string | null, email?: string | null, personId?: number | null): void {
    if (this.manualNames().some(n => n.name === name && n.metadata?.cpf === cpf)) {
      this.toastr.warning("Esta pessoa já foi adicionada.");
      return;
    }

    const newItem: CertificateItemRequest = {
      name,
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

    // 1. Busca o template do sistema (ou do usuário) para o tipo selecionado
    this.templateService.getByType(request.type).subscribe({
      next: async (res) => {
        try {
          if (!res.jsonSchema) {
            this.toastr.error("Template não possui um layout configurado.");
            return;
          }

          // Trata barras invertidas do JSON armazenado no banco
          console.log('JSON Schema bruto do banco:', res.jsonSchema);
          const templateJson = JSON.parse(res.jsonSchema);
          console.log('Template parseado para PDFME:', templateJson);

          // Pega o nome da revista
          const magazine = this.magazines().find(m => m.id === request.magazineId);
          const magazineName = magazine?.name || '';
          const issn = magazine?.issn || '';
          const magazineEmail = magazine?.email || '';
          const now = new Date();
          const year = String(now.getFullYear());
          const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

          // Extrai o primeiro array de schemas (geralmente só tem um para uma página)
          const pageSchemas = templateJson.schemas[0] || [];

          // Monta os inputs para o PDFME fazendo a interpolação manual do texto
          const inputs = request.certificates.map(item => {
            const rawData: Record<string, string> = {
              name: item.name || '',
              cpf: item.metadata?.cpf || '',
              validationCode: item.validationCode || '',
              evaluationId: item.metadata?.evaluationId || '',
              magazineName: magazineName,
              issn: issn,
              email: magazineEmail,
              year: year,
              date: date,
              volume: request.volume || '',
              number: request.number || '',
              dossieTitle: item.metadata?.dossieTitle || '',
              articleTitle: item.metadata?.articleTitle || '',
              publishMonthYear: item.metadata?.publishMonthYear || '',
              doi: item.metadata?.doi || '',
              accessLink: item.metadata?.accessLink || '',
              startDate: item.metadata?.startDate || '',
              endDate: item.metadata?.endDate || ''
            };

            const interpolatedInput: Record<string, string> = {};
            
            // Para cada campo definido no schema, nós pegamos o 'content' padrão
            // e substituímos as tags {{variavel}} pelo valor correspondente em rawData
            pageSchemas.forEach((schemaField: any) => {
              if (schemaField.type === 'text') {
                let textContent = schemaField.content || '';
                Object.keys(rawData).forEach(key => {
                  const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                  textContent = textContent.replace(regex, rawData[key]);
                });
                interpolatedInput[schemaField.name] = textContent;
              } else {
                 interpolatedInput[schemaField.name] = schemaField.content || '';
              }
            });

            return interpolatedInput;
          });

          const plugins = { text, image, qrcode: barcodes.qrcode };
          const options = { font: getDefaultFont() };

          // 2. Gera o PDF mesclado para download do usuário
          const pdfMerged = await generate({ template: templateJson, plugins, inputs, options });
          
          // Dispara download do arquivo único (com várias páginas) imediatamente antes da req assíncrona
          const blob = new Blob([pdfMerged], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'certificados.pdf';
          link.click();
          window.URL.revokeObjectURL(url);

          // 3. Gera os PDFs individuais em Base64 para envio ao backend (e-mails individuais)
          for (let i = 0; i < request.certificates.length; i++) {
            const singlePdf = await generate({ template: templateJson, plugins, inputs: [inputs[i]], options });
            request.certificates[i].pdfBase64 = this.uint8ArrayToBase64(singlePdf);
          }

          // 4. Envia para o backend para salvar e disparar e-mails
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

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}