import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';
import { VentasService } from '../../services/ventas.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { RouterLink } from '@angular/router';
import { RelojService } from '../../services/reloj.service';
import { ScannerSocketService } from '../../services/scanner-socket.service';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { SatService } from '../../services/sat.service';
import { ClientesFiscalesService } from '../../services/clientes-fiscales.service';
import { AiService } from '../../services/ai.service';
import {
  Producto, CarritoItem, VentaPayload, TicketVenta,
  DatosCfdi, CatSatItem, CatSatUsoCfdi, CatSatRegimenFiscal
} from '../../models/interfaces';
import { Subscription } from 'rxjs';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QRCodeComponent, TopbarPerfilComponent],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit, OnDestroy {

  usuarioId: number = 0;
  fechaActual = '';
  horaActual = '';
  nombreCajero = '';
  busqueda: string = '';
  resultadosBusqueda: Producto[] = [];

  carrito: CarritoItem[] = [];
  listaProductos: Producto[] = [];

  totalVenta: number = 0;
  subtotalSinIva: number = 0;
  montoIva: number = 0;

  pagando: boolean = false;
  folioActual: string = '';
  tipoVenta: 'Tienda' | 'Pedido' = 'Tienda';

  mostrarQR: boolean = false;
  salaId: string = '';
  urlEscaner: string = '';

  ticketVenta: TicketVenta | null = null;

  // Cobro modal
  modalCobro = false;
  formaPago = '01';
  formasPago: CatSatItem[] = [];

  descuentoPorcentaje = 0;

  get totalConDescuento(): number {
    const desc = Math.min(Math.max(this.descuentoPorcentaje, 0), 100);
    return this.totalVenta * (1 - desc / 100);
  }

  clampDescuento(): void {
    if (this.descuentoPorcentaje > 100) this.descuentoPorcentaje = 100;
    if (this.descuentoPorcentaje < 0)   this.descuentoPorcentaje = 0;
  }

  // CFDI
  requiereFactura = false;
  buscandoCliente = false;
  datosCfdi: DatosCfdi = {
    receptor_rfc: '',
    receptor_nombre: '',
    receptor_cp: '',
    receptor_regimen: '',
    uso_cfdi: 'G03',
    guardar_cliente: false
  };
  usosCfdi: CatSatUsoCfdi[] = [];
  regimenesFiscales: CatSatRegimenFiscal[] = [];

  // Asistente IA
  mostrarAsistente = false;
  preguntaAsistente = '';
  respuestaAsistente = '';
  cargandoAsistente = false;

  private scannerSub: Subscription | undefined;
  private clienteSub: Subscription | undefined;
  private asistenteSub: Subscription | undefined;

  private generarFolio(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const parte = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `F-${parte}`;
  }
  
  private relojInterval: ReturnType<typeof setInterval> | undefined;

  constructor(
    private productosService: ProductosService,
    private ventasService: VentasService,
    private relojService: RelojService,
    private scannerSocket: ScannerSocketService,
    public negocioService: NegocioService,
    private toastService: ToastService,
    private satService: SatService,
    private clientesFiscalesService: ClientesFiscalesService,
    private sucursalActivaService: SucursalActivaService,
    public aiService: AiService
  ) {}

  ngOnInit() {
    this.actualizarTiempo();
    this.relojInterval = setInterval(() => this.actualizarTiempo(), 1000);
    this.nombreCajero = localStorage.getItem('nombreCajero') || 'Cajero';
    const idGuardado = localStorage.getItem('idUsuario');
    this.usuarioId = idGuardado ? Number(idGuardado) : 1;
    this.folioActual = this.generarFolio();
    this.cargarCatalogo();

    this.salaId = `caja-${this.usuarioId}`;
    this.urlEscaner = `${window.location.origin}/escaner/${this.salaId}`;
    this.scannerSocket.unirseACaja(this.salaId);

    this.scannerSub = this.scannerSocket.escucharCodigo().subscribe(codigo => {
      this.busqueda = codigo;
      this.buscarProducto();
    });

    this.satService.getFormasPago().subscribe(data => { this.formasPago = data; });
    this.satService.getUsosCfdi().subscribe(data => { this.usosCfdi = data; });
    this.satService.getRegimenesFiscales().subscribe(data => { this.regimenesFiscales = data; });
  }

  ngOnDestroy(): void {
    if (this.relojInterval) clearInterval(this.relojInterval);
    this.scannerSub?.unsubscribe();
    this.clienteSub?.unsubscribe();
    this.asistenteSub?.unsubscribe();
    this.scannerSocket.desconectar();
  }

  toggleAsistente(): void {
    this.mostrarAsistente = !this.mostrarAsistente;
    if (!this.mostrarAsistente) {
      this.respuestaAsistente = '';
      this.preguntaAsistente = '';
    }
  }

  enviarPreguntaAsistente(): void {
    const pregunta = this.preguntaAsistente.trim();
    if (!pregunta || this.cargandoAsistente) return;
    if (!this.aiService.tieneApiKey()) {
      this.toastService.show('Configura tu API key de IA en Usuarios > Configuración IA', 'info');
      return;
    }
    this.cargandoAsistente = true;
    this.respuestaAsistente = '';
    this.asistenteSub?.unsubscribe();
    this.asistenteSub = this.aiService.asistenteCaja(pregunta, this.listaProductos).subscribe({
      next: (resp) => {
        this.respuestaAsistente = resp;
        this.preguntaAsistente = '';
        this.cargandoAsistente = false;
      },
      error: (err) => {
        this.respuestaAsistente = '⚠️ ' + (err.message || 'Error al conectar con la IA');
        this.cargandoAsistente = false;
      }
    });
  }

  toggleQR(): void {
    this.mostrarQR = !this.mostrarQR;
  }

  actualizarTiempo() {
    this.fechaActual = this.relojService.obtenerFechaActual();
    this.horaActual = this.relojService.obtenerHoraActual();
  }

  cargarCatalogo() {
    const sucId = this.sucursalActivaService.sucursalId ?? undefined;
    this.productosService.getProductos(sucId).subscribe({
      next: (data: Producto[]) => { this.listaProductos = data; },
      error: () => this.toastService.show('Error al cargar el catálogo de productos', 'error')
    });
  }

  buscarProducto() {
    if (!this.busqueda.trim()) return;
    const texto = this.busqueda.trim().toLowerCase();
    this.resultadosBusqueda = [];

    // Coincidencia exacta por código de barras → agregar directo
    const porCodigo = this.listaProductos.find(p => p.codigo_barras?.toLowerCase() === texto);
    if (porCodigo) {
      this.agregarAlCarrito(porCodigo);
      this.busqueda = '';
      return;
    }

    // Coincidencias por nombre
    const porNombre = this.listaProductos.filter(p => p.nombre.toLowerCase().includes(texto));
    if (porNombre.length === 1) {
      this.agregarAlCarrito(porNombre[0]);
      this.busqueda = '';
      return;
    }
    if (porNombre.length > 1) {
      this.resultadosBusqueda = porNombre.slice(0, 10);
      return; // Mostrar dropdown, no limpiar busqueda
    }

    // Si parece código de barras, buscar en API
    const esCodigoBarras = /^\d+$/.test(texto);
    if (esCodigoBarras) {
      this.productosService.buscarProducto(texto, this.sucursalActivaService.sucursalId ?? undefined).subscribe({
        next: (resultados) => {
          if (resultados.length > 0) {
            this.agregarAlCarrito(resultados[0]);
            if (!this.listaProductos.find(p => p.producto_id === resultados[0].producto_id)) {
              this.listaProductos.push(resultados[0]);
            }
            this.busqueda = '';
          } else {
            this.toastService.show(`Código ${this.busqueda} no encontrado`, 'error');
            this.busqueda = '';
          }
        },
        error: (err) => {
          const msg = err?.status === 0 ? 'Error de conexión. Verifica la red.' : `Código ${this.busqueda} no encontrado`;
          this.toastService.show(msg, 'error');
          this.busqueda = '';
        }
      });
    } else {
      this.toastService.show('Producto no encontrado', 'error');
      this.busqueda = '';
    }
  }

  seleccionarProducto(producto: Producto) {
    this.resultadosBusqueda = [];
    this.busqueda = '';
    this.agregarAlCarrito(producto);
  }

  private precioActual(item: CarritoItem): number {
    if (item.minimo_mayoreo && item.minimo_mayoreo > 0 && item.cantidad >= item.minimo_mayoreo)
      return item.precio_mayoreo;
    return item.precio_menudeo;
  }

  agregarAlCarrito(producto: Producto) {
    if (producto.stock_actual <= 0) {
      this.toastService.show(`"${producto.nombre}" está agotado`, 'error');
      return;
    }

    // Aviso de stock bajo — no bloquea la venta
    const stockMinimo = (producto as any).stock_minimo;
    if (stockMinimo != null && producto.stock_actual <= stockMinimo) {
      this.toastService.show(`⚠ Stock bajo en "${producto.nombre}": quedan ${producto.stock_actual} unidad(es)`, 'info');
    }

    const existente = this.carrito.find(i => i.producto_id === producto.producto_id);
    if (existente) {
      if (existente.cantidad >= existente.stock_actual) {
        this.toastService.show(`Solo hay ${existente.stock_actual} unidad(es) disponible(s) de "${existente.nombre}"`, 'error');
        return;
      }
      existente.cantidad++;
      existente.precio_venta = this.precioActual(existente);
      existente.subtotal = existente.cantidad * existente.precio_venta;
    } else {
      const item: CarritoItem = {
        producto_id: producto.producto_id,
        codigo: producto.codigo_barras,
        nombre: producto.nombre,
        cantidad: 1,
        precio_menudeo: Number(producto.precio_menudeo),
        precio_mayoreo: Number(producto.precio_mayoreo),
        minimo_mayoreo: producto.minimo_mayoreo != null ? Number(producto.minimo_mayoreo) : null,
        precio_venta: Number(producto.precio_menudeo),
        subtotal: Number(producto.precio_menudeo),
        stock_actual: Number(producto.stock_actual)
      };
      item.precio_venta = this.precioActual(item);
      item.subtotal = item.precio_venta;
      this.carrito.push(item);
    }
    this.calcularTotal();
  }

  incrementarCantidad(index: number) {
    const item = this.carrito[index];
    if (item.cantidad >= item.stock_actual) {
      this.toastService.show(`Solo hay ${item.stock_actual} unidad(es) de "${item.nombre}"`, 'error');
      return;
    }
    item.cantidad++;
    item.precio_venta = this.precioActual(item);
    item.subtotal = item.cantidad * item.precio_venta;
    this.calcularTotal();
  }

  decrementarCantidad(index: number) {
    const item = this.carrito[index];
    if (item.cantidad <= 1) return;
    item.cantidad--;
    item.precio_venta = this.precioActual(item);
    item.subtotal = item.cantidad * item.precio_venta;
    this.calcularTotal();
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.subtotalSinIva = this.carrito.reduce((s, i) => s + Number(i.subtotal), 0);
    if (this.negocioService.ivaActivo) {
      this.montoIva  = this.subtotalSinIva * this.negocioService.ivaPorcentaje / 100;
      this.totalVenta = this.subtotalSinIva + this.montoIva;
    } else {
      this.montoIva  = 0;
      this.totalVenta = this.subtotalSinIva;
    }
  }

  abrirModalCobro(): void {
    if (this.carrito.length === 0) {
      this.toastService.show('El carrito está vacío', 'error');
      return;
    }
    if (this.pagando) return;
    this.formaPago = '01';
    this.descuentoPorcentaje = 0;
    this.requiereFactura = false;
    this.datosCfdi = { receptor_rfc: '', receptor_nombre: '', receptor_cp: '', receptor_regimen: '', uso_cfdi: 'G03', guardar_cliente: false };
    this.modalCobro = true;
  }

  cerrarModalCobro(): void {
    this.modalCobro = false;
  }

  buscarCliente(): void {
    const rfc = this.datosCfdi.receptor_rfc.trim().toUpperCase();
    if (!rfc) return;
    this.datosCfdi.receptor_rfc = rfc;
    this.buscandoCliente = true;
    this.clienteSub?.unsubscribe();
    this.clienteSub = this.clientesFiscalesService.buscarPorRfc(rfc).subscribe({
      next: (cliente) => {
        if (cliente) {
          this.datosCfdi.receptor_nombre = cliente.nombre_fiscal;
          this.datosCfdi.receptor_cp = cliente.cp_fiscal;
          this.datosCfdi.receptor_regimen = cliente.regimen_fiscal;
          this.datosCfdi.uso_cfdi = cliente.uso_cfdi_default;
          this.toastService.show('Cliente encontrado y datos pre-cargados', 'ok');
        } else {
          this.toastService.show('RFC no registrado — llena los datos manualmente', 'info');
        }
        this.buscandoCliente = false;
      },
      error: () => {
        this.toastService.show('RFC no encontrado — llena los datos manualmente', 'info');
        this.buscandoCliente = false;
      }
    });
  }

  confirmarCobro(): void {
    if (this.pagando) return;

    if (this.requiereFactura) {
      const d = this.datosCfdi;
      if (!d.receptor_rfc || !d.receptor_nombre || !d.receptor_cp || !d.receptor_regimen || !d.uso_cfdi) {
        this.toastService.show('Completa todos los datos fiscales', 'error');
        return;
      }
      if (d.receptor_cp.length !== 5) {
        this.toastService.show('El CP fiscal debe tener 5 dígitos', 'error');
        return;
      }
    }

    this.pagando = true;
    this.modalCobro = false;

    const snapshotFolio = this.folioActual;
    const snapshotCarrito = [...this.carrito];
    const snapshotTipo = this.tipoVenta;
    const totalFinal = this.totalConDescuento;

    const venta: VentaPayload = {
      folio: snapshotFolio,
      usuario_id: this.usuarioId,
      sucursal_id: this.sucursalActivaService.sucursalId,
      total: totalFinal,
      tipo_venta: snapshotTipo,
      pedido_numero: snapshotTipo === 'Pedido' ? snapshotFolio : undefined,
      forma_pago: this.formaPago,
      descuento_porcentaje: this.descuentoPorcentaje,
      tipo_pago: 'efectivo',
      ...(this.requiereFactura ? { datos_cfdi: { ...this.datosCfdi } } : {}),
      detalles: snapshotCarrito.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_venta,
        subtotal: i.subtotal
      }))
    };

    this.ventasService.registrarVenta(venta).subscribe({
      next: () => {
        this.ticketVenta = {
          folio: snapshotFolio,
          fecha: this.fechaActual,
          hora: this.horaActual,
          cajero: this.nombreCajero,
          tipoVenta: snapshotTipo,
          items: snapshotCarrito,
          subtotalSinIva: this.subtotalSinIva,
          montoIva: this.montoIva,
          total: this.totalVenta,
          ivaActivo: this.negocioService.ivaActivo,
          ivaPorcentaje: this.negocioService.ivaPorcentaje,
          logoUrl: this.negocioService.logoActivo,
          nombreNegocio: this.negocioService.nombreNegocio
        };
        this.folioActual = this.generarFolio();
        this.carrito = [];
        this.totalVenta = 0;
        this.subtotalSinIva = 0;
        this.montoIva = 0;
        this.busqueda = '';
        this.tipoVenta = 'Tienda';
        this.formaPago = '01';
        this.requiereFactura = false;
        this.cargarCatalogo();
        this.productosService.verificarStockBajo();
        this.pagando = false;
      },
      error: (err) => {
        this.toastService.show('Error al cobrar: ' + (err.error?.error || 'Error desconocido'), 'error');
        this.pagando = false;
      }
    });
  }

  imprimirTicket(): void {
    document.body.classList.add('print-ticket');
    window.print();
    document.body.classList.remove('print-ticket');
  }

  cerrarTicket(): void {
    this.ticketVenta = null;
  }

  cancelar() {
    this.carrito = [];
    this.totalVenta = 0;
    this.busqueda = '';
    this.tipoVenta = 'Tienda';
  }
}