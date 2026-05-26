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
import { API_BASE_URL } from '../../../api/api';

/** Host do servidor sem o prefixo /api — usado para acessar assets em /uploads/** */
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

/** Dimensões do A4 em pontos (1pt = 25.4mm/72) para o PDF de background */
const A4_LANDSCAPE_PT = { width: 841.89, height: 595.28 } as const;

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

  magazineId!: number;
  templateId!: number;
  templateName = signal('');
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  saveSuccess = signal(false);
  hasBackground = signal(false);
  isDirty = signal(false);
  showUnsavedModal = signal(false);
  private designer!: Designer;
  private readonly blankPdf = { width: 297, height: 210, padding: [0, 0, 0, 0] as [number, number, number, number] };

  /**
   * Valor que será persistido no banco como basePdf.
   * Pode ser:
   *   - string relativa:  "/uploads/uuid.png"  → arquivo no disco
   *   - objeto em branco: { width, height, padding } → sem fundo
   * O PDFME em memória usa um PDF data URI — essa variável guarda o que vai para o banco.
   */
  private basePdfPersisted: any = null;

  ngAfterViewInit() {
    this.magazineId = Number(this.route.snapshot.paramMap.get('magazineId'));
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAndInit();
  }

  private async loadAndInit() {
    this.loading.set(true);
    this.error.set(null);
    this.templateService.getById(this.magazineId, this.templateId).subscribe({
      next: async (template) => {
        this.templateName.set(template.name);
        let schema: any;
        try {
          schema = JSON.parse(template.jsonSchema ?? '{}');
        } catch (e) {
          console.error('Erro ao parsear JSON do banco:', e);
          schema = { basePdf: this.blankPdf, schemas: [[]] };
        }

        if (!schema.schemas || !Array.isArray(schema.schemas)) schema.schemas = [[]];

        // Normaliza basePdf: se for um objeto de folha em branco, mantém.
        // Se for qualquer string apontando para /uploads/, converte a imagem
        // para um PDF real (data:application/pdf;base64,...) em memória usando pdf-lib.
        // O banco nunca vê o PDF gerado — apenas guarda o path do arquivo original.
        if (typeof schema.basePdf === 'object' && !Array.isArray(schema.basePdf)) {
          // Folha em branco — garante padding correto
          if (!schema.basePdf.padding) schema.basePdf.padding = [0, 0, 0, 0];
          this.basePdfPersisted = schema.basePdf;
          this.hasBackground.set(false);

        } else if (typeof schema.basePdf === 'string' && schema.basePdf.includes('/uploads/')) {
          // Extrai path relativo independente do formato armazenado
          const idx = schema.basePdf.indexOf('/uploads/');
          const relativePath = schema.basePdf.substring(idx);
          this.basePdfPersisted = relativePath;

          try {
            const absoluteUrl = `${SERVER_BASE_URL}${relativePath}`;
            schema.basePdf = await this.imageToPdfDataUri(absoluteUrl);
            this.hasBackground.set(true);
          } catch (e) {
            console.warn('Não foi possível carregar a imagem de fundo:', e);
            schema.basePdf = { ...this.blankPdf };
            this.basePdfPersisted = { ...this.blankPdf };
            this.hasBackground.set(false);
          }

        } else {
          // Qualquer outro valor (data URI legado, string inválida, etc.) → folha em branco
          schema.basePdf = { ...this.blankPdf };
          this.basePdfPersisted = { ...this.blankPdf };
          this.hasBackground.set(false);
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

            this.designer.onChangeTemplate(() => {
              this.isDirty.set(true);
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

  protected save() {
    if (!this.designer) return;
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.persistTemplate(() => {
      this.saving.set(false);
      this.saveSuccess.set(true);
      this.isDirty.set(false);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, () => {
      this.saving.set(false);
      this.error.set('Erro ao salvar o template.');
    });
  }

  protected uploadBackground(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.designer) return;

    this.loading.set(true);
    this.templateService.uploadAsset(file).subscribe({
      next: async (res) => {
        // Grava a URL relativa do arquivo no disco — será salva no banco
        this.basePdfPersisted = res.url;

        try {
          // Converte a imagem local para PDF em memória (sem segundo request ao servidor).
          // O PDFME v6 exige data:application/pdf;base64,... como basePdf.
          const pdfDataUri = await this.imageFileToPdfDataUri(file);
          const template = this.designer.getTemplate();
          (template as any).basePdf = pdfDataUri;
          this.designer.updateTemplate(template);
          this.hasBackground.set(true);
          this.isDirty.set(true);
        } catch (e) {
          console.error('Erro ao processar imagem de fundo:', e);
          this.error.set('Erro ao processar a imagem de fundo.');
        } finally {
          this.loading.set(false);
        }
      },
      error: (err) => {
        const status = err?.status;
        if (status === 413) {
          this.error.set('Imagem muito grande. O tamanho máximo permitido é 2 MB.');
        } else if (status === 415 || status === 400) {
          this.error.set('Formato não suportado. Use PNG ou JPG (máx. 2 MB).');
        } else {
          this.error.set('Erro ao fazer upload da imagem de fundo. Tente novamente.');
        }
        this.loading.set(false);
      },
      complete: () => {
        (event.target as HTMLInputElement).value = '';
      }
    });
  }

  /** Remove a imagem de fundo e volta para folha em branco */
  protected removeBackground() {
    if (!this.designer) return;
    const template = this.designer.getTemplate();
    (template as any).basePdf = { ...this.blankPdf };
    this.designer.updateTemplate(template);
    this.basePdfPersisted = { ...this.blankPdf };
    this.hasBackground.set(false);
    this.isDirty.set(true);
  }

  /** Tenta navegar de volta — abre o modal se houver alterações não salvas */
  protected goBack() {
    if (this.isDirty()) {
      this.showUnsavedModal.set(true);
    } else {
      this.navigateBack();
    }
  }

  protected confirmDiscard() {
    this.showUnsavedModal.set(false);
    this.isDirty.set(false);
    this.navigateBack();
  }

  protected confirmSaveAndLeave() {
    if (!this.designer) return;
    this.saving.set(true);
    this.showUnsavedModal.set(false);
    this.persistTemplate(() => {
      this.saving.set(false);
      this.isDirty.set(false);
      this.navigateBack();
    }, () => {
      this.saving.set(false);
      this.error.set('Erro ao salvar o template. Tente novamente.');
    });
  }

  protected cancelModal() {
    this.showUnsavedModal.set(false);
  }

  private navigateBack() {
    this.router.navigate(['/templates/magazine', this.magazineId]);
  }

  /**
   * Monta o payload do template para persistência e chama o serviço.
   * Substitui basePdf pelo valor de `basePdfPersisted` (URL relativa ou objeto em branco)
   * para que o banco nunca receba o PDF data URI gerado em memória.
   */
  private persistTemplate(onSuccess: () => void, onError: () => void) {
    const template = this.designer.getTemplate();
    // Sempre usa o valor de persistência — nunca o PDF em memória
    (template as any).basePdf = this.basePdfPersisted ?? { ...this.blankPdf };
    const jsonSchema = JSON.stringify(template);
    this.templateService.save(this.magazineId, this.templateId, {
      name: this.templateName(),
      jsonSchema
    }).subscribe({ next: onSuccess, error: onError });
  }

  // ── Conversão de imagem para PDF (necessária para o PDFME v6) ──────────────

  /**
   * Converte uma imagem de um File local para data:application/pdf;base64,...
   * O PDFME v6 só aceita PDF como basePdf — imagens precisam ser empacotadas.
   */
  private async imageFileToPdfDataUri(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    return this.imageBufferToPdfDataUri(buffer, file.type);
  }

  /**
   * Converte uma imagem de uma URL pública para data:application/pdf;base64,...
   * Usada ao carregar templates já salvos com background.
   */
  private async imageUrlToPdfDataUri(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar imagem`);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    return this.imageBufferToPdfDataUri(buffer, contentType);
  }

  /**
   * Empacota bytes de uma imagem PNG ou JPEG em um PDF A4 paisagem usando pdf-lib.
   * Retorna data:application/pdf;base64,... — formato exigido pelo PDFME v6.
   */
  private async imageBufferToPdfDataUri(buffer: ArrayBuffer, mimeType: string): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([A4_LANDSCAPE_PT.width, A4_LANDSCAPE_PT.height]);

    let embeddedImage;
    if (mimeType.includes('png')) {
      embeddedImage = await pdfDoc.embedPng(buffer);
    } else {
      // JPEG, WebP e outros: tenta como JPEG (WebP requer conversão via Canvas)
      try {
        embeddedImage = await pdfDoc.embedJpg(buffer);
      } catch {
        // Fallback via Canvas para WebP e formatos não suportados diretamente
        embeddedImage = await pdfDoc.embedJpg(await this.toJpegViaCanvas(buffer, mimeType));
      }
    }

    page.drawImage(embeddedImage, {
      x: 0, y: 0,
      width: A4_LANDSCAPE_PT.width,
      height: A4_LANDSCAPE_PT.height
    });

    const pdfBytes = await pdfDoc.save();
    const b64 = btoa(Array.from(new Uint8Array(pdfBytes), b => String.fromCharCode(b)).join(''));
    return `data:application/pdf;base64,${b64}`;
  }

  /**
   * Converte qualquer formato de imagem (incluindo WebP) para JPEG via Canvas API.
   * Usado como fallback quando pdf-lib não suporta o formato diretamente.
   */
  private toJpegViaCanvas(buffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(
          blob => blob ? blob.arrayBuffer().then(resolve).catch(reject) : reject(new Error('Canvas toBlob falhou')),
          'image/jpeg', 0.92
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Falha ao carregar imagem no Canvas')); };
      img.src = objectUrl;
    });
  }

  /** Alias que seleciona automaticamente a conversão por URL ou por buffer */
  private async imageToPdfDataUri(absoluteUrl: string): Promise<string> {
    return this.imageUrlToPdfDataUri(absoluteUrl);
  }

  ngOnDestroy() {
    this.designer?.destroy?.();
  }
}
