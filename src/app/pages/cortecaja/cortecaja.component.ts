import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CajaService } from '../../services/caja.service';

@Component({
  selector: 'app-cortecaja',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, HttpClientModule],
  templateUrl: './cortecaja.component.html',
  styleUrls: ['./cortecaja.component.css']
})
export class CortecajaComponent implements OnInit {

  cajaId: number = 0;
  usuarioId: number = 1; 
  nombreCajero: string = 'Cajero';

  montoInicial: number = 0;
  entradaDinero: number = 0;
  salidaEfectivo: number = 0;

  montoFinal: number | null = null; 

  showEgresoModal: boolean = false;
  montoEgreso: number | null = null;
  conceptoEgreso: string = '';

  constructor(
    private router: Router,
    private cajaService: CajaService
  ) {}

  ngOnInit() {
    // 1. Recuperar ID de Caja Activa
    const idCajaGuardado = localStorage.getItem('cajaAbiertaId');
    if (!idCajaGuardado || Number(idCajaGuardado) === 0) {
        alert("⚠️ No se encontró una sesión de caja activa. Serás redirigido al Dashboard.");
        this.router.navigate(['/dashboard']);
        return;
    }
    this.cajaId = Number(idCajaGuardado);
    
    // 2. Recuperar Usuario Real
    const idUserStorage = Number(localStorage.getItem('idUsuario'));
    if (idUserStorage > 0) {
        this.usuarioId = idUserStorage;
    } else {
        // Fallback solo si falló el login
        console.warn("⚠️ No se encontró ID de usuario, usando default (1)");
        this.usuarioId = 1;
    }
    
    this.nombreCajero = localStorage.getItem('nombreCajero') || 'Cajero';
    this.cargarDatosCorte();
  }

  cargarDatosCorte() {
    this.cajaService.obtenerTotales(this.cajaId).subscribe({
      next: (data) => {
        this.montoInicial = Number(data.montoInicial) || 0;
        this.entradaDinero = Number(data.totalVentasEfectivo) || 0;
        this.salidaEfectivo = Number(data.totalEgresos) || 0;
      },
      error: (e) => {
        console.error(e);
        alert('Error al cargar datos del corte.');
      }
    });
  }

  get montoEsperado(): number {
    return this.montoInicial + this.entradaDinero - this.salidaEfectivo;
  }

  get diferencia(): number {
    return (this.montoFinal || 0) - this.montoEsperado;
  }

  // --- EGRESOS ---
  abrirModalEgreso() {
    this.showEgresoModal = true;
    this.montoEgreso = null;
    this.conceptoEgreso = '';
  }

  registrarEgreso() {
    if (!this.montoEgreso || this.montoEgreso <= 0) {
      alert('Debes ingresar un monto válido.');
      return;
    }

    const datosEgreso = {
      caja_id: this.cajaId,
      usuario_id: this.usuarioId,
      monto: this.montoEgreso,
      concepto: this.conceptoEgreso,
      tipo_movimiento: 'EGRESO'
    };

    this.cajaService.registrarMovimiento(datosEgreso).subscribe({
      next: () => {
        alert('Salida registrada.');
        this.showEgresoModal = false;
        this.cargarDatosCorte();
      },
      error: () => alert('Fallo al registrar movimiento.')
    });
  }

  // --- CIERRE FINAL ---
  cerrarCaja() {
    if (this.montoFinal === null || this.montoFinal === undefined || this.montoFinal < 0) {
        alert("⚠️ Por favor cuenta el dinero físico e ingresa el Monto Final.");
        return;
    }

    const final = Number(this.montoFinal);
    const diferencia = final - this.montoEsperado;

    const mensaje = `¿Confirmar Cierre de Caja?\n\n` +
                    `💰 Esperado: $${this.montoEsperado.toFixed(2)}\n` +
                    `💵 Físico: $${final.toFixed(2)}\n` +
                    `📉 Diferencia: $${diferencia.toFixed(2)}`;

    if (!confirm(mensaje)) return;

    const datosCierre = {
      caja_id: this.cajaId,
      usuario_cierre_id: this.usuarioId, // Enviamos el ID correcto
      montoFinal: final,
      diferencia: diferencia
    };

    console.log("Enviando al servicio:", datosCierre);

    this.cajaService.cerrarCaja(datosCierre).subscribe({
      next: () => {
        alert('✅ Caja cerrada correctamente. Turno finalizado.');
        localStorage.removeItem('cajaAbiertaId'); 
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al cerrar caja.');
      }
    });
  }
}