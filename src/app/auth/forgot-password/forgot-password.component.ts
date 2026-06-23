import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnDestroy {
  paso: 1 | 2 = 1;
  usuario = '';
  codigo = '';
  nueva_contrasena = '';
  confirmar = '';

  solicitando = false;
  guardando = false;
  codigoEnviado = false;
  segundosRestantes = 0;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnDestroy() {
    this.limpiarCountdown();
  }

  solicitarCodigo() {
    if (!this.usuario.trim() || this.solicitando) return;
    this.solicitando = true;
    this.authService.solicitarResetContrasena(this.usuario.trim()).subscribe({
      next: (resp) => {
        this.toast.show(resp.mensaje, 'ok');
        this.codigoEnviado = true;
        this.paso = 2;
        this.solicitando = false;
        this.iniciarCountdown(900);
      },
      error: (err) => {
        this.toast.show(err.error?.mensaje || 'Error al solicitar código', 'error');
        this.solicitando = false;
      }
    });
  }

  confirmar_reset() {
    if (!this.codigo.trim() || this.nueva_contrasena.length < 6 || this.nueva_contrasena !== this.confirmar) return;
    this.guardando = true;
    this.authService.confirmarResetContrasena(this.usuario.trim(), this.codigo.trim(), this.nueva_contrasena).subscribe({
      next: (resp) => {
        this.limpiarCountdown();
        this.toast.show(resp.mensaje, 'ok');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toast.show(err.error?.mensaje || 'Código inválido o expirado', 'error');
        this.guardando = false;
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
        this.paso = 1;
        this.toast.show('El código expiró. Solicita uno nuevo.', 'error');
      }
    }, 1000);
  }

  private limpiarCountdown() {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
  }

  get tiempoRestante(): string {
    const m = Math.floor(this.segundosRestantes / 60);
    const s = this.segundosRestantes % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get passwordsCoinciden(): boolean {
    return this.nueva_contrasena === this.confirmar;
  }
}
