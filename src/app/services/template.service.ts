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

  constructor(private http: HttpClient) {}

  /** Lista todos os templates do usuário logado */
  listMyTemplates(): Observable<PdfmeTemplate[]> {
    return this.http.get<PdfmeTemplate[]>(this.base);
  }

  /** Busca um template por ID (com jsonSchema completo) */
  getById(id: number): Observable<PdfmeTemplate> {
    return this.http.get<PdfmeTemplate>(`${this.base}/${id}`);
  }

  /** Salva edições (nome e/ou jsonSchema) de um template */
  save(id: number, req: SaveTemplateRequest): Observable<PdfmeTemplate> {
    return this.http.put<PdfmeTemplate>(`${this.base}/${id}`, req);
  }

  /** Cria um novo template customizado do zero */
  create(req: SaveTemplateRequest): Observable<PdfmeTemplate> {
    return this.http.post<PdfmeTemplate>(this.base, req);
  }

  /** Clona um template existente */
  clone(id: number): Observable<PdfmeTemplate> {
    return this.http.post<PdfmeTemplate>(`${this.base}/${id}/clone`, {});
  }

  /** Deleta um template */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Reseta o jsonSchema de volta ao template padrão do sistema de origem */
  resetToDefault(id: number): Observable<PdfmeTemplate> {
    return this.http.post<PdfmeTemplate>(`${this.base}/${id}/reset-to-default`, {});
  }
}
