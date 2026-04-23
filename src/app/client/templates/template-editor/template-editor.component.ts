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
        const blankPdf = { width: 297, height: 210 };
        let schema: any;
        try {
          schema = JSON.parse(template.jsonSchema);
        } catch {
          schema = { basePdf: blankPdf, schemas: [[]] };
        }

        if (!schema.basePdf) schema.basePdf = blankPdf;
        if (!schema.schemas || !Array.isArray(schema.schemas)) schema.schemas = [[]];
        
        // If basePdf is a string, it's either an old/broken base64 or a corrupted JSON string
        // In all cases, if it's a string, we migrate it to our new stable object format
        if (typeof schema.basePdf === 'string') {
          console.log('Migrating string-based basePdf to object format');
          schema.basePdf = blankPdf;
        }
        this.loading.set(false);
        setTimeout(() => {
          try {
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
          } catch (e) {
            console.error('Erro ao inicializar PDFME:', e);
            this.error.set('Erro ao carregar o editor gráfico.');
          }
        }, 50);
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
