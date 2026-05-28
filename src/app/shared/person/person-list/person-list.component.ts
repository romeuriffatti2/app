import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { PersonService } from '../../../services/person.service';
import { PersonResponse, PersonUpdateRequest } from '../../../models/person.interface';
import { PersonListItemComponent } from '../person-list-item/person-list-item.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-person-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PersonListItemComponent],
  templateUrl: './person-list.component.html',
  styleUrl: './person-list.component.css',
})
export class PersonListComponent implements OnInit {
  private personService = inject(PersonService);
  private toastr = inject(ToastrService);

  protected persons = signal<PersonResponse[]>([]);
  protected isLoading = signal<boolean>(true);

  // --- Filtros ---
  protected searchName = signal<string>('');
  protected searchCpf = signal<string>('');

  protected filteredPersons = computed(() => {
    const name = this.searchName().toLowerCase().trim();
    const cpf = this.searchCpf().replace(/\D/g, '');

    return this.persons().filter(p => {
      const matchName = !name || p.name.toLowerCase().includes(name);
      const matchCpf = !cpf || p.cpf.replace(/\D/g, '').includes(cpf);
      return matchName && matchCpf;
    });
  });

  // --- Modal de edição ---
  protected isEditModalOpen = signal<boolean>(false);
  protected editingPerson = signal<PersonResponse | null>(null);
  protected isSaving = signal<boolean>(false);

  protected editForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    cpf: new FormControl('', [
      Validators.required,
      Validators.minLength(11),
      Validators.maxLength(11),
      Validators.pattern(/^\d{11}$/),
    ]),
  });

  // --- Modal de exclusão ---
  protected isDeleteModalOpen = signal<boolean>(false);
  protected deletingPerson = signal<PersonResponse | null>(null);
  protected isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPersons();
  }

  private loadPersons(): void {
    this.isLoading.set(true);
    this.personService.getAllPersons().subscribe({
      next: (data) => {
        this.persons.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Erro ao carregar pessoas');
        this.isLoading.set(false);
      }
    });
  }

  // --- Handlers de filtro ---
  protected onSearchNameChange(value: string): void {
    this.searchName.set(value);
  }

  protected onSearchCpfChange(value: string): void {
    this.searchCpf.set(value);
  }

  // --- Handlers de edição ---
  protected onEdit(person: PersonResponse): void {
    this.editingPerson.set(person);
    this.editForm.setValue({
      name: person.name,
      email: person.email,
      cpf: person.cpf.replace(/\D/g, ''),
    });
    this.isEditModalOpen.set(true);
  }

  protected closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingPerson.set(null);
    this.editForm.reset();
  }

  protected onSaveEdit(): void {
    if (this.editForm.invalid || !this.editingPerson()) return;

    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    const person = this.editingPerson()!;
    const raw = this.editForm.value;
    const data: PersonUpdateRequest = {
      name: raw.name!,
      email: raw.email!,
      cpf: raw.cpf!.replace(/\D/g, ''),
    };

    this.isSaving.set(true);
    this.personService.updatePerson(person.id, data).subscribe({
      next: (updated) => {
        this.persons.update(list =>
          list.map(p => p.id === updated.id ? updated : p)
        );
        this.toastr.success(`${updated.name} atualizado(a) com sucesso`);
        this.isSaving.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao atualizar pessoa';
        this.toastr.error(msg);
        this.isSaving.set(false);
      }
    });
  }

  // --- Handlers de exclusão ---
  protected onDelete(person: PersonResponse): void {
    this.deletingPerson.set(person);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingPerson.set(null);
  }

  protected confirmDelete(): void {
    const person = this.deletingPerson();
    if (!person) return;

    this.isDeleting.set(true);
    this.personService.deletePerson(person.id).subscribe({
      next: () => {
        this.persons.update(list => list.filter(p => p.id !== person.id));
        this.toastr.success(`${person.name} excluído(a) com sucesso`);
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.toastr.error('Erro ao excluir pessoa');
        this.isDeleting.set(false);
      }
    });
  }
}
