import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { NegocioService } from '../../services/negocio.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';
import { RespuestaLogin } from '../../models/interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private sucursalActivaService: SucursalActivaService,
    private negocioService: NegocioService,
    private themeService: ThemeService,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { usuario, password } = this.loginForm.value;

      this.authService.login(usuario, password).subscribe({
        next: (resp: RespuestaLogin) => {
          localStorage.setItem('token', resp.token);

          const idReal = resp.usuario_id ?? resp.usuario?.usuario_id ?? resp.id;
          if (idReal) {
            localStorage.setItem('idUsuario', idReal.toString());
          }

          const nombreCajero = resp.nombre ?? resp.usuario?.nombre ?? usuario;
          localStorage.setItem('nombreCajero', nombreCajero);

          const esAdmin = (resp.rol_id === 1) ? 'true' : 'false';
          localStorage.setItem('esAdmin', esAdmin);

          localStorage.setItem('usuarioActual', resp.usuario?.usuario ?? usuario);

          if (resp.empresa_id)  localStorage.setItem('empresa_id',  resp.empresa_id.toString());
          if (resp.sucursal_id) localStorage.setItem('sucursal_id', resp.sucursal_id.toString());

          // Carga logo y nombre de la empresa desde el servidor
          if (resp.empresa_logo) {
            localStorage.setItem('casac-logo', resp.empresa_logo);
            this.negocioService.logoUrl = resp.empresa_logo;
          }
          // Si el backend no devuelve logo, conservar el que esté cacheado
          // (el logout ya limpia localStorage; no hace falta borrarlo aquí)
          if (resp.empresa_nombre) {
            localStorage.setItem('casac-nombre', resp.empresa_nombre);
            this.negocioService.nombreNegocio = resp.empresa_nombre;
          }

          // Foto de perfil y tema por usuario
          localStorage.setItem('casac-foto-perfil', resp.foto_perfil ?? '');
          const usuarioId = resp.usuario_id ?? resp.usuario?.usuario_id ?? resp.id;
          if (usuarioId) this.themeService.setUsuario(usuarioId, resp.color_tema);

          // Guardar flag de superadmin
          localStorage.setItem('esSuperAdmin', resp.es_superadmin ? 'true' : 'false');

          // Auto-set sucursal activa con los datos completos del login
          if (resp.sucursal_id && resp.sucursal_nombre) {
            this.sucursalActivaService.setSucursal({
              sucursal_id: resp.sucursal_id,
              nombre:      resp.sucursal_nombre,
              cp_sat:      resp.sucursal_cp_sat ?? '',
              logo_b64:    resp.sucursal_logo   ?? null,
              empresa_id:  resp.empresa_id ?? 1,
              direccion:   '',
              latitud:     0,
              longitud:    0,
              activa:      true
            });
          }

          this.router.navigate([resp.es_superadmin ? '/superadmin' : '/dashboard']);
        },
        error: (err) => {
          const msg = err?.error?.mensaje;
          if (msg) {
            this.toastService.show(msg, 'error');
          } else {
            this.toastService.show('Usuario o contraseña incorrectos', 'error');
          }
        }
      });
    }
  }
}
