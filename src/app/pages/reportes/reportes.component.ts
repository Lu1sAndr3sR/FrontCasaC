import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-reportes',
  standalone: true, // <<---- importante
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent {

  periodoSeleccionado: string = 'dia';
  fechaInicio: string = '';
  fechaFin: string = '';

  entradasTotales: number = 0;
  salidasTotales: number = 0;
  ventasTotales: number = 0;

  constructor(private router: Router) {}

  goDashboard() { this.router.navigate(['/dashboard']); }
  goCaja() { this.router.navigate(['/caja']); }
  goUsuarios() { this.router.navigate(['/usuarios']); }
  goInventario() { this.router.navigate(['/inventario']); }
  goNotificaciones() { this.router.navigate(['/notificaciones']); }

  generarGrafica() { /* lógica de la gráfica */ }
  exportarDatos() { /* lógica de exportar */ }
  generarGraficaBarras() {
  // Aquí generas tu gráfica de barras usando entradasTotales, salidasTotales y ventasTotales
  console.log('Generando gráfica de barras...');
  // Puedes llamar a Chart.js o la librería que estés usando para renderizar la gráfica
}

}
