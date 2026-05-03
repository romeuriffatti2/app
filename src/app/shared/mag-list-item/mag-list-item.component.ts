import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MagazineResponse } from '../../models/magazine-response.interface';

@Component({
  selector: 'app-mag-list-item',
  imports: [CommonModule],
  templateUrl: './mag-list-item.component.html',
  styleUrl: './mag-list-item.component.css',
})
export class MagListItemComponent {
  magazine = input.required<MagazineResponse>();
}
