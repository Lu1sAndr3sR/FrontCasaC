import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReportesService } from '../../services/reportes.service';

// 1. IMPORTAR CHART.JS
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables); // Registrar componentes gráficos

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {

  // Control de Pestañas (Agregamos 'graficas')
  tabActiva: 'ventas' | 'productos' | 'caja' | 'movimientos' | 'graficas' = 'ventas';

  // Fechas
  fechaInicio: string = '';
  fechaFin: string = '';

  // DATOS TABLAS
  listaVentas: any[] = [];
  resumenVentas = { totalDinero: 0, conteoVentas: 0 };
  listaProductos: any[] = [];      
  listaCortes: any[] = [];         
  listaMovimientosCaja: any[] = []; 
  listaBitacoraInv: any[] = [];    

  // VARIABLES PARA GRÁFICAS
  chartBarras: any;
  chartLinea: any;

  cargando: boolean = false;

  constructor(
    private router: Router,
    private reportesService: ReportesService
  ) {}

  ngOnInit() {
    this.setFechasHoy();
    this.cargarDatos();
  }

  setFechasHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
  }

  cambiarTab(tab: any) {
    this.tabActiva = tab;
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    const rango = { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin };

    if (this.tabActiva === 'ventas') {
      this.reportesService.getVentas(rango).subscribe({
        next: (res: any) => {
          this.listaVentas = res.datos;
          this.resumenVentas = res.resumen;
          this.cargando = false;
        }, error: () => this.cargando = false
      });
    } 
    else if (this.tabActiva === 'productos') {
      this.reportesService.getProductos(rango).subscribe({
        next: (res: any) => {
          this.listaProductos = res;
          this.cargando = false;
        }, error: () => this.cargando = false
      });
    }
    else if (this.tabActiva === 'caja') {
      this.reportesService.getCaja(rango).subscribe({
        next: (res: any) => {
          this.listaCortes = res.cortes;
          this.listaMovimientosCaja = res.movimientos;
          this.cargando = false;
        }, error: () => this.cargando = false
      });
    }
    else if (this.tabActiva === 'movimientos') {
      this.reportesService.getMovimientosInventario(rango).subscribe({
        next: (res: any) => {
          this.listaBitacoraInv = res;
          this.cargando = false;
        }, error: () => this.cargando = false
      });
    }
    // === LÓGICA GRÁFICAS ===
    else if (this.tabActiva === 'graficas') {
      this.reportesService.getDatosGraficas(rango).subscribe({
        next: (res: any) => {
          this.cargando = false;
          // Esperamos un poquito a que el HTML renderice el <canvas>
          setTimeout(() => {
             this.renderizarGraficas(res.topProductos, res.tendenciaVentas);
          }, 100);
        },
        error: () => this.cargando = false
      });
    }
  }

  // FUNCIÓN PARA PINTAR LAS GRÁFICAS
  renderizarGraficas(topProds: any[], tendencia: any[]) {
    // Destruir anteriores si existen para no sobreponerlas
    if (this.chartBarras) this.chartBarras.destroy();
    if (this.chartLinea) this.chartLinea.destroy();

    // 1. Gráfica de Barras (Top Productos)
    const ctxBarras = document.getElementById('chartBarras') as HTMLCanvasElement;
    if (ctxBarras) {
      this.chartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
          labels: topProds.map(p => p.nombre),
          datasets: [{
            label: 'Unidades Vendidas',
            data: topProds.map(p => p.cantidad),
            backgroundColor: '#4cc9f0',
            borderRadius: 5
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { 
            y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#ccc'} },
            x: { grid: { display: false }, ticks: { color: '#ccc'} } 
          }
        }
      });
    }

    // 2. Gráfica de Línea (Tendencia)
    const ctxLinea = document.getElementById('chartLinea') as HTMLCanvasElement;
    if (ctxLinea) {
      this.chartLinea = new Chart(ctxLinea, {
        type: 'line',
        data: {
          labels: tendencia.map(t => t.dia),
          datasets: [{
            label: 'Ingreso Total ($)',
            data: tendencia.map(t => t.total),
            borderColor: '#4cd96f',
            backgroundColor: 'rgba(76, 217, 111, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { 
          responsive: true,
          maintainAspectRatio: false,
          scales: { 
            y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#ccc'} },
            x: { grid: { color: '#333' }, ticks: { color: '#ccc'} } 
          }
        }
      });
    }
  }

  // Navegación
  goDashboard() { this.router.navigate(['/dashboard']); }
  goCaja() { this.router.navigate(['/caja']); }
  goUsuarios() { this.router.navigate(['/usuarios']); }
  goInventario() { this.router.navigate(['/inventario']); }
  goNotificaciones() { this.router.navigate(['/notificaciones']); }
}