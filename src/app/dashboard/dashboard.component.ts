import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TopbarPerfilComponent } from '../components/topbar-perfil/topbar-perfil.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CajaService } from '../services/caja.service';
import { RelojService } from '../services/reloj.service';
import { NegocioService } from '../services/negocio.service';
import { ToastService } from '../services/toast.service';
import { ConfirmService } from '../services/confirm.service';
import { SucursalActivaService } from '../services/sucursal-activa.service';
import { SelectorSucursalComponent } from '../components/selector-sucursal/selector-sucursal.component';
import { ReportesService } from '../services/reportes.service';
import { ProductosService } from '../services/productos.service';
import { DevolucionesService } from '../services/devoluciones.service';
import { OnboardingService, OnboardingStatus } from '../services/onboarding.service';
import { RespuestaCaja, RespuestaAbrirCaja } from '../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectorSucursalComponent, TopbarPerfilComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  cajaAbierta = false;
  montoApertura: number | null = null;
  usuarioId = 1;

  showUserMenu   = false;
  showSucursal   = false;
  usuarioNombre  = 'Invitado';
  fechaActual    = '';
  horaActual     = '';
  esAdmin        = false;

  kpiVentasHoy       = 0;
  kpiStockBajo       = 0;
  kpiDevolucionesHoy = 0;
  kpiCargando        = false;

  onboarding: OnboardingStatus | null = null;
  esSuperAdmin = false;

  private relojInterval: ReturnType<typeof setInterval> | undefined;
  private sucursalSub: Subscription | undefined;

  constructor(
    private router: Router,
    private cajaService: CajaService,
    private relojService: RelojService,
    public  negocioService: NegocioService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    public  sucursalActivaService: SucursalActivaService,
    private reportesService: ReportesService,
    private productosService: ProductosService,
    private devolucionesService: DevolucionesService,
    private onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {
    this.actualizarTiempo();
    this.relojInterval = setInterval(() => this.actualizarTiempo(), 1000);

    const nombre = localStorage.getItem('nombreCajero');
    if (nombre) this.usuarioNombre = nombre;

    const id = localStorage.getItem('idUsuario');
    if (id) this.usuarioId = Number(id);

    this.esAdmin = localStorage.getItem('esAdmin') === 'true';
    this.esSuperAdmin = localStorage.getItem('esSuperAdmin') === 'true';

    this.verificarEstadoCaja();
    this.cargarKpis();
    if (!this.esSuperAdmin) this.cargarOnboarding();

    // Re-verifica la caja cuando el admin cambia de sucursal
    this.sucursalSub = this.sucursalActivaService.sucursal$.subscribe(() => {
      this.verificarEstadoCaja();
      this.cargarKpis();
    });
  }

  ngOnDestroy(): void {
    if (this.relojInterval) clearInterval(this.relojInterval);
    this.sucursalSub?.unsubscribe();
  }

  actualizarTiempo() {
    this.fechaActual = this.relojService.obtenerFechaActual();
    this.horaActual  = this.relojService.obtenerHoraActual(true);
  }

  get cajaKey(): string {
    return `cajaAbiertaId-${this.sucursalActivaService.sucursalId}`;
  }

  verificarEstadoCaja() {
    const sucursalId = this.sucursalActivaService.sucursalId;
    this.cajaService.verificarEstado(this.usuarioId, sucursalId).subscribe({
      next: (resp: RespuestaCaja) => {
        this.cajaAbierta = resp.abierta;
        if (resp.abierta && resp.datos) {
          localStorage.setItem(this.cajaKey, String(resp.datos.caja_id));
        } else {
          localStorage.removeItem(this.cajaKey);
        }
      },
      error: () => {
        this.toastService.show('No se pudo verificar el estado de la caja', 'error');
        this.cajaAbierta = false;
      }
    });
  }

  confirmarApertura() {
    if (this.montoApertura === null || this.montoApertura < 0) {
      this.toastService.show('Por favor ingresa un monto válido.', 'error'); return;
    }
    const sucursalId = this.sucursalActivaService.sucursalId;
    this.cajaService.abrirCaja({ usuario_id: this.usuarioId, monto: this.montoApertura, sucursal_id: sucursalId }).subscribe({
      next: (resp: RespuestaAbrirCaja) => {
        this.cajaAbierta = true;
        localStorage.setItem(this.cajaKey, String(resp.caja.caja_id));
        this.toastService.show('Turno iniciado correctamente', 'ok');
      },
      error: (err) => {
        this.toastService.show('Error: ' + (err.error?.error || 'No se pudo abrir la caja'), 'error');
      }
    });
  }

  cargarKpis() {
    this.kpiCargando = true;
    const hoy = new Date().toISOString().split('T')[0];
    const sucId = this.sucursalActivaService.sucursalId;

    forkJoin({
      ventas:       this.reportesService.getVentas({ fechaInicio: hoy, fechaFin: hoy }).pipe(catchError(() => of(null))),
      productos:    this.productosService.getProductos(sucId).pipe(catchError(() => of([]))),
      devoluciones: this.devolucionesService.getHoy(sucId).pipe(catchError(() => of({ total: 0, count: 0 })))
    }).subscribe(({ ventas, productos, devoluciones }) => {
      this.kpiVentasHoy       = ventas?.resumen?.totalDinero ?? 0;
      this.kpiStockBajo       = (productos as { stock_actual: number; stock_minimo: number | null }[])
        .filter(p => p.stock_actual <= (p.stock_minimo ?? 5)).length;
      this.kpiDevolucionesHoy = (devoluciones as { total: number; count: number }).count;
      this.kpiCargando = false;
    });
  }

  cargarOnboarding() {
    this.onboardingService.getStatus().subscribe({
      next: (s) => { this.onboarding = s.completado ? null : s; },
      error: () => {}
    });
  }

  goCaja() {
    if (!this.sucursalActivaService.sucursalActiva) {
      this.showSucursal = true;
      this.toastService.show('Primero selecciona una sucursal', 'error');
      return;
    }
    this.router.navigate(['/caja']);
  }

  goInventario()     { this.router.navigate(['/inventario']); }
  goNotificaciones() { this.router.navigate(['/notificaciones']); }
  goCorteCaja()      { this.router.navigate(['/cortecaja']); }
  goReporte()        { this.router.navigate(['/reportes']); }
  goUsuarios()       { this.router.navigate(['/usuarios']); }
  goSucursales()     { this.router.navigate(['/sucursales']); }
  goProveedores()    { this.router.navigate(['/proveedores']); }
  goCompras()        { this.router.navigate(['/compras']); }
  goDevoluciones()   { this.router.navigate(['/devoluciones']); }
  goCotizaciones()   { this.router.navigate(['/cotizaciones']); }
  toggleUserMenu()   { this.showUserMenu = !this.showUserMenu; this.showSucursal = false; }
  abrirSelectorSucursal() { this.showSucursal = true; this.showUserMenu = false; }
  cerrarSelectorSucursal() { this.showSucursal = false; }

  async cerrarSesion() {
    const ok = await this.confirmService.abrir('¿Cerrar sesión?');
    if (ok) { localStorage.clear(); this.router.navigate(['/login']); }
  }
}
