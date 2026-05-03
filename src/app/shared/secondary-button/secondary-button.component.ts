import { Component, input } from '@angular/core';

@Component({
  selector: 'app-secondary-button',
  standalone: true,
  imports: [],
  templateUrl: './secondary-button.component.html',
  styleUrl: './secondary-button.component.css',
})
export class SecondaryButtonComponent {
  public text = input<string>('');
  public type = input<'button' | 'submit' | 'reset'>('button');
}
