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
  {
    path: 'tutorial/app-password',
    loadComponent: () =>
      import('./shared/tutorial/app-password-tutorial/app-password-tutorial.component').then(
        m => m.AppPasswordTutorialComponent
      )
  },
  {
    path: 'templates',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./client/templates/select-magazine/select-magazine.component').then(
            m => m.SelectMagazineComponent
          )
      },
      {
        path: 'magazine/:magazineId',
        loadComponent: () =>
          import('./client/templates/template-list/template-list.component').then(
            m => m.TemplateListComponent
          )
      },
      {
        path: 'magazine/:magazineId/editor/:id',
        loadComponent: () =>
          import('./client/templates/template-editor/template-editor.component').then(
            m => m.TemplateEditorComponent
          )
      }
    ]
  }
];

