import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../services/compras.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '../../services/productos.service';
import { ToastService } from '../../services/toast.service';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { Compra, DetalleCompraItem, Proveedor, Producto } from '../../models/interfaces';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css']
})
export class ComprasComponent implements OnInit {
  compras: Compra[] = [];
  proveedores: Proveedor[] = [];
  productos: Producto[] = [];
  cargando = false;

  modalAbierto = false;
  modalDetalle: Compra | null = null;

  nuevaCompra = {
    proveedor_id: null as number | null,
    folio: '',
    notas: '',
    items: [] as DetalleCompraItem[],
    descontar_de_caja: false
  };

  itemNuevo: DetalleCompraItem = { nombre_producto: '', cantidad: 1, costo_unitario: 0, subtotal: 0, producto_id: undefined };
  busquedaProducto = '';
  productosFiltrados: Producto[] = [];

  nombreNegocio = localStorage.getItem('casac-nombre') || 'SC POS';
  hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  constructor(
    private svcCompras: ComprasService,
    private svcProveedores: ProveedoresService,
    private svcProductos: ProductosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargar();
    this.svcProveedores.listar().subscribe(data => this.proveedores = data);
    this.svcProductos.getProductos().subscribe(data => this.productos = data);
  }

  cargar() {
    this.cargando = true;
    this.svcCompras.listar().subscribe({
      next: (data) => { this.compras = data; this.cargando = false; },
      error: () => { this.toast.show('Error al cargar compras', 'error'); this.cargando = false; }
    });
  }

  get totalNuevaCompra(): number {
    return this.nuevaCompra.items.reduce((s, i) => s + i.subtotal, 0);
  }

  filtrarProductos() {
    const q = this.busquedaProducto.toLowerCase();
    this.productosFiltrados = q.length >= 2
      ? this.productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q)).slice(0, 8)
      : [];
  }

  seleccionarProducto(p: Producto) {
    this.itemNuevo.producto_id    = p.producto_id;
    this.itemNuevo.nombre_producto = p.nombre;
    this.busquedaProducto = p.nombre;
    this.productosFiltrados = [];
  }

  actualizarSubtotal() {
    this.itemNuevo.subtotal = this.itemNuevo.cantidad * this.itemNuevo.costo_unitario;
  }

  agregarItem() {
    if (!this.itemNuevo.nombre_producto.trim()) {
      this.toast.show('Escribe o selecciona un producto', 'error');
      return;
    }
    if (this.itemNuevo.cantidad <= 0) {
      this.toast.show('La cantidad debe ser mayor a 0', 'error');
      return;
    }
    if (this.itemNuevo.costo_unitario <= 0) {
      this.toast.show('El costo unitario debe ser mayor a 0', 'error');
      return;
    }
    this.nuevaCompra.items.push({ ...this.itemNuevo });
    this.itemNuevo = { nombre_producto: '', cantidad: 1, costo_unitario: 0, subtotal: 0, producto_id: undefined };
    this.busquedaProducto = '';
  }

  quitarItem(i: number) {
    this.nuevaCompra.items.splice(i, 1);
  }

  abrirNueva() {
    this.nuevaCompra = { proveedor_id: null, folio: '', notas: '', items: [], descontar_de_caja: false };
    this.itemNuevo   = { nombre_producto: '', cantidad: 1, costo_unitario: 0, subtotal: 0, producto_id: undefined };
    this.busquedaProducto = '';
    this.modalAbierto = true;
  }

  guardando = false;

  guardar() {
    if (this.guardando) return;
    if (this.nuevaCompra.items.length === 0) { this.toast.show('Agrega al menos un producto', 'error'); return; }
    this.guardando = true;
    this.svcCompras.crear(this.nuevaCompra).subscribe({
      next: () => {
        this.toast.show('Compra registrada y stock actualizado', 'ok');
        this.modalAbierto = false;
        this.guardando = false;
        this.cargar();
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'Error al registrar compra', 'error');
        this.guardando = false;
      }
    });
  }

  verDetalle(c: Compra) {
    this.modalDetalle = c;
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
