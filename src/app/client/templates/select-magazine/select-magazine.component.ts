import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MagazineService } from '../../../services/magazine-service.service';
import { MagazineResponse } from '../../../models/magazine-response.interface';

@Component({
  selector: 'app-select-magazine',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './select-magazine.component.html',
  styleUrl: './select-magazine.component.css'
})
export class SelectMagazineComponent implements OnInit {
  private magazineService = inject(MagazineService);
  private router = inject(Router);

  magazines = signal<MagazineResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadMagazines();
  }

  loadMagazines() {
    this.loading.set(true);
    this.error.set(null);
    this.magazineService.getAllMagazines().subscribe({
      next: (list) => {
        this.magazines.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar revistas. Tente novamente.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  selectMagazine(magazineId: number) {
    this.router.navigate(['/templates/magazine', magazineId]);
  }
}
