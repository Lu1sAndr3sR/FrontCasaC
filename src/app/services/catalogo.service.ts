import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CatalogoItem,
  CatalogoListaRespuesta,
  CatalogoStatsRespuesta,
} from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private base  = `${environment.apiUrl}/catalogo`;
  private admin = `${environment.apiUrl}/superadmin/catalogo`;

  constructor(private http: HttpClient) {}

  buscar(q: string): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.base}/buscar`, { params: { q } });
  }

  listar(params: { q?: string; page?: number; limit?: number; categoria?: string }): Observable<CatalogoListaRespuesta> {
    const p: Record<string, string> = {};
    if (params.q)         p['q']         = params.q;
    if (params.page)      p['page']      = String(params.page);
    if (params.limit)     p['limit']     = String(params.limit);
    if (params.categoria) p['categoria'] = params.categoria;
    return this.http.get<CatalogoListaRespuesta>(this.base, { params: p });
  }

  categorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/categorias`);
  }

  adoptar(ids: number[]): Observable<{ adoptados: number; omitidos: number; mensaje: string }> {
    return this.http.post<any>(`${this.base}/adoptar`, { ids });
  }

  adoptarTodo(): Observable<{ adoptados: number; omitidos: number; mensaje: string }> {
    return this.http.post<any>(`${this.base}/adoptar-todo`, {});
  }

  stats(): Observable<CatalogoStatsRespuesta> {
    return this.http.get<CatalogoStatsRespuesta>(`${this.admin}/stats`);
  }

  importarExcel(archivo: File): Observable<{ total: number; mensaje: string }> {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<any>(`${this.admin}/importar`, form);
  }

  limpiar(): Observable<{ mensaje: string }> {
    return this.http.delete<any>(`${this.admin}/limpiar`);
  }
}
