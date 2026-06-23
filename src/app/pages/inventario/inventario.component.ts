import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { RelojService } from '../../services/reloj.service';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { SatService } from '../../services/sat.service';
import { CatalogoService } from '../../services/catalogo.service';
import { Producto, MovimientoInventario, RespuestaEliminar, CatSatProductoServicio, CatalogoItem, CatalogoMaestroItem } from '../../models/interfaces';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopbarPerfilComponent],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit, OnDestroy {
  
  fechaActual = '';
  horaActual = '';
  nombreCajero = 'Invitado';
  
  selectedFilter: 'todos' | 'bajo' | 'categoria' = 'todos';
  modalCategorias = false;
  modalAgregar    = false;
  modalEditar     = false;

  cargando        = false;
  paginaActual    = 1;
  totalProductos  = 0;
  totalPaginas    = 1;
  readonly LIMITE = 50;
  
  modalStock = false;
  productoStock: Producto | null = null;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'PERDIDA' = 'ENTRADA';
  cantidadMov: number | null = null;
  motivoMov: string = '';
  razonMov: string = '';

  productoEditando: Partial<Producto> = {}; 
  
  categorias: string[] = []; 
  inventario: Producto[] = []; 
  filtered: Producto[] = []; 
  
  textoBuscador: string = '';

  resultadosClaveSat: CatSatProductoServicio[] = [];
  satSearchNuevo = '';
  satSearchEditar = '';
  private satSearchTimeout: ReturnType<typeof setTimeout> | undefined;

  catalogoSugerencias: CatalogoItem[] = [];
  mostrarCatalogoSugerencias = false;
  private catTimeout: ReturnType<typeof setTimeout> | undefined;

  readonly categoriasOpciones = [
    'Herramientas Manuales',
    'Herramientas Eléctricas',
    'Plomería',
    'Electricidad e Iluminación',
    'Construcción y Materiales',
    'Pintura y Acabados',
    'Fijación (Tornillos, Clavos, Tuercas)',
    'Adhesivos y Selladores',
    'Seguridad Industrial',
    'Jardinería',
    'Limpieza',
    'Medición y Trazo',
    'Ventilación y Climatización',
    'Varios',
  ];

  readonly sugerenciasObservacion: Record<string, string[]> = {
    ENTRADA: [
      'Compra a proveedor',
      'Devolución de cliente',
      'Ajuste de inventario',
      'Reposición de emergencia',
      'Inventario inicial',
    ],
    SALIDA: [
      'Ajuste manual',
      'Muestra a cliente',
      'Uso interno',
      'Traspaso a sucursal',
    ],
    PERDIDA: [
      'Conteo físico — faltante',
      'Producto dañado en almacén',
      'Caducado / deteriorado',
      'Merma por manejo',
      'Robo detectado en conteo',
    ],
  };

  readonly unidadesSat = [
    { clave: 'H87', nombre: 'Pieza' },
    { clave: 'KGM', nombre: 'Kilogramo' },
    { clave: 'GRM', nombre: 'Gramo' },
    { clave: 'LTR', nombre: 'Litro' },
    { clave: 'MTR', nombre: 'Metro' },
    { clave: 'MTK', nombre: 'Metro cuadrado' },
    { clave: 'MTQ', nombre: 'Metro cúbico' },
    { clave: 'E48', nombre: 'Unidad de servicio' },
    { clave: 'XBX', nombre: 'Caja' },
    { clave: 'XPK', nombre: 'Paquete' },
    { clave: 'PR',  nombre: 'Par' },
    { clave: 'KT',  nombre: 'Kit' },
    { clave: 'SET', nombre: 'Conjunto' },
    { clave: 'E51', nombre: 'Trabajo' },
    { clave: 'KGS', nombre: 'Kilogramo neto' },
  ];

  nuevo = {
    nombre: '',
    barras: '',
    descripcion: '',
    categoria: '',
    precioMenudeo: 0,
    precioMayoreo: 0,
    precioOferta: 0,
    minimoMayoreo: 0,
    stockMinimo: 5,
    claveSat: '01010101',
    claveUnidadSat: 'H87',
    objetoImp: '02',
    _mayoreoAuto: false,
  };

  readonly categoriaSatMap: Record<string, string> = {
    'Herramientas Manuales':                  '27111900',
    'Herramientas Eléctricas':               '27111500',
    'Plomería':                               '30181500',
    'Electricidad e Iluminación':            '39121400',
    'Construcción y Materiales':             '30111500',
    'Pintura y Acabados':                    '31201500',
    'Fijación (Tornillos, Clavos, Tuercas)': '31161500',
    'Adhesivos y Selladores':                '31201700',
    'Seguridad Industrial':                  '46181500',
    'Jardinería':                            '10191500',
    'Limpieza':                              '47131500',
    'Medición y Trazo':                      '41111900',
    'Ventilación y Climatización':           '40161600',
    'Varios':                                '01010101',
  };

  importando = false;

  // Drawer catálogo base
  drawerCatalogo    = false;
  catItems:          CatalogoMaestroItem[] = [];
  catTotal          = 0;
  catPages          = 1;
  catPage           = 1;
  catQ              = '';
  catCategoria      = '';
  catCategorias:    string[] = [];
  catCargando       = false;
  catAdoptando      = false;
  seleccionados     = new Set<number>();
  private catBusqTimeout: ReturnType<typeof setTimeout> | undefined;

  private relojInterval: ReturnType<typeof setInterval> | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productosService: ProductosService,
    public sucursalActivaService: SucursalActivaService,
    private relojService: RelojService,
    public negocioService: NegocioService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private satService: SatService,
    private catalogoService: CatalogoService
  ) {}

  ngOnInit(): void {
    this.actualizarTiempo(); 
    this.relojInterval = setInterval(() => this.actualizarTiempo(), 1000); 
    
    const cajeroGuardado = localStorage.getItem('nombreCajero');
    if(cajeroGuardado) this.nombreCajero = cajeroGuardado;

    this.cargarProductos();
  }

  ngOnDestroy(): void {
    if (this.relojInterval) clearInterval(this.relojInterval);
    if (this.satSearchTimeout) clearTimeout(this.satSearchTimeout);
    if (this.catTimeout) clearTimeout(this.catTimeout);
    if (this.catBusqTimeout) clearTimeout(this.catBusqTimeout);
  }

  onArchivoExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    input.value = '';

    this.importando = true;
    this.productosService.importarExcel(archivo).subscribe({
      next: (r) => {
        this.importando = false;
        this.toastService.show(
          `Importados: ${r.importados} · Ya existían: ${r.omitidos}` +
          (r.errores?.length ? ` · Errores: ${r.errores.length}` : ''),
          'ok'
        );
        this.cargarProductos();
      },
      error: (err) => {
        this.importando = false;
        this.toastService.show(err?.error?.error || 'Error al importar el archivo', 'error');
      }
    });
  }

  buscarEnCatalogo(texto: string): void {
    clearTimeout(this.catTimeout);
    if (texto.length < 2) { this.catalogoSugerencias = []; return; }
    this.catTimeout = setTimeout(() => {
      this.catalogoService.buscar(texto).subscribe({
        next: (items) => {
          this.catalogoSugerencias = items;
          this.mostrarCatalogoSugerencias = items.length > 0;
        },
        error: () => {}
      });
    }, 300);
  }

  // ── Drawer catálogo base ─────────────────────────────────────────────────

  abrirCatalogo(): void {
    this.drawerCatalogo = true;
    this.catPage   = 1;
    this.catQ      = '';
    this.catCategoria = '';
    this.seleccionados.clear();
    this.cargarCatalogo();
    if (this.catCategorias.length === 0) {
      this.catalogoService.categorias().subscribe({ next: c => this.catCategorias = c, error: () => {} });
    }
  }

  cerrarCatalogo(): void {
    this.drawerCatalogo = false;
    this.seleccionados.clear();
  }

  cargarCatalogo(): void {
    this.catCargando = true;
    this.catalogoService.listar({ q: this.catQ, page: this.catPage, limit: 50, categoria: this.catCategoria || undefined }).subscribe({
      next: r => { this.catItems = r.items; this.catTotal = r.total; this.catPages = r.pages; this.catCargando = false; },
      error: () => { this.catCargando = false; }
    });
  }

  onCatBusqueda(): void {
    clearTimeout(this.catBusqTimeout);
    this.catBusqTimeout = setTimeout(() => { this.catPage = 1; this.cargarCatalogo(); }, 350);
  }

  filtrarPorCategoria(cat: string): void {
    this.catCategoria = this.catCategoria === cat ? '' : cat;
    this.catPage = 1;
    this.cargarCatalogo();
  }

  toggleSeleccion(id: number): void {
    if (this.seleccionados.has(id)) this.seleccionados.delete(id);
    else this.seleccionados.add(id);
  }

  adoptarSeleccionados(): void {
    if (this.seleccionados.size === 0) return;
    this.catAdoptando = true;
    this.catalogoService.adoptar(Array.from(this.seleccionados)).subscribe({
      next: r => {
        this.catAdoptando = false;
        this.toastService.show(`Adoptados: ${r.adoptados} · Ya existían: ${r.omitidos}`, 'ok');
        this.seleccionados.clear();
        this.cargarCatalogo();
        this.cargarProductos();
      },
      error: err => { this.catAdoptando = false; this.toastService.show(err?.error?.error || 'Error al adoptar', 'error'); }
    });
  }

  async adoptarTodoCatalogo(): Promise<void> {
    const ok = await this.confirmService.abrir(
      `¿Adoptar todos los ${this.catTotal} productos?`,
      'Los productos que ya existen en tu inventario se omiten automáticamente.'
    );
    if (!ok) return;
    this.catAdoptando = true;
    this.catalogoService.adoptarTodo().subscribe({
      next: r => {
        this.catAdoptando = false;
        this.toastService.show(`Adoptados: ${r.adoptados} · Ya existían: ${r.omitidos}`, 'ok');
        this.seleccionados.clear();
        this.cargarCatalogo();
        this.cargarProductos();
      },
      error: err => { this.catAdoptando = false; this.toastService.show(err?.error?.error || 'Error al adoptar todo', 'error'); }
    });
  }

  aplicarSugerenciaCatalogo(item: CatalogoItem): void {
    this.nuevo.nombre    = item.nombre;
    this.nuevo.categoria = item.categoria_sugerida ?? this.nuevo.categoria;
    if (item.clave_sat_sugerida)  this.nuevo.claveSat       = item.clave_sat_sugerida;
    if (item.unidad_sat_sugerida) this.nuevo.claveUnidadSat = item.unidad_sat_sugerida;
    if (item.codigo_barras)  this.nuevo.barras        = item.codigo_barras;
    if (item.descripcion)    this.nuevo.descripcion   = item.descripcion;
    if (item.precio_menudeo) { this.nuevo.precioMenudeo = Number(item.precio_menudeo); this.nuevo._mayoreoAuto = false; }
    if (item.precio_mayoreo) { this.nuevo.precioMayoreo = Number(item.precio_mayoreo); this.nuevo._mayoreoAuto = false; }
    if (item.precio_oferta)  this.nuevo.precioOferta  = Number(item.precio_oferta);
    if (item.stock_minimo)   this.nuevo.stockMinimo   = Number(item.stock_minimo);
    this.catalogoSugerencias        = [];
    this.mostrarCatalogoSugerencias = false;
  }

  actualizarTiempo() {
    this.fechaActual = this.relojService.obtenerFechaActual();
    this.horaActual = this.relojService.obtenerHoraActual(); 
  }

  cargarProductos(resetPagina = false) {
    if (resetPagina) this.paginaActual = 1;
    this.cargando = true;

    const sucId     = this.sucursalActivaService.sucursalId ?? undefined;
    const categoria = this.selectedFilter === 'categoria' ? (this.categorias[0] ?? undefined) : undefined;

    this.productosService.getProductosPaginados({
      page:        this.paginaActual,
      limit:       this.LIMITE,
      q:           this.textoBuscador.trim() || undefined,
      sucursal_id: sucId,
    }).subscribe({
      next: (r) => {
        this.cargando       = false;
        this.inventario     = r.items;
        this.filtered       = r.items;
        this.totalProductos = r.total;
        this.totalPaginas   = r.pages;

        const cats = r.items.map(p => p.categoria).filter((c): c is string => !!c);
        this.categorias = [...new Set(cats)].sort();

        const buscarParam = this.route.snapshot.queryParams['buscar'];
        if (buscarParam && !this.textoBuscador) {
          this.textoBuscador = buscarParam;
          this.cargarProductos();
        }
      },
      error: () => { this.cargando = false; this.toastService.show('Error al cargar productos', 'error'); }
    });
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
    this.cargarProductos();
  }

  procesarDatos() {
    this.filtered   = [...this.inventario];
    const cats = this.inventario.map(p => p.categoria).filter((c): c is string => !!c);
    this.categorias = [...new Set(cats)].sort();
  }

  buscar(event: Event) {
    const input = event.target as HTMLInputElement;
    this.textoBuscador = input.value;
    clearTimeout(this.catBusqTimeout);
    this.catBusqTimeout = setTimeout(() => this.cargarProductos(true), 350);
  }

  selectFilter(type: 'todos' | 'bajo' | 'categoria') {
    this.selectedFilter = type;
    if (type === 'categoria') { this.modalCategorias = true; return; }
    this.modalCategorias = false;
    this.cargarProductos(true);
  }

  abrirModalStock(p: Producto, tipo: 'ENTRADA' | 'SALIDA' | 'PERDIDA') {
    this.productoStock = p;
    this.tipoMovimiento = tipo;
    this.cantidadMov = null;
    this.motivoMov = '';
    this.razonMov = '';
    this.modalStock = true;
  }

  cerrarModalStock() {
    this.modalStock = false;
  }

  guardarMovimiento() {
    if (!this.cantidadMov || this.cantidadMov <= 0 || !this.productoStock) {
      this.toastService.show('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    const payload: MovimientoInventario = {
      producto_id:    this.productoStock.producto_id,
      usuario_id:     Number(localStorage.getItem('idUsuario') || 1),
      sucursal_id:    this.sucursalActivaService.sucursalId ?? undefined,
      tipo_movimiento: this.tipoMovimiento,
      cantidad:       this.cantidadMov,
      motivo:         this.motivoMov.trim() || undefined,
      observaciones:  this.razonMov || undefined
    };

    this.productosService.registrarMovimiento(payload).subscribe({
      next: () => {
        this.toastService.show('Inventario actualizado correctamente', 'ok');
        this.cerrarModalStock();
        this.cargarProductos();
      },
      error: () => this.toastService.show('Error al actualizar inventario', 'error')
    });
  }

  openCategorias() { this.selectedFilter = 'categoria'; this.modalCategorias = true; }
  closeCategorias() { this.modalCategorias = false; }
  filterByCategory(cat: string) {
    this.modalCategorias = false;
    const sucId = this.sucursalActivaService.sucursalId ?? undefined;
    this.cargando = true;
    this.paginaActual = 1;
    this.productosService.getProductosPaginados({ page: 1, limit: this.LIMITE, categoria: cat, sucursal_id: sucId }).subscribe({
      next: r => { this.cargando = false; this.inventario = r.items; this.filtered = r.items; this.totalProductos = r.total; this.totalPaginas = r.pages; },
      error: () => { this.cargando = false; }
    });
  }

  abrirModalAgregar() {
    this.nuevo = {
      nombre: '', barras: '', descripcion: '', categoria: '',
      precioMenudeo: 0, precioMayoreo: 0, precioOferta: 0,
      minimoMayoreo: 0, stockMinimo: 5,
      claveSat: '01010101', claveUnidadSat: 'H87', objetoImp: '02',
      _mayoreoAuto: false,
    };
    this.satSearchNuevo = '';
    this.resultadosClaveSat = [];
    this.modalAgregar = true;
  }
  cerrarModalAgregar() {
    this.modalAgregar = false;
    this.resultadosClaveSat = [];
  }

  onPrecioMenudeoChange(): void {
    if (this.nuevo._mayoreoAuto || this.nuevo.precioMayoreo === 0) {
      this.nuevo.precioMayoreo = Math.round(this.nuevo.precioMenudeo * 0.88 * 100) / 100;
      this.nuevo._mayoreoAuto = true;
    }
  }

  onCategoriaChange(): void {
    const clave = this.categoriaSatMap[this.nuevo.categoria];
    if (clave) this.nuevo.claveSat = clave;
  }

  guardarProducto() {
    if (!this.nuevo.nombre || !this.nuevo.barras) {
      this.toastService.show('Nombre y código de barras son obligatorios', 'error');
      return;
    }
    if (this.nuevo.precioOferta > 0 && this.nuevo.precioOferta >= this.nuevo.precioMenudeo) {
      this.toastService.show('El precio de oferta debe ser menor al precio público', 'error');
      return;
    }

    const payload = {
      nombre:           this.nuevo.nombre,
      codigo_barras:    this.nuevo.barras,
      descripcion:      this.nuevo.descripcion || this.nuevo.nombre,
      categoria:        this.nuevo.categoria || 'Varios',
      precio_menudeo:   this.nuevo.precioMenudeo,
      precio_mayoreo:   this.nuevo.precioMayoreo || this.nuevo.precioMenudeo,
      precio_oferta:    this.nuevo.precioOferta  || 0,
      stock_actual:     0,
      stock_minimo:     this.nuevo.stockMinimo,
      minimo_mayoreo:   this.nuevo.minimoMayoreo > 0 ? this.nuevo.minimoMayoreo : null,
      activo:           true,
      clave_sat:        this.nuevo.claveSat        || '01010101',
      clave_unidad_sat: this.nuevo.claveUnidadSat  || 'H87',
      objeto_imp:       this.nuevo.objetoImp        || '02',
    };

    this.productosService.createProducto(payload).subscribe({
      next: () => { this.toastService.show('Producto guardado', 'ok'); this.cerrarModalAgregar(); this.cargarProductos(); },
      error: () => this.toastService.show('Error al guardar producto', 'error')
    });
  }

  editar(p: Producto) {
    this.productoEditando = { ...p };
    this.satSearchEditar = '';
    this.resultadosClaveSat = [];
    this.modalEditar = true;
  }
  cerrarModalEditar() {
    this.modalEditar = false;
    this.resultadosClaveSat = [];
  }

  guardarEdicion() {
    if ((this.productoEditando.precio_menudeo !== undefined && this.productoEditando.precio_menudeo < 0) ||
        (this.productoEditando.stock_actual !== undefined && this.productoEditando.stock_actual < 0)) {
      this.toastService.show('No se permiten valores negativos', 'error');
      return;
    }
    if (this.productoEditando.precio_oferta !== undefined &&
        this.productoEditando.precio_oferta > 0 &&
        this.productoEditando.precio_menudeo !== undefined &&
        this.productoEditando.precio_oferta >= this.productoEditando.precio_menudeo) {
      this.toastService.show('El precio de oferta debe ser menor al precio público', 'error');
      return;
    }

    if (this.productoEditando.producto_id) {
      this.productosService.updateProducto(this.productoEditando.producto_id, this.productoEditando).subscribe({
        next: () => {
          this.toastService.show('Producto actualizado', 'ok');
          this.cerrarModalEditar();
          this.cargarProductos();
        },
        error: () => this.toastService.show('Error al actualizar', 'error')
      });
    }
  }

  async eliminar(p: Producto) {
    const ok = await this.confirmService.abrir(
      `¿Eliminar "${p.nombre}"?`,
      'Si tiene ventas o movimientos registrados se desactivará en lugar de eliminarse.'
    );
    if (!ok) return;

    this.productosService.deleteProducto(p.producto_id).subscribe({
      next: (resp: RespuestaEliminar) => {
        if (resp.eliminado === false) {
          const idx = this.inventario.findIndex(x => x.producto_id === p.producto_id);
          if (idx !== -1) this.inventario[idx].activo = false;
          this.toastService.show(`"${p.nombre}" fue desactivado (tiene historial registrado).`, 'info');
        } else {
          this.inventario = this.inventario.filter(x => x.producto_id !== p.producto_id);
          this.toastService.show(`"${p.nombre}" eliminado.`, 'ok');
        }
        this.selectFilter(this.selectedFilter);
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Error desconocido';
        this.toastService.show('Error al eliminar: ' + msg, 'error');
      }
    });
  }

  onClaveSatInput(valor: string, target: 'nuevo' | 'editar'): void {
    if (this.satSearchTimeout) clearTimeout(this.satSearchTimeout);
    if (valor.trim().length < 3) { this.resultadosClaveSat = []; return; }
    this.satSearchTimeout = setTimeout(() => {
      this.satService.buscarClaveSat(valor.trim()).subscribe({
        next: (items) => { this.resultadosClaveSat = items.slice(0, 8); },
        error: () => {}
      });
    }, 400);
  }

  seleccionarClaveSat(item: CatSatProductoServicio, target: 'nuevo' | 'editar'): void {
    if (target === 'nuevo') {
      this.nuevo.claveSat = item.clave;
      this.satSearchNuevo = '';
    } else {
      this.productoEditando.clave_sat = item.clave;
      this.satSearchEditar = '';
    }
    this.resultadosClaveSat = [];
  }

  goTo(path: string) { this.router.navigate([path]); }
}