import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs'; // 1. Importar Subject
import { environment } from '../../environments/environment'; 

export interface Producto {
  producto_id: number;
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  categoria: string;
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

  private api = `${environment.apiUrl}/productos`;

  // 2. Canal de comunicación para alertas
  private alertaStockSource = new Subject<string>();
  alertaStock$ = this.alertaStockSource.asObservable();

  constructor(private http: HttpClient) {}

  // --- NUEVA FUNCIÓN: Verificar y Avisar ---
  verificarStockBajo() {
    this.getProductos().subscribe({
      next: (productos) => {
        // Filtramos productos con stock <= 5
        const bajos = productos.filter(p => p.stock_actual <= 5);
        
        if (bajos.length > 0) {
          // Emitimos el aviso para quien esté escuchando (AppComponent)
          this.alertaStockSource.next(`⚠️ Atención: Tienes ${bajos.length} productos con stock crítico.`);
        }
      },
      error: (err) => console.error("Error validando stock", err)
    });
  }

  // --- TUS MÉTODOS ORIGINALES ---

  buscarProducto(busqueda: string): Observable<any> {
    return this.http.get(`${this.api}/buscar/${busqueda}`);
  }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.api);
  }

  createProducto(producto: any): Observable<any> {
    return this.http.post(this.api, producto);
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.api}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
 registrarMovimiento(datos: any): Observable<any> {
    // datos: { producto_id, usuario_id, tipo_movimiento, cantidad, observaciones }
    return this.http.post(`${this.api.replace('/productos', '')}/inventario/movimiento`, datos);
}
}