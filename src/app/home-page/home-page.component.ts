import { Component, HostListener, signal } from '@angular/core';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { GenCertFormComponent } from "../shared/gen-cert-form/gen-cert-form.component";
import { RegMagFormComponent } from "../shared/reg-mag-form/reg-mag-form.component";
import { RegPersonFormComponent } from "../shared/reg-person-form/reg-person-form.component";
import { MagListComponent } from '../shared/mag-list/mag-list.component';
import { PersonListComponent } from '../shared/person-list/person-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, NavbarComponent, GenCertFormComponent, RegMagFormComponent, RegPersonFormComponent, MagListComponent, PersonListComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  protected isCertFormOpen = signal<boolean>(false);
  protected isMagazineFormOpen = signal<boolean>(false);
  protected isMagazineListOpen = signal<boolean>(false);
  protected isPersonFormOpen = signal<boolean>(false);
  protected isPersonListOpen = signal<boolean>(false);
  
  protected isMagazineDropdownOpen = signal<boolean>(false);
  protected isPersonDropdownOpen = signal<boolean>(false);

  protected onOpenForm() {
    this.isCertFormOpen.set(!this.isCertFormOpen());
    this.isMagazineFormOpen.set(false);
    this.isMagazineListOpen.set(false);
    this.isPersonFormOpen.set(false);
    this.isPersonListOpen.set(false);
    this.isMagazineDropdownOpen.set(false);
    this.isPersonDropdownOpen.set(false);
  }

  // --- Magazine Methods ---
  protected onToggleMagazineDropdown() {
    this.isMagazineDropdownOpen.set(!this.isMagazineDropdownOpen());
    this.isPersonDropdownOpen.set(false);
  }

  protected onOpenRegistryMagazine() {
    this.isMagazineFormOpen.set(true);
    this.isMagazineListOpen.set(false);
    this.isCertFormOpen.set(false);
    this.isPersonFormOpen.set(false);
    this.isPersonListOpen.set(false);
    this.isMagazineDropdownOpen.set(false);
  }

  protected onOpenMagazineList() {
    this.isMagazineListOpen.set(true);
    this.isMagazineFormOpen.set(false);
    this.isCertFormOpen.set(false);
    this.isPersonFormOpen.set(false);
    this.isPersonListOpen.set(false);
    this.isMagazineDropdownOpen.set(false);
  }

  protected isMagazineActive() {
    return this.isMagazineFormOpen() || this.isMagazineListOpen();
  }

  // --- Person Methods ---
  protected onTogglePersonDropdown() {
    this.isPersonDropdownOpen.set(!this.isPersonDropdownOpen());
    this.isMagazineDropdownOpen.set(false);
  }

  protected onOpenPersonForm() {
    this.isPersonFormOpen.set(true);
    this.isPersonListOpen.set(false);
    this.isCertFormOpen.set(false);
    this.isMagazineFormOpen.set(false);
    this.isMagazineListOpen.set(false);
    this.isPersonDropdownOpen.set(false);
  }

  protected onOpenPersonList() {
    this.isPersonListOpen.set(true);
    this.isPersonFormOpen.set(false);
    this.isCertFormOpen.set(false);
    this.isMagazineFormOpen.set(false);
    this.isMagazineListOpen.set(false);
    this.isPersonDropdownOpen.set(false);
  }

  protected isPersonActive() {
    return this.isPersonFormOpen() || this.isPersonListOpen();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sidebar-dropdown')) {
      this.isMagazineDropdownOpen.set(false);
      this.isPersonDropdownOpen.set(false);
    }
  }
}
