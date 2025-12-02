import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent {

  fechaActual: string = '';
  horaActual: string = '';
  filas = Array(10).fill(null);

  constructor(private router: Router) {  // <--- IMPORTANTE
    this.actualizarFecha();
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 1000);
  }

  actualizarFecha() {
    const hoy = new Date();
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const año = hoy.getFullYear();
    this.fechaActual = `${dia}/${mes}/${año}`;
  }

  actualizarHora() {
    const ahora = new Date();

    let horas = ahora.getHours();
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12;
    horas = horas ? horas : 12;

    this.horaActual = `${horas}:${minutos} ${ampm}`;
  }

  cobrar() {
    // Aquí después agregarás la lógica del pago si quieres
    this.router.navigate(['/dashboard']);
  }

  cancelar() {
    // Si quieres que limpie la tabla, aquí se hace
    this.router.navigate(['/dashboard']);
  }

}
