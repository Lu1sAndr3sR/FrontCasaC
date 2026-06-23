import { Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../services/reportes.service';
import { CfdiService } from '../../services/cfdi.service';
import { ClientesFiscalesService } from '../../services/clientes-fiscales.service';
import { NegocioService } from '../../services/negocio.service';
import { ToastService } from '../../services/toast.service';
import { ComprasService } from '../../services/compras.service';
import { AiService } from '../../services/ai.service';
import { Chart, registerables } from 'chart.js';
import {
  VentaReporte,
  ResumenVentas,
  ProductoReporte,
  CorteReporte,
  MovimientoCajaReporte,
  MovimientoInventarioReporte,
  TopProducto,
  TendenciaVenta,
  TicketVenta,
  CfdiVenta,
  ClienteFiscal,
  DatosCfdi,
  Compra
} from '../../models/interfaces';
Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, OnDestroy {

  tabActiva: 'ventas' | 'movimientos' | 'caja' | 'graficas' | 'facturas' | 'compras' | 'ia' = 'ventas';

  // IA
  analisisIA = '';
  analisisAnomalias = '';
  cargandoIA = false;
  cargandoAnomalias = false;
  errorIA = '';
  errorAnomalias = '';

  fechaInicio: string = '';
  fechaFin: string = '';

  listaVentas: VentaReporte[] = [];
  resumenVentas: ResumenVentas = { totalDinero: 0, conteoVentas: 0 };
  listaProductos: ProductoReporte[] = [];
  listaCortes: CorteReporte[] = [];
  listaMovimientosCaja: MovimientoCajaReporte[] = [];
  listaBitacoraInv: MovimientoInventarioReporte[] = [];
  listaCompras: Compra[] = [];
  totalCompras = 0;

  chartBarras: Chart | undefined;
  chartLinea: Chart | undefined;

  cargando: boolean = false;
  ticketNota: TicketVenta | null = null;
  cargandoNota: boolean = false;

  // Facturas CFDI
  listaCfdis: CfdiVenta[] = [];
  procesandoCfdiId: number | null = null;
  modalCancelar = false;
  cfdiACancelar: CfdiVenta | null = null;
  motivoCancelacion = '';

  readonly regimenesFiscales = [
    { clave: '601', descripcion: 'General de Ley Personas Morales' },
    { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos' },
    { clave: '605', descripcion: 'Sueldos y Salarios e Ingresos Asimilados' },
    { clave: '606', descripcion: 'Arrendamiento' },
    { clave: '612', descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales' },
    { clave: '616', descripcion: 'Sin obligaciones fiscales' },
    { clave: '621', descripcion: 'Incorporación Fiscal' },
    { clave: '626', descripcion: 'Régimen Simplificado de Confianza' },
  ];

  readonly usosCfdi = [
    { clave: 'G01', descripcion: 'Adquisición de mercancias' },
    { clave: 'G02', descripcion: 'Devoluciones, descuentos o bonificaciones' },
    { clave: 'G03', descripcion: 'Gastos en general' },
    { clave: 'I01', descripcion: 'Construcciones' },
    { clave: 'I02', descripcion: 'Mobiliario y equipo de oficina' },
    { clave: 'I03', descripcion: 'Equipo de transporte' },
    { clave: 'I04', descripcion: 'Equipo de cómputo y accesorios' },
    { clave: 'I08', descripcion: 'Otra maquinaria y equipo' },
    { clave: 'S01', descripcion: 'Sin efectos fiscales' },
    { clave: 'CP01', descripcion: 'Pagos' },
  ];

  // Modal enviar correo
  modalEmail = false;
  cfdiAEnviar: CfdiVenta | null = null;
  emailDestino = '';
  enviandoCorreo = false;

  // Modal timbrar (datos fiscales)
  modalTimbrar = false;
  cfdiATimbrar: CfdiVenta | null = null;
  datosFiscales: DatosCfdi = { receptor_rfc: '', receptor_nombre: '', receptor_cp: '', receptor_regimen: '', uso_cfdi: '', guardar_cliente: false };
  clienteEncontrado: ClienteFiscal | null = null;
  buscandoRfc = false;

  constructor(
    private router: Router,
    private reportesService: ReportesService,
    private cfdiService: CfdiService,
    private clientesFiscalesService: ClientesFiscalesService,
    public negocioService: NegocioService,
    private toastService: ToastService,
    private comprasService: ComprasService,
    public aiService: AiService
  ) {}

  ngOnInit() {
    this.setFechasHoy();
    this.cargarDatos();
  }

  setFechasHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
  }

  cambiarTab(tab: 'ventas' | 'movimientos' | 'caja' | 'graficas' | 'facturas' | 'compras' | 'ia') {
    this.tabActiva = tab;
    if (tab !== 'ia') {
      this.cargarDatos();
    } else {
      this.analisisIA = '';
      this.analisisAnomalias = '';
      this.errorIA = '';
      this.errorAnomalias = '';
    }
  }

  cargarDatos() {
    this.cargando = true;
    const rango = { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin };

    if (this.tabActiva === 'ventas') {
      this.reportesService.getVentas(rango).subscribe({
        next: (res) => {
          this.listaVentas = res.datos;
          this.resumenVentas = res.resumen;
          this.cargando = false;
        }, error: () => { this.cargando = false; this.toastService.show('Error al cargar ventas', 'error'); }
      });
    }
    else if (this.tabActiva === 'caja') {
      this.reportesService.getCaja(rango).subscribe({
        next: (res) => {
          this.listaCortes = res.cortes;
          this.listaMovimientosCaja = res.movimientos;
          this.cargando = false;
        }, error: () => { this.cargando = false; this.toastService.show('Error al cargar auditoría de caja', 'error'); }
      });
    }
    else if (this.tabActiva === 'movimientos') {
      this.reportesService.getMovimientosInventario(rango).subscribe({
        next: (res) => {
          this.listaBitacoraInv = res;
          this.cargando = false;
        },
        error: () => { this.cargando = false; this.toastService.show('Error al cargar movimientos de productos', 'error'); }
      });
    }
    else if (this.tabActiva === 'facturas') {
      this.cfdiService.getCfdis(rango).subscribe({
        next: (res) => { this.listaCfdis = res; this.cargando = false; },
        error: () => { this.cargando = false; this.toastService.show('Error al cargar facturas', 'error'); }
      });
    }
    else if (this.tabActiva === 'compras') {
      this.comprasService.listar(this.fechaInicio, this.fechaFin).subscribe({
        next: (res) => {
          this.listaCompras = res;
          this.totalCompras = res.reduce((s, c) => s + Number(c.total), 0);
          this.cargando = false;
        },
        error: () => { this.cargando = false; this.toastService.show('Error al cargar compras', 'error'); }
      });
    }
    else if (this.tabActiva === 'graficas') {
      this.reportesService.getDatosGraficas(rango).subscribe({
        next: (res) => {
          this.cargando = false;
          setTimeout(() => {
            this.renderizarGraficas(res.topProductos, res.tendenciaVentas);
          }, 100);
        },
        error: () => { this.cargando = false; this.toastService.show('Error al cargar gráficas', 'error'); }
      });
    }
  }

  renderizarGraficas(topProds: TopProducto[], tendencia: TendenciaVenta[]) {
    if (this.chartBarras) this.chartBarras.destroy();
    if (this.chartLinea) this.chartLinea.destroy();

    const ctxBarras = document.getElementById('chartBarras') as HTMLCanvasElement;
    if (ctxBarras) {
      this.chartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
          labels: topProds.map(p => p.nombre),
          datasets: [{
            label: 'Unidades Vendidas',
            data: topProds.map(p => p.cantidad),
            backgroundColor: '#4cc9f0',
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#ccc' } },
            x: { grid: { display: false }, ticks: { color: '#ccc' } }
          }
        }
      });
    }

    const ctxLinea = document.getElementById('chartLinea') as HTMLCanvasElement;
    if (ctxLinea) {
      this.chartLinea = new Chart(ctxLinea, {
        type: 'line',
        data: {
          labels: tendencia.map(t => t.dia),
          datasets: [{
            label: 'Ingreso Total ($)',
            data: tendencia.map(t => t.total),
            borderColor: '#4cd96f',
            backgroundColor: 'rgba(76, 217, 111, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#ccc' } },
            x: { grid: { color: '#333' }, ticks: { color: '#ccc' } }
          }
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.chartBarras) this.chartBarras.destroy();
    if (this.chartLinea) this.chartLinea.destroy();
  }

  verNota(venta: VentaReporte): void {
    this.cargandoNota = true;
    this.reportesService.getDetalleVenta(venta.venta_id).subscribe({
      next: (detalle) => {
        const fechaObj = new Date(detalle.fecha);
        this.ticketNota = {
          folio: detalle.folio,
          fecha: fechaObj.toLocaleDateString('es-MX'),
          hora: fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          cajero: detalle.nombre_cajero ?? '—',
          tipoVenta: detalle.tipo_venta as 'Tienda' | 'Pedido',
          items: detalle.detalles.map(d => ({
            producto_id: d.producto_id,
            codigo: d.codigo_barras ?? '',
            nombre: d.nombre,
            cantidad: d.cantidad,
            precio_venta: d.precio_unitario,
            precio_menudeo: d.precio_unitario,
            precio_mayoreo: d.precio_unitario,
            minimo_mayoreo: null,
            subtotal: d.subtotal,
            stock_actual: 0
          })),
          subtotalSinIva: detalle.total,
          montoIva: 0,
          total: detalle.total,
          ivaActivo: false,
          ivaPorcentaje: 16,
          logoUrl: this.negocioService.logoActivo,
          nombreNegocio: this.negocioService.nombreNegocio
        };
        this.cargandoNota = false;
      },
      error: () => {
        this.toastService.show('No se pudo cargar la nota de venta.', 'error');
        this.cargandoNota = false;
      }
    });
  }

  cerrarNota(): void {
    this.ticketNota = null;
  }

  imprimirNota(): void {
    document.body.classList.add('print-ticket');
    window.print();
    document.body.classList.remove('print-ticket');
  }

  abrirModalTimbrar(cfdi: CfdiVenta): void {
    this.cfdiATimbrar = cfdi;
    this.clienteEncontrado = null;
    this.datosFiscales = {
      receptor_rfc:     cfdi.receptor_rfc     || '',
      receptor_nombre:  cfdi.receptor_nombre  || '',
      receptor_cp:      cfdi.receptor_cp      || '',
      receptor_regimen: cfdi.receptor_regimen || '',
      uso_cfdi:         cfdi.uso_cfdi         || '',
      guardar_cliente:  false
    };
    this.modalTimbrar = true;
    if (this.datosFiscales.receptor_rfc) {
      this.buscarClienteFiscal();
    }
  }

  buscarClienteFiscal(): void {
    const rfc = this.datosFiscales.receptor_rfc?.trim().toUpperCase();
    if (!rfc) return;
    this.datosFiscales.receptor_rfc = rfc;
    this.buscandoRfc = true;
    this.clienteEncontrado = null;
    this.clientesFiscalesService.buscarPorRfc(rfc).subscribe({
      next: (cliente) => {
        this.buscandoRfc = false;
        if (cliente) {
          this.clienteEncontrado = cliente;
          this.datosFiscales.receptor_nombre  = cliente.nombre_fiscal;
          this.datosFiscales.receptor_cp      = cliente.cp_fiscal;
          this.datosFiscales.receptor_regimen = cliente.regimen_fiscal;
          this.datosFiscales.uso_cfdi         = cliente.uso_cfdi_default;
        }
      },
      error: () => { this.buscandoRfc = false; }
    });
  }

  get datosFiscalesValidos(): boolean {
    const d = this.datosFiscales;
    return !!(d.receptor_rfc?.trim() && d.receptor_nombre?.trim() && d.receptor_cp?.trim() && d.receptor_regimen && d.uso_cfdi);
  }

  confirmarTimbrado(): void {
    if (!this.cfdiATimbrar) return;
    const cfdi = this.cfdiATimbrar;
    this.procesandoCfdiId = cfdi.cfdi_id;
    this.modalTimbrar = false;
    this.cfdiService.timbrar(cfdi.cfdi_id, this.datosFiscales).subscribe({
      next: (res) => {
        cfdi.cfdi_uuid        = res.uuid;
        cfdi.estado           = 'TIMBRADO';
        cfdi.receptor_rfc     = this.datosFiscales.receptor_rfc;
        cfdi.receptor_nombre  = this.datosFiscales.receptor_nombre;
        cfdi.receptor_cp      = this.datosFiscales.receptor_cp;
        cfdi.receptor_regimen = this.datosFiscales.receptor_regimen;
        cfdi.uso_cfdi         = this.datosFiscales.uso_cfdi;
        if (res.xml)     cfdi.xml_cfdi = res.xml;
        if (res.pdf_url) cfdi.pdf_url  = res.pdf_url;
        this.toastService.show(`CFDI timbrado — UUID: ${res.uuid.substring(0, 8)}...`, 'ok');
        this.procesandoCfdiId = null;
        this.persistirClienteFiscal();
      },
      error: (err) => {
        this.toastService.show('Error al timbrar: ' + (err.error?.mensaje || 'Verifica la conexión con el PAC'), 'error');
        this.procesandoCfdiId = null;
      }
    });
  }

  private persistirClienteFiscal(): void {
    if (!this.datosFiscales.guardar_cliente) return;
    const payload = {
      rfc:             this.datosFiscales.receptor_rfc,
      nombre_fiscal:   this.datosFiscales.receptor_nombre,
      cp_fiscal:       this.datosFiscales.receptor_cp,
      regimen_fiscal:  this.datosFiscales.receptor_regimen,
      uso_cfdi_default: this.datosFiscales.uso_cfdi
    };
    if (this.clienteEncontrado?.cliente_id) {
      this.clientesFiscalesService.actualizar(this.clienteEncontrado.cliente_id, payload).subscribe();
    } else {
      this.clientesFiscalesService.crear(payload).subscribe();
    }
  }

  cerrarModalTimbrar(): void {
    this.modalTimbrar = false;
    this.cfdiATimbrar = null;
  }

  abrirModalEmail(cfdi: CfdiVenta): void {
    this.cfdiAEnviar = cfdi;
    this.emailDestino = '';
    this.modalEmail = true;
  }

  cerrarModalEmail(): void {
    this.modalEmail = false;
    this.cfdiAEnviar = null;
  }

  confirmarEnvioCorreo(): void {
    if (!this.cfdiAEnviar || !this.emailDestino.trim()) return;
    this.enviandoCorreo = true;
    this.cfdiService.enviarCorreo(this.cfdiAEnviar.cfdi_id, this.emailDestino.trim()).subscribe({
      next: () => {
        this.toastService.show(`Factura enviada a ${this.emailDestino}`, 'ok');
        this.enviandoCorreo = false;
        this.cerrarModalEmail();
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'No se pudo enviar el correo', 'error');
        this.enviandoCorreo = false;
      }
    });
  }

  abrirModalCancelar(cfdi: CfdiVenta): void {
    this.cfdiACancelar = cfdi;
    this.motivoCancelacion = '';
    this.modalCancelar = true;
  }

  cerrarModalCancelar(): void {
    this.modalCancelar = false;
    this.cfdiACancelar = null;
  }

  confirmarCancelacion(): void {
    if (!this.cfdiACancelar || !this.motivoCancelacion) return;
    const cfdi = this.cfdiACancelar;
    this.procesandoCfdiId = cfdi.cfdi_id;
    this.modalCancelar = false;
    this.cfdiService.cancelar(cfdi.cfdi_id, this.motivoCancelacion).subscribe({
      next: () => {
        cfdi.estado = 'CANCELADO';
        this.toastService.show('CFDI cancelado correctamente', 'ok');
        this.procesandoCfdiId = null;
      },
      error: (err) => {
        this.toastService.show('Error al cancelar: ' + (err.error?.mensaje || 'Error desconocido'), 'error');
        this.procesandoCfdiId = null;
      }
    });
  }

  descargarXml(cfdi: CfdiVenta): void {
    if (cfdi.xml_cfdi) {
      this.triggerXmlDownload(cfdi.xml_cfdi, cfdi.folio_venta);
      return;
    }
    this.procesandoCfdiId = cfdi.cfdi_id;
    this.cfdiService.getXml(cfdi.cfdi_id).subscribe({
      next: (res) => {
        this.procesandoCfdiId = null;
        if (!res.xml) {
          this.toastService.show('El XML no está disponible aún (timbrado pendiente de PAC real)', 'error');
          return;
        }
        cfdi.xml_cfdi = res.xml;
        this.triggerXmlDownload(res.xml, res.folio);
      },
      error: () => {
        this.toastService.show('No se pudo obtener el XML', 'error');
        this.procesandoCfdiId = null;
      }
    });
  }

  private triggerXmlDownload(xml: string, folio: string): void {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CFDI_${folio}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  abrirPdf(cfdi: CfdiVenta): void {
    if (cfdi.pdf_url) window.open(cfdi.pdf_url, '_blank');
  }

  get cfdisPendientes(): number {
    return this.listaCfdis.filter(c => c.estado === 'PENDIENTE').length;
  }

  get cfdisTimbrados(): number {
    return this.listaCfdis.filter(c => c.estado === 'TIMBRADO').length;
  }

  analizarConIA() {
    if (!this.aiService.tieneApiKey()) {
      this.toastService.show('Configura tu API key de IA en Usuarios > Configuración IA', 'info');
      return;
    }
    this.cargandoIA = true;
    this.analisisIA = '';
    this.errorIA = '';

    const rango = { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin };

    this.reportesService.getDatosGraficas(rango).subscribe({
      next: (graficas) => {
        this.aiService.analizarReportes({
          ventas: this.listaVentas,
          resumen: this.resumenVentas,
          topProductos: graficas.topProductos,
          tendencia: graficas.tendenciaVentas,
          cortes: this.listaCortes,
          compras: this.listaCompras
        }).subscribe({
          next: (resp) => { this.analisisIA = resp; this.cargandoIA = false; },
          error: (err) => { this.errorIA = err.message || 'Error al conectar con la IA'; this.cargandoIA = false; }
        });
      },
      error: () => {
        this.aiService.analizarReportes({
          ventas: this.listaVentas,
          resumen: this.resumenVentas,
          cortes: this.listaCortes,
          compras: this.listaCompras
        }).subscribe({
          next: (resp) => { this.analisisIA = resp; this.cargandoIA = false; },
          error: (err) => { this.errorIA = err.message || 'Error al conectar con la IA'; this.cargandoIA = false; }
        });
      }
    });
  }

  detectarAnomalias() {
    if (!this.aiService.tieneApiKey()) {
      this.toastService.show('Configura tu API key de IA en Usuarios > Configuración IA', 'info');
      return;
    }
    this.cargandoAnomalias = true;
    this.analisisAnomalias = '';
    this.errorAnomalias = '';

    const rango = { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin };

    forkJoin({
      ventas: this.reportesService.getVentas(rango),
      caja:   this.reportesService.getCaja(rango)
    }).pipe(
      switchMap(({ ventas, caja }) => this.aiService.detectarAnomalias(ventas.datos, caja.cortes))
    ).subscribe({
      next: (resp) => { this.analisisAnomalias = resp; this.cargandoAnomalias = false; },
      error: (err) => { this.errorAnomalias = err.message || 'No se pudieron cargar los datos'; this.cargandoAnomalias = false; }
    });
  }

  exportarExcel(tipo: 'ventas' | 'productos' | 'caja' | 'inventario') {
    const rango = { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin };
    this.reportesService.exportarExcel(tipo, rango).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CasaC_${tipo}_${this.fechaInicio}_${this.fechaFin}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toastService.show('Error al exportar Excel', 'error')
    });
  }

  exportarPDF(tipo: 'ventas' | 'productos' | 'caja' | 'inventario') {
    const doc = new jsPDF({ orientation: 'landscape' });
    const titulo = `CasaC — Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const subtitulo = `Período: ${this.fechaInicio} al ${this.fechaFin}`;

    doc.setFontSize(16);
    doc.setTextColor(30, 34, 39);
    doc.text(titulo, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitulo, 14, 23);

    let head: string[][] = [];
    let body: (string | number | undefined)[][] = [];

    if (tipo === 'ventas') {
      head = [['Folio', 'Fecha', 'Total', 'Tipo', 'Cajero', 'Sucursal']];
      body = this.listaVentas.map(v => [v.folio, v.fecha, `$${parseFloat(String(v.total)).toFixed(2)}`, v.tipo_venta || '', v.nombre_cajero, v.nombre_sucursal || '']);
    } else if (tipo === 'productos') {
      head = [['Código', 'Producto', 'Cant. vendida', 'Total generado']];
      body = this.listaProductos.map(p => [p.codigo_barras || '', p.nombre, p.cantidad, `$${parseFloat(String(p.total)).toFixed(2)}`]);
    } else if (tipo === 'caja') {
      head = [['Apertura', 'Cierre', 'Monto inicial', 'Monto final', 'Abrió', 'Cerró', 'Sucursal']];
      body = this.listaCortes.map(c => [c.fecha_apertura, c.fecha_cierre || '—', `$${parseFloat(String(c.monto_inicial)).toFixed(2)}`, `$${parseFloat(String(c.monto_final || 0)).toFixed(2)}`, c.abrio, c.cerro || '—', c.nombre_sucursal || '']);
    } else if (tipo === 'inventario') {
      head = [['Fecha', 'Tipo', 'Cantidad', 'Producto', 'Código', 'Usuario', 'Sucursal']];
      body = this.listaBitacoraInv.map(m => [m.fecha, m.tipo, m.cantidad, m.producto, m.codigo_barras || '', m.usuario || '', m.nombre_sucursal || '']);
    }

    autoTable(doc, {
      head,
      body: body as (string | number)[][],
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 34, 39], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`CasaC_${tipo}_${this.fechaInicio}_${this.fechaFin}.pdf`);
  }

  goDashboard() { this.router.navigate(['/dashboard']); }
  goCaja() { this.router.navigate(['/caja']); }
  goUsuarios() { this.router.navigate(['/usuarios']); }
  goInventario() { this.router.navigate(['/inventario']); }
  goNotificaciones() { this.router.navigate(['/notificaciones']); }
}
