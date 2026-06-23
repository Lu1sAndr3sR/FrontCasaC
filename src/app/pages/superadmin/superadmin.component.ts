import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SuperadminService, EmpresaAdmin, EmpresaDetalle } from '../../services/superadmin.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ConfirmService } from '../../services/confirm.service';

type Accion = 'aprobar' | 'rechazar' | 'suspender' | 'reactivar';

interface ModalState {
  empresa:       EmpresaAdmin;
  accion:        Accion;
  titulo:        string;
  descripcion:   string;
  notas:         string;
  notasPlaceholder: string;
  btnLabel:      string;
  colorClass:    string;
}

interface ToastState {
  mensaje: string;
  tipo:    'exito' | 'error';
}

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  empresas:       EmpresaAdmin[] = [];
  cargando        = true;
  procesando      = false;
  filtroActivo    = 'todas';
  modal:          ModalState | null = null;
  toast:          ToastState | null = null;
  drawerAbierto   = false;
  cargandoDetalle = false;
  detalle:        EmpresaDetalle | null = null;

  // Catálogo base
  catTotal        = 0;
  catCategorias   = 0;
  catImportando   = false;
  catLimpiando    = false;

  filtros = [
    { valor: 'todas',      label: 'Todas' },
    { valor: 'pendiente',  label: 'Pendientes' },
    { valor: 'activa',     label: 'Activas' },
    { valor: 'suspendida', label: 'Suspendidas' },
    { valor: 'rechazada',  label: 'Rechazadas' }
  ];

  private modalConfig: Record<Accion, Omit<ModalState, 'empresa' | 'accion' | 'notas'>> = {
    aprobar: {
      titulo:           'Aprobar empresa',
      descripcion:      '¿Confirmas la activación de esta empresa? Recibirán un correo de bienvenida.',
      notasPlaceholder: 'Notas internas (opcional)',
      btnLabel:         'Aprobar',
      colorClass:       'verde'
    },
    rechazar: {
      titulo:           'Rechazar empresa',
      descripcion:      '¿Rechazas esta solicitud? Se notificará al cliente por correo.',
      notasPlaceholder: 'Motivo del rechazo (se enviará al cliente)',
      btnLabel:         'Rechazar',
      colorClass:       'rojo'
    },
    suspender: {
      titulo:           'Suspender empresa',
      descripcion:      '¿Suspendes el acceso a esta empresa? Sus usuarios no podrán iniciar sesión.',
      notasPlaceholder: 'Motivo de la suspensión (opcional, interno)',
      btnLabel:         'Suspender',
      colorClass:       'naranja'
    },
    reactivar: {
      titulo:           'Reactivar empresa',
      descripcion:      '¿Reactivas esta empresa? Sus usuarios podrán volver a iniciar sesión.',
      notasPlaceholder: '',
      btnLabel:         'Reactivar',
      colorClass:       'morado'
    }
  };

  constructor(
    private service:      SuperadminService,
    private router:       Router,
    private catalogoSvc:  CatalogoService,
    private confirmSvc:   ConfirmService
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarStatsCatalogo();
  }

  cargar() {
    this.cargando = true;
    this.service.listarEmpresas().subscribe({
      next: (data) => { this.empresas = data; this.cargando = false; },
      error: ()    => { this.cargando = false; this.mostrarToast('Error al cargar empresas', 'error'); }
    });
  }

  get empresasFiltradas(): EmpresaAdmin[] {
    if (this.filtroActivo === 'todas') return this.empresas;
    return this.empresas.filter(e => e.estado === this.filtroActivo);
  }

  contarEstado(estado: string): number {
    return this.empresas.filter(e => e.estado === estado).length;
  }

  abrirModal(empresa: EmpresaAdmin, accion: Accion) {
    const cfg = this.modalConfig[accion];
    this.modal = { empresa, accion, notas: '', ...cfg };
  }

  cerrarModal() {
    if (!this.procesando) this.modal = null;
  }

  confirmarModal() {
    if (!this.modal) return;
    this.ejecutar(this.modal.empresa, this.modal.accion, this.modal.notas);
  }

  ejecutar(empresa: EmpresaAdmin, accion: Accion, notas = '') {
    this.procesando = true;
    let req$;

    switch (accion) {
      case 'aprobar':   req$ = this.service.aprobar(empresa.empresa_id, notas);   break;
      case 'rechazar':  req$ = this.service.rechazar(empresa.empresa_id, notas);  break;
      case 'suspender': req$ = this.service.suspender(empresa.empresa_id, notas); break;
      case 'reactivar': req$ = this.service.reactivar(empresa.empresa_id);        break;
    }

    req$.subscribe({
      next: (r) => {
        this.modal      = null;
        this.procesando = false;
        this.mostrarToast(r.mensaje, 'exito');
        this.cargar();
      },
      error: () => {
        this.procesando = false;
        this.mostrarToast('Error al procesar la acción', 'error');
      }
    });
  }

  abrirDetalle(empresa: EmpresaAdmin) {
    this.drawerAbierto   = true;
    this.cargandoDetalle = true;
    this.detalle         = null;
    this.service.detalle(empresa.empresa_id).subscribe({
      next: (d) => { this.detalle = d; this.cargandoDetalle = false; },
      error: ()  => { this.cargandoDetalle = false; this.mostrarToast('Error al cargar detalle', 'error'); }
    });
  }

  cerrarDrawer() {
    this.drawerAbierto = false;
    this.detalle       = null;
  }

  toggleSucursal(suc: { sucursal_id: number; activa: boolean; nombre: string }) {
    this.service.toggleSucursal(suc.sucursal_id).subscribe({
      next: (r) => { suc.activa = r.activa; this.mostrarToast(r.mensaje, 'exito'); },
      error: ()  => this.mostrarToast('Error al actualizar sucursal', 'error')
    });
  }

  toggleUsuario(usr: { usuario_id: number; activo: boolean; nombre: string }) {
    this.service.toggleUsuario(usr.usuario_id).subscribe({
      next: (r) => { usr.activo = r.activo; this.mostrarToast(r.mensaje, 'exito'); },
      error: ()  => this.mostrarToast('Error al actualizar usuario', 'error')
    });
  }

  mostrarToast(mensaje: string, tipo: 'exito' | 'error') {
    this.toast = { mensaje, tipo };
    setTimeout(() => this.toast = null, 3500);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ── Catálogo base ────────────────────────────────────────────────────────

  cargarStatsCatalogo() {
    this.catalogoSvc.stats().subscribe({
      next: s => { this.catTotal = s.total; this.catCategorias = s.categorias; },
      error: () => {}
    });
  }

  async onArchivoExcelCatalogo(event: Event): Promise<void> {
    const input   = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    input.value = '';

    const ok = await this.confirmSvc.abrir(
      `¿Importar "${archivo.name}"?`,
      'Esto reemplazará el catálogo base actual por completo.'
    );
    if (!ok) return;

    this.catImportando = true;
    this.catalogoSvc.importarExcel(archivo).subscribe({
      next: r => {
        this.catImportando = false;
        this.catTotal = r.total;
        this.mostrarToast(`Catálogo importado — ${r.total} productos`, 'exito');
        this.cargarStatsCatalogo();
      },
      error: err => {
        this.catImportando = false;
        this.mostrarToast(err?.error?.error || 'Error al importar', 'error');
      }
    });
  }

  async limpiarCatalogo(): Promise<void> {
    const ok = await this.confirmSvc.abrir(
      `¿Eliminar ${this.catTotal} productos del catálogo base?`,
      'Esta acción no se puede deshacer.'
    );
    if (!ok) return;
    this.catLimpiando = true;
    this.catalogoSvc.limpiar().subscribe({
      next: () => { this.catLimpiando = false; this.catTotal = 0; this.catCategorias = 0; this.mostrarToast('Catálogo limpiado', 'exito'); },
      error: () => { this.catLimpiando = false; this.mostrarToast('Error al limpiar catálogo', 'error'); }
    });
  }
}
