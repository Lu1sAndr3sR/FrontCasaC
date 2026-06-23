import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { SucursalesService } from '../../services/sucursales.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { ConfiguracionFiscalService } from '../../services/configuracion-fiscal.service';
import { Usuario, ConfiguracionFiscal, Sucursal } from '../../models/interfaces';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  usuariosOriginal: Usuario[] = [];
  usuarios: Usuario[] = [];

  soyAdmin = false;
  usuarioActual = '';
  miUsuarioId: number | null = null;
  fotoPerfilActual = '';
  subiendoFoto = false;

  sucursales: Sucursal[] = [];

  // ── Modal: Invitar persona ──────────────────────────────
  modalInvitar = false;
  configInvitacion = { sucursal_id: null as number | null, rol_id: 2, usos_max: 1 };
  codigoGenerado = '';
  generandoCodigo = false;

  // ── Modal: Cambiar sucursal ─────────────────────────────
  modalCambiarSucursal = false;
  usuarioCambiando: Partial<Usuario> = {};
  nuevaSucursalId: number | null = null;

  // ── Config de facturación (solo admin) ─────────────────
  readonly regimenesFiscales = [
    { clave: '601', descripcion: 'General de Ley Personas Morales' },
    { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos' },
    { clave: '612', descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales' },
    { clave: '616', descripcion: 'Sin obligaciones fiscales' },
    { clave: '621', descripcion: 'Incorporación Fiscal' },
    { clave: '626', descripcion: 'Régimen Simplificado de Confianza' },
  ];

  readonly pacesDisponibles = ['Finkok', 'SW Sapien', 'Facturama', 'Otro'];


  configFiscal: ConfiguracionFiscal | null = null;
  formConfig = {
    rfc_emisor: '', nombre_emisor: '', cp_emisor: '', regimen_emisor: '',
    csd_cert_b64: '', csd_key_b64: '', csd_password: '',
    pac_nombre: '', pac_url: '', pac_usuario: '', pac_password: '',
    email_nombre: '', email_user: '', email_pass: ''
  };
  guardandoConfig  = false;
  cargandoUsuarios = false;

  constructor(
    private router: Router,
    private usuariosService: UsuariosService,
    private sucursalesService: SucursalesService,
    private authService: AuthService,
    public themeService: ThemeService,
    public negocioService: NegocioService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private configFiscalService: ConfiguracionFiscalService,
  ) {}

  ngOnInit() {
    this.verificarPermisos();
    this.cargarUsuarios();
    this.cargarSucursales();
    if (this.soyAdmin) this.cargarConfigFiscal();
  }

  goDashboard() { this.router.navigate(['/dashboard']); }

  verificarPermisos() {
    this.soyAdmin      = localStorage.getItem('esAdmin') === 'true';
    this.usuarioActual = localStorage.getItem('usuarioActual') || '';
    const id = localStorage.getItem('idUsuario');
    this.miUsuarioId   = id ? Number(id) : null;
    this.fotoPerfilActual = localStorage.getItem('casac-foto-perfil') || '';
  }

  cargarUsuarios() {
    this.cargandoUsuarios = true;
    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        this.cargandoUsuarios = false;
        this.usuariosOriginal = data.map(u => ({
          ...u,
          rol: u.rol_id === 1 ? 'ADMINISTRADOR' : 'EMPLEADO'
        } as Usuario));
        this.usuarios = [...this.usuariosOriginal];
      },
      error: () => { this.cargandoUsuarios = false; this.toastService.show('Error al cargar usuarios', 'error'); }
    });
  }

  cargarSucursales() {
    this.sucursalesService.getSucursales().subscribe({
      next: (s) => { this.sucursales = s; },
      error: () => {}
    });
  }

  nombreSucursal(id?: number): string {
    if (!id) return '—';
    return this.sucursales.find(s => s.sucursal_id === id)?.nombre ?? `#${id}`;
  }

  buscarUsuario(texto: string) {
    texto = texto.toLowerCase();
    this.usuarios = !texto
      ? [...this.usuariosOriginal]
      : this.usuariosOriginal.filter(u =>
          u.nombre.toLowerCase().includes(texto) ||
          u.usuario.toLowerCase().includes(texto)
        );
  }

  // ── Invitar persona ────────────────────────────────────
  abrirInvitar() {
    this.configInvitacion = { sucursal_id: this.sucursales[0]?.sucursal_id ?? null, rol_id: 2, usos_max: 1 };
    this.codigoGenerado = '';
    this.modalInvitar = true;
  }

  generarCodigoInvitacion() {
    this.generandoCodigo = true;
    this.authService.generarCodigo(this.configInvitacion.sucursal_id, this.configInvitacion.usos_max, this.configInvitacion.rol_id).subscribe({
      next: (resp) => {
        this.codigoGenerado = resp.codigo;
        this.generandoCodigo = false;
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'Error al generar código', 'error');
        this.generandoCodigo = false;
      }
    });
  }

  copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo).then(() =>
      this.toastService.show(`Código "${codigo}" copiado`, 'ok')
    );
  }

  cerrarInvitar() {
    this.modalInvitar = false;
    this.codigoGenerado = '';
  }

  // ── Cambiar sucursal ───────────────────────────────────
  abrirCambiarSucursal(u: Usuario) {
    this.usuarioCambiando = u;
    this.nuevaSucursalId  = u.sucursal_id ?? null;
    this.modalCambiarSucursal = true;
  }

  async confirmarCambiarSucursal() {
    if (!this.usuarioCambiando.usuario_id || this.nuevaSucursalId === null) return;
    this.usuariosService.updateUsuario(this.usuarioCambiando.usuario_id, {
      ...this.usuarioCambiando,
      sucursal_id: this.nuevaSucursalId
    }).subscribe({
      next: () => {
        this.toastService.show('Sucursal actualizada', 'ok');
        this.modalCambiarSucursal = false;
        this.cargarUsuarios();
      },
      error: () => this.toastService.show('Error al cambiar sucursal', 'error')
    });
  }

  // ── Desactivar / Reactivar ─────────────────────────────
  async desactivarUsuario(u: Usuario) {
    const ok = await this.confirmService.abrir(
      `¿Desactivar a "${u.nombre}"? No podrá iniciar sesión hasta que lo reactives.`
    );
    if (!ok) return;
    this.usuariosService.updateUsuario(u.usuario_id!, { ...u, activo: false } as Usuario).subscribe({
      next: () => {
        this.toastService.show(`${u.nombre} desactivado`, 'ok');
        this.cargarUsuarios();
      },
      error: () => this.toastService.show('Error al desactivar', 'error')
    });
  }

  async reactivarUsuario(u: Usuario) {
    this.usuariosService.updateUsuario(u.usuario_id!, { ...u, activo: true } as Usuario).subscribe({
      next: () => {
        this.toastService.show(`${u.nombre} reactivado`, 'ok');
        this.cargarUsuarios();
      },
      error: () => this.toastService.show('Error al reactivar', 'error')
    });
  }

  private comprimirImagen(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // ── Foto de perfil ────────────────────────────────────
  onFotoPerfilSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.subiendoFoto = true;
    this.comprimirImagen(file, 150, 0.82).then(base64 => {
      this.authService.actualizarPerfil({ foto_perfil: base64 }).subscribe({
        next: () => {
          this.fotoPerfilActual = base64;
          localStorage.setItem('casac-foto-perfil', base64);
          this.toastService.show('Foto actualizada', 'ok');
          this.subiendoFoto = false;
        },
        error: () => {
          this.toastService.show('Error al guardar foto', 'error');
          this.subiendoFoto = false;
        }
      });
    }).catch(() => {
      this.toastService.show('Error al procesar la imagen', 'error');
      this.subiendoFoto = false;
    });
  }

  quitarFotoPerfil(): void {
    this.authService.actualizarPerfil({ foto_perfil: null }).subscribe({
      next: () => {
        this.fotoPerfilActual = '';
        localStorage.setItem('casac-foto-perfil', '');
        this.toastService.show('Foto eliminada', 'ok');
      },
      error: () => this.toastService.show('Error al eliminar foto', 'error')
    });
  }

  // ── Tema con sincronía al servidor ─────────────────────
  aplicarTemaYGuardar(temaId: string): void {
    this.themeService.aplicarTema(temaId);
    this.authService.actualizarPerfil({ color_tema: temaId }).subscribe();
  }

  // ── Configuración Fiscal ───────────────────────────────
  cargarConfigFiscal(): void {
    this.configFiscalService.get().subscribe({
      next: (config) => {
        this.configFiscal = config;
        this.formConfig.rfc_emisor     = config.rfc_emisor;
        this.formConfig.nombre_emisor  = config.nombre_emisor;
        this.formConfig.cp_emisor      = config.cp_emisor;
        this.formConfig.regimen_emisor = config.regimen_emisor;
        this.formConfig.pac_nombre     = config.pac_nombre;
        this.formConfig.pac_url        = config.pac_url;
        this.formConfig.pac_usuario    = config.pac_usuario;
        this.formConfig.email_user     = config.email_user;
        const match = config.email_from?.match(/^(.+?)\s*</);
        this.formConfig.email_nombre   = match ? match[1].trim() : config.email_from || '';
      },
      error: () => {}
    });
  }

  guardarConfigFiscal(): void {
    this.guardandoConfig = true;
    const payload: Record<string, string | number> = {
      rfc_emisor:     this.formConfig.rfc_emisor,
      nombre_emisor:  this.formConfig.nombre_emisor,
      cp_emisor:      this.formConfig.cp_emisor,
      regimen_emisor: this.formConfig.regimen_emisor,
      pac_nombre:     this.formConfig.pac_nombre,
      pac_url:        this.formConfig.pac_url,
      pac_usuario:    this.formConfig.pac_usuario,
      email_host:     'smtp.gmail.com',
      email_port:     587,
      email_user:     this.formConfig.email_user,
      email_from:     this.formConfig.email_nombre
                        ? `${this.formConfig.email_nombre} <${this.formConfig.email_user}>`
                        : this.formConfig.email_user,
      logo_b64:       this.negocioService.logoActivo,
      nombre_negocio: this.negocioService.nombreNegocio,
    };
    if (this.formConfig.csd_cert_b64)  payload['csd_cert_b64']  = this.formConfig.csd_cert_b64;
    if (this.formConfig.csd_key_b64)   payload['csd_key_b64']   = this.formConfig.csd_key_b64;
    if (this.formConfig.csd_password)  payload['csd_password']  = this.formConfig.csd_password;
    if (this.formConfig.pac_password)  payload['pac_password']  = this.formConfig.pac_password;
    if (this.formConfig.email_pass)    payload['email_pass']    = this.formConfig.email_pass;

    this.configFiscalService.guardar(payload).subscribe({
      next: () => {
        this.toastService.show('Configuración de facturación guardada', 'ok');
        this.guardandoConfig = false;
        this.formConfig.csd_cert_b64 = '';
        this.formConfig.csd_key_b64  = '';
        this.formConfig.csd_password = '';
        this.formConfig.pac_password = '';
        this.formConfig.email_pass   = '';
        this.cargarConfigFiscal();
      },
      error: () => {
        this.toastService.show('Error al guardar la configuración', 'error');
        this.guardandoConfig = false;
      }
    });
  }

  onCertSeleccionado(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.formConfig.csd_cert_b64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.readAsDataURL(file);
  }

  onKeySeleccionado(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.formConfig.csd_key_b64 = result.includes(',') ? result.split(',')[1] : result;
    };
    reader.readAsDataURL(file);
  }

  toggleIva(event: Event): void {
    const activo = (event.target as HTMLInputElement).checked;
    this.negocioService.actualizarIva(activo, this.negocioService.ivaPorcentaje);
  }

  guardarIvaPorcentaje(valor: string): void {
    const pct = Number(valor);
    if (!pct || pct <= 0 || pct > 99) { this.toastService.show('Ingresa un porcentaje válido (1–99)', 'error'); return; }
    this.negocioService.actualizarIva(this.negocioService.ivaActivo, pct);
  }

  onLogoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.comprimirImagen(file, 300, 0.82).then(base64 => {
      this.negocioService.actualizarLogo(base64);
      this.authService.actualizarLogoEmpresa(base64).subscribe({
        next: () => this.toastService.show('Logo guardado', 'ok'),
        error: () => this.toastService.show('Logo actualizado localmente (error al sincronizar)', 'error')
      });
    }).catch(() => {
      this.toastService.show('Error al procesar la imagen del logo', 'error');
    });
  }

  guardarNombre(nombre: string): void { this.negocioService.actualizarNombre(nombre); }

  async resetearNegocio(): Promise<void> {
    const ok = await this.confirmService.abrir('¿Restaurar el logo y nombre por defecto?');
    if (ok) this.negocioService.resetear();
  }

}
