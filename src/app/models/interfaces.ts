export interface Usuario {
  usuario_id?: number;
  nombre: string;
  usuario: string;
  contrasena?: string;
  rol: 'ADMINISTRADOR' | 'EMPLEADO';
  sucursal_id?: number;
  empresa_id?: number;
  foto_perfil?: string | null;
  color_tema?: string | null;
  activo?: boolean;
}

export interface UsuarioRaw {
  usuario_id: number;
  nombre: string;
  usuario: string;
  rol_id: number;
  sucursal_id?: number;
  empresa_id?: number;
}

export interface Producto {
  producto_id: number;
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio_menudeo: number;
  precio_mayoreo: number;
  precio_oferta: number;
  stock_actual: number;
  stock_minimo: number | null;
  minimo_mayoreo: number | null;
  activo: boolean;
  clave_sat?: string;
  clave_unidad_sat?: string;
  objeto_imp?: string;
}

export interface CarritoItem {
  producto_id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_venta: number;
  precio_menudeo: number;
  precio_mayoreo: number;
  minimo_mayoreo: number | null;
  subtotal: number;
  stock_actual: number;
}

export interface DatosCfdi {
  receptor_rfc: string;
  receptor_nombre: string;
  receptor_cp: string;
  receptor_regimen: string;
  uso_cfdi: string;
  guardar_cliente: boolean;
}

export interface ClienteFiscal {
  cliente_id?: number;
  rfc: string;
  nombre_fiscal: string;
  cp_fiscal: string;
  regimen_fiscal: string;
  uso_cfdi_default: string;
  email?: string;
  activo?: boolean;
}

export interface CatSatItem {
  clave: string;
  descripcion: string;
}

export interface CatSatUsoCfdi extends CatSatItem {
  aplica_fisica: boolean;
  aplica_moral: boolean;
}

export interface CatSatRegimenFiscal extends CatSatItem {
  aplica_fisica: boolean;
  aplica_moral: boolean;
}

export interface CatSatProductoServicio {
  clave: string;
  descripcion: string;
}

