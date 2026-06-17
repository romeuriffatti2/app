import { CommonModule } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';
import { SecondaryButtonComponent } from '../../buttons/secondary-button/secondary-button.component';
import { PersonService } from '../../../services/person.service';
import { PersonDeletedError, PersonRequest, PersonResponse } from '../../../models/person.interface';

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

  /** Emitido sempre que uma pessoa é cadastrada ou reativada com sucesso. */
  readonly personRegistered = output<PersonResponse>();

  protected personForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    cpf: new FormControl('', [
      (control) => {
        const val = control.value?.replace(/\D/g, '') ?? '';
        if (!val) return null; // CPF é opcional
        if (!/^\d{11}$/.test(val)) return { cpfInvalid: true };
        return null;
      }
    ]),
  });

  // --- Modal de reativação ---
  protected showReactivateModal = signal<boolean>(false);
  protected deletedPersonId = signal<number | null>(null);
  protected deletedPersonName = signal<string>('');
  protected isReactivating = signal<boolean>(false);

  private stripCpf(value: string): string {
    return value.replace(/\D/g, '');
  }

  protected handleSubmit() {
    if (this.personForm.invalid) {
      this.personForm.markAllAsTouched();
      return;
    }

    const raw = this.personForm.value;
    const strippedCpf = this.stripCpf(raw.cpf ?? '');
    const person: PersonRequest = {
      name: raw.name!,
      email: raw.email!,
      cpf: strippedCpf || undefined,
    };

    this.personService.postPerson(person).subscribe({
      next: (res) => {
        this.toastr.success(`${res.name} cadastrado(a) com sucesso`);
        this.personForm.reset();
        this.personRegistered.emit(res);
      },
      error: (err) => {
        // Verifica se é o caso especial de pessoa deletada
        if (err.status === 409 && err.error?.errorCode === 'PERSON_DELETED') {
          const body = err.error as PersonDeletedError;
          this.deletedPersonId.set(body.personId);
          this.deletedPersonName.set(body.personName);
          this.showReactivateModal.set(true);
        } else {
          const msg = err?.error?.message || 'Erro ao cadastrar pessoa';
          this.toastr.error(msg);
        }
      }
    });
  }

  protected closeReactivateModal(): void {
    this.showReactivateModal.set(false);
    this.deletedPersonId.set(null);
    this.deletedPersonName.set('');
  }

  protected confirmReactivate(): void {
    const id = this.deletedPersonId();
    if (!id) return;

    const raw = this.personForm.value;
    const strippedCpf = this.stripCpf(raw.cpf ?? '');
    const data = {
      name: raw.name!,
      email: raw.email!,
      cpf: strippedCpf || undefined,
    };

    this.isReactivating.set(true);
    this.personService.reactivatePerson(id, data).subscribe({
      next: (res) => {
        this.toastr.success(`Cadastro de ${res.name} reativado com sucesso`);
        this.personForm.reset();
        this.isReactivating.set(false);
        this.closeReactivateModal();
        this.personRegistered.emit(res);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao reativar pessoa';
        this.toastr.error(msg);
        this.isReactivating.set(false);
      }
    });
  }
}
