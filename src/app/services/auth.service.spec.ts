import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('login() hace POST a /auth/login con usuario y contraseña', () => {
    const respMock = { token: 'abc', nombre: 'Admin' };
    service.login('admin', 'pass123').subscribe(resp => {
      expect(resp.token).toBe('abc');
    });
    const req = http.expectOne(`${base}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuario: 'admin', contrasena: 'pass123' });
    req.flush(respMock);
  });

  it('solicitarCodigoRegistro() hace POST a /auth/solicitar-registro con email', () => {
    service.solicitarCodigoRegistro('test@test.com').subscribe();
    const req = http.expectOne(`${base}/solicitar-registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com' });
    req.flush({ mensaje: 'Código enviado' });
  });

  it('solicitarResetContrasena() hace POST a /auth/solicitar-reset', () => {
    service.solicitarResetContrasena('miusuario').subscribe();
    const req = http.expectOne(`${base}/solicitar-reset`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuario: 'miusuario' });
    req.flush({ mensaje: 'OK' });
  });

  it('actualizarPerfil() hace PUT a /auth/perfil', () => {
    service.actualizarPerfil({ color_tema: 'verde' }).subscribe();
    const req = http.expectOne(`${base}/perfil`);
    expect(req.request.method).toBe('PUT');
    req.flush({ msg: 'Actualizado' });
  });
});
