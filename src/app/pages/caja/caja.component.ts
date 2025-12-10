import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';
import { VentasService } from '../../services/ventas.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {

  // ... (Tus variables iniciales se quedan igual) ...
  usuarioId: number = 0;
  fechaActual = '';
  horaActual = '';
  nombreCajero = '';
  busqueda: string = '';
  carrito: any[] = [];
  totalVenta: number = 0;
  tipoVentaSeleccionado: 'Tienda' | 'Pedido' = 'Tienda';
  numeroPedidoInput: string = '';
  listaProductos: any[] = [];

  // Agregamos bandera para bloquear botón
  pagando: boolean = false; 

  constructor(
    private router: Router,
    private productosService: ProductosService,
    private ventasService: VentasService
  ) {
    this.actualizarFecha();
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 1000);
  }

  ngOnInit() {
    this.nombreCajero = localStorage.getItem('nombreCajero') || 'Cajero';
    const idGuardado = localStorage.getItem('idUsuario');
    this.usuarioId = idGuardado ? Number(idGuardado) : 1;
    this.cargarCatalogo();
  }

  // ... (Tus métodos de carrito: cargarCatalogo, buscarProducto, agregarAlCarrito, etc. SE QUEDAN IGUAL) ...
  cargarCatalogo() {
    this.productosService.getProductos().subscribe({
      next: (data) => { this.listaProductos = data; },
      error: (err) => console.error("Error al cargar productos", err)
    });
  }

  buscarProducto() {
    if (!this.busqueda.trim()) return;
    const texto = this.busqueda.toLowerCase();
    const producto = this.listaProductos.find(p =>
      p.codigo_barras.toLowerCase() === texto || p.nombre.toLowerCase().includes(texto)
    );
    if (producto) {
      this.agregarAlCarrito(producto);
      this.busqueda = '';
    } else {
      alert("Producto no encontrado ❌");
    }
  }

  agregarAlCarrito(producto: any) {
    const existente = this.carrito.find(i => i.producto_id === producto.producto_id);
    if (existente) {
      existente.cantidad++;
      this.actualizarCantidadRef(existente);
    } else {
      this.carrito.push({
        producto_id: producto.producto_id,
        codigo: producto.codigo_barras,
        nombre: producto.nombre,
        cantidad: 1,
        precio_venta: producto.precio_menudeo,
        subtotal: producto.precio_menudeo
      });
    }
    this.calcularTotal();
  }

  actualizarCantidad(index: number) {
    this.actualizarCantidadRef(this.carrito[index]);
    this.calcularTotal();
  }

  actualizarCantidadRef(item: any) {
    if (item.cantidad < 1) item.cantidad = 1;
    item.subtotal = item.cantidad * item.precio_venta;
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.totalVenta = this.carrito.reduce((s, i) => s + i.subtotal, 0);
  }

  // === AQUÍ ESTÁ EL CAMBIO PRINCIPAL EN COBRAR ===
  cobrar() {
    if (this.carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (this.tipoVentaSeleccionado === 'Pedido' && !this.numeroPedidoInput.trim()) {
      alert("Por favor, ingresa un número de pedido");
      return;
    }

    // Evitar doble clic
    if (this.pagando) return;

    if (!confirm(`¿Cobrar un total de $${this.totalVenta}?`)) return;

    this.pagando = true; // Bloqueamos

    const venta = {
      usuario_id: this.usuarioId,
      total: this.totalVenta,
      tipo_venta: this.tipoVentaSeleccionado,
      pedido_numero: this.tipoVentaSeleccionado === 'Pedido' ? this.numeroPedidoInput.trim() : '',
      detalles: this.carrito.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_venta,
        subtotal: i.subtotal
      }))
    };

    this.ventasService.registrarVenta(venta).subscribe({
      next: () => {
        alert("¡Venta registrada con éxito! 💸");
        
        this.cancelar();
        this.cargarCatalogo(); // Recarga lista local
        
        // 🚀 DISPARADOR: Revisar si el stock bajó a niveles críticos
        this.productosService.verificarStockBajo(); 

        this.pagando = false; // Desbloqueamos
      },
      error: (err) => {
        console.error(err);
        alert("Error al cobrar: " + (err.error?.error || "Error desconocido"));
        this.pagando = false;
      }
    });
  }

  cancelar() {
    this.carrito = [];
    this.totalVenta = 0;
    this.busqueda = '';
    this.numeroPedidoInput = '';
    this.tipoVentaSeleccionado = 'Tienda';
  }

  actualizarFecha() {
    const h = new Date();
    this.fechaActual = `${h.getDate().toString().padStart(2, '0')}/${(h.getMonth() + 1).toString().padStart(2, '0')}/${h.getFullYear()}`;
  }

  actualizarHora() {
    const h = new Date();
    let horas = h.getHours();
    const minutos = h.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
    this.horaActual = `${horas}:${minutos} ${ampm}`;
  }
}