import { Component, signal } from '@angular/core';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { GenCertFormComponent } from "../shared/gen-cert-form/gen-cert-form.component";
import { RegMagFormComponent } from "../shared/reg-mag-form/reg-mag-form.component";
import { RegPersonFormComponent } from "../shared/reg-person-form/reg-person-form.component";
import { MagListComponent } from '../shared/mag-list/mag-list.component';
import { PersonListComponent } from '../shared/person-list/person-list.component';
import { CommonModule } from '@angular/common';
import { SidebarComponent, ViewMode } from '../shared/sidebar/sidebar.component';
import { CertListComponent } from '../shared/cert-list/cert-list.component';
import { RegUserFormComponent } from '../shared/reg-user-form/reg-user-form.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    SidebarComponent,
    GenCertFormComponent, 
    RegMagFormComponent, 
    RegPersonFormComponent, 
    MagListComponent, 
    PersonListComponent,
    CertListComponent,
    RegUserFormComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  protected currentView = signal<ViewMode>('none');
}
