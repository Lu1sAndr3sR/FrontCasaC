import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router'; // 1. Importar Router
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProductosService } from './services/productos.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'casaC';
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';

  constructor(
    private productosService: ProductosService,
    private router: Router // 2. Inyectar Router
  ) {}

  ngOnInit() {
    this.productosService.alertaStock$.subscribe((mensaje) => {
      this.lanzarNotificacion(mensaje);
    });
    this.productosService.verificarStockBajo();
  }

  lanzarNotificacion(mensaje: string) {
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
    setTimeout(() => { this.mostrarAlerta = false; }, 5000);
  }

  // 3. FUNCIÓN PARA IR A NOTIFICACIONES
  irANotificaciones() {
    this.mostrarAlerta = false; // Cerramos el toast
    this.router.navigate(['/notificaciones']); // Navegamos
  }

  // 4. FUNCIÓN PARA CERRAR (Sin navegar)
  cerrarAlerta(event: Event) {
    event.stopPropagation(); // ⚠️ Truco: Evita que el clic en la X active la navegación
    this.mostrarAlerta = false;
  }
}