import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { DevolucionesService, VentaParaDevolucion, DevolucionResumen } from '../../services/devoluciones.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { RelojService } from '../../services/reloj.service';

interface ItemDevolucion {
  producto_id: number;
  nombre_producto: string;
  precio_unitario: number;
  cantidadOriginal: number;
  cantidadADevolver: number;
  seleccionado: boolean;
}


@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './devoluciones.component.html',
  styleUrls: ['./devoluciones.component.css']
})
export class DevolucionesComponent implements OnInit, OnDestroy {
  tab: 'nueva' | 'historial' = 'nueva';
  horaActual = '';
  private relojInterval: ReturnType<typeof setInterval> | undefined;

  // Búsqueda de venta
  folioBuscar = '';
  buscando = false;
  ventaEncontrada: VentaParaDevolucion | null = null;
  errorBusqueda = '';
  items: ItemDevolucion[] = [];
  motivo = '';
  guardando = false;

  // Historial
  historial: DevolucionResumen[] = [];
  cargandoHistorial = false;
  paginaActual = 1;
  totalPaginas = 1;
  readonly pageSize = 20;

  constructor(
    private router: Router,
    private devolucionesService: DevolucionesService,
    public  sucursalActivaService: SucursalActivaService,
    public  negocioService: NegocioService,
    private toastService: ToastService,
    private relojService: RelojService
  ) {}

  ngOnInit(): void {
    this.horaActual = this.relojService.obtenerHoraActual(true);
    this.relojInterval = setInterval(() => {
      this.horaActual = this.relojService.obtenerHoraActual(true);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  cambiarTab(t: 'nueva' | 'historial') {
    this.tab = t;
    if (t === 'historial') { this.paginaActual = 1; this.cargarHistorial(); }
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
    this.cargarHistorial();
  }

  buscarVenta() {
    if (!this.folioBuscar.trim()) return;
    this.buscando = true;
    this.ventaEncontrada = null;
    this.errorBusqueda = '';
    this.items = [];

    this.devolucionesService.buscarVenta(this.folioBuscar).subscribe({
      next: (venta) => {
        this.ventaEncontrada = venta;
        this.items = (venta.detalles ?? []).map(d => ({
          producto_id:       d.producto_id,
          nombre_producto:   d.nombre_producto,
          precio_unitario:   Number(d.precio_unitario),
          cantidadOriginal:  d.cantidad,
          cantidadADevolver: d.cantidad,
          seleccionado:      false
        }));
        this.buscando = false;
      },
      error: (err) => {
        this.errorBusqueda = err.error?.error ?? 'Venta no encontrada';
        this.buscando = false;
      }
    });
  }

  // Ratio para aplicar el mismo IVA y descuento que tuvo la venta original
  private get ratioVenta(): number {
    if (!this.ventaEncontrada?.total) return 1;
    const baseTotal = this.items.reduce((s, i) => s + i.precio_unitario * i.cantidadOriginal, 0);
    return baseTotal > 0 ? this.ventaEncontrada.total / baseTotal : 1;
  }

  get totalADevolver(): number {
    const base = this.items
      .filter(i => i.seleccionado && i.cantidadADevolver > 0)
      .reduce((s, i) => s + i.precio_unitario * i.cantidadADevolver, 0);
    return base * this.ratioVenta;
  }

  get hayItemsSeleccionados(): boolean {
    return this.items.some(i => i.seleccionado && i.cantidadADevolver > 0);
  }

  registrarDevolucion() {
    if (!this.hayItemsSeleccionados) {
      this.toastService.show('Selecciona al menos un producto a devolver', 'error');
      return;
    }

    const ratio = this.ratioVenta;
    const detalles = this.items
      .filter(i => i.seleccionado && i.cantidadADevolver > 0)
      .map(i => ({
        producto_id:     i.producto_id,
        nombre_producto: i.nombre_producto,
        cantidad:        i.cantidadADevolver,
        precio_unitario: i.precio_unitario,
        subtotal:        parseFloat((i.precio_unitario * i.cantidadADevolver * ratio).toFixed(2))
      }));

    const usuarioId = Number(localStorage.getItem('idUsuario') ?? '1');
    const sucursalId = this.sucursalActivaService.sucursalId;
    const cajaKey = `cajaAbiertaId-${sucursalId}`;
    const cajaId = Number(localStorage.getItem(cajaKey) ?? '0') || undefined;

    this.guardando = true;
    this.devolucionesService.crear({
      venta_id:    this.ventaEncontrada?.venta_id ?? null,
      folio_venta: this.folioBuscar.trim(),
      motivo:      this.motivo.trim(),
      usuario_id:  usuarioId,
      sucursal_id: sucursalId,
      caja_id:     cajaId,
      detalles
    }).subscribe({
      next: () => {
        this.toastService.show('Devolución registrada correctamente', 'ok');
        this.limpiarFormulario();
        this.guardando = false;
      },
      error: (err) => {
        this.toastService.show(err.error?.error ?? 'Error al registrar la devolución', 'error');
        this.guardando = false;
      }
    });
  }

  limpiarFormulario() {
    this.folioBuscar = '';
    this.ventaEncontrada = null;
    this.errorBusqueda = '';
    this.items = [];
    this.motivo = '';
  }

  cargarHistorial() {
    this.cargandoHistorial = true;
    this.devolucionesService.listar(this.sucursalActivaService.sucursalId, this.paginaActual, this.pageSize).subscribe({
      next: (resp) => {
        this.historial = resp.data;
        this.totalPaginas = resp.totalPaginas;
        this.cargandoHistorial = false;
      },
      error: () => { this.cargandoHistorial = false; }
    });
  }

  volver() { this.router.navigate(['/dashboard']); }
}
