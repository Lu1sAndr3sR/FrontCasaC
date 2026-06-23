import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CotizacionesService } from './cotizaciones.service';
import { environment } from '../../environments/environment';

describe('CotizacionesService', () => {
  let service: CotizacionesService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/cotizaciones`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CotizacionesService]
    });
    service = TestBed.inject(CotizacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('debería crearse', () => expect(service).toBeTruthy());

  it('listar() hace GET a /cotizaciones', () => {
    service.listar().subscribe(lista => expect(lista).toEqual([]));
    const req = http.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('crear() hace POST con el payload y devuelve folio', () => {
    const payload = { cliente_nombre: 'Juan', items: [{ nombre_producto: 'X', cantidad: 1, precio_unitario: 10, descuento_pct: 0, subtotal: 10 }] };
    service.crear(payload).subscribe(resp => {
      expect(resp.folio).toBe('COT-0001');
    });
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    req.flush({ cotizacion_id: 1, folio: 'COT-0001' });
  });

  it('actualizarEstado() hace PUT con el estado', () => {
    service.actualizarEstado(1, 'ACEPTADA').subscribe();
    const req = http.expectOne(`${api}/1/estado`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ estado: 'ACEPTADA' });
    req.flush({ ok: true });
  });
});
