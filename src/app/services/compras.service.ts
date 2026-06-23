import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Compra, DetalleCompraItem } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private base = `${environment.apiUrl}/compras`;
  constructor(private http: HttpClient) {}

  listar(fechaInicio?: string, fechaFin?: string): Observable<Compra[]> {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin)    params['fechaFin']    = fechaFin;
    return this.http.get<Compra[]>(this.base, { params });
  }

  crear(payload: { proveedor_id?: number | null; folio?: string; notas?: string; items: DetalleCompraItem[]; descontar_de_caja?: boolean }): Observable<{ mensaje: string; compra_id: number }> {
    return this.http.post<{ mensaje: string; compra_id: number }>(this.base, payload);
  }
}
