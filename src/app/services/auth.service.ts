import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaLogin, RespuestaRegistro, CodigoInvitacion } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}/auth`;
  private empresasBase = `${environment.apiUrl}/empresas`;

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.base}/login`, {
      usuario,
      contrasena: password
    });
  }

  solicitarCodigoRegistro(email: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.base}/solicitar-registro`, { email });
  }

  registroAdmin(payload: {
    nombre: string; usuario: string; contrasena: string;
    email: string; codigo_verificacion: string;
  }): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.base}/registro`, payload);
  }

  registroEmpleado(payload: {
    nombre: string; usuario: string; contrasena: string;
    codigo_invitacion: string;
  }): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.base}/registro`, payload);
  }

  generarCodigo(sucursal_id: number | null, usos_max: number, rol_id = 2): Observable<{ codigo: string; usos_max: number; rol_id: number }> {
    return this.http.post<{ codigo: string; usos_max: number; rol_id: number }>(
      `${this.empresasBase}/codigos`,
      { sucursal_id, usos_max, rol_id }
    );
  }

  listarCodigos(): Observable<CodigoInvitacion[]> {
    return this.http.get<CodigoInvitacion[]>(`${this.empresasBase}/codigos`);
  }

  actualizarPerfil(data: { foto_perfil?: string | null; color_tema?: string | null }): Observable<{ msg: string }> {
    return this.http.put<{ msg: string }>(`${this.base}/perfil`, data);
  }

  solicitarResetContrasena(usuario: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.base}/solicitar-reset`, { usuario });
  }

  confirmarResetContrasena(usuario: string, codigo: string, nueva_contrasena: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.base}/confirmar-reset`, { usuario, codigo, nueva_contrasena });
  }

  actualizarLogoEmpresa(logo_empresa: string): Observable<{ mensaje: string }> {
    const empresaId = localStorage.getItem('empresa_id');
    return this.http.put<{ mensaje: string }>(`${this.empresasBase}/${empresaId}`, { logo_empresa });
  }
}
