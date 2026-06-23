import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Sucursal } from '../models/interfaces';

const KEY_ID    = 'sucursal_activa_id';
const KEY_CP    = 'sucursal_activa_cp';
const KEY_NOMBRE = 'sucursal_activa_nombre';
const KEY_LOGO  = 'sucursal_activa_logo';

@Injectable({ providedIn: 'root' })
export class SucursalActivaService {

  private _sucursal = new BehaviorSubject<Sucursal | null>(this.cargarDeStorage());
  readonly sucursal$ = this._sucursal.asObservable();

  get sucursalActiva(): Sucursal | null {
    return this._sucursal.value;
  }

  get sucursalId(): number {
    return this._sucursal.value?.sucursal_id
      ?? Number(localStorage.getItem('sucursal_id') ?? 1);
  }

  get cpSat(): string {
    return this._sucursal.value?.cp_sat
      ?? localStorage.getItem(KEY_CP)
      ?? '';
  }

  setSucursal(s: Sucursal): void {
    localStorage.setItem(KEY_ID,     String(s.sucursal_id));
    localStorage.setItem(KEY_CP,     s.cp_sat);
    localStorage.setItem(KEY_NOMBRE, s.nombre);
    if (s.logo_b64) {
      localStorage.setItem(KEY_LOGO, s.logo_b64);
    } else {
      localStorage.removeItem(KEY_LOGO);
    }
    this._sucursal.next(s);
  }

  limpiar(): void {
    localStorage.removeItem(KEY_ID);
    localStorage.removeItem(KEY_CP);
    localStorage.removeItem(KEY_NOMBRE);
    localStorage.removeItem(KEY_LOGO);
    this._sucursal.next(null);
  }

  private cargarDeStorage(): Sucursal | null {
    const id = localStorage.getItem(KEY_ID);
    if (!id) return null;
    return {
      sucursal_id: Number(id),
      cp_sat:      localStorage.getItem(KEY_CP)     ?? '',
      nombre:      localStorage.getItem(KEY_NOMBRE) ?? '',
      logo_b64:    localStorage.getItem(KEY_LOGO)   ?? null,
      empresa_id:  Number(localStorage.getItem('empresa_id') ?? 1),
      direccion:   '',
      latitud:     0,
      longitud:    0,
      activa:      true
    };
  }
}
