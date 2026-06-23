import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { SucursalesService } from '../../services/sucursales.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { ToastService } from '../../services/toast.service';
import { Sucursal } from '../../models/interfaces';

@Component({
  selector: 'app-sucursales-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sucursales-map.component.html',
  styleUrls: ['./sucursales-map.component.css']
})
export class SucursalesMapComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  sucursales: Sucursal[] = [];
  sucursalActualId = Number(localStorage.getItem('sucursal_id') || 1);
  cargando = true;
  guardandoLogo: number | null = null;

  constructor(
    private sucursalesService: SucursalesService,
    private sucursalActivaService: SucursalActivaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.cargarSucursales();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map('mapa-sucursales', {
      center: [23.6345, -102.5528],
      zoom: 5
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
  }

  private cargarSucursales(): void {
    this.sucursalesService.getSucursales().subscribe({
      next: (sucursales) => {
        this.sucursales = sucursales;
        this.cargando = false;

        sucursales.forEach(s => {
          if (!s.latitud || !s.longitud) return;
          const esActual = s.sucursal_id === this.sucursalActualId;

          const icono = L.divIcon({
            className: '',
            html: `<div style="
              width:18px; height:18px; border-radius:50%;
              background:${esActual ? '#4cd96f' : '#1e2227'};
              border:3px solid ${esActual ? '#fff' : '#4cd96f'};
              box-shadow:0 0 8px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          L.marker([s.latitud, s.longitud], { icon: icono })
            .addTo(this.map)
            .bindPopup(`
              <div style="font-family:sans-serif;min-width:180px">
                <strong style="font-size:14px">${s.nombre}</strong>
                ${esActual ? '<span style="color:#4cd96f;font-size:11px"> ★ Tu sucursal</span>' : ''}
                <hr style="margin:6px 0;border-color:#eee">
                <div style="font-size:12px;color:#555">${s.direccion || 'Sin dirección'}</div>
                <div style="font-size:11px;margin-top:4px;color:#888">CP SAT: <b>${s.cp_sat}</b></div>
              </div>
            `);
        });

        const actual = sucursales.find(s => s.sucursal_id === this.sucursalActualId);
        if (actual?.latitud && actual?.longitud) {
          this.map.setView([actual.latitud, actual.longitud], 13);
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  onLogoSeleccionado(event: Event, sucursal: Sucursal): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.guardandoLogo = sucursal.sucursal_id;

      this.sucursalesService.updateSucursal(sucursal.sucursal_id, { logo_b64: base64 }).subscribe({
        next: () => {
          sucursal.logo_b64 = base64;
          if (sucursal.sucursal_id === this.sucursalActualId) {
            this.sucursalActivaService.setSucursal({ ...sucursal, logo_b64: base64 });
          }
          this.guardandoLogo = null;
          this.toastService.show('Logo actualizado', 'ok');
        },
        error: () => {
          this.guardandoLogo = null;
          this.toastService.show('Error al guardar logo', 'error');
        }
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  quitarLogo(sucursal: Sucursal): void {
    this.guardandoLogo = sucursal.sucursal_id;
    this.sucursalesService.updateSucursal(sucursal.sucursal_id, { logo_b64: null }).subscribe({
      next: () => {
        sucursal.logo_b64 = null;
        if (sucursal.sucursal_id === this.sucursalActualId) {
          this.sucursalActivaService.setSucursal({ ...sucursal, logo_b64: null });
        }
        this.guardandoLogo = null;
        this.toastService.show('Logo eliminado', 'ok');
      },
      error: () => {
        this.guardandoLogo = null;
        this.toastService.show('Error al eliminar logo', 'error');
      }
    });
  }
}
