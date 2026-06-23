import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  anioActual = new Date().getFullYear();

  features = [
    { icono: '🛒', titulo: 'Punto de Venta', desc: 'Cobra en segundos con búsqueda por código de barras o nombre. Tickets automáticos y descuentos al instante.' },
    { icono: '📦', titulo: 'Inventario en Tiempo Real', desc: 'Controla el stock por sucursal, recibe alertas de productos bajos y registra entradas de mercancía.' },
    { icono: '📊', titulo: 'Reportes y Cortes', desc: 'Visualiza ventas, cortes de caja, historial de movimientos y exporta a Excel o PDF con un clic.' },
    { icono: '🧾', titulo: 'Facturación CFDI 4.0', desc: 'Emite facturas electrónicas al SAT. Timbrado, cancelación y envío por correo incluidos.' },
    { icono: '🤖', titulo: 'Asistente con IA', desc: 'Analiza el desempeño del negocio, detecta anomalías en caja y sugiere precios de reorden automáticamente.' },
    { icono: '📱', titulo: 'Escáner Móvil', desc: 'Convierte tu celular en lector de códigos de barras. Sin hardware adicional, solo escanea y listo.' },
    { icono: '🏬', titulo: 'Multi-sucursal', desc: 'Administra todas tus sucursales desde un panel central. Cada una con su inventario y caja independientes.' },
    { icono: '👥', titulo: 'Control de Usuarios', desc: 'Roles diferenciados para administrador y empleado. Códigos de invitación para agregar al equipo en segundos.' },
  ];

  pasos = [
    { num: '1', titulo: 'Solicita tu acceso', desc: 'Regístrate con tu correo. Tu cuenta queda activa en menos de 24 horas.' },
    { num: '2', titulo: 'Configura tu negocio', desc: 'Agrega tu logo, productos y usuarios. El onboarding te guía paso a paso.' },
    { num: '3', titulo: 'Empieza a vender', desc: 'Desde el primer día tu equipo puede cobrar, controlar inventario y generar reportes.' },
  ];
}
