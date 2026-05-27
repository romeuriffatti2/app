import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';
import { SecondaryButtonComponent } from '../secondary-button/secondary-button.component';
import { PersonService } from '../../services/person.service';
import { PersonRequest } from '../../models/person.interface';

@Component({
  selector: 'app-reg-person-form',
  imports: [CommonModule, ReactiveFormsModule, SecondaryButtonComponent, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './reg-person-form.component.html',
  styleUrl: './reg-person-form.component.css',
})
export class RegPersonFormComponent {
  private personService = inject(PersonService);
  private toastr = inject(ToastrService);

  protected personForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    cpf: new FormControl('', [
      Validators.required,
      Validators.minLength(11),
      Validators.maxLength(11),
      Validators.pattern(/^\d{11}$/)
    ]),
  });

  private stripCpf(value: string): string {
    return value.replace(/\D/g, '');
  }

  protected handleSubmit() {
    if (this.personForm.invalid) {
      this.personForm.markAllAsTouched();
      return;
    }

    const raw = this.personForm.value;
    const person: PersonRequest = {
      name: raw.name!,
      email: raw.email!,
      cpf: this.stripCpf(raw.cpf!),
    };

    this.personService.postPerson(person).subscribe({
      next: (res) => {
        this.toastr.success(`${res.name} cadastrado(a) com sucesso`);
        this.personForm.reset();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao cadastrar pessoa';
        this.toastr.error(msg);
      }
    });
  }
}
