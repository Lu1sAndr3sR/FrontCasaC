import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditosService } from '../../services/creditos.service';
import { ToastService } from '../../services/toast.service';
import { TopbarPerfilComponent } from '../../components/topbar-perfil/topbar-perfil.component';
import { VentaCredito } from '../../models/interfaces';

@Component({
  selector: 'app-creditos',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarPerfilComponent],
  templateUrl: './creditos.component.html',
  styleUrls: ['./creditos.component.css']
})
export class CreditosComponent implements OnInit {
  creditos: VentaCredito[] = [];
  cargando = false;

  modalPago: VentaCredito | null = null;
  montoPago = 0;
  notasPago = '';
  guardandoPago = false;

  nombreNegocio = localStorage.getItem('casac-nombre') || 'SC POS';
  hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  constructor(
    private svc: CreditosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.svc.listar().subscribe({
      next: (data) => { this.creditos = data; this.cargando = false; },
      error: () => { this.toast.show('Error al cargar créditos', 'error'); this.cargando = false; }
    });
  }

  get totalPendiente(): number {
    return this.creditos.reduce((s, c) => s + Number(c.saldo_pendiente), 0);
  }

  abrirPago(c: VentaCredito) {
    this.modalPago  = c;
    this.montoPago  = Number(c.saldo_pendiente);
    this.notasPago  = '';
  }

  registrarPago() {
    if (!this.modalPago || this.montoPago <= 0) return;
    this.guardandoPago = true;
    this.svc.registrarPago(this.modalPago.venta_id, this.montoPago, this.notasPago).subscribe({
      next: (resp) => {
        this.toast.show('Pago registrado', 'ok');
        this.guardandoPago = false;
        this.modalPago = null;
        this.cargar();
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'Error al registrar pago', 'error');
        this.guardandoPago = false;
      }
    });
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
