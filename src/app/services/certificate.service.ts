import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api';
import { CertificateRequest } from '../models/certificate-request.interface';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CertificateResponse {
  id: number;
  name: string;
  validationCode: string;
  magazineResponse: { id: number; name: string };
  volume: string;
  number: string;
  type: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private http = inject(HttpClient)

  public generateCertificates(request: CertificateRequest): Observable<void> {
    return this.http.post<void>(API_BASE_URL + "/certificate/generate", request)
  }

  public getCertificates(page: number = 0, size: number = 10, name?: string, cpf?: string, email?: string): Observable<Page<CertificateResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (name) params = params.set('name', name);
    if (cpf) params = params.set('cpf', cpf);
    if (email) params = params.set('email', email);
    return this.http.get<Page<CertificateResponse>>(API_BASE_URL + "/certificate/list", { params });
  }

  public resendCertificate(code: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/certificate/resend/${code}`, {});
  }

  public downloadCertificate(code: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/certificate/download/${code}`, { responseType: 'blob' });
  }
}
