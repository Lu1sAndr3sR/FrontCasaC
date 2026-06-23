import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ScannerSocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketUrl, {
      autoConnect: false,
      reconnectionAttempts: 4,
      reconnectionDelay: 3000,
    });

    this.socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') console.warn('[Scanner] Socket desconectado:', reason);
    });
    this.socket.io.on('reconnect_failed', () =>
      console.warn('[Scanner] No se pudo conectar al servidor de escáner (servidor dormido o no disponible)'));
  }

  unirseACaja(salaId: string): void {
    this.socket.connect();
    this.socket.once('connect', () => {
      this.socket.emit('unirse-caja', salaId);
    });
    if (this.socket.connected) {
      this.socket.emit('unirse-caja', salaId);
    }
  }

  unirseComoMovil(salaId: string): void {
    this.socket.connect();
    this.socket.once('connect', () => {
      this.socket.emit('unirse-movil', salaId);
    });
    if (this.socket.connected) {
      this.socket.emit('unirse-movil', salaId);
    }
  }

  emitirCodigo(salaId: string, codigo: string): void {
    this.socket.emit('codigo-leido', { salaId, codigo });
  }

  escucharCodigo(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('codigo-leido', (data: string | { codigo: string; salaId?: string }) => {
        const codigo = typeof data === 'string' ? data : data?.codigo ?? '';
        if (codigo) observer.next(codigo);
      });
      return () => { this.socket.off('codigo-leido'); };
    });
  }

  estaConectado(): boolean {
    return this.socket.connected;
  }

  desconectar(): void {
    this.socket.disconnect();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
