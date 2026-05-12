import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClickOutsideDirective } from '../directives/click-outside.directive';

export type ViewMode = 'cert' | 'cert-list' | 'mag-form' | 'mag-list' | 'person-form' | 'person-list' | 'none';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Input received from parent (HomePage) to know which item is active
  activeView = input<ViewMode>('none');
  
  // Output event to notify parent (HomePage) to change the view
  viewChange = output<ViewMode>();

  protected isCertDropdownOpen = signal<boolean>(false);
  protected isMagazineDropdownOpen = signal<boolean>(false);
  protected isPersonDropdownOpen = signal<boolean>(false);

  protected onSelectView(view: ViewMode) {
    this.viewChange.emit(view);
    // Optionally close dropdowns when an item is selected, or keep them open.
    // Usually, keeping them open is fine until clicked outside.
  }

  protected onToggleCertDropdown() {
    this.isCertDropdownOpen.set(!this.isCertDropdownOpen());
    this.isMagazineDropdownOpen.set(false);
    this.isPersonDropdownOpen.set(false);
  }

  protected onToggleMagazineDropdown() {
    this.isMagazineDropdownOpen.set(!this.isMagazineDropdownOpen());
    this.isCertDropdownOpen.set(false);
    this.isPersonDropdownOpen.set(false);
  }

  protected onTogglePersonDropdown() {
    this.isPersonDropdownOpen.set(!this.isPersonDropdownOpen());
    this.isCertDropdownOpen.set(false);
    this.isMagazineDropdownOpen.set(false);
  }
}
