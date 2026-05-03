import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonResponse } from '../../models/person.interface';

@Component({
  selector: 'app-person-list-item',
  imports: [CommonModule],
  templateUrl: './person-list-item.component.html',
  styleUrl: './person-list-item.component.css',
})
export class PersonListItemComponent {
  person = input.required<PersonResponse>();
}
