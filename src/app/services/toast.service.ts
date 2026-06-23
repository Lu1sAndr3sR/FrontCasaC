import { Injectable } from '@angular/core';

type ToastTipo = 'ok' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  mensaje = '';
  tipo: ToastTipo = 'info';
  visible = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(mensaje: string, tipo: ToastTipo = 'info', duracion = 3200) {
    clearTimeout(this.timer);
    this.mensaje = mensaje;
    this.tipo = tipo;
    this.visible = true;
    this.timer = setTimeout(() => { this.visible = false; }, duracion);
  }
}
