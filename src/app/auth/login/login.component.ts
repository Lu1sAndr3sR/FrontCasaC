import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { usuario, password } = this.loginForm.value;

      console.log("📤 Enviando al backend:", usuario);

      this.authService.login(usuario, password).subscribe({
        next: (resp: any) => {
          console.log('Login correcto:', resp);
          
          // 1. Guardar Token
          localStorage.setItem('token', resp.token);
          
          // ⚠️ 2. GUARDAR ID DE USUARIO (ESTA ERA LA LÍNEA FALTANTE) ⚠️
          // Intentamos buscar el ID en varias partes por si la estructura cambia
          const idReal = resp.usuario_id || resp.usuario?.usuario_id || resp.id;
          
          if (idReal) {
             localStorage.setItem('idUsuario', idReal.toString());
             console.log("✅ ID de Usuario guardado:", idReal);
          } else {
             console.error("⚠️ No se encontró ID en la respuesta del login", resp);
          }
          
          // 3. Guardar Nombre
          const nombreCajero = resp.nombre || resp.usuario?.nombre || usuario;
          localStorage.setItem('nombreCajero', nombreCajero);

          // 4. Guardar Rol
          const esAdmin = (resp.rol_id === 1) ? 'true' : 'false';
          localStorage.setItem('esAdmin', esAdmin);

          // 5. Guardar Login Único
          localStorage.setItem('usuarioActual', resp.usuario?.usuario || usuario);

          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          console.error(err);
          alert('Usuario o contraseña incorrectos');
        }
      });
    }
  }
}