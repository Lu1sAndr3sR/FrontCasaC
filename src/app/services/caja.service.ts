import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  // Base de la API
  private apiUrl = `${environment.apiUrl}/`;
  constructor(private http: HttpClient) { }

  // ================================
  //  1. ESTADO DE CAJA (Anti-Caché)
  // ================================
  verificarEstado(usuarioId: number): Observable<any> {
    // Agregamos timestamp para que el navegador NO guarde la respuesta vieja
    const timestamp = new Date().getTime();
    return this.http.get(`${this.apiUrl}/caja/estado/${usuarioId}?t=${timestamp}`);
  }

  // ================================
  //  2. ABRIR CAJA (CORREGIDO)
  // ================================
  abrirCaja(datos: { usuario_id: number, monto: number }): Observable<any> {
    // ENVIAMOS SOLO LO QUE EL BACKEND PIDE (Simple y directo)
    return this.http.post(`${this.apiUrl}/caja/abrir`, {
      usuario_id: Number(datos.usuario_id),
      monto: Number(datos.monto)
    });
  }

  // ================================
  //  3. OBTENER TOTALES PARA CORTE
  // ================================
  obtenerTotales(cajaId: number): Observable<any> {
    // Asegúrate que tu ruta en node sea /totales/:cajaId
    return this.http.get(`${this.apiUrl}/caja/totales/${cajaId}`);
  }

  // ================================
  //  4. REGISTRAR MOVIMIENTO (Egreso)
  // ================================
  registrarMovimiento(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/caja/movimiento`, {
      caja_id: Number(datos.caja_id),
      usuario_id: Number(datos.usuario_id),
      monto: Number(datos.monto),
      concepto: datos.concepto || '',
      tipo_movimiento: datos.tipo_movimiento // 'INGRESO' o 'EGRESO'
    });
  }

  // ================================
  //  5. CERRAR CAJA
  // ================================
  cerrarCaja(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/caja/cerrar`, {
      caja_id: Number(datos.caja_id),
      montoFinal: Number(datos.montoFinal),
      diferencia: Number(datos.diferencia),
      usuario_cierre_id: Number(datos.usuario_cierre_id)
    });
  }
}