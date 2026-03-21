import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api';
import { MagazineResponse } from '../models/magazine-response.interface';
import { MagazineRequest } from '../models/magazine-request.interface';

@Injectable({
  providedIn: 'root',
})
export class MagazineService {
  private http = inject(HttpClient)

  public postMagazine(magazine: MagazineRequest): Observable<MagazineResponse> {
    return this.http.post<MagazineResponse>(API_BASE_URL + "/magazines", magazine)
  }

  public getAllMagazines(): Observable<MagazineResponse[]> {
    return this.http.get<MagazineResponse[]>(API_BASE_URL+ "/magazines")
  }
}
