import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TemplateService } from '../../../services/template.service';
import { PdfmeTemplate } from '../../../models/template.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css'
})
export class TemplateListComponent implements OnInit {
  private templateService = inject(TemplateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  magazineId = signal<number | null>(null);
  templates = signal<PdfmeTemplate[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  actionLoading = signal<number | null>(null); // ID do template em operação

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const magIdStr = params.get('magazineId');
      if (magIdStr) {
        this.magazineId.set(Number(magIdStr));
        this.loadTemplates();
      }
    });
  }

  loadTemplates() {
    const magId = this.magazineId();
    if (!magId) return;
    this.loading.set(true);
    this.error.set(null);
    this.templateService.listMyTemplates(magId).subscribe({
      next: (list) => {
        this.templates.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar templates. Tente novamente.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  openEditor(templateId: number) {
    this.router.navigate(['/templates/magazine', this.magazineId(), 'editor', templateId]);
  }

  clone(template: PdfmeTemplate) {
    const magId = this.magazineId();
    if (!magId) return;
    this.actionLoading.set(template.id);
    this.templateService.clone(magId, template.id).subscribe({
      next: (cloned) => {
        this.templates.update(list => [...list, cloned]);
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  resetToDefault(template: PdfmeTemplate) {
    const magId = this.magazineId();
    if (!magId) return;
    if (!confirm(`Resetar "${template.name}" para o padrão do sistema?`)) return;
    this.actionLoading.set(template.id);
    this.templateService.resetToDefault(magId, template.id).subscribe({
      next: (updated) => {
        this.templates.update(list =>
          list.map(t => t.id === updated.id ? updated : t)
        );
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null)
    });
  }



  createNew() {
    const magId = this.magazineId();
    if (!magId) return;
    const name = prompt('Nome do novo template:');
    if (!name?.trim()) return;
    const blankSchema = JSON.stringify({ basePdf: '__BLANK_PDF__', schemas: [[]] });
    this.templateService.create(magId, { name: name.trim(), jsonSchema: blankSchema }).subscribe({
      next: (created) => {
        this.templates.update(list => [created, ...list]);
        this.openEditor(created.id);
      }
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      participacao: 'Participação',
      publicacao: 'Publicação',
      parecerista: 'Ad Hoc',
      'corpo-editorial': 'Corpo Editorial',
      dossie: 'Dossiê',
      aceite: 'Aceite',
      custom: 'Personalizado'
    };
    return labels[type] ?? type;
  }

  // --- Modal de Edição de E-mail ---
  emailModalOpen = signal(false);
  currentEmailTemplate = signal<PdfmeTemplate | null>(null);
  emailSubjectInput = signal('');
  emailBodyInput = signal('');

  openEmailEditor(template: PdfmeTemplate) {
    this.currentEmailTemplate.set(template);
    this.emailSubjectInput.set(template.emailSubject || '');
    this.emailBodyInput.set(template.emailBody || '');
    this.emailModalOpen.set(true);
  }

  closeEmailEditor() {
    this.emailModalOpen.set(false);
    this.currentEmailTemplate.set(null);
  }

  saveEmailTemplate() {
    const magId = this.magazineId();
    const template = this.currentEmailTemplate();
    if (!magId || !template) return;

    this.actionLoading.set(template.id);
    this.templateService.save(magId, template.id, {
      emailSubject: this.emailSubjectInput(),
      emailBody: this.emailBodyInput()
    }).subscribe({
      next: (updated) => {
        this.templates.update(list =>
          list.map(t => t.id === updated.id ? updated : t)
        );
        this.closeEmailEditor();
        this.actionLoading.set(null);
      },
      error: (err) => {
        console.error(err);
        this.actionLoading.set(null);
        alert('Erro ao salvar template de e-mail.');
      }
    });
  }

}
