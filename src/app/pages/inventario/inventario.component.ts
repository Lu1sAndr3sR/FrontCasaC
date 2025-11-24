import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// NOTA: Ya no necesitamos CommonModule gracias a la sintaxis nueva (@for)
import { ProductosService, Producto } from '../../services/productos.service'; 

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [], 
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  fechaActual = '';
  horaActual = '';
  selectedFilter: 'todos' | 'bajo' | 'categoria' = 'todos';
  modalCategorias = false;
  
  // Categorías de ejemplo (tu BD aún no tiene tabla de categorías)
  categorias = ['General', 'Abarrotes', 'Limpieza', 'Farmacia']; 

  // Listas de datos
  inventario: Producto[] = []; // La lista completa original
  filtered: Producto[] = [];   // La lista que se muestra (filtrada)

  constructor(
    private router: Router,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    
    // Cargar datos al iniciar
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe({
      next: (data) => {
        console.log('Productos cargados:', data);
        this.inventario = data;
        this.filtered = [...this.inventario]; // Inicialmente mostramos todo
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  // --- BUSCADOR EN TIEMPO REAL ---
  buscar(event: Event) {
    const input = event.target as HTMLInputElement;
    const texto = input.value.toLowerCase().trim();

    if (texto === '') {
      // Si borran el texto, regresamos al filtro actual (por defecto 'todos')
      this.selectFilter(this.selectedFilter);
      return;
    }

    // Filtramos por nombre O por código de barras
    this.filtered = this.inventario.filter(p => 
      p.nombre.toLowerCase().includes(texto) || 
      p.codigo_barras.includes(texto)
    );
  }

  // --- RELOJ ---
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

  // --- NAVEGACIÓN ---
  goTo(path: string) {
    this.router.navigate([path]);
  }

  // --- FILTROS ---
  selectFilter(type: 'todos' | 'bajo' | 'categoria') {
    this.selectedFilter = type;
    
    if (type === 'todos') {
      this.filtered = [...this.inventario];
      this.modalCategorias = false;
    } else if (type === 'bajo') {
      // Filtra productos con stock menor o igual al mínimo
      this.filtered = this.inventario.filter(p => p.stock_actual <= p.stock_minimo);
      this.modalCategorias = false;
    } else {
      this.modalCategorias = true;
    }
  }

  openCategorias() {
    this.selectedFilter = 'categoria';
    this.modalCategorias = true;
  }

  closeCategorias() {
    this.modalCategorias = false;
  }

  filterByCategory(cat: string) {
    console.log('Filtro por categoría pendiente (BD sin columna categoria)');
    this.modalCategorias = false;
  }

  // --- ACCIONES ---
  editar(p: Producto) {
    console.log('Editar producto:', p);
    // Aquí podrías navegar a una pantalla de edición: this.router.navigate(['/editar', p.producto_id]);
  }

  eliminar(p: Producto) {
    if(confirm(`¿Estás seguro de eliminar "${p.nombre}"?`)) {
      this.productosService.deleteProducto(p.producto_id).subscribe({
        next: () => {
          // Eliminamos el producto de la lista local para no recargar la página
          this.inventario = this.inventario.filter(x => x.producto_id !== p.producto_id);
          // Reaplicamos el filtro actual para actualizar la vista
          this.buscar({ target: { value: '' } } as any); // Truco para resetear o podrías llamar a selectFilter
          this.selectFilter(this.selectedFilter);
        },
        error: (e) => alert('Error al eliminar: ' + e.message)
      });
    }
  }
}