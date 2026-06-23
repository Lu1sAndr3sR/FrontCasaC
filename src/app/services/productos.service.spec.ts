import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductosService } from './productos.service';
import { environment } from '../../environments/environment';

describe('ProductosService', () => {
  let service: ProductosService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/productos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductosService]
    });
    service = TestBed.inject(ProductosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('debería crearse', () => expect(service).toBeTruthy());

  it('getProductosPaginados() hace GET con parámetros correctos', () => {
    const mockResp = { items: [], total: 0, page: 1, pages: 0 };
    service.getProductosPaginados({ page: 1, limit: 50, sucursal_id: 1 }).subscribe(resp => {
      expect(resp.items).toEqual([]);
    });
    const req = http.expectOne(r => r.url === api && r.params.get('page') === '1');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('sucursal_id')).toBe('1');
    req.flush(mockResp);
  });

  it('buscarProducto() hace GET con búsqueda y sucursal_id', () => {
    service.buscarProducto('tornillo', 1).subscribe();
    const req = http.expectOne(`${api}/buscar/tornillo?sucursal_id=1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createProducto() hace POST a /productos', () => {
    const nuevo = { nombre: 'Martillo', precio_menudeo: 100 } as any;
    service.createProducto(nuevo).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    req.flush({ producto_id: 99, ...nuevo });
  });

  it('deleteProducto() hace DELETE a /productos/:id', () => {
    service.deleteProducto(5).subscribe();
    const req = http.expectOne(`${api}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ eliminado: true });
  });
});
