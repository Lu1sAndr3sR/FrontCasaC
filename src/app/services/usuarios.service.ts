import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, UsuarioRaw, RespuestaSimple } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<UsuarioRaw[]> {
    return this.http.get<UsuarioRaw[]>(this.apiUrl);
  }

  createUsuario(usuario: Usuario): Observable<RespuestaSimple> {
    return this.http.post<RespuestaSimple>(this.apiUrl, usuario);
  }

  updateUsuario(id: number, usuario: Partial<Usuario>): Observable<RespuestaSimple> {
    return this.http.put<RespuestaSimple>(`${this.apiUrl}/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<RespuestaSimple> {
    return this.http.delete<RespuestaSimple>(`${this.apiUrl}/${id}`);
  }
}
