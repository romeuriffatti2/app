import { Injectable } from '@angular/core';
import { CertificateRequest } from '../models/certificate-request.interface';
import { MagazineResponse } from '../models/magazine-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CertificateMapperService {

  /**
   * Mapeia os dados do formulário e os metadados da Revista para o formato de array
   * de chaves/valores exigido pelo schema do PDFME.
   * Ele substitui dinamicamente as strings {{variavel}} baseadas no conteúdo padrão do layout.
   */
  public mapToPdfInputs(
    request: CertificateRequest,
    templateJson: any,
    magazines: MagazineResponse[]
  ): Record<string, string>[] {
    
    // Recupera dados base da Revista selecionada
    const magazine = magazines.find(m => m.id === request.magazineId);
    const magazineName = magazine?.name || '';
    const issn = magazine?.issn || '';
    const magazineEmail = magazine?.email || '';
    const responsavelTecnico = magazine?.responsavelTecnico || '';
    
    const now = new Date();
    const year = String(now.getFullYear());
    const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    // Extrai o primeiro array de schemas do PDFME (geralmente só tem um para uma página)
    const pageSchemas = templateJson.schemas[0] || [];

    let combinedNames = '';
    let itemsToProcess = request.certificates;

    if (request.type === 'aceite' || request.type === 'publicacao') {
      const names = request.certificates.map(c => c.name);
      if (names.length > 1) {
        const last = names.pop();
        combinedNames = names.join(', ') + ' e ' + last;
      } else {
        combinedNames = names[0] || '';
      }
      // Processa apenas 1 vez para gerar 1 PDF
      itemsToProcess = [request.certificates[0]];
    }

    // Mapeia os dados
    return itemsToProcess.map(item => {
      const nameToUse = combinedNames ? combinedNames : (item.name || '');
      const rawData: Record<string, string> = {
        name: nameToUse,
        cpf: item.metadata?.cpf || '',
        validationCode: item.validationCode || '',
        evaluationId: item.metadata?.evaluationId || '',
        magazineName: magazineName,
        issn: issn,
        email: magazineEmail,
        responsavelTecnico: responsavelTecnico,
        year: year,
        date: date,
        volume: request.volume || '',
        number: request.number || '',
        dossieTitle: item.metadata?.dossieTitle || '',
        articleTitle: item.metadata?.articleTitle || '',
        publishMonth: item.metadata?.publishMonth || '',
        publishYear: item.metadata?.publishYear || '',
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
          // Se for imagem e existir um valor default no esquema (content), a gente usa ele.
          if (schemaField.content) {
            interpolatedInput[schemaField.name] = schemaField.content;
          }
        }
      });

      return interpolatedInput;
    });
  }
}
