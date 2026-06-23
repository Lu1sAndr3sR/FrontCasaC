import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sucursal } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private base = `${environment.apiUrl}/sucursales`;

  constructor(private http: HttpClient) {}

  getSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.base);
  }

  createSucursal(data: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.base, data);
  }

  updateSucursal(id: number, data: Partial<Sucursal>): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.base}/${id}`, data);
  }
}
