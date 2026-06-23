import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../../services/proveedores.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { Proveedor } from '../../models/interfaces';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  cargando = false;

  modalAbierto = false;
  editando: Proveedor | null = null;
  form: Proveedor = { nombre: '', contacto: '', telefono: '', email: '', direccion: '' };

  nombreNegocio = localStorage.getItem('casac-nombre') || 'SC POS';
  hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  constructor(
    private svc: ProveedoresService,
    private toast: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.svc.listar().subscribe({
      next: (data) => { this.proveedores = data; this.cargando = false; },
      error: () => { this.toast.show('Error al cargar proveedores', 'error'); this.cargando = false; }
    });
  }

  abrirNuevo() {
    this.editando = null;
    this.form = { nombre: '', contacto: '', telefono: '', email: '', direccion: '' };
    this.modalAbierto = true;
  }

  abrirEditar(p: Proveedor) {
    this.editando = p;
    this.form = { ...p };
    this.modalAbierto = true;
  }

  guardar() {
    if (!this.form.nombre?.trim()) return;
    const obs$ = this.editando
      ? this.svc.actualizar(this.editando.proveedor_id!, this.form)
      : this.svc.crear(this.form);

    obs$.subscribe({
      next: () => {
        this.toast.show(this.editando ? 'Proveedor actualizado' : 'Proveedor creado', 'ok');
        this.modalAbierto = false;
        this.cargar();
      },
      error: () => this.toast.show('Error al guardar proveedor', 'error')
    });
  }

  async eliminar(p: Proveedor) {
    const ok = await this.confirmService.abrir(
      `¿Eliminar a ${p.nombre}?`,
      'Esta acción no se puede deshacer.'
    );
    if (!ok) return;
    this.svc.eliminar(p.proveedor_id!).subscribe({
      next: () => { this.toast.show('Proveedor eliminado', 'ok'); this.cargar(); },
      error: () => this.toast.show('Error al eliminar', 'error')
    });
  }
}
