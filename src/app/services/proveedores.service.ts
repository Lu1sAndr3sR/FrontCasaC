import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Proveedor } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private base = `${environment.apiUrl}/proveedores`;
  constructor(private http: HttpClient) {}

  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.base);
  }

  crear(p: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, p);
  }

  actualizar(id: number, p: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.base}/${id}`, p);
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
