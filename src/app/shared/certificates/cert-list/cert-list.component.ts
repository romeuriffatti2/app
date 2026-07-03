import { Component, inject, OnInit, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CertificateResponse, CertificateService, Page, CertificateGroupResponse } from '../../../services/certificate.service';
import { PersonService } from '../../../services/person.service';
import { PersonResponse } from '../../../models/person.interface';
import { computed } from '@angular/core';
import { CertificateRequest, CertificateItemRequest } from '../../../models/certificate-request.interface';

export type CertListType = 'all' | 'aceite' | 'publicacao';

@Component({
  selector: 'app-cert-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cert-list.component.html',
  styleUrl: './cert-list.component.css'
})
export class CertListComponent implements OnInit, OnChanges {
  private certService = inject(CertificateService);

  @Input() listType: CertListType = 'all';

  protected items = signal<any[]>([]);
  protected page = signal<number>(0);
  protected totalPages = signal<number>(0);
  protected isLoading = signal<boolean>(false);
  protected isActionLoading = signal<boolean>(false);
  protected expandedGroups = signal<Set<string>>(new Set<string>());

  // --- Modal Editar Grupo ---
  private personService = inject(PersonService);
  protected isEditModalOpen = signal<boolean>(false);
  protected editingGroup = signal<CertificateGroupResponse | null>(null);
  protected groupAuthors = signal<any[]>([]); // Current authors
  
  protected editSearchName = signal<string>('');
  protected editSearchCpf = signal<string>('');
  protected editSearchEmail = signal<string>('');
  protected allPersons = signal<PersonResponse[]>([]);
  
  protected filteredPersons = computed(() => {
    const name = this.editSearchName().toLowerCase().trim();
    const cpf = this.editSearchCpf().replace(/\D/g, '');
    const email = this.editSearchEmail().toLowerCase().trim();

    if (!name && !cpf && !email) return [];

    return this.allPersons().filter(p => {
      const matchName = !name || p.name.toLowerCase().includes(name);
      const matchCpf = !cpf || (p.cpf && p.cpf.replace(/\D/g, '').includes(cpf));
      const matchEmail = !email || (p.email && p.email.toLowerCase().includes(email));
      return matchName && matchCpf && matchEmail;
    });
  });

  protected isSuccessModalOpen = signal<boolean>(false);

  // --- Filtros ---
  protected searchName = signal<string>('');
  protected searchCpf = signal<string>('');
  protected searchEmail = signal<string>('');

  private searchSubject = new Subject<void>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400)
    ).subscribe(() => {
      this.page.set(0);
      this.loadCertificates();
    });
  }

  ngOnInit(): void {
    this.loadCertificates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listType'] && !changes['listType'].isFirstChange()) {
      this.page.set(0);
      this.loadCertificates();
    }
  }

  protected onSearchChange() {
    this.searchSubject.next();
  }

  loadCertificates(pageIndex: number = 0) {
    this.isLoading.set(true);
    const name = this.searchName().trim();
    const cpf = this.searchCpf().replace(/\D/g, '');
    const email = this.searchEmail().trim();

    if (this.listType === 'all') {
      this.certService.getCertificates(pageIndex, 10, name, cpf, email).subscribe({
        next: (page: Page<CertificateResponse>) => {
          this.items.set(page.content);
          this.page.set(page.number);
          this.totalPages.set(page.totalPages);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          alert('Erro ao carregar os certificados emitidos.');
        }
      });
    } else {
      this.certService.getGroupedCertificates(this.listType, name, pageIndex, 10).subscribe({
        next: (page: Page<CertificateGroupResponse>) => {
          this.items.set(page.content);
          this.page.set(page.number);
          this.totalPages.set(page.totalPages);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          alert('Erro ao carregar os certificados emitidos.');
        }
      });
    }
  }

  toggleGroup(code: string) {
    const current = new Set(this.expandedGroups());
    if (current.has(code)) {
      current.delete(code);
    } else {
      current.add(code);
    }
    this.expandedGroups.set(current);
  }

  isGroupExpanded(code: string): boolean {
    return this.expandedGroups().has(code);
  }

  onEditGroup(group: CertificateGroupResponse) {
    this.editingGroup.set(group);
    this.groupAuthors.set(group.authors ? [...group.authors] : []);
    this.editSearchName.set('');
    this.editSearchCpf.set('');
    this.editSearchEmail.set('');
    this.isEditModalOpen.set(true);

    if (this.allPersons().length === 0) {
      this.personService.getAllPersons().subscribe(res => {
        this.allPersons.set(res);
      });
    }
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingGroup.set(null);
  }

  removeAuthor(id: number) {
    this.groupAuthors.update(authors => authors.filter(a => a.id !== id));
  }

  addAuthor(person: PersonResponse) {
    const current = this.groupAuthors();
    if (!current.find(a => a.id === person.id)) {
      this.groupAuthors.update(authors => [...authors, person]);
    }
    this.editSearchName.set('');
    this.editSearchCpf.set('');
    this.editSearchEmail.set('');
  }

  saveEditGroup() {
    const group = this.editingGroup();
    if (!group) return;

    if (this.groupAuthors().length === 0) {
      alert('O certificado precisa ter pelo menos um autor.');
      return;
    }

    this.isActionLoading.set(true);

    const sharedCode = crypto.randomUUID();

    const certificateRequest: CertificateRequest = {
      magazineId: group.magazineResponse.id,
      volume: '', 
      number: '', 
      type: group.type,
      certificates: this.groupAuthors().map(author => ({
        personId: author.id,
        name: author.name,
        cpf: author.cpf,
        email: author.email,
        pdfBase64: '',
        validationCode: sharedCode,
        metadata: { articleTitle: group.articleTitle }
      }))
    };

    // First delete batch
    this.certService.deleteBatchCertificate(group.validationCode).subscribe({
      next: () => {
        // Then recreate
        this.certService.generateCertificates(certificateRequest).subscribe({
          next: () => {
            this.isActionLoading.set(false);
            this.closeEditModal();
            this.isSuccessModalOpen.set(true);
            this.loadCertificates(this.page()); // reload list
          },
          error: () => {
            this.isActionLoading.set(false);
            alert('Erro ao reemitir os certificados.');
          }
        });
      },
      error: () => {
        this.isActionLoading.set(false);
        alert('Erro ao excluir os certificados anteriores.');
      }
    });
  }

  closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
  }

  onDownload(cert: any) {
    this.isActionLoading.set(true);
    this.certService.downloadCertificate(cert.validationCode).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = cert.name ? `Certificado_${cert.name}.pdf` : `Certificado_${cert.articleTitle}.pdf`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.isActionLoading.set(false);
      },
      error: () => {
        this.isActionLoading.set(false);
        alert('Erro ao baixar o certificado.');
      }
    });
  }

  onResendEmail(cert: any) {
    const label = cert.name ? cert.name : `os autores de "${cert.articleTitle}"`;
    if (!confirm(`Deseja reenviar o(s) certificado(s) para ${label}?`)) return;

    this.isActionLoading.set(true);
    this.certService.resendCertificate(cert.validationCode).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        alert('E-mail reenviado com sucesso!');
      },
      error: () => {
        this.isActionLoading.set(false);
        alert('Erro ao reenviar o e-mail. Verifique os logs do servidor.');
      }
    });
  }

  nextPage() {
    if (this.page() < this.totalPages() - 1) {
      this.loadCertificates(this.page() + 1);
    }
  }

  prevPage() {
    if (this.page() > 0) {
      this.loadCertificates(this.page() - 1);
    }
  }
}
