import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CatSatItem, CatSatUsoCfdi, CatSatRegimenFiscal, CatSatProductoServicio, CatSatColonia } from '../models/interfaces';

const FORMAS_PAGO_DEFAULT: CatSatItem[] = [
  { clave: '01', descripcion: 'Efectivo' },
  { clave: '03', descripcion: 'Transferencia electrónica de fondos' },
  { clave: '04', descripcion: 'Tarjeta de crédito' },
  { clave: '28', descripcion: 'Tarjeta de débito' },
  { clave: '05', descripcion: 'Monedero electrónico' },
  { clave: '02', descripcion: 'Cheque nominativo' },
  { clave: '99', descripcion: 'Por definir' },
];

const USOS_CFDI_DEFAULT: CatSatUsoCfdi[] = [
  { clave: 'G01', descripcion: 'Adquisición de mercancias',          aplica_fisica: true,  aplica_moral: true  },
  { clave: 'G03', descripcion: 'Gastos en general',                   aplica_fisica: true,  aplica_moral: true  },
  { clave: 'I01', descripcion: 'Construcciones',                      aplica_fisica: true,  aplica_moral: true  },
  { clave: 'I03', descripcion: 'Equipo de transporte',                aplica_fisica: true,  aplica_moral: true  },
  { clave: 'I04', descripcion: 'Equipo de cómputo y accesorios',      aplica_fisica: true,  aplica_moral: true  },
  { clave: 'I08', descripcion: 'Otra maquinaria y equipo',            aplica_fisica: true,  aplica_moral: true  },
  { clave: 'D01', descripcion: 'Honorarios médicos y gastos hospitalarios', aplica_fisica: true, aplica_moral: false },
  { clave: 'D10', descripcion: 'Pagos por servicios educativos',      aplica_fisica: true,  aplica_moral: false },
  { clave: 'S01', descripcion: 'Sin efectos fiscales',                aplica_fisica: true,  aplica_moral: true  },
  { clave: 'CP01', descripcion: 'Pagos',                              aplica_fisica: true,  aplica_moral: true  },
  { clave: 'CN01', descripcion: 'Nómina',                             aplica_fisica: true,  aplica_moral: false },
];

const REGIMENES_DEFAULT: CatSatRegimenFiscal[] = [
  { clave: '601', descripcion: 'General de Ley Personas Morales',                         aplica_fisica: false, aplica_moral: true  },
  { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos',                aplica_fisica: false, aplica_moral: true  },
  { clave: '605', descripcion: 'Sueldos y Salarios e Ingresos Asimilados a Salarios',     aplica_fisica: true,  aplica_moral: false },
  { clave: '606', descripcion: 'Arrendamiento',                                           aplica_fisica: true,  aplica_moral: false },
  { clave: '608', descripcion: 'Demás ingresos',                                          aplica_fisica: true,  aplica_moral: false },
  { clave: '610', descripcion: 'Residentes en el Extranjero sin Establecimiento Permanente', aplica_fisica: true, aplica_moral: true },
  { clave: '611', descripcion: 'Ingresos por Dividendos',                                 aplica_fisica: true,  aplica_moral: false },
  { clave: '612', descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales', aplica_fisica: true, aplica_moral: false },
  { clave: '614', descripcion: 'Ingresos por intereses',                                  aplica_fisica: true,  aplica_moral: false },
  { clave: '616', descripcion: 'Sin obligaciones fiscales',                               aplica_fisica: true,  aplica_moral: false },
  { clave: '620', descripcion: 'Sociedades Cooperativas de Producción',                   aplica_fisica: false, aplica_moral: true  },
  { clave: '621', descripcion: 'Incorporación Fiscal',                                    aplica_fisica: true,  aplica_moral: false },
  { clave: '622', descripcion: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', aplica_fisica: true, aplica_moral: true  },
  { clave: '623', descripcion: 'Opcional para Grupos de Sociedades',                      aplica_fisica: false, aplica_moral: true  },
  { clave: '624', descripcion: 'Coordinados',                                             aplica_fisica: false, aplica_moral: true  },
  { clave: '625', descripcion: 'Régimen de Plataformas Tecnológicas',                     aplica_fisica: true,  aplica_moral: false },
  { clave: '626', descripcion: 'Régimen Simplificado de Confianza (RESICO)',               aplica_fisica: true,  aplica_moral: true  },
];

@Injectable({ providedIn: 'root' })
export class SatService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFormasPago(): Observable<CatSatItem[]> {
    return this.http.get<CatSatItem[]>(`${this.base}/sat/formas-pago`).pipe(
      catchError(() => of(FORMAS_PAGO_DEFAULT))
    );
  }

  getUsosCfdi(): Observable<CatSatUsoCfdi[]> {
    return this.http.get<CatSatUsoCfdi[]>(`${this.base}/sat/usos-cfdi`).pipe(
      catchError(() => of(USOS_CFDI_DEFAULT))
    );
  }

  getRegimenesFiscales(): Observable<CatSatRegimenFiscal[]> {
    return this.http.get<CatSatRegimenFiscal[]>(`${this.base}/sat/regimenes-fiscales`).pipe(
      catchError(() => of(REGIMENES_DEFAULT))
    );
  }

  buscarClaveSat(texto: string): Observable<CatSatProductoServicio[]> {
    return this.http.get<CatSatProductoServicio[]>(`${this.base}/sat/productos`, {
      params: { q: texto }
    }).pipe(catchError(() => of([])));
  }

  getColoniasPorCp(cp: string): Observable<CatSatColonia[]> {
    return this.http.get<CatSatColonia[]>(`${this.base}/sat/colonias`, {
      params: { cp }
    }).pipe(catchError(() => of([])));
  }
}
