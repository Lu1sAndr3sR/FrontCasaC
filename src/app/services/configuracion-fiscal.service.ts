import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConfiguracionFiscal, RespuestaSimple } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ConfiguracionFiscalService {
  private base = `${environment.apiUrl}/configuracion`;

  constructor(private http: HttpClient) {}

  get(): Observable<ConfiguracionFiscal> {
    return this.http.get<ConfiguracionFiscal>(this.base);
  }

  guardar(datos: Record<string, string | number>): Observable<RespuestaSimple> {
    return this.http.put<RespuestaSimple>(this.base, datos);
  }
}
