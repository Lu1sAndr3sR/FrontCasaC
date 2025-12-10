import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CajaService } from '../services/caja.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  cajaAbierta: boolean = false; 
  montoApertura: number | null = null;
  usuarioId: number = 1; 

  showUserMenu = false;
  usuarioNombre: string = "Invitado";
  fechaActual: string = "";
  horaActual: string = "";

  constructor(private router: Router, private cajaService: CajaService) {}

  ngOnInit(): void {
    this.setFecha();
    this.actualizarHora();

    const nombreGuardado = localStorage.getItem('nombreCajero');
    if (nombreGuardado) this.usuarioNombre = nombreGuardado;
    
    // Recuperar ID real guardado en el Login
    const idGuardado = localStorage.getItem('idUsuario');
    if (idGuardado) {
        this.usuarioId = Number(idGuardado);
        console.log("Dashboard - Usuario Activo ID:", this.usuarioId);
    }

    this.verificarEstadoCaja();
  }

  verificarEstadoCaja() {
    this.cajaService.verificarEstado(this.usuarioId).subscribe({
      next: (resp: any) => {
        this.cajaAbierta = resp.abierta; 
        
        if (resp.abierta && resp.datos) {
            localStorage.setItem('cajaAbiertaId', resp.datos.caja_id);
        }
      },
      error: (err) => {
        console.error('Error conectando a BD:', err);
        this.cajaAbierta = false; 
      }
    });
  }

  confirmarApertura() {
    if (this.montoApertura === null || this.montoApertura < 0) {
      alert("Por favor ingresa un monto válido.");
      return;
    }

    const datos = {
      usuario_id: this.usuarioId,
      monto: this.montoApertura
    };

    this.cajaService.abrirCaja(datos).subscribe({
      next: (resp: any) => {
        this.cajaAbierta = true;
        localStorage.setItem('cajaAbiertaId', resp.caja.caja_id);
        alert('¡Turno iniciado correctamente!');
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Error: ' + (err.error.error || 'No se pudo abrir la caja'));
      }
    });
  }

  // ... Navegación y Reloj igual que antes ...
  goCaja() { this.router.navigate(['/caja']); }
  goInventario() { this.router.navigate(['/inventario']); }
  goNotificaciones() { this.router.navigate(['/notificaciones']); }
  goCorteCaja() { this.router.navigate(['/cortecaja']); }
  goReporte() { this.router.navigate(['/reportes']); }
  goUsuarios() { this.router.navigate(['/usuarios']); }
  toggleUserMenu() { this.showUserMenu = !this.showUserMenu; }
  
  setFecha() {
    const hoy = new Date();
    this.fechaActual = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()}`;
  }

  actualizarHora() {
    setInterval(() => {
      const ahora = new Date();
      this.horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}:${ahora.getSeconds().toString().padStart(2, '0')}`;
    }, 1000);
  }

  cerrarSesion() {
    if (confirm("¿Seguro que deseas cerrar sesión?")) {
      localStorage.clear(); // Borra TODO (token, nombre, ID) para evitar fantasmas
      this.router.navigate(['/login']);
    }
  }
}