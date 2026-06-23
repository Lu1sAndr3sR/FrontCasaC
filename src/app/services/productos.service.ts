import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto, MovimientoInventario, RespuestaSimple, RespuestaEliminar } from '../models/interfaces';

export interface ProductosPaginados {
  items:  Producto[];
  total:  number;
  page:   number;
  pages:  number;
  limit:  number;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {

  private api = `${environment.apiUrl}/productos`;

  private alertaStockSource = new Subject<string>();
  alertaStock$ = this.alertaStockSource.asObservable();

  constructor(private http: HttpClient) {}

  verificarStockBajo() {
    this.http.get<{ count: number }>(`${this.api}/stock-bajo-count`).subscribe({
      next: ({ count }) => {
        if (count > 0) this.alertaStockSource.next(`⚠️ Atención: Tienes ${count} productos con stock crítico.`);
      },
      error: () => {}
    });
  }

  buscarProducto(busqueda: string, sucursalId?: number): Observable<Producto[]> {
    const params = sucursalId ? `?sucursal_id=${sucursalId}` : '';
    return this.http.get<Producto[]>(`${this.api}/buscar/${busqueda}${params}`);
  }

  getProductosPaginados(params: {
    page?: number; limit?: number; q?: string; categoria?: string; sucursal_id?: number;
  }): Observable<ProductosPaginados> {
    const p: Record<string, string> = {};
    if (params.page)        p['page']        = String(params.page);
    if (params.limit)       p['limit']       = String(params.limit);
    if (params.q)           p['q']           = params.q;
    if (params.categoria)   p['categoria']   = params.categoria;
    if (params.sucursal_id) p['sucursal_id'] = String(params.sucursal_id);
    return this.http.get<ProductosPaginados>(this.api, { params: p });
  }

  // Mantener compatibilidad con caja y otros módulos que esperan array
  getProductos(sucursalId?: number): Observable<Producto[]> {
    return new Observable(obs => {
      this.getProductosPaginados({ sucursal_id: sucursalId, limit: 200 }).subscribe({
        next: r => { obs.next(r.items); obs.complete(); },
        error: e => obs.error(e),
      });
    });
  }

  createProducto(producto: Partial<Producto>): Observable<RespuestaSimple> {
    return this.http.post<RespuestaSimple>(this.api, producto);
  }

  updateProducto(id: number, producto: Partial<Producto>): Observable<RespuestaSimple> {
    return this.http.put<RespuestaSimple>(`${this.api}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<RespuestaEliminar> {
    return this.http.delete<RespuestaEliminar>(`${this.api}/${id}`);
  }

  registrarMovimiento(datos: MovimientoInventario): Observable<RespuestaSimple> {
    return this.http.post<RespuestaSimple>(`${environment.apiUrl}/inventario/movimiento`, datos);
  }

  importarExcel(archivo: File): Observable<{ mensaje: string; importados: number; omitidos: number; errores: string[]; total_filas: number }> {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<any>(`${this.api}/importar`, form);
  }
}
