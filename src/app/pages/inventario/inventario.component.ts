import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';      // ✅ Para *ngIf y *ngFor
import { FormsModule } from '@angular/forms';        // ✅ Para [(ngModel)]
import { ProductosService, Producto } from '../../services/productos.service'; 

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],   // ✅ Importamos aquí
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  fechaActual = '';
  horaActual = '';
  selectedFilter: 'todos' | 'bajo' | 'categoria' = 'todos';
  modalCategorias = false;
  modalAgregar = false;

  nuevo: any = {
    nombre: '',
    barras: '',
    abreviado: '',
    precioCompra: null,
    precioVenta: null,
    precioDescuento: null
  };

  categorias = ['General', 'Abarrotes', 'Limpieza', 'Farmacia']; 
  inventario: Producto[] = [];
  filtered: Producto[] = [];

  constructor(
    private router: Router,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe({
      next: (data) => {
        this.inventario = data;
        this.filtered = [...this.inventario];
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
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
      p.codigo_barras.includes(texto)
    );
  }

  abrirModalAgregar() { this.modalAgregar = true; }
  cerrarModalAgregar() { 
    this.modalAgregar = false; 
    this.nuevo = { nombre:'', barras:'', abreviado:'', precioCompra:null, precioVenta:null, precioDescuento:null };
  }
  guardarProducto() { console.log(this.nuevo); this.cerrarModalAgregar(); }

  updateDateTime() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2,'0');
    const m = (now.getMonth()+1).toString().padStart(2,'0');
    const y = now.getFullYear();
    this.fechaActual = `${d}/${m}/${y}`;
    let h = now.getHours();
    const min = now.getMinutes().toString().padStart(2,'0');
    const ampm = h>=12?'PM':'AM';
    h = h%12; h = h? h:12;
    this.horaActual = `${h}:${min} ${ampm}`;
  }

  goTo(path: string) { this.router.navigate([path]); }

  selectFilter(type: 'todos' | 'bajo' | 'categoria') {
    this.selectedFilter = type;
    if(type==='todos'){ this.filtered=[...this.inventario]; this.modalCategorias=false; }
    else if(type==='bajo'){ this.filtered=this.inventario.filter(p=>p.stock_actual<=p.stock_minimo); this.modalCategorias=false; }
    else{ this.modalCategorias=true; }
  }

  openCategorias(){ this.selectedFilter='categoria'; this.modalCategorias=true; }
  closeCategorias(){ this.modalCategorias=false; }
  filterByCategory(cat: string){ console.log('Filtrar por categoría', cat); this.modalCategorias=false; }

  editar(p: Producto){ console.log('Editar producto', p); }
  eliminar(p: Producto){
    if(confirm(`¿Eliminar "${p.nombre}"?`)){
      this.productosService.deleteProducto(p.producto_id).subscribe({
        next:()=>{ 
          this.inventario=this.inventario.filter(x=>x.producto_id!==p.producto_id);
          this.buscar({target:{value:''}} as any);
          this.selectFilter(this.selectedFilter);
        },
        error:(e)=>alert('Error al eliminar: '+e.message)
      });
    }
  }
}
