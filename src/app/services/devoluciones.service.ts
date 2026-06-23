import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DetalleDevolucion {
  producto_id: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface DevolucionPayload {
  venta_id: number | null;
  folio_venta: string;
  motivo: string;
  usuario_id: number;
  sucursal_id: number;
  detalles: DetalleDevolucion[];
}

export interface VentaParaDevolucion {
  venta_id: number;
  folio: string;
  fecha: string;
  total: number;
  descuento_porcentaje?: number;
  detalles: {
    producto_id: number;
    nombre_producto: string;
    precio_unitario: number;
    cantidad: number;
    subtotal?: number;
  }[];
}

export interface DevolucionResumen {
  devolucion_id: number;
  folio_venta: string;
  fecha: string;
  total_devuelto: number;
  motivo?: string;
  usuario?: string;
  nombre_sucursal?: string;
  detalles?: DetalleDevolucion[];
}

@Injectable({ providedIn: 'root' })
export class DevolucionesService {
  private base = `${environment.apiUrl}/devoluciones`;

  constructor(private http: HttpClient) {}

  buscarVenta(folio: string): Observable<VentaParaDevolucion> {
    return this.http.get<VentaParaDevolucion>(`${this.base}/venta/${folio.trim()}`);
  }

  crear(payload: DevolucionPayload): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(this.base, payload);
  }

  listar(sucursalId: number, page = 1, limit = 20): Observable<{ data: DevolucionResumen[]; total: number; totalPaginas: number; page: number }> {
    return this.http.get<{ data: DevolucionResumen[]; total: number; totalPaginas: number; page: number }>(`${this.base}?sucursal_id=${sucursalId}&page=${page}&limit=${limit}`);
  }

  getHoy(sucursalId: number): Observable<{ total: number; count: number }> {
    return this.http.get<{ total: number; count: number }>(`${this.base}/hoy?sucursal_id=${sucursalId}`);
  }
}
