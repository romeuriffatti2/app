import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {

  private http = inject(HttpClient);

  public validateCertificateByCode(code: String): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/certificate/validate/${code.trim()}`);
  }
  public sendByEmail(email: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/certificate/send-by-email`, null, { params: { email } });
  }
}
