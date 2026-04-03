import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Designer } from '@pdfme/ui';
import { getDefaultFont } from '@pdfme/common';
import { TemplateService } from '../../../services/template.service';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-editor.component.html',
  styleUrl: './template-editor.component.css'
})
export class TemplateEditorComponent implements AfterViewInit, OnDestroy {

  @ViewChild('designerContainer') container!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templateService = inject(TemplateService);

  templateId!: number;
  templateName = signal('');
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  saveSuccess = signal(false);

  private designer!: Designer;

  ngAfterViewInit() {
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAndInit();
  }

  private loadAndInit() {
    this.loading.set(true);
    this.error.set(null);

    this.templateService.getById(this.templateId).subscribe({
      next: (template) => {
        this.templateName.set(template.name);

        let schema: any;
        try {
          schema = JSON.parse(template.jsonSchema);
        } catch {
          schema = { basePdf: '__BLANK_PDF__', schemas: [[]] };
        }

        // Garante estrutura mínima válida para o PDFME
        if (!schema.basePdf) schema.basePdf = '__BLANK_PDF__';
        if (!schema.schemas || !Array.isArray(schema.schemas)) schema.schemas = [[]];

        this.designer = new Designer({
          domContainer: this.container.nativeElement,
          template: schema,
          options: {
            font: getDefaultFont(),
            lang: 'en',
            labels: {
              'Download JSON': 'Baixar JSON',
              clear: 'Limpar',
              cancel: 'Cancelar',
              fieldName: 'Nome do Campo',
              'Select Font': 'Fonte',
            }
          }
        });

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Não foi possível carregar o template.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  save() {
    if (!this.designer) return;
    this.saving.set(true);
    this.saveSuccess.set(false);

    const jsonSchema = JSON.stringify(this.designer.getTemplate());

    this.templateService.save(this.templateId, {
      name: this.templateName(),
      jsonSchema
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Erro ao salvar o template.');
      }
    });
  }

  uploadBackground(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.designer) return;

    const reader = new FileReader();
    reader.onload = () => {
      const template = this.designer.getTemplate();
      template.basePdf = reader.result as string;
      this.designer.updateTemplate(template);
    };
    reader.readAsDataURL(file);
  }

  goBack() {
    this.router.navigate(['/templates']);
  }

  ngOnDestroy() {
    this.designer?.destroy?.();
  }
}
