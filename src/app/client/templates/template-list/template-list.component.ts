import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TemplateService } from '../../../services/template.service';
import { PdfmeTemplate } from '../../../models/template.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css'
})
export class TemplateListComponent implements OnInit {
  private templateService = inject(TemplateService);
  private router = inject(Router);

  templates = signal<PdfmeTemplate[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  actionLoading = signal<number | null>(null); // ID do template em operação

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading.set(true);
    this.error.set(null);
    this.templateService.listMyTemplates().subscribe({
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
    this.router.navigate(['/templates/editor', templateId]);
  }

  clone(template: PdfmeTemplate) {
    this.actionLoading.set(template.id);
    this.templateService.clone(template.id).subscribe({
      next: (cloned) => {
        this.templates.update(list => [...list, cloned]);
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  resetToDefault(template: PdfmeTemplate) {
    if (!confirm(`Resetar "${template.name}" para o padrão do sistema?`)) return;
    this.actionLoading.set(template.id);
    this.templateService.resetToDefault(template.id).subscribe({
      next: (updated) => {
        this.templates.update(list =>
          list.map(t => t.id === updated.id ? updated : t)
        );
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null)
    });
  }

  deleteTemplate(template: PdfmeTemplate) {
    if (!confirm(`Deletar "${template.name}"? Esta ação é irreversível.`)) return;
    this.actionLoading.set(template.id);
    this.templateService.delete(template.id).subscribe({
      next: () => {
        this.templates.update(list => list.filter(t => t.id !== template.id));
        this.actionLoading.set(null);
      },
      error: (err) => {
        alert(err?.error?.message || 'Não foi possível deletar o template.');
        this.actionLoading.set(null);
      }
    });
  }

  createNew() {
    const name = prompt('Nome do novo template:');
    if (!name?.trim()) return;
    const blankSchema = JSON.stringify({ basePdf: '__BLANK_PDF__', schemas: [[]] });
    this.templateService.create({ name: name.trim(), jsonSchema: blankSchema }).subscribe({
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

  typeColor(type: string): string {
    const colors: Record<string, string> = {
      participacao: '#6366f1',
      publicacao: '#0ea5e9',
      parecerista: '#f59e0b',
      'corpo-editorial': '#10b981',
      dossie: '#8b5cf6',
      aceite: '#ef4444',
      custom: '#64748b'
    };
    return colors[type] ?? '#64748b';
  }
}
