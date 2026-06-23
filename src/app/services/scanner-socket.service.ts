import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class ScannerSocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io(window.location.origin, { autoConnect: false });

    this.socket.on('disconnect', (reason) =>
      console.warn('[Scanner] Socket desconectado:', reason));
    this.socket.on('connect_error', (err) =>
      console.error('[Scanner] Error de conexión:', err.message));
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
