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
import { text, image } from '@pdfme/schemas';
import { PDFDocument } from 'pdf-lib';
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
        const blankPdf = { width: 297, height: 210, padding: [0, 0, 0, 0] };
        let schema: any;
        try {
          const cleanJson = template.jsonSchema ?? '{}';
          schema = JSON.parse(cleanJson);
        } catch (e) {
          console.error('Erro ao fazer o parse do JSON do banco:', e);
          schema = { basePdf: blankPdf, schemas: [[]] };
        }

        if (!schema.basePdf) schema.basePdf = blankPdf;
        if (typeof schema.basePdf === 'object' && schema.basePdf !== null && !Array.isArray(schema.basePdf) && !schema.basePdf.padding) {
          schema.basePdf.padding = [0, 0, 0, 0];
        }
        if (!schema.schemas || !Array.isArray(schema.schemas)) schema.schemas = [[]];
        
        // Se basePdf for uma string válida de data URI (base64 de imagem/pdf), nós a mantemos.
        // Caso contrário (string vazia, objeto malformado, etc), resetamos para folha em branco.
        if (typeof schema.basePdf === 'string') {
          if (!schema.basePdf.startsWith('data:')) {
            console.log('Migrating invalid string-based basePdf to object format');
            schema.basePdf = blankPdf;
          }
        }
        this.loading.set(false);
        setTimeout(() => {
          try {
            this.designer = new Designer({
              domContainer: this.container.nativeElement,
              template: schema,
              plugins: { text, image },
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

  async uploadBackground(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.designer) return;

    this.loading.set(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      
      // A4 landscape dimensions em pontos (297x210 mm)
      const page = pdfDoc.addPage([841.89, 595.28]);

      let imageToEmbed;
      if (file.type === 'image/png') {
        imageToEmbed = await pdfDoc.embedPng(arrayBuffer);
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        imageToEmbed = await pdfDoc.embedJpg(arrayBuffer);
      } else {
        throw new Error('Formato não suportado. Use PNG ou JPG.');
      }

      page.drawImage(imageToEmbed, {
        x: 0,
        y: 0,
        width: 841.89,
        height: 595.28,
      });

      const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });

      const template = this.designer.getTemplate();
      template.basePdf = pdfBytes;
      this.designer.updateTemplate(template);
    } catch (e) {
      console.error('Erro ao processar imagem de fundo:', e);
      this.error.set('Erro ao processar imagem de fundo. Use formato PNG ou JPG.');
    } finally {
      this.loading.set(false);
      (event.target as HTMLInputElement).value = '';
    }
  }

  goBack() {
    this.router.navigate(['/templates']);
  }

  ngOnDestroy() {
    this.designer?.destroy?.();
  }
}
