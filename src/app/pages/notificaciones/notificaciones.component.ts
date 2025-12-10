import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // 1. Importar Router
import { HttpClientModule } from '@angular/common/http';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit {

  notificaciones: any[] = [];
  cargando: boolean = true;

  constructor(
    private productosService: ProductosService,
    private router: Router // 2. Inyectar Router
  ) {}

  ngOnInit() {
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.cargando = true;
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        const productosBajos = productos.filter(p => p.stock_actual <= 5);

        this.notificaciones = productosBajos.map(p => ({
          // 3. GUARDAMOS EL NOMBRE EXACTO PARA LA BÚSQUEDA
          nombreProducto: p.nombre, 
          
          titulo: 'Stock Crítico',
          mensaje: `El producto "${p.nombre}" tiene pocas unidades.`,
          detalle: `Stock actual: ${p.stock_actual}`,
          tipo: 'alerta',
          fecha: new Date()
        }));

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // 4. FUNCIÓN PARA IR AL INVENTARIO
  irAlInventario(noti: any) {
    // Navegamos a /inventario y le pegamos ?buscar=NombreProducto en la URL
    this.router.navigate(['/inventario'], { 
      queryParams: { buscar: noti.nombreProducto } 
    });
  }
  
  goBack() {
    this.router.navigate(['/dashboard']);
  }
}