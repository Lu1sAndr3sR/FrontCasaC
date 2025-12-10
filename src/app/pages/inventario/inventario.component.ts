import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { ProductosService, Producto } from '../../services/productos.service'; 
import { RouterLink, ActivatedRoute } from '@angular/router'; // Agregamos ActivatedRoute para la búsqueda externa

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  
  fechaActual = '';
  horaActual = '';
  nombreCajero = 'Invitado';
  
  // Filtros y Modales
  selectedFilter: 'todos' | 'bajo' | 'categoria' = 'todos';
  modalCategorias = false;
  modalAgregar = false;
  modalEditar = false;
  
  // NUEVO: Modal de Movimientos de Stock (Surtir/Merma)
  modalStock = false;
  productoStock: any = null;
  tipoMovimiento: 'ENTRADA' | 'AJUSTE' = 'ENTRADA';
  cantidadMov: number | null = null;
  razonMov: string = '';

  productoEditando: any = {}; 
  
  categorias: string[] = []; 
  inventario: Producto[] = []; 
  filtered: Producto[] = []; 
  
  // Variable para el input de búsqueda (binding)
  textoBuscador: string = ''; 

  nuevo = {
    nombre: '',
    barras: '',
    categoria: '', 
    precioMenudeo: 0,
    precioMayoreo: 0,
    stockMinimo: 5 
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    
    const cajeroGuardado = localStorage.getItem('nombreCajero');
    if(cajeroGuardado) this.nombreCajero = cajeroGuardado;

    this.cargarProductos();
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe({
      next: (data) => {
        this.inventario = data;
        this.procesarDatos();

        // Verificar si hay petición de búsqueda desde Notificaciones
        this.route.queryParams.subscribe(params => {
          if (params['buscar']) {
            this.textoBuscador = params['buscar'];
            this.buscar({ target: { value: this.textoBuscador } } as any);
          }
        });
      },
      error: (err) => console.error('Error BD:', err)
    });
  }

  procesarDatos() {
    this.filtered = [...this.inventario];
    const cats = this.inventario.map(p => p.categoria).filter(c => c);
    this.categorias = [...new Set(cats)].sort();
  }

  buscar(event: Event) {
    const input = event.target as HTMLInputElement;
    const texto = input.value.toLowerCase().trim();

    if (texto === '') {
      this.selectFilter(this.selectedFilter);
      return;
    }

    this.filtered = this.inventario.filter(p => 
      p.nombre.toLowerCase().includes(texto) || 
      p.codigo_barras.includes(texto) ||
      (p.categoria && p.categoria.toLowerCase().includes(texto))
    );
  }

  selectFilter(type: 'todos' | 'bajo' | 'categoria') {
    this.selectedFilter = type;
    if (type === 'todos') {
      this.filtered = [...this.inventario];
      this.modalCategorias = false;
    } else if (type === 'bajo') {
      this.filtered = this.inventario.filter(p => p.stock_actual <= 5);
      this.modalCategorias = false;
    } else {
      this.modalCategorias = true;
    }
  }

  // --- MOVIMIENTOS DE STOCK (NUEVO) ---
  abrirModalStock(p: any, tipo: 'ENTRADA' | 'AJUSTE') {
    this.productoStock = p;
    this.tipoMovimiento = tipo;
    this.cantidadMov = null;
    this.razonMov = '';
    this.modalStock = true;
  }

  cerrarModalStock() {
    this.modalStock = false;
  }

  guardarMovimiento() {
    if (!this.cantidadMov || this.cantidadMov <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    const payload = {
      producto_id: this.productoStock.producto_id,
      usuario_id: Number(localStorage.getItem('idUsuario') || 1),
      tipo_movimiento: this.tipoMovimiento,
      cantidad: this.cantidadMov,
      observaciones: this.razonMov || (this.tipoMovimiento === 'ENTRADA' ? 'Compra de mercancía' : 'Ajuste de inventario')
    };

    this.productosService.registrarMovimiento(payload).subscribe({
      next: () => {
        alert("✅ Inventario actualizado correctamente");
        this.cerrarModalStock();
        this.cargarProductos(); 
      },
      error: (e) => alert("❌ Error al actualizar inventario")
    });
  }

  // --- CRUD PRODUCTOS (Igual que antes) ---
  openCategorias() { this.selectedFilter = 'categoria'; this.modalCategorias = true; }
  closeCategorias() { this.modalCategorias = false; }
  filterByCategory(cat: string) {
    this.filtered = this.inventario.filter(p => p.categoria === cat);
    this.modalCategorias = false;
  }

  abrirModalAgregar() {
    this.nuevo = { nombre: '', barras: '', categoria: '', precioMenudeo: 0, precioMayoreo: 0, stockMinimo: 5 };
    this.modalAgregar = true;
  }
  cerrarModalAgregar() { this.modalAgregar = false; }

  guardarProducto() {
    if (!this.nuevo.nombre || !this.nuevo.barras) { alert('Faltan datos'); return; }
    
    const payload = {
      nombre: this.nuevo.nombre,
      codigo_barras: this.nuevo.barras,
      categoria: this.nuevo.categoria || 'General', 
      precio_menudeo: this.nuevo.precioMenudeo,
      precio_mayoreo: this.nuevo.precioMayoreo || this.nuevo.precioMenudeo,
      precio_oferta: this.nuevo.precioMenudeo,
      stock_actual: 0,
      stock_minimo: this.nuevo.stockMinimo,
      activo: true,
      descripcion: this.nuevo.nombre 
    };

    this.productosService.createProducto(payload).subscribe({
      next: () => { alert('Guardado'); this.cerrarModalAgregar(); this.cargarProductos(); },
      error: () => alert('Error al guardar')
    });
  }

  editar(p: Producto) {
    this.productoEditando = { ...p };
    this.modalEditar = true;
  }
  cerrarModalEditar() { this.modalEditar = false; }

  guardarEdicion() {
    if (this.productoEditando.precio_menudeo < 0 || this.productoEditando.stock_actual < 0) {
        alert('No se permiten valores negativos');
        return;
    }

    this.productosService.updateProducto(this.productoEditando.producto_id, this.productoEditando).subscribe({
        next: () => {
            alert('Producto actualizado');
            this.cerrarModalEditar();
            this.cargarProductos();
        },
        error: (e) => alert('Error al actualizar')
    });
  }

  eliminar(p: Producto) {
    if(confirm(`¿Eliminar "${p.nombre}"?`)) {
      this.productosService.deleteProducto(p.producto_id).subscribe({
        next: () => {
          this.inventario = this.inventario.filter(x => x.producto_id !== p.producto_id);
          this.selectFilter(this.selectedFilter); 
        },
        error: () => alert('Error al eliminar')
      });
    }
  }

  updateDateTime() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const y = now.getFullYear();
    this.fechaActual = `${d}/${m}/${y}`;
    let h = now.getHours();
    const min = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; h = h ? h : 12;
    this.horaActual = `${h}:${min} ${ampm}`;
  }

  goTo(path: string) { this.router.navigate([path]); }
}