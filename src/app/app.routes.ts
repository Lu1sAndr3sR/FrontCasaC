import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  { path: 'dashboard', component: DashboardComponent },

  { path: 'usuarios', component: UsuariosComponent},

  {path:'notificaciones', component: NotificacionesComponent },

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
