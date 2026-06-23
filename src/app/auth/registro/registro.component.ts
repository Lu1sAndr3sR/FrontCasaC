import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

type Modo = 'admin' | 'empleado';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnDestroy {

  modo: Modo = 'admin';
  cargando = false;
  aceptaTerminos = false;

  form = {
    nombre: '',
    usuario: '',
    contrasena: '',
    confirmar: '',
    // Admin
    email: '',
    codigo_verificacion: '',
    // Empleado
    codigo_invitacion: ''
  };

  // Estado del OTP
  solicitandoCodigo = false;
  codigoEnviado = false;
  segundosRestantes = 0;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  get emailValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim());
  }

  get formularioValido(): boolean {
    const base = this.form.nombre.trim() &&
                 this.form.usuario.trim() &&
                 this.form.contrasena.length >= 6 &&
                 this.form.contrasena === this.form.confirmar;

    if (this.modo === 'admin') {
      return !!(base &&
        this.emailValido &&
        this.codigoEnviado &&
        this.form.codigo_verificacion.trim().length === 6);
    }
    return !!(base && this.form.codigo_invitacion.trim());
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnDestroy(): void {
    this.limpiarCountdown();
  }

  cambiarModo(m: Modo) {
    this.modo = m;
  }

  solicitarCodigo() {
    if (!this.emailValido || this.solicitandoCodigo) return;
    this.solicitandoCodigo = true;

    this.authService.solicitarCodigoRegistro(this.form.email.trim()).subscribe({
      next: (resp) => {
        this.toastService.show(resp.mensaje, 'ok');
        this.codigoEnviado = true;
        this.solicitandoCodigo = false;
        this.iniciarCountdown(900); // 15 min
      },
      error: (err) => {
        this.toastService.show(err.error?.mensaje || 'Error al enviar el código', 'error');
        this.solicitandoCodigo = false;
      }
    });
  }

  private iniciarCountdown(segundos: number) {
    this.limpiarCountdown();
    this.segundosRestantes = segundos;
    this.countdownInterval = setInterval(() => {
      this.segundosRestantes--;
      if (this.segundosRestantes <= 0) {
        this.limpiarCountdown();
        this.codigoEnviado = false;
        this.form.codigo_verificacion = '';
        this.toastService.show('El código expiró. Solicita uno nuevo.', 'error');
      }
    }, 1000);
  }

  private limpiarCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  get tiempoRestante(): string {
    const m = Math.floor(this.segundosRestantes / 60);
    const s = this.segundosRestantes % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  enviar() {
    if (!this.formularioValido || this.cargando) return;
    this.cargando = true;

    const obs$ = this.modo === 'admin'
      ? this.authService.registroAdmin({
          nombre:               this.form.nombre.trim(),
          usuario:              this.form.usuario.trim(),
          contrasena:           this.form.contrasena,
          email:                this.form.email.trim().toLowerCase(),
          codigo_verificacion:  this.form.codigo_verificacion.trim()
        })
      : this.authService.registroEmpleado({
          nombre:              this.form.nombre.trim(),
          usuario:             this.form.usuario.trim(),
          contrasena:          this.form.contrasena,
          codigo_invitacion:   this.form.codigo_invitacion.trim().toUpperCase()
        });

    obs$.subscribe({
      next: (resp) => {
        this.limpiarCountdown();
        this.toastService.show(resp.mensaje, 'ok');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toastService.show(err.error?.mensaje || 'Error al registrarse', 'error');
        this.cargando = false;
      }
    });
  }
}
