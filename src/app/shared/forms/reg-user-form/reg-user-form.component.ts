import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';
import { SecondaryButtonComponent } from '../secondary-button/secondary-button.component';
import { UserService } from '../../services/user.service';
import { RegisterUserRequest } from '../../services/user.service';

@Component({
  selector: 'app-reg-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SecondaryButtonComponent, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './reg-user-form.component.html',
  styleUrl: './reg-user-form.component.css',
})
export class RegUserFormComponent {
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  protected userForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    cpf: new FormControl('', [
      Validators.required,
      Validators.minLength(11),
      Validators.maxLength(11),
      Validators.pattern(/^\d{11}$/)
    ]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    birthDate: new FormControl<string | null>(null),
    role: new FormControl<'ADMIN' | 'CLIENT'>('CLIENT', [Validators.required]),
  });

  private stripMask(value: string): string {
    return value.replace(/\D/g, '');
  }

  protected handleSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.value;
    const payload: RegisterUserRequest = {
      name: raw.name!,
      email: raw.email!,
      cpf: this.stripMask(raw.cpf!),
      password: raw.password!,
      birthDate: raw.birthDate || null,
      role: raw.role!,
    };

    this.userService.registerUser(payload).subscribe({
      next: (res) => {
        this.toastr.success(`Usuário "${res.name}" cadastrado com sucesso!`);
        this.userForm.reset({ role: 'CLIENT' });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao cadastrar usuário';
        this.toastr.error(msg);
      }
    });
  }
}
