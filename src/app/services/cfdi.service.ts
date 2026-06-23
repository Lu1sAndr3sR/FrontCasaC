import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CfdiVenta, RespuestaTimbrado, RespuestaSimple, RangoFechas, DatosCfdi } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class CfdiService {
  private base = `${environment.apiUrl}/cfdi`;

  constructor(private http: HttpClient) {}

  getCfdis(fechas: RangoFechas): Observable<CfdiVenta[]> {
    return this.http.get<CfdiVenta[]>(this.base, {
      params: { fechaInicio: fechas.fechaInicio, fechaFin: fechas.fechaFin }
    });
  }

  timbrar(cfdiId: number, datos: DatosCfdi): Observable<RespuestaTimbrado> {
    return this.http.post<RespuestaTimbrado>(`${this.base}/timbrar/${cfdiId}`, datos);
  }

  cancelar(cfdiId: number, motivo: string): Observable<RespuestaSimple> {
    return this.http.post<RespuestaSimple>(`${this.base}/cancelar/${cfdiId}`, { motivo });
  }

  getXml(cfdiId: number): Observable<{ xml: string; folio: string }> {
    return this.http.get<{ xml: string; folio: string }>(`${this.base}/${cfdiId}/xml`);
  }

  enviarCorreo(cfdiId: number, email: string): Observable<RespuestaSimple> {
    return this.http.post<RespuestaSimple>(`${this.base}/${cfdiId}/enviar-correo`, { email });
  }
}
