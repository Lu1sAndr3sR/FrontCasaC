import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cortecaja',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cortecaja.component.html',
  styleUrls: ['./cortecaja.component.css']
})
export class CortecajaComponent {
  // inputs
  montoInicial: number = 0;
  entradaDinero: number = 0;
  salidaEfectivo: number = 0;

  // monto final que ingresa el usuario
  montoFinal: number = 0;

  constructor(private router: Router) {}

  // calculado
  get montoEsperado(): number {
    const a = Number(this.montoInicial) || 0;
    const b = Number(this.entradaDinero) || 0;
    const c = Number(this.salidaEfectivo) || 0;

    return a + b - c;
  }

  cerrarCaja() {
    const esperado = this.montoEsperado;
    const final = Number(this.montoFinal) || 0;
    const diferencia = final - esperado;

    const mensaje =
      `Cierre de Caja\n\n` +
      `Monto esperado: $${esperado.toFixed(2)}\n` +
      `Monto final: $${final.toFixed(2)}\n` +
      `Diferencia: $${diferencia.toFixed(2)}\n\n` +
      `¿Deseas continuar al Dashboard?`;

    const confirmacion = confirm(mensaje);

    if (confirmacion) {
      this.router.navigate(['/dashboard']);
    }
  }
}
