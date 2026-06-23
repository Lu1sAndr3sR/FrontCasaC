import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RangoFechas,
  RespuestaVentas,
  ProductoReporte,
  RespuestaCajaReporte,
  MovimientoInventarioReporte,
  RespuestaGraficas,
  VentaConDetalles
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { }

  getVentas(fechas: RangoFechas): Observable<RespuestaVentas> {
    return this.http.post<RespuestaVentas>(`${this.apiUrl}/ventas`, fechas);
  }

  getProductos(fechas: RangoFechas): Observable<ProductoReporte[]> {
    return this.http.post<ProductoReporte[]>(`${this.apiUrl}/productos`, fechas);
  }

  getCaja(fechas: RangoFechas): Observable<RespuestaCajaReporte> {
    return this.http.post<RespuestaCajaReporte>(`${this.apiUrl}/caja`, fechas);
  }

  getMovimientosInventario(fechas: RangoFechas): Observable<MovimientoInventarioReporte[]> {
    return this.http.get<MovimientoInventarioReporte[]>(`${environment.apiUrl}/inventario/historial`, {
      params: { fechaInicio: fechas.fechaInicio, fechaFin: fechas.fechaFin }
    });
  }

  getDatosGraficas(fechas: RangoFechas): Observable<RespuestaGraficas> {
    return this.http.post<RespuestaGraficas>(`${this.apiUrl}/graficas`, fechas);
  }

  getDetalleVenta(ventaId: number): Observable<VentaConDetalles> {
    return this.http.get<VentaConDetalles>(`${environment.apiUrl}/ventas/${ventaId}`);
  }

  exportarExcel(tipo: string, fechas: RangoFechas): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/exportar-excel`, { tipo, ...fechas }, { responseType: 'blob' });
  }
}
