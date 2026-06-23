import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { ProductosService } from './services/productos.service';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { ConfirmService } from './services/confirm.service';
import { NotificacionesSocketService, AlertaStock } from './services/notificaciones-socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'casaC';
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  alertasStockSocket: AlertaStock[] = [];
  badgeAlertas = 0;

  private alertaSub: Subscription | undefined;
  private socketSub: Subscription | undefined;
  private routerSub: Subscription | undefined;

  constructor(
    private productosService: ProductosService,
    private router: Router,
    private themeService: ThemeService,
    public toastService: ToastService,
    public confirmService: ConfirmService,
    private notifSocket: NotificacionesSocketService
  ) {}

  private esRutaPublica(url: string): boolean {
    const publicas = ['/', '/login', '/registro', '/forgot-password', '/terminos'];
    return publicas.includes(url) || url.startsWith('/escaner/');
  }

  ngOnInit() {
    this.alertaSub = this.productosService.alertaStock$.subscribe((mensaje) => {
      this.lanzarNotificacion(mensaje);
    });

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      if (this.esRutaPublica(e.urlAfterRedirects)) {
        // En rutas públicas: desconectar socket y ocultar notificaciones
        this.notifSocket.desconectar();
        this.socketSub?.unsubscribe();
        this.mostrarAlerta = false;
      } else if (localStorage.getItem('token')) {
        this.productosService.verificarStockBajo();
        this.conectarSocket();
      }
    });
  }

  ngOnDestroy() {
    this.alertaSub?.unsubscribe();
    this.socketSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    this.notifSocket.desconectar();
  }

  conectarSocket() {
    const empresaId = localStorage.getItem('empresa_id');
    const token = localStorage.getItem('token');
    if (!token || !empresaId) return;

    this.notifSocket.conectar(empresaId);
    this.socketSub = this.notifSocket.escucharAlertas().subscribe((alertas) => {
      this.alertasStockSocket = alertas;
      this.badgeAlertas = alertas.length;
      if (alertas.length > 0) {
        this.lanzarNotificacion(`${alertas.length} producto(s) con stock crítico`);
      }
    });
  }

  lanzarNotificacion(mensaje: string) {
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
    setTimeout(() => { this.mostrarAlerta = false; }, 5000);
  }

  irANotificaciones() {
    this.mostrarAlerta = false;
    this.router.navigate(['/notificaciones']);
  }

  cerrarAlerta(event: Event) {
    event.stopPropagation();
    this.mostrarAlerta = false;
  }
}
