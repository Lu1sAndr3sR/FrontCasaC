import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VentaPayload, RespuestaVenta } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  registrarVenta(datosVenta: VentaPayload): Observable<RespuestaVenta> {
    return this.http.post<RespuestaVenta>(this.apiUrl, datosVenta);
  }
}
