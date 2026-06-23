import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClienteFiscal } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ClientesFiscalesService {
  private base = `${environment.apiUrl}/clientes-fiscales`;

  constructor(private http: HttpClient) {}

  buscarPorRfc(rfc: string): Observable<ClienteFiscal | null> {
    return this.http.get<ClienteFiscal | null>(`${this.base}/buscar`, {
      params: { rfc }
    });
  }

  crear(datos: Omit<ClienteFiscal, 'cliente_id' | 'activo'>): Observable<ClienteFiscal> {
    return this.http.post<ClienteFiscal>(this.base, datos);
  }

  actualizar(id: number, datos: Partial<ClienteFiscal>): Observable<ClienteFiscal> {
    return this.http.put<ClienteFiscal>(`${this.base}/${id}`, datos);
  }
}
