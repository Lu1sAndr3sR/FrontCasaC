import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NegocioService {
  private readonly KEY_LOGO          = 'casac-logo';
  private readonly KEY_NOMBRE        = 'casac-nombre';
  private readonly KEY_IVA_ACTIVO    = 'casac-iva-activo';
  private readonly KEY_IVA_PORCENTAJE = 'casac-iva-porcentaje';

  logoUrl: string       = '';
  nombreNegocio: string = 'SC POS';
  ivaActivo: boolean    = false;
  ivaPorcentaje: number = 16;

  constructor() {
    this.logoUrl      = localStorage.getItem(this.KEY_LOGO)   || '';
    this.nombreNegocio = localStorage.getItem(this.KEY_NOMBRE) || 'SC POS';
    const ivaGuardado = localStorage.getItem(this.KEY_IVA_ACTIVO);
    this.ivaActivo    = ivaGuardado === null ? true : ivaGuardado === 'true';
    const p = Number(localStorage.getItem(this.KEY_IVA_PORCENTAJE));
    this.ivaPorcentaje = p > 0 ? p : 16;
  }

  get logoActivo(): string {
    return localStorage.getItem('sucursal_activa_logo') || this.logoUrl || 'assets/logoC.png';
  }

  actualizarLogo(base64: string): void {
    this.logoUrl = base64;
    localStorage.setItem(this.KEY_LOGO, base64);
  }

  actualizarNombre(nombre: string): void {
    const limpio = nombre.trim() || 'SC POS';
    this.nombreNegocio = limpio;
    localStorage.setItem(this.KEY_NOMBRE, limpio);
  }

  actualizarIva(activo: boolean, porcentaje: number): void {
    this.ivaActivo    = activo;
    this.ivaPorcentaje = porcentaje > 0 ? porcentaje : 16;
    localStorage.setItem(this.KEY_IVA_ACTIVO, String(this.ivaActivo));
    localStorage.setItem(this.KEY_IVA_PORCENTAJE, String(this.ivaPorcentaje));
  }

  resetear(): void {
    this.logoUrl       = 'assets/logoC.png';
    this.nombreNegocio = 'SC POS';
    this.ivaActivo     = true;
    this.ivaPorcentaje = 16;
    localStorage.removeItem(this.KEY_LOGO);
    localStorage.removeItem(this.KEY_NOMBRE);
    localStorage.removeItem(this.KEY_IVA_ACTIVO);
    localStorage.removeItem(this.KEY_IVA_PORCENTAJE);
  }
}
