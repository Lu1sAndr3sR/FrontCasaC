import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SucursalDetalle {
  sucursal_id:   number;
  nombre:        string;
  direccion:     string;
  cp_sat:        string;
  activa:        boolean;
}

export interface UsuarioDetalle {
  usuario_id:  number;
  nombre:      string;
  usuario:     string;
  rol_id:      number;
  sucursal_id: number;
  activo:      boolean;
}

export interface VentaDetalle {
  venta_id:    number;
  folio:       string;
  fecha:       string;
  total:       number;
  tipo_pago:   string;
  sucursal_id: number;
}

export interface TotalSucursal {
  nombre_sucursal: string;
  conteo:          number;
  total:           number;
}

export interface MovimientoDetalle {
  movimiento_id:   number;
  nombre_producto: string;
  tipo_movimiento: string;
  cantidad:        number;
  motivo:          string;
  fecha:           string;
  sucursal_id:     number;
}

export interface EmpresaDetalle {
  empresa:          EmpresaAdmin;
  sucursales:       SucursalDetalle[];
  usuarios:         UsuarioDetalle[];
  ventas_recientes: VentaDetalle[];
  totales_sucursal: TotalSucursal[];
  movimientos:      MovimientoDetalle[];
}

export interface EmpresaAdmin {
  empresa_id:      number;
  rfc:             string;
  razon_social:    string;
  regimen_fiscal:  string;
  activo:          boolean;
  estado:          'pendiente' | 'activa' | 'suspendida' | 'rechazada';
  email_contacto:  string | null;
  notas_admin:     string | null;
  creado_en:       string | null;
  total_sucursales: number;
  total_usuarios:   number;
}

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private base = `${environment.apiUrl}/superadmin`;

  constructor(private http: HttpClient) {}

  listarEmpresas(): Observable<EmpresaAdmin[]> {
    return this.http.get<EmpresaAdmin[]>(`${this.base}/empresas`);
  }

  aprobar(id: number, notas?: string): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.base}/empresas/${id}/aprobar`, { notas });
  }

  rechazar(id: number, notas?: string): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.base}/empresas/${id}/rechazar`, { notas });
  }

  suspender(id: number, notas?: string): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.base}/empresas/${id}/suspender`, { notas });
  }

  reactivar(id: number): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.base}/empresas/${id}/reactivar`, {});
  }

  actualizarNotas(id: number, notas: string): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.base}/empresas/${id}/notas`, { notas });
  }

  detalle(id: number): Observable<EmpresaDetalle> {
    return this.http.get<EmpresaDetalle>(`${this.base}/empresas/${id}/detalle`);
  }

  toggleSucursal(id: number): Observable<{ mensaje: string; activa: boolean }> {
    return this.http.put<{ mensaje: string; activa: boolean }>(`${this.base}/sucursales/${id}/toggle`, {});
  }

  toggleUsuario(id: number): Observable<{ mensaje: string; activo: boolean }> {
    return this.http.put<{ mensaje: string; activo: boolean }>(`${this.base}/usuarios/${id}/toggle`, {});
  }
}
