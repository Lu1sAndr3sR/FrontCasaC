import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VentasService } from './ventas.service';
import { environment } from '../../environments/environment';
import { VentaPayload } from '../models/interfaces';

describe('VentasService', () => {
  let service: VentasService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/ventas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VentasService]
    });
    service = TestBed.inject(VentasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('debería crearse', () => expect(service).toBeTruthy());

  it('registrarVenta() hace POST a /ventas con el payload correcto', () => {
    const payload: VentaPayload = {
      folio: 'V-0001',
      usuario_id: 1,
      sucursal_id: 1,
      total: 250,
      tipo_venta: 'Tienda',
      tipo_pago: 'efectivo',
      detalles: [{
        producto_id: 1,
        cantidad: 10,
        precio_unitario: 25,
        subtotal: 250
      }]
    };
    service.registrarVenta(payload).subscribe(resp => {
      expect(resp).toBeTruthy();
    });
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.total).toBe(250);
    req.flush({ venta_id: 1, folio: 'V-0001', mensaje: 'OK' });
  });
});
