import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {

  // Lista original de usuarios
  usuariosOriginal = [
    { nombre: 'USUARIO 1', rol: 'EMPLEADO' },
    { nombre: 'USUARIO 2', rol: 'ADMINISTRADOR' },
    { nombre: 'USUARIO 3', rol: 'EMPLEADO' }
  ];

  // Lista mostrada
  usuarios = [...this.usuariosOriginal];

  // Campos para modales
  modalEditar = false;
  modalEliminar = false;
  usuarioEditando: any = null;
  usuarioEliminando: any = null;

  constructor(private router: Router) {}

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // -------------------------
  // ⭐ BUSCAR USUARIO
  // -------------------------
  buscarUsuario(texto: string) {
    texto = texto.toLowerCase();

    this.usuarios = this.usuariosOriginal.filter(u =>
      u.nombre.toLowerCase().includes(texto) ||
      u.rol.toLowerCase().includes(texto)
    );
  }

  // -------------------------
  // ⭐ EDITAR
  // -------------------------
  abrirEditar(usuario: any) {
    this.usuarioEditando = { ...usuario };
    this.modalEditar = true;
  }

  guardarEdicion() {
    const index = this.usuariosOriginal.findIndex(u => u.nombre === this.usuarioEditando.nombre);

    if (index !== -1) {
      this.usuariosOriginal[index] = { ...this.usuarioEditando };
    }

    this.usuarios = [...this.usuariosOriginal];
    this.cerrarModal();
  }

  // -------------------------
  // ⭐ ELIMINAR
  // -------------------------
  abrirEliminar(usuario: any) {
    this.usuarioEliminando = usuario;
    this.modalEliminar = true;
  }

  confirmarEliminar() {
    this.usuariosOriginal = this.usuariosOriginal.filter(u => u !== this.usuarioEliminando);
    this.usuarios = [...this.usuariosOriginal];
    this.cerrarModal();
  }

  // -------------------------
  // Cerrar cualquier modal
  // -------------------------
  cerrarModal() {
    this.modalEditar = false;
    this.modalEliminar = false;
    this.usuarioEditando = null;
    this.usuarioEliminando = null;
  }

  // -------------------------
  // AGREGAR USUARIO
  // -------------------------
  abrirAgregar() {
    alert("Aquí agregarás un usuario 😎 (este modal lo hacemos después)");
  }

}
