import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  { path: 'dashboard', component: DashboardComponent },

  {
    path: 'caja',
    loadComponent: () =>
      import('./pages/caja/caja.component').then(m => m.CajaComponent)
  },
  { 
  path: 'inventario', 
  loadComponent: () => import('./pages/inventario/inventario.component')
    .then(m => m.InventarioComponent) 
}

];
