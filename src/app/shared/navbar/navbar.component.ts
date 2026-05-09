import { Component, inject } from '@angular/core';
import { ButtonComponent } from "../button/button.component";
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [ButtonComponent, CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn() {
    return this.authService.isAuthenticated();
  }

  onLogout() {
    this.authService.logout();
  }

  onLogin() {
    this.router.navigate(['/login']);
  }
}
