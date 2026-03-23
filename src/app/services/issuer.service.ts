import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IssuerResponse } from '../models/issuer.interface';
import { API_BASE_URL } from '../api/api';

@Injectable({
  providedIn: 'root'
})
export class IssuerService {

  private http = inject(HttpClient);

  getAllIssuers(): Observable<IssuerResponse[]> {
    return this.http.get<IssuerResponse[]>(`${API_BASE_URL}/issuers`);
  }
}
