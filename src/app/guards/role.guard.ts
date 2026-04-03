import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autorização baseado em role.
 *
 * Uso nas rotas:
 *   canActivate: [authGuard, roleGuard('ADMIN')]
 *   canActivate: [authGuard, roleGuard('CLIENT', 'ADMIN')]
 */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.getRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Redireciona para home se o usuário não tem permissão
    router.navigate(['/']);
    return false;
  };
}
