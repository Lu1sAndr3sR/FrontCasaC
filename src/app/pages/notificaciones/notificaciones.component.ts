import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductosService } from '../../services/productos.service';
import { ReportesService } from '../../services/reportes.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { NegocioService } from '../../services/negocio.service';
import { AiService } from '../../services/ai.service';
import { ToastService } from '../../services/toast.service';
import { Notificacion, ProductoReporte, Producto } from '../../models/interfaces';

interface NotificacionExtendida extends Notificacion {
  stockActual: number;
  stockMinimo: number;
  velocidadDiaria: number;
  diasEstimados: number | null;
  urgencia: 'critica' | 'alta' | 'media';
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit, OnDestroy {

  notificaciones: NotificacionExtendida[] = [];
  cargando = true;
  sucursalNombre = '';

  private destroy$ = new Subject<void>();

  analisisIA = '';
  cargandoIA = false;
  errorIA = '';

  private ventasProductos: ProductoReporte[] = [];

  constructor(
    private productosService: ProductosService,
    private reportesService: ReportesService,
    private sucursalActivaService: SucursalActivaService,
    private router: Router,
    public negocioService: NegocioService,
    public aiService: AiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.sucursalNombre = this.sucursalActivaService.sucursalActiva?.nombre || '';
    this.cargarNotificaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarNotificaciones() {
    this.cargando = true;
    const sucId = this.sucursalActivaService.sucursalId ?? undefined;

    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hoy.getDate() - 30);
    const rango = {
      fechaInicio: hace30.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    };

    forkJoin({
      productos: this.productosService.getProductos(sucId),
      ventas: this.reportesService.getProductos(rango)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ productos, ventas }) => {
        this.ventasProductos = ventas;
        const mapaVelocidad = new Map<string, number>();
        ventas.forEach(v => mapaVelocidad.set(v.nombre.toLowerCase(), v.cantidad / 30));

        const productosBajos = productos.filter(p => p.stock_actual <= (p.stock_minimo ?? 5));

        this.notificaciones = productosBajos.map(p => {
          const velocidad = mapaVelocidad.get(p.nombre.toLowerCase()) ?? 0;
          const diasEst = velocidad > 0 ? Math.floor(p.stock_actual / velocidad) : null;
          const stockMin = p.stock_minimo ?? 5;
          const ratio = p.stock_actual / stockMin;
          const urgencia: 'critica' | 'alta' | 'media' =
            ratio <= 0.3 || (diasEst !== null && diasEst <= 3) ? 'critica' :
            ratio <= 0.6 || (diasEst !== null && diasEst <= 7) ? 'alta' : 'media';

          return {
            nombreProducto: p.nombre,
            titulo: urgencia === 'critica' ? 'Stock Crítico' : urgencia === 'alta' ? 'Stock Bajo' : 'Stock Moderado',
            mensaje: `"${p.nombre}" — ${diasEst !== null ? `~${diasEst} días estimados de stock` : 'pocas unidades disponibles'}`,
            detalle: `Stock: ${p.stock_actual} / Mínimo: ${stockMin}`,
            tipo: 'alerta',
            fecha: new Date(),
            stockActual: p.stock_actual,
            stockMinimo: stockMin,
            velocidadDiaria: velocidad,
            diasEstimados: diasEst,
            urgencia
          };
        });

        this.notificaciones.sort((a, b) => {
          const orden = { critica: 0, alta: 1, media: 2 };
          return orden[a.urgencia] - orden[b.urgencia];
        });

        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.toastService.show('Error al cargar notificaciones de stock', 'error');
      }
    });
  }

  analizarConIA() {
    if (!this.aiService.tieneApiKey()) {
      this.toastService.show('Configura tu API key de IA en Usuarios > Configuración IA', 'info');
      return;
    }
    this.cargandoIA = true;
    this.analisisIA = '';
    this.errorIA = '';

    const productosAlerta = this.notificaciones.map(n => ({
      nombre: n.nombreProducto,
      stock_actual: n.stockActual,
      stock_minimo: n.stockMinimo
    }));

    this.aiService.analizarStockBajo(productosAlerta, this.ventasProductos).subscribe({
      next: (resp) => {
        this.analisisIA = resp;
        this.cargandoIA = false;
      },
      error: (err) => {
        this.errorIA = err.message || 'Error al conectar con la IA';
        this.cargandoIA = false;
      }
    });
  }

  irAlInventario(noti: NotificacionExtendida) {
    this.router.navigate(['/inventario'], { queryParams: { buscar: noti.nombreProducto } });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
