import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';
import { SucursalesService } from '../../services/sucursales.service';
import { SatService } from '../../services/sat.service';
import { ToastService } from '../../services/toast.service';
import { CatSatColonia } from '../../models/interfaces';

@Component({
  selector: 'app-alta-sucursal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alta-sucursal.component.html',
  styleUrls: ['./alta-sucursal.component.css']
})
export class AltaSucursalComponent implements AfterViewInit, OnDestroy {

  form = {
    nombre:    '',
    direccion: '',
    cp_sat:    '',
    colonia:   '',
    latitud:   '',
    longitud:  ''
  };

  colonias: CatSatColonia[] = [];
  buscandoCp = false;
  guardando  = false;
  cpValido   = false; // true solo si SAT lo reconoce (no bloquea el guardado)

  private cp$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private mapaSelector!: L.Map;
  private marcador: L.Marker | null = null;

  constructor(
    private sucursalesService: SucursalesService,
    private satService: SatService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.cp$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(cp => {
          if (cp.length !== 5) {
            this.colonias = [];
            this.cpValido = false;
            return [];
          }
          this.buscandoCp = true;
          return this.satService.getColoniasPorCp(cp);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (cols) => {
          this.colonias = cols;
          this.cpValido = cols.length > 0;
          this.buscandoCp = false;
          if (!this.cpValido) this.toastService.show('CP no encontrado en catálogo SAT', 'error');
        },
        error: () => { this.buscandoCp = false; }
      });
  }

  ngAfterViewInit(): void {
    this.mapaSelector = L.map('mapa-selector', { center: [23.6345, -102.5528], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.mapaSelector);

    this.mapaSelector.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.form.latitud  = lat.toFixed(6);
      this.form.longitud = lng.toFixed(6);

      if (this.marcador) {
        this.marcador.setLatLng([lat, lng]);
      } else {
        this.marcador = L.marker([lat, lng]).addTo(this.mapaSelector)
          .bindPopup('Ubicación seleccionada').openPopup();
      }
    });
  }

  onCpChange(): void {
    this.form.colonia = '';
    this.cp$.next(this.form.cp_sat.trim());
  }

  guardar(): void {
    if (!this.form.nombre.trim()) {
      this.toastService.show('El nombre de la sucursal es obligatorio', 'error'); return;
    }
    const cp = this.form.cp_sat.trim();
    if (cp && !/^\d{5}$/.test(cp)) {
      this.toastService.show('El código postal debe tener 5 dígitos', 'error'); return;
    }

    const lat = parseFloat(this.form.latitud);
    const lng = parseFloat(this.form.longitud);

    this.guardando = true;
    this.sucursalesService.createSucursal({
      nombre:    this.form.nombre.trim(),
      direccion: this.form.colonia
        ? `${this.form.direccion.trim()}, Col. ${this.form.colonia}`
        : this.form.direccion.trim(),
      cp_sat:    this.form.cp_sat.trim(),
      latitud:   isNaN(lat) ? undefined : lat,
      longitud:  isNaN(lng) ? undefined : lng
    } as any).subscribe({
      next: () => {
        this.toastService.show('Sucursal registrada correctamente', 'ok');
        this.router.navigate(['/sucursales']);
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'Error al guardar', 'error');
        this.guardando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.mapaSelector) this.mapaSelector.remove();
  }
}
