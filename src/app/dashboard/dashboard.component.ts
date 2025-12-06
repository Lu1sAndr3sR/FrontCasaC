import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private router: Router) {}

  // === NAVIGATION ===
  goCaja() {
    this.router.navigate(['/caja']);
  }

  goInventario() {
    this.router.navigate(['/inventario']);
  }

  goNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }

  goCorteCaja() {
    this.router.navigate(['/cortecaja']);
  }

  goReporte() {
    this.router.navigate(['/reportes']);
  }

  goUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  // === POPUP DEL USUARIO ===
  showUserMenu = false;

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  // === PERFIL DEL USUARIO ===
  usuarioNombre: string = "Luis Galindo"; // Puedes cambiarlo o traerlo de login
  fechaActual: string = "";
  horaActual: string = "";

  ngOnInit(): void {
    this.setFecha();
    this.actualizarHora();
  }

  // Obtener fecha actual
  setFecha() {
    const hoy = new Date();
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const año = hoy.getFullYear();

    this.fechaActual = `${dia}/${mes}/${año}`;
  }

  // Actualizar la hora cada segundo
  actualizarHora() {
    setInterval(() => {
      const ahora = new Date();
      const h = ahora.getHours().toString().padStart(2, '0');
      const m = ahora.getMinutes().toString().padStart(2, '0');
      const s = ahora.getSeconds().toString().padStart(2, '0');

      this.horaActual = `${h}:${m}:${s}`;
    }, 1000);
  }

  // Cerrar sesión
  cerrarSesion() {
    const salir = confirm("¿Seguro que deseas cerrar sesión?");
    if (salir) {
      this.router.navigate(['/login']);
    }
  }

}