export interface VentaPayload {
  folio: string;
  usuario_id: number;
  sucursal_id?: number;
  total: number;
  tipo_venta: 'Tienda' | 'Pedido';
  pedido_numero?: string;
  forma_pago?: string;
  descuento_porcentaje?: number;
  tipo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  nombre_cliente?: string;
  saldo_pendiente?: number;
  datos_cfdi?: DatosCfdi;
  detalles: {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
}

export interface MovimientoInventario {
  producto_id: number;
  usuario_id: number;
  sucursal_id?: number;
  tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'PERDIDA';
  cantidad: number;
  motivo?: string;
  observaciones?: string;
}

export interface TotalesCaja {
  montoInicial: number;
  totalVentas: number;
  totalIngresos: number;
  totalEgresos: number;
  totalDevoluciones: number;
  montoEsperado: number;
  fecha_apertura: string;
}

export interface Empresa {
  empresa_id: number;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  activo: boolean;
}

export interface Sucursal {
  sucursal_id: number;
  empresa_id: number;
  nombre: string;
  direccion: string;
  cp_sat: string;
  latitud: number;
  longitud: number;
  activa: boolean;
  logo_b64?: string | null;
}

export interface RespuestaLogin {
  token: string;
  usuario_id?: number;
  id?: number;
  nombre?: string;
  rol_id?: number;
  empresa_id?: number;
  sucursal_id?: number;
  foto_perfil?: string | null;
  color_tema?: string | null;
  sucursal_nombre?: string;
  sucursal_cp_sat?: string;
  sucursal_logo?: string | null;
  empresa_logo?: string | null;
  empresa_nombre?: string | null;
  es_superadmin?: boolean;
  usuario?: {
    usuario_id?: number;
    nombre?: string;
    usuario?: string;
  };
}

export interface RespuestaRegistro {
  mensaje: string;
  usuario_id: number;
  rol_id: number;
  empresa_id: number;
  sucursal_id: number;
}

export interface CodigoInvitacion {
  codigo_id?: number;
  empresa_id: number;
  sucursal_id?: number | null;
  codigo: string;
  usos_restantes: number;
  activo: boolean;
  creado_por?: number;
}

export interface CatalogoItem {
  catalogo_id: number;
  nombre: string;
  categoria_sugerida?: string;
  clave_sat_sugerida?: string;
  unidad_sat_sugerida?: string;
  // Campos opcionales presentes cuando viene del catálogo maestro
  codigo_barras?: string;
  descripcion?: string;
  precio_menudeo?: number;
  precio_mayoreo?: number;
  precio_oferta?: number;
  stock_minimo?: number;
}

export interface CatalogoMaestroItem {
  catalogo_id:        number;
  codigo_barras?:     string;
  nombre:             string;
  descripcion?:       string;
  categoria_sugerida?: string;
  precio_menudeo:     number;
  precio_mayoreo:     number;
  precio_oferta:      number;
  stock_minimo:       number;
  minimo_mayoreo?:    number;
  clave_sat_sugerida?: string;
  unidad_sat_sugerida?: string;
  objeto_imp?:        string;
  ya_adoptado?:       boolean;
}

export interface CatalogoListaRespuesta {
  items:  CatalogoMaestroItem[];
  total:  number;
  page:   number;
  pages:  number;
}

export interface CatalogoStatsRespuesta {
  total:      number;
  categorias: number;
}

export interface RespuestaCaja {
  abierta: boolean;
  datos?: { caja_id: number };
}

export interface RespuestaAbrirCaja {
  caja: { caja_id: number };
}

export interface MovimientoCajaPayload {
  caja_id: number;
  usuario_id: number;
  monto: number;
  concepto: string;
  tipo_movimiento: 'EGRESO' | 'INGRESO';
}

export interface CerrarCajaPayload {
  caja_id: number;
  montoFinal: number;
  diferencia: number;
  usuario_cierre_id: number;
}

export interface RespuestaSimple {
  mensaje: string;
}

export interface RespuestaEliminar {
  mensaje: string;
  eliminado?: boolean;
}

export interface RespuestaVenta {
  mensaje: string;
  folio: string;
}

export interface DetalleVentaItem {
  producto_id: number;
  nombre: string;
  codigo_barras?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaConDetalles extends VentaReporte {
  detalles: DetalleVentaItem[];
}

export interface TicketVenta {
  folio: string;
  fecha: string;
  hora: string;
  cajero: string;
  tipoVenta: 'Tienda' | 'Pedido';
  items: CarritoItem[];
  subtotalSinIva: number;
  montoIva: number;
  total: number;
  ivaActivo: boolean;
  ivaPorcentaje: number;
  logoUrl: string;
  nombreNegocio: string;
}

export interface Notificacion {
  nombreProducto: string;
  titulo: string;
  mensaje: string;
  detalle: string;
  tipo: string;
  fecha: Date;
}

export interface RangoFechas {
  fechaInicio: string;
  fechaFin: string;
}

export interface ResumenVentas {
  totalDinero: number;
  conteoVentas: number;
}

export interface VentaReporte {
  venta_id: number;
  folio: string;
  fecha: string;
  total: number;
  tipo_venta: string;
  nombre_cajero?: string;
  pedido_numero?: string;
  nombre_sucursal?: string;
}

export interface RespuestaVentas {
  datos: VentaReporte[];
  resumen: ResumenVentas;
}

export interface ProductoReporte {
  nombre: string;
  cantidad: number;
  total: number;
  categoria?: string;
  codigo_barras?: string;
  stock_actual?: number;
}

export interface CorteReporte {
  caja_id: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_final?: number;
  diferencia?: number;
  abrio?: string;
  cerro?: string;
  nombre_sucursal?: string;
}

export interface MovimientoCajaReporte {
  movimiento_id: number;
  fecha: string;
  tipo_movimiento: string;
  monto: number;
  concepto: string;
  usuario?: string;
  nombre_sucursal?: string;
}

export interface RespuestaCajaReporte {
  cortes: CorteReporte[];
  movimientos: MovimientoCajaReporte[];
}

export interface MovimientoInventarioReporte {
  movimiento_id?: number;
  fecha: string;
  producto: string;
  codigo_barras?: string;
  tipo: string;
  motivo?: string;
  cantidad: number;
  stock_anterior?: number;
  stock_nuevo?: number;
  observaciones?: string;
  usuario?: string;
  nombre_sucursal?: string;
}

export interface CatSatColonia {
  colonia: string;
  tipo_asentamiento: string;
}

export interface CfdiVenta {
  cfdi_id: number;
  venta_id: number;
  folio_venta: string;
  fecha_venta: string;
  total_venta: number;
  receptor_rfc: string;
  receptor_nombre: string;
  receptor_cp: string;
  receptor_regimen: string;
  uso_cfdi: string;
  cfdi_uuid?: string;
  estado: 'PENDIENTE' | 'TIMBRADO' | 'CANCELADO';
  xml_cfdi?: string;
  pdf_url?: string;
  creado_en: string;
}

export interface RespuestaTimbrado {
  uuid: string;
  estado: string;
  xml?: string;
  pdf_url?: string;
}

export interface TopProducto {
  nombre: string;
  cantidad: number;
}

export interface TendenciaVenta {
  dia: string;
  total: number;
}

export interface RespuestaGraficas {
  topProductos: TopProducto[];
  tendenciaVentas: TendenciaVenta[];
}

export interface Proveedor {
  proveedor_id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

export interface DetalleCompraItem {
  producto_id?: number | null;
  nombre_producto: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
}

export interface Compra {
  compra_id?: number;
  proveedor_id?: number | null;
  proveedor_nombre?: string | null;
  folio?: string;
  total: number;
  notas?: string;
  fecha?: string;
  detalles?: DetalleCompraItem[];
}

export interface PagoCredito {
  pago_id?: number;
  venta_id: number;
  monto: number;
  fecha?: string;
  notas?: string;
}

export interface VentaCredito {
  venta_id: number;
  folio: string;
  fecha: string;
  total: number;
  saldo_pendiente: number;
  nombre_cliente?: string;
  pagos?: PagoCredito[];
}

export interface ConfiguracionFiscal {
  rfc_emisor: string;
  nombre_emisor: string;
  cp_emisor: string;
  regimen_emisor: string;
  csd_cert_configurado: boolean;
  csd_key_configurado: boolean;
  csd_password_configurado: boolean;
  pac_nombre: string;
  pac_url: string;
  pac_usuario: string;
  pac_password_configurado: boolean;
  email_host: string;
  email_port: number;
  email_user: string;
  email_pass_configurado: boolean;
  email_from: string;
  logo_configurado: boolean;
  nombre_negocio: string;
}

export interface DetalleCotizacion {
  detalle_id?: number;
  cotizacion_id?: number;
  producto_id?: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  subtotal: number;
}

export interface Cotizacion {
  cotizacion_id?: number;
  empresa_id?: number;
  sucursal_id?: number;
  usuario_id?: number;
  folio?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  estado?: 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'VENCIDA';
  total?: number;
  vigencia_dias?: number;
  notas?: string;
  fecha?: string;
  nombre_usuario?: string;
  nombre_sucursal?: string;
  detalles?: DetalleCotizacion[];
}
