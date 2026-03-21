import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecondaryButtonComponent } from "../secondary-button/secondary-button.component";
import { MagazineService } from '../../services/magazine-service.service';
import { MagazineRequest } from '../../models/magazine-request.interface';
import { ToastrService } from 'ngx-toastr';
import { MagazineResponse } from '../../models/magazine-response.interface';

@Component({
  selector: 'app-reg-mag-form',
  imports: [CommonModule, ReactiveFormsModule, SecondaryButtonComponent],
  templateUrl: './reg-mag-form.component.html',
  styleUrl: './reg-mag-form.component.css',
})

export class RegMagFormComponent {
  private magazineService = inject(MagazineService)
  private toastr = inject(ToastrService)
  protected magazines = signal<MagazineResponse[]>([])


  protected magazineForm = new FormGroup({
    name: new FormControl('', [Validators.required,Validators.minLength(3)]),
    issn: new FormControl('', [Validators.required,Validators.pattern(/^\d{4}-\d{3}[\dX]$/)]),
    isbn: new FormControl('', [Validators.required, Validators.pattern(/^\d{4}-\d{3}[\dX]$/)]),
    email: new FormControl('', [Validators.required,Validators.email]),})

  protected handleMagazineFormSubmit() {
    if (this.magazineForm.invalid) {
      this.magazineForm.markAllAsTouched();
      return;
    }

    const magazine = this.magazineForm.value as MagazineRequest;

    this.magazineService.postMagazine(magazine).subscribe({
      next: (res) => {
        this.toastr.success("Revista cadastrada com sucesso");
        this.toastr.success(`${res.name}, ${res.issn}, ${res.isbn}, ${res.email}`);
        this.magazineForm.reset();
      },
      error: () => {
        this.toastr.error("Erro ao cadastrar revista");
      }
    });
  }
}
