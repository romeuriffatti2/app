import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api';
import { CertificateRequest } from '../models/certificate-request.interface';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private http = inject(HttpClient)

  public generateCertificates(request: CertificateRequest): Observable<void> {
    return this.http.post<void>(API_BASE_URL + "/certificate/generate", request)
  }
}
