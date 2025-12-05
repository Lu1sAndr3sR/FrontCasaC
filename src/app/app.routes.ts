import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';

export const routes: Routes = [
  // Ruta por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Auth
  { path: 'login', component: LoginComponent },

  // Dashboard
  { path: 'dashboard', component: DashboardComponent },

  // Usuarios
  { path: 'usuarios', component: UsuariosComponent },

  // Notificaciones
  { path: 'notificaciones', component: NotificacionesComponent },

  // Reportes (standalone)
  { 
    path: 'reportes', 
    loadComponent: () =>
      import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
  },

  // Caja (standalone)
  { 
    path: 'caja', 
    loadComponent: () =>
      import('./pages/caja/caja.component').then(m => m.CajaComponent)
  },

  // Inventario (standalone)
  { 
    path: 'inventario', 
    loadComponent: () =>
      import('./pages/inventario/inventario.component').then(m => m.InventarioComponent)
  }
];
