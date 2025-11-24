import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  producto_id: number;
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  precio_menudeo: number;
  precio_mayoreo: number;
  precio_oferta: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private api = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.api);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
