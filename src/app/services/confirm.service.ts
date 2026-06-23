import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  mensaje = '';
  detalle = '';
  visible = false;
  private resolver!: (val: boolean) => void;

  abrir(mensaje: string, detalle = ''): Promise<boolean> {
    this.mensaje = mensaje;
    this.detalle = detalle;
    this.visible = true;
    return new Promise(res => { this.resolver = res; });
  }

  responder(val: boolean) {
    this.visible = false;
    this.resolver(val);
  }
}
