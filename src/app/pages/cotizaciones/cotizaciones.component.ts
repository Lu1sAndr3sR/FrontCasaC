import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { CotizacionesService } from '../../services/cotizaciones.service';
import { ProductosService } from '../../services/productos.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { Cotizacion, DetalleCotizacion, Producto } from '../../models/interfaces';

interface ItemCarrito extends DetalleCotizacion {
  editandoPrecio?: boolean;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css']
})
export class CotizacionesComponent implements OnInit {

  tab: 'nueva' | 'historial' = 'nueva';

  // Nueva cotización
  busqueda = '';
  sugerencias: Producto[] = [];
  buscando = false;
  carrito: ItemCarrito[] = [];

  clienteNombre = '';
  clienteTelefono = '';
  clienteEmail = '';
  vigenciaDias = 7;
  notas = '';
  guardando = false;

  // Cotización guardada para imprimir
  cotizacionGuardada: Cotizacion | null = null;
  folioGuardado = '';

  // Historial
  historial: Cotizacion[] = [];
  cargandoHistorial = false;
  cotizacionDetalle: Cotizacion | null = null;

  nombreNegocio = localStorage.getItem('casac-nombre') || 'CasaC';
  nombreCajero = localStorage.getItem('nombreCajero') || '';

  readonly ESTADOS: Record<string, string> = {
    BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', VENCIDA: 'Vencida'
  };

  constructor(
    private router: Router,
    private cotizacionesSvc: CotizacionesService,
    private productosSvc: ProductosService,
    public sucursalSvc: SucursalActivaService,
    public negocioSvc: NegocioService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargarHistorial();
  }

  cambiarTab(t: 'nueva' | 'historial') {
    this.tab = t;
    if (t === 'historial') this.cargarHistorial();
  }

  cargarHistorial() {
    this.cargandoHistorial = true;
    this.cotizacionesSvc.listar().subscribe({
      next: (data) => { this.historial = data; this.cargandoHistorial = false; },
      error: () => { this.toast.show('Error al cargar historial', 'error'); this.cargandoHistorial = false; }
    });
  }

  buscarProducto() {
    const q = this.busqueda.trim();
    if (q.length < 2) { this.sugerencias = []; return; }
    this.buscando = true;
    this.productosSvc.buscarProducto(q, this.sucursalSvc.sucursalId).subscribe({
      next: (lista) => { this.sugerencias = lista || []; this.buscando = false; },
      error: () => { this.sugerencias = []; this.buscando = false; }
    });
  }

  agregarProducto(p: Producto) {
    this.busqueda = '';
    this.sugerencias = [];
    const existe = this.carrito.find(i => i.producto_id === p.producto_id);
    if (existe) {
      existe.cantidad++;
      existe.subtotal = existe.cantidad * existe.precio_unitario * (1 - existe.descuento_pct / 100);
      return;
    }
    this.carrito.push({
      producto_id: p.producto_id,
      nombre_producto: p.nombre,
      cantidad: 1,
      precio_unitario: p.precio_menudeo,
      descuento_pct: 0,
      subtotal: p.precio_menudeo
    });
  }

  recalcular(item: ItemCarrito) {
    item.subtotal = item.cantidad * item.precio_unitario * (1 - item.descuento_pct / 100);
  }

  eliminarItem(idx: number) {
    this.carrito.splice(idx, 1);
  }

  get total(): number {
    return this.carrito.reduce((acc, i) => acc + i.subtotal, 0);
  }

  guardar() {
    if (this.carrito.length === 0) { this.toast.show('Agrega al menos un producto', 'error'); return; }
    this.guardando = true;
    const payload = {
      cliente_nombre: this.clienteNombre || undefined,
      cliente_telefono: this.clienteTelefono || undefined,
      cliente_email: this.clienteEmail || undefined,
      vigencia_dias: this.vigenciaDias,
      notas: this.notas || undefined,
      items: this.carrito.map(i => ({
        producto_id: i.producto_id,
        nombre_producto: i.nombre_producto,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        descuento_pct: i.descuento_pct,
        subtotal: i.subtotal
      }))
    };
    this.cotizacionesSvc.crear(payload).subscribe({
      next: (resp) => {
        this.guardando = false;
        this.folioGuardado = resp.folio;
        this.cotizacionGuardada = {
          folio: resp.folio,
          cotizacion_id: resp.cotizacion_id,
          cliente_nombre: this.clienteNombre,
          cliente_telefono: this.clienteTelefono,
          vigencia_dias: this.vigenciaDias,
          notas: this.notas,
          total: this.total,
          detalles: [...this.carrito],
          fecha: new Date().toISOString()
        };
        this.toast.show(`Cotización ${resp.folio} guardada`, 'ok');
      },
      error: (err) => { this.guardando = false; this.toast.show(err?.error?.error || 'Error al guardar', 'error'); }
    });
  }

  imprimir() {
    window.print();
  }

  nuevaCotizacion() {
    this.carrito = [];
    this.clienteNombre = '';
    this.clienteTelefono = '';
    this.clienteEmail = '';
    this.vigenciaDias = 7;
    this.notas = '';
    this.cotizacionGuardada = null;
    this.folioGuardado = '';
  }

  verDetalle(c: Cotizacion) {
    this.cotizacionesSvc.detalle(c.cotizacion_id!).subscribe({
      next: (d) => { this.cotizacionDetalle = d; },
      error: () => this.toast.show('Error al cargar detalle', 'error')
    });
  }

  cambiarEstado(c: Cotizacion, estado: string) {
    this.cotizacionesSvc.actualizarEstado(c.cotizacion_id!, estado).subscribe({
      next: () => { c.estado = estado as Cotizacion['estado']; this.toast.show('Estado actualizado', 'ok'); },
      error: () => this.toast.show('Error al actualizar estado', 'error')
    });
  }

  colorEstado(estado?: string): string {
    const map: Record<string, string> = { ACEPTADA: '#4cd96f', ENVIADA: '#4cc9f0', VENCIDA: '#ff5f5f', BORRADOR: '#aaa' };
    return map[estado || 'BORRADOR'] || '#aaa';
  }

  goDashboard() { this.router.navigate(['/dashboard']); }
}
