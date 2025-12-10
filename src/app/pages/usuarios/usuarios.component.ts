import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  usuariosOriginal: any[] = [];
  usuarios: any[] = []; 
  
  // Variables de Seguridad
  soyAdmin = false;
  usuarioActual = ''; // Aquí guardaremos mi propio login

  // Modales
  modalAgregar = false;
  modalEditar = false;
  modalEliminar = false;

  usuarioEditando: any = {};
  usuarioEliminando: any = {};
  
  // Objeto para crear nuevo
  nuevoUsuario = {
    nombre: '',
    usuario: '',
    contrasena: '', 
    rol: 'EMPLEADO'
  };

  constructor(
    private router: Router,
    private usuariosService: UsuariosService
  ) {}

  ngOnInit() {
    this.verificarPermisos();
    this.cargarUsuarios();
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // --- 1. SEGURIDAD ---
  verificarPermisos() {
    const esAdmin = localStorage.getItem('esAdmin');
    this.soyAdmin = (esAdmin === 'true');

    // Leemos quién está logueado
    this.usuarioActual = localStorage.getItem('usuarioActual') || '';
  }

  // --- 2. CARGAR ---
  cargarUsuarios() {
    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        // Traducir rol_id 1 -> ADMINISTRADOR
        this.usuariosOriginal = data.map(u => ({
            ...u,
            rol: u.rol_id === 1 ? 'ADMINISTRADOR' : 'EMPLEADO'
        }));
        this.usuarios = [...this.usuariosOriginal];
      },
      error: (e) => console.error(e)
    });
  }

  buscarUsuario(texto: string) {
    texto = texto.toLowerCase();
    if(!texto) {
        this.usuarios = [...this.usuariosOriginal];
        return;
    }
    this.usuarios = this.usuariosOriginal.filter(u =>
      u.nombre.toLowerCase().includes(texto) ||
      u.usuario.toLowerCase().includes(texto)
    );
  }

  // --- 3. CREAR ---
  abrirAgregar() {
    if (!this.soyAdmin) { alert('Acceso denegado'); return; }
    
    this.nuevoUsuario = { nombre: '', usuario: '', contrasena: '', rol: 'EMPLEADO' };
    this.modalAgregar = true;
  }

  guardarNuevo() {
    if(!this.nuevoUsuario.nombre || !this.nuevoUsuario.usuario || !this.nuevoUsuario.contrasena) {
        alert("Todos los campos son obligatorios");
        return;
    }

    this.usuariosService.createUsuario(this.nuevoUsuario).subscribe({
        next: () => {
            alert("Usuario creado correctamente");
            this.modalAgregar = false;
            this.cargarUsuarios();
        },
        error: (e) => alert("Error al crear. El usuario ya existe.")
    });
  }

  // --- 4. EDITAR ---
  abrirEditar(u: any) {
    if (!this.soyAdmin) { alert('Acceso denegado'); return; }

    // Limpiamos contraseña para no mostrar el hash
    this.usuarioEditando = { ...u, contrasena: '' }; 
    this.modalEditar = true;
  }

  guardarEdicion() {
    this.usuariosService.updateUsuario(this.usuarioEditando.usuario_id, this.usuarioEditando).subscribe({
        next: () => {
            alert("Usuario actualizado");
            this.modalEditar = false;
            this.cargarUsuarios();
        },
        error: () => alert("Error al actualizar")
    });
  }

  // --- 5. ELIMINAR ---
  abrirEliminar(u: any) {
    if (!this.soyAdmin) { alert('Acceso denegado'); return; }

    // PROTECCIÓN CONTRA AUTO-ELIMINACIÓN
    if (u.usuario === this.usuarioActual) {
        alert("⚠️ No puedes eliminar tu propia cuenta mientras estás conectado.");
        return;
    }

    this.usuarioEliminando = u;
    this.modalEliminar = true;
  }

  confirmarEliminar() {
    this.usuariosService.deleteUsuario(this.usuarioEliminando.usuario_id).subscribe({
        next: () => {
            this.modalEliminar = false;
            this.cargarUsuarios();
        },
        error: () => alert("Error al eliminar")
    });
  }

  cerrarModal() {
    this.modalAgregar = false;
    this.modalEditar = false;
    this.modalEliminar = false;
  }
}