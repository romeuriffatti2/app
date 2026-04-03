import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginComponent } from './login/login.component';
import { ValidateCertComponent } from './validate-cert/validate-cert.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'validate_cert',
    component: ValidateCertComponent
  },
  // ─── Módulo de Templates (CLIENT e ADMIN) ──────────────────────────────────
  {
    path: 'templates',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./client/templates/template-list/template-list.component').then(
            m => m.TemplateListComponent
          )
      },
      {
        path: 'editor/:id',
        loadComponent: () =>
          import('./client/templates/template-editor/template-editor.component').then(
            m => m.TemplateEditorComponent
          )
      }
    ]
  }
];

