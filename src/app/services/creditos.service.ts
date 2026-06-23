import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VentaCredito } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class CreditosService {
  private base = `${environment.apiUrl}/creditos`;
  constructor(private http: HttpClient) {}

  listar(): Observable<VentaCredito[]> {
    return this.http.get<VentaCredito[]>(this.base);
  }

  listarSaldados(): Observable<VentaCredito[]> {
    return this.http.get<VentaCredito[]>(`${this.base}/saldados`);
  }

  registrarPago(venta_id: number, monto: number, notas?: string): Observable<{ mensaje: string; saldo_pendiente: number }> {
    return this.http.post<{ mensaje: string; saldo_pendiente: number }>(
      `${this.base}/${venta_id}/pagos`,
      { monto, notas }
    );
  }
}
