import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface AlertaStock {
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  sucursal: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesSocketService implements OnDestroy {
  private socket: Socket | null = null;

  conectar(empresaId: number | string): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('token') ?? '';
    this.socket = io(environment.socketUrl, {
      autoConnect: false,
      auth: { token }
    });
    this.socket.connect();

    this.socket.once('connect', () => {
      this.socket?.emit('unirse-empresa', String(empresaId));
    });
    if (this.socket.connected) {
      this.socket.emit('unirse-empresa', String(empresaId));
    }
  }

  escucharAlertas(): Observable<AlertaStock[]> {
    return new Observable(observer => {
      this.socket?.on('alerta-stock', (alertas: AlertaStock[]) => {
        observer.next(alertas);
      });
      return () => { this.socket?.off('alerta-stock'); };
    });
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}
