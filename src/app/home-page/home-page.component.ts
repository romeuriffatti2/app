import { Component, inject, signal } from '@angular/core';
import { SecondaryButtonComponent } from '../shared/secondary-button/secondary-button.component';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { GenCertFormComponent } from "../shared/gen-cert-form/gen-cert-form.component";
import { MagazineService } from '../services/magazine-service.service';
import { RegMagFormComponent } from "../shared/reg-mag-form/reg-mag-form.component";

@Component({
  selector: 'app-home-page',
  imports: [NavbarComponent, SecondaryButtonComponent, GenCertFormComponent, RegMagFormComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  protected isCertFormOpen = signal<boolean>(false)
  protected isMagazineFormOpen = signal<boolean>(false)

  protected onOpenForm() {
    const isOpen = this.isCertFormOpen()

    this.isCertFormOpen.set(!isOpen)
    this.isMagazineFormOpen.set(false)
  }

  protected onOpenRegistryMagazine() {
    const isOpen = this.isMagazineFormOpen()
    this.isMagazineFormOpen.set(!isOpen)
    this.isCertFormOpen.set(false)
  }
}




