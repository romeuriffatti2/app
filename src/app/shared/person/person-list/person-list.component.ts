import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonService } from '../../services/person.service';
import { PersonResponse } from '../../models/person.interface';
import { PersonListItemComponent } from '../person-list-item/person-list-item.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-person-list',
  imports: [CommonModule, PersonListItemComponent],
  templateUrl: './person-list.component.html',
  styleUrl: './person-list.component.css',
})
export class PersonListComponent implements OnInit {
  private personService = inject(PersonService);
  private toastr = inject(ToastrService);

  protected persons = signal<PersonResponse[]>([]);
  protected isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.personService.getAllPersons().subscribe({
      next: (data) => {
        this.persons.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Erro ao carregar pessoas');
        this.isLoading.set(false);
      }
    });
  }
}
