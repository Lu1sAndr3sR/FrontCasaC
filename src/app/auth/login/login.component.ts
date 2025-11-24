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

      // 🔍 LOG para ver qué se envía al backend
      console.log("📤 Enviando al backend:");
      console.log("Usuario:", usuario);
      console.log("Contraseña:", password);

      this.authService.login(usuario, password).subscribe({
        next: (resp) => {
          console.log('Login correcto:', resp);
          localStorage.setItem('token', resp.token);
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
