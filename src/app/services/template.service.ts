import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api';
import { PdfmeTemplate, SaveTemplateRequest } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

  private readonly base = `${API_BASE_URL}/my/templates`;

  constructor(private http: HttpClient) { }

  /** Lista todos os templates da revista */
  listMyTemplates(magazineId: number): Observable<PdfmeTemplate[]> {
    return this.http.get<PdfmeTemplate[]>(`${this.base}/magazine/${magazineId}`);
  }

  /** Busca um template por ID (com jsonSchema completo) */
  getById(magazineId: number, id: number): Observable<PdfmeTemplate> {
    return this.http.get<PdfmeTemplate>(`${this.base}/magazine/${magazineId}/${id}`);
  }

  /** Busca o template ativo para o tipo informado */
  getByType(magazineId: number, type: string): Observable<PdfmeTemplate> {
    return this.http.get<PdfmeTemplate>(`${this.base}/magazine/${magazineId}/type/${type}`);
  }

  /** Salva edições (nome e/ou jsonSchema) de um template */
  save(magazineId: number, id: number, req: SaveTemplateRequest): Observable<PdfmeTemplate> {
    return this.http.put<PdfmeTemplate>(`${this.base}/magazine/${magazineId}/${id}`, req);
  }

  /** Cria um novo template customizado do zero */
  create(magazineId: number, req: SaveTemplateRequest): Observable<PdfmeTemplate> {
    return this.http.post<PdfmeTemplate>(`${this.base}/magazine/${magazineId}`, req);
  }

  /** Clona um template existente */
  clone(magazineId: number, id: number): Observable<PdfmeTemplate> {
    return this.http.post<PdfmeTemplate>(`${this.base}/magazine/${magazineId}/${id}/clone`, {});
  }

  /** Reseta o jsonSchema de volta ao template padrão do sistema de origem */
  resetToDefault(magazineId: number, id: number): Observable<PdfmeTemplate> {
    return this.http.post<PdfmeTemplate>(`${this.base}/magazine/${magazineId}/${id}/reset-to-default`, {});
  }

  /** Faz o upload de um arquivo de asset (como imagem de fundo) para o disco do servidor */
  uploadAsset(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${API_BASE_URL}/my/assets/image`, formData);
  }
}
