import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface Producto {
  id: number;
  thumb?: string; // ruta a la miniatura en assets/productos/...
  nombre: string;
  sku: string;
  stock: number;
  precio: number;
  categoria: string;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  fechaActual = '';
  horaActual = '';
  selectedFilter: 'todos' | 'bajo' | 'categoria' = 'todos';
  modalCategorias = false;
  categorias = ['Herramientas', 'Tornillería', 'Pintura', 'Electricidad', 'Plomería'];

  // datos de ejemplo (reemplaza por tu API)
  inventario: Producto[] = [
    { id: 1, thumb: 'assets/productos/tornillo.png', nombre: 'Tornillos Cabeza Plana', sku: 'TRN-CPL-M8', stock: 550, precio: 8.50, categoria: 'Tornillería' },
    { id: 2, thumb: 'assets/productos/martillo.png', nombre: 'Martillo de Uña', sku: 'HRR-MTO-001', stock: 12, precio: 15.99, categoria: 'Herramientas' },
    { id: 3, thumb: 'assets/productos/pintura.png', nombre: 'Pintura Acrílica Blanca', sku: 'PNT-ACR-001', stock: 8, precio: 25.75, categoria: 'Pintura' },
    { id: 4, thumb: 'assets/productos/llave.png', nombre: 'Llave Inglesa Ajustable', sku: 'LLV-ING-01', stock: 3, precio: 180.00, categoria: 'Herramientas' },
    { id: 5, thumb: 'assets/productos/cinta.png', nombre: 'Cinta Métrica 5m', sku: 'CINTA-MET-05', stock: 20, precio: 4.90, categoria: 'Herramientas' }
  ];

  filtered: Producto[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.filtered = [...this.inventario];
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
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
    h = h % 12;
    h = h ? h : 12;
    this.horaActual = `${h}:${min} ${ampm}`;
  }

  goTo(path: string) {
    // rutas: '/caja', '/dashboard'
    this.router.navigate([path]);
  }

  // filtros
  selectFilter(type: 'todos' | 'bajo' | 'categoria') {
    this.selectedFilter = type;
    if (type === 'todos') {
      this.filtered = [...this.inventario];
      this.modalCategorias = false;
    } else if (type === 'bajo') {
      this.filtered = this.inventario.filter(p => p.stock < 5 || p.stock <= 12); // ajuste visual similar al mockup
      this.modalCategorias = false;
    } else {
      // abre modal de categorías
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
    this.filtered = this.inventario.filter(p => p.categoria === cat);
    this.selectedFilter = 'categoria';
    this.modalCategorias = false;
  }

  // acciones de la tabla (placeholder)
  editar(p: Producto) {
    console.log('editar', p);
    // abrir modal editar o ruta
  }

  eliminar(p: Producto) {
    this.inventario = this.inventario.filter(x => x.id !== p.id);
    this.selectFilter(this.selectedFilter); // refresca vista
  }
}
