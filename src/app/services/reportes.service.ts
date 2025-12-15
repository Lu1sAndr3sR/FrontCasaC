import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 
@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = `${environment.apiUrl}/reportes`;
  constructor(private http: HttpClient) { }

  // 1. Ventas
  getVentas(fechas: { fechaInicio: string, fechaFin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/ventas`, fechas);
  }

  // 2. Productos
  getProductos(fechas: { fechaInicio: string, fechaFin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/productos`, fechas);
  }

  // 3. Caja (Auditoría)
  getCaja(fechas: { fechaInicio: string, fechaFin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/caja`, fechas);
  }

  // 4. Bitácora Inventario (ESTE SE SUELE OLVIDAR)
  getMovimientosInventario(fechas: { fechaInicio: string, fechaFin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/inventario`, fechas);
  }

  // 5. Gráficas (ESTE ES NUEVO)
  getDatosGraficas(fechas: { fechaInicio: string, fechaFin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/graficas`, fechas);
  }
}