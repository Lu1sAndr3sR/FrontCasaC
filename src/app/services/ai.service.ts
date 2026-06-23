import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { VentaReporte, ProductoReporte, CorteReporte, TopProducto, TendenciaVenta, ResumenVentas, Compra, Producto, MovimientoInventarioReporte } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly base = `${environment.apiUrl}/ia`;
  private _tieneKey = false;

  constructor(private http: HttpClient) {
    this.cargarStatus().subscribe({ error: () => {} });
  }

  cargarStatus(): Observable<boolean> {
    return this.http.get<{ tieneKey: boolean }>(`${this.base}/status`).pipe(
      map(r => r.tieneKey),
      tap(v => { this._tieneKey = v; })
    );
  }

  tieneApiKey(): boolean { return this._tieneKey; }

  private llamar(sistemaPrompt: string, prompt: string, max_tokens = 1200): Observable<string> {
    if (!this._tieneKey) {
      return throwError(() => new Error('No hay API key configurada. Ve a Usuarios > Configuración IA.'));
    }
    return this.http.post<{ texto: string }>(`${this.base}/consultar`, {
      system: sistemaPrompt, prompt, max_tokens
    }).pipe(map(r => r.texto));
  }

  analizarReportes(datos: {
    ventas: VentaReporte[]; resumen: ResumenVentas; topProductos?: TopProducto[]; tendencia?: TendenciaVenta[]; cortes?: CorteReporte[]; compras?: Compra[];
  }): Observable<string> {
    const sys = 'Eres el analista de negocio de SC POS, sistema POS de ferretería. Responde siempre en español con bullet points claros. Sé práctico y conciso.';
    const prompt = `Analiza los datos del período y genera un informe inteligente:

RESUMEN: ${JSON.stringify(datos.resumen)}
VENTAS (últimas 20): ${JSON.stringify(datos.ventas.slice(0, 20).map(v => ({ folio: v.folio, total: v.total, cajero: v.nombre_cajero })))}
${datos.topProductos?.length ? `TOP PRODUCTOS: ${JSON.stringify(datos.topProductos)}` : ''}
${datos.tendencia?.length ? `TENDENCIA DIARIA: ${JSON.stringify(datos.tendencia)}` : ''}
${datos.cortes?.length ? `CORTES DE CAJA: ${datos.cortes.length} cortes` : ''}
${datos.compras?.length ? `COMPRAS: ${datos.compras.length} registradas` : ''}

Proporciona:
1. **Resumen ejecutivo** (2-3 oraciones)
2. **Insights clave** (máx. 3 puntos)
3. **Recomendación de acción para hoy** (1 punto concreto)`;
    return this.llamar(sys, prompt);
  }

  detectarAnomalias(ventas: VentaReporte[], cortes: CorteReporte[]): Observable<string> {
    const sys = 'Eres auditor financiero de SC POS, una ferretería. Identifica anomalías con criterio. Responde en español con bullet points.';
    const prompt = `Revisa estos datos en busca de anomalías o irregularidades:

VENTAS (${ventas.length}): ${JSON.stringify(ventas.slice(0, 30).map(v => ({ folio: v.folio, total: v.total, cajero: v.nombre_cajero })))}
CORTES DE CAJA: ${JSON.stringify(cortes.map(c => ({ fecha_apertura: c.fecha_apertura, fecha_cierre: c.fecha_cierre, monto_inicial: c.monto_inicial, monto_final: c.monto_final, diferencia: c.diferencia })))}

Identifica:
1. **Ventas anómalas** (importes inusuales, patrones sospechosos)
2. **Diferencias en caja** (montos esperados vs. contados)
3. **Otros patrones de riesgo**
Si no hay anomalías evidentes, indícalo claramente.`;
    return this.llamar(sys, prompt);
  }

  sugerirPrecio(producto: Producto, historial: MovimientoInventarioReporte[]): Observable<string> {
    const sys = 'Eres asesor de precios para una ferretería en México. Da recomendaciones prácticas. Responde en español.';
    const prompt = `Analiza este producto y su historial (últimos 30 días):

PRODUCTO: ${producto.nombre} | Precio público: $${producto.precio_menudeo} | Mayoreo: $${producto.precio_mayoreo} | Mín. mayoreo: ${producto.minimo_mayoreo ?? 'N/A'} | Stock actual: ${producto.stock_actual} | Stock mínimo: ${producto.stock_minimo ?? 5}

MOVIMIENTOS RECIENTES: ${JSON.stringify(historial.slice(0, 20).map(m => ({ tipo: m.tipo, cantidad: m.cantidad, fecha: m.fecha })))}

Proporciona:
1. **Evaluación del precio actual**
2. **Sugerencia de precio ajustado** con justificación
3. **Recomendación de stock mínimo**`;
    return this.llamar(sys, prompt);
  }

  analizarStockBajo(productosAlerta: { nombre: string; stock_actual: number; stock_minimo: number }[], ventasProductos: ProductoReporte[]): Observable<string> {
    const sys = 'Eres el sistema de alertas de inventario de SC POS, una ferretería. Analiza stock y prioriza reabastecimiento. Responde en español.';
    const prompt = `Analiza productos con stock bajo y ventas recientes (30 días):

PRODUCTOS EN ALERTA (${productosAlerta.length}): ${JSON.stringify(productosAlerta.map(p => ({ nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo ?? 5 })))}

VENTAS POR PRODUCTO (30 días): ${JSON.stringify(ventasProductos.slice(0, 15).map(p => ({ nombre: p.nombre, cantidad_vendida: p.cantidad })))}

Para cada producto:
1. Clasifica urgencia: **URGENTE** / **MODERADO** / **PUEDE ESPERAR**
2. Estima días de stock restantes (basado en velocidad de ventas)
3. Sugiere cantidad mínima a reordenar para 30 días de cobertura`;
    return this.llamar(sys, prompt);
  }

  asistenteCaja(pregunta: string, productos: Producto[]): Observable<string> {
    const sys = 'Eres el asistente de caja de SC POS, una ferretería. Tienes acceso al catálogo. Responde en español de forma breve y directa. Máximo 3 oraciones.';
    const prompt = `CATÁLOGO (${productos.length} productos): ${JSON.stringify(productos.slice(0, 60).map(p => ({ nombre: p.nombre, precio: p.precio_menudeo, mayoreo: p.precio_mayoreo, minMay: p.minimo_mayoreo, stock: p.stock_actual, cat: p.categoria })))}

PREGUNTA: ${pregunta}`;
    return this.llamar(sys, prompt);
  }
}
