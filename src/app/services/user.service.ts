import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api/api';

export interface RegisterUserRequest {
  name: string;
  email: string;
  cpf: string;
  password: string;
  birthDate: string | null;
  role: 'ADMIN' | 'CLIENT';
}

export interface RegisterUserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  registerUser(payload: RegisterUserRequest) {
    return this.http.post<RegisterUserResponse>(`${API_BASE_URL}/auth/register`, payload);
  }
}
