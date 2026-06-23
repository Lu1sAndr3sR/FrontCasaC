import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RespuestaCaja,
  RespuestaAbrirCaja,
  TotalesCaja,
  MovimientoCajaPayload,
  CerrarCajaPayload
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  verificarEstado(usuarioId: number, sucursalId?: number | null): Observable<RespuestaCaja> {
    const timestamp = new Date().getTime();
    const suc = sucursalId ? `&sucursal_id=${sucursalId}` : '';
    return this.http.get<RespuestaCaja>(`${this.apiUrl}/caja/estado/${usuarioId}?t=${timestamp}${suc}`);
  }

  abrirCaja(datos: { usuario_id: number, monto: number, sucursal_id?: number | null }): Observable<RespuestaAbrirCaja> {
    return this.http.post<RespuestaAbrirCaja>(`${this.apiUrl}/caja/abrir`, {
      usuario_id:  Number(datos.usuario_id),
      monto:       Number(datos.monto),
      sucursal_id: datos.sucursal_id ?? undefined
    });
  }

  obtenerTotales(cajaId: number): Observable<TotalesCaja> {
    return this.http.get<TotalesCaja>(`${this.apiUrl}/caja/totales/${cajaId}`);
  }

  registrarMovimiento(datos: MovimientoCajaPayload): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/caja/movimiento`, {
      caja_id: Number(datos.caja_id),
      usuario_id: Number(datos.usuario_id),
      monto: Number(datos.monto),
      concepto: datos.concepto || '',
      tipo_movimiento: datos.tipo_movimiento
    });
  }

  cerrarCaja(datos: CerrarCajaPayload): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/caja/cerrar`, {
      caja_id: Number(datos.caja_id),
      montoFinal: Number(datos.montoFinal),
      diferencia: Number(datos.diferencia),
      usuario_cierre_id: Number(datos.usuario_cierre_id)
    });
  }
}
