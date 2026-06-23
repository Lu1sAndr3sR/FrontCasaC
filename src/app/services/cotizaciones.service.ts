import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cotizacion } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private url = `${environment.apiUrl}/cotizaciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.url);
  }

  detalle(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.url}/${id}`);
  }

  crear(payload: Partial<Cotizacion>): Observable<{ cotizacion_id: number; folio: string }> {
    return this.http.post<{ cotizacion_id: number; folio: string }>(this.url, payload);
  }

  actualizarEstado(id: number, estado: string): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}/estado`, { estado });
  }
}
