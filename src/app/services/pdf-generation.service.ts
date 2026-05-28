import { Injectable } from '@angular/core';
import { generate } from '@pdfme/generator';
import { text, image, barcodes } from '@pdfme/schemas';
import { getDefaultFont } from '@pdfme/common';
import { PDFDocument } from 'pdf-lib';
import { API_BASE_URL } from '../../api/api';

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
const A4_LANDSCAPE_PT = { width: 841.89, height: 595.28 } as const;

export interface PdfGenerationResult {
  mergedPdfBlob: Blob;
  individualPdfsBase64: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {

  /**
   * Prepara o template (converte basePdf se for URL local) e gera:
   * 1. Um arquivo Blob com todos os certificados mesclados para download local.
   * 2. Uma lista de strings em Base64 para envio individualizado por email via backend.
   */
  public async generateCertificates(templateJson: any, inputs: Record<string, string>[]): Promise<PdfGenerationResult> {
    const plugins = { text, image, qrcode: barcodes.qrcode };
    const options = { font: getDefaultFont() };

    // Tratamento especial para imagens no próprio servidor local (converter para PDF Data URI)
    if (typeof templateJson.basePdf === 'string' && templateJson.basePdf.startsWith('/uploads/')) {
      const absoluteImageUrl = `${SERVER_BASE_URL}${templateJson.basePdf}`;
      try {
        templateJson.basePdf = await this.imageUrlToPdfDataUri(absoluteImageUrl);
      } catch (err) {
        console.error("Erro ao converter imagem de fundo do template:", err);
        templateJson.basePdf = absoluteImageUrl; // Fallback
      }
    }

    // 1. Gera o PDF mesclado para download do usuário
    const pdfMerged = await generate({ template: templateJson, plugins, inputs, options });
    const mergedPdfBlob = new Blob([pdfMerged], { type: 'application/pdf' });

    // 2. Gera PDFs individuais em Base64 para backend
    const individualPdfsBase64: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const singlePdf = await generate({ template: templateJson, plugins, inputs: [inputs[i]], options });
      individualPdfsBase64.push(this.uint8ArrayToBase64(singlePdf));
    }

    return { mergedPdfBlob, individualPdfsBase64 };
  }

  /**
   * Força o download de um Blob no navegador
   */
  public downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private async imageUrlToPdfDataUri(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar imagem`);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    return this.imageBufferToPdfDataUri(buffer, contentType);
  }

  private async imageBufferToPdfDataUri(buffer: ArrayBuffer, mimeType: string): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([A4_LANDSCAPE_PT.width, A4_LANDSCAPE_PT.height]);

    let embeddedImage;
    if (mimeType.includes('png')) {
      embeddedImage = await pdfDoc.embedPng(buffer);
    } else {
      try {
        embeddedImage = await pdfDoc.embedJpg(buffer);
      } catch {
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
}
