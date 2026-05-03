import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api';
import { PersonRequest, PersonResponse } from '../models/person.interface';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private http = inject(HttpClient);

  public postPerson(person: PersonRequest): Observable<PersonResponse> {
    return this.http.post<PersonResponse>(API_BASE_URL + '/persons', person);
  }

  public getAllPersons(): Observable<PersonResponse[]> {
    return this.http.get<PersonResponse[]>(API_BASE_URL + '/persons');
  }
}
