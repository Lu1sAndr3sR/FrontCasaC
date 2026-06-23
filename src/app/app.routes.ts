import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
import { superadminGuard } from './core/auth/superadmin.guard';

export const routes: Routes = [
  // Landing page (pública)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },

  // Términos y Condiciones / Aviso de Privacidad (público)
  {
    path: 'terminos',
    loadComponent: () => import('./pages/terminos/terminos.component').then(m => m.TerminosComponent)
  },

  // Auth (Rutas públicas)
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },

  // Dashboard (Protegida)
  { 
    path: 'dashboard', 
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },

  // Usuarios (Protegida)
  { 
    path: 'usuarios', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent) 
  },

  // Notificaciones (Protegida)
  { 
    path: 'notificaciones', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent) 
  },

  // Reportes (Protegida)
  { 
    path: 'reportes', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
  },

  // Caja (Protegida)
  { 
    path: 'caja', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/caja/caja.component').then(m => m.CajaComponent)
  },
  
  // Inventario (Protegida)
  { 
    path: 'inventario', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inventario/inventario.component').then(m => m.InventarioComponent) 
  },

  // Corte de Caja (Protegida)
  {
    path: 'cortecaja',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cortecaja/cortecaja.component').then(m => m.CortecajaComponent)
  },

  // Escáner móvil (Pública — accede desde el celular via QR)
  {
    path: 'escaner/:salaId',
    loadComponent: () => import('./pages/escaner/escaner.component').then(m => m.EscanerComponent)
  },

  // Mapa de sucursales (Solo admin)
  {
    path: 'sucursales',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/sucursales-map/sucursales-map.component').then(m => m.SucursalesMapComponent)
  },

  // Alta de sucursal (Solo admin)
  {
    path: 'sucursales/nueva',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/alta-sucursal/alta-sucursal.component').then(m => m.AltaSucursalComponent)
  },

  // Proveedores (Protegida)
  {
    path: 'proveedores',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/proveedores/proveedores.component').then(m => m.ProveedoresComponent)
  },

  // Compras / Entradas (Protegida)
  {
    path: 'compras',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/compras/compras.component').then(m => m.ComprasComponent)
  },

  // Devoluciones (Protegida)
  {
    path: 'devoluciones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/devoluciones/devoluciones.component').then(m => m.DevolucionesComponent)
  },

  // Cotizaciones (Protegida)
  {
    path: 'cotizaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cotizaciones/cotizaciones.component').then(m => m.CotizacionesComponent)
  },

  // Panel Superadmin (Solo superadmin)
  {
    path: 'superadmin',
    canActivate: [authGuard, superadminGuard],
    loadComponent: () => import('./pages/superadmin/superadmin.component').then(m => m.SuperadminComponent)
  }
];