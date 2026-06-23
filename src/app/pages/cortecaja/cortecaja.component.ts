import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CajaService } from '../../services/caja.service';
import { RelojService } from '../../services/reloj.service';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { CerrarCajaPayload } from '../../models/interfaces';

@Component({
  selector: 'app-cortecaja',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, TopbarPerfilComponent],
  templateUrl: './cortecaja.component.html',
  styleUrls: ['./cortecaja.component.css']
})
export class CortecajaComponent implements OnInit, OnDestroy {

  cajaId: number = 0;
  usuarioId: number = 1;
  nombreCajero: string = 'Cajero';

  fechaActual: string = '';
  horaActual: string = '';

  montoInicial: number = 0;
  entradaDinero: number = 0;
  salidaEfectivo: number = 0;

  totalVentas: number = 0;

  montoFinal: number | null = null;
  cerrando = false;

  private clockSub: Subscription | undefined;

  constructor(
    private router: Router,
    private cajaService: CajaService,
    private relojService: RelojService,
    private cdr: ChangeDetectorRef,
    public negocioService: NegocioService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private sucursalActivaService: SucursalActivaService
  ) {}

  ngOnInit() {
    this.actualizarTiempo();
    this.clockSub = interval(1000).subscribe(() => {
      this.actualizarTiempo();
      this.cdr.detectChanges();
    });

    const cajaKey = `cajaAbiertaId-${this.sucursalActivaService.sucursalId}`;
    const idCajaGuardado = localStorage.getItem(cajaKey);
    if (!idCajaGuardado || Number(idCajaGuardado) === 0) {
      this.toastService.show('No se encontró una sesión de caja activa.', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }
    this.cajaId = Number(idCajaGuardado);

    const idUserStorage = Number(localStorage.getItem('idUsuario'));
    this.usuarioId = idUserStorage > 0 ? idUserStorage : 1;

    this.nombreCajero = localStorage.getItem('nombreCajero') || 'Cajero';
    this.cargarDatosCorte();
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
  }

  actualizarTiempo() {
    this.fechaActual = this.relojService.obtenerFechaActual();
    this.horaActual = this.relojService.obtenerHoraActual(true);
  }

  cargarDatosCorte() {
    this.cajaService.obtenerTotales(this.cajaId).subscribe({
      next: (data) => {
        this.montoInicial   = Number(data.montoInicial)  || 0;
        this.totalVentas    = Number(data.totalVentas)   || 0;
        this.entradaDinero  = Number(data.totalIngresos) || 0;
        this.salidaEfectivo = Number(data.totalEgresos)  || 0; // incluye EGRESO + DEVOLUCION
      },
      error: () => {
        this.toastService.show('Error al cargar datos del corte.', 'error');
      }
    });
  }

  get montoEsperado(): number {
    return this.montoInicial + this.totalVentas + this.entradaDinero - this.salidaEfectivo;
  }

  get diferencia(): number {
    if (this.montoFinal === null) return 0;
    return this.montoFinal - this.montoEsperado;
  }


  async cerrarCaja() {
    if (this.cerrando) return;
    if (this.montoFinal === null || this.montoFinal === undefined || this.montoFinal < 0) {
      this.toastService.show('Por favor ingresa el Monto Final contado.', 'error');
      return;
    }

    const final = Number(this.montoFinal);
    const diferencia = final - this.montoEsperado;

    const ok = await this.confirmService.abrir(
      '¿Confirmar Cierre de Caja?',
      `Esperado: $${this.montoEsperado.toFixed(2)}   Físico: $${final.toFixed(2)}   Diferencia: $${diferencia.toFixed(2)}`
    );
    if (!ok) return;

    this.cerrando = true;
    const datosCierre: CerrarCajaPayload = {
      caja_id: this.cajaId,
      usuario_cierre_id: this.usuarioId,
      montoFinal: final,
      diferencia: diferencia
    };

    this.cajaService.cerrarCaja(datosCierre).subscribe({
      next: () => {
        this.toastService.show('Caja cerrada correctamente. Turno finalizado.', 'ok');
        localStorage.removeItem(`cajaAbiertaId-${this.sucursalActivaService.sucursalId}`);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.toastService.show('Error al cerrar caja.', 'error');
        this.cerrando = false;
      }
    });
  }
}
