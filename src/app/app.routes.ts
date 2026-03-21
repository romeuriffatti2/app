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
    }
];
