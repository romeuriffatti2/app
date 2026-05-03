import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MagazineService } from '../../services/magazine-service.service';
import { MagazineResponse } from '../../models/magazine-response.interface';
import { MagListItemComponent } from '../mag-list-item/mag-list-item.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-mag-list',
  imports: [CommonModule, MagListItemComponent],
  templateUrl: './mag-list.component.html',
  styleUrl: './mag-list.component.css',
})
export class MagListComponent implements OnInit {
  private magazineService = inject(MagazineService);
  private toastr = inject(ToastrService);

  protected magazines = signal<MagazineResponse[]>([]);
  protected isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.magazineService.getAllMagazines().subscribe({
      next: (data) => {
        this.magazines.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Erro ao carregar revistas');
        this.isLoading.set(false);
      }
    });
  }
}
