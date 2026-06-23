import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SucursalesService } from '../../services/sucursales.service';
import { SucursalActivaService } from '../../services/sucursal-activa.service';
import { Sucursal } from '../../models/interfaces';

@Component({
  selector: 'app-selector-sucursal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selector-sucursal.component.html',
  styleUrls: ['./selector-sucursal.component.css']
})
export class SelectorSucursalComponent implements OnInit {
  @Output() cerrado = new EventEmitter<void>();

  sucursales: Sucursal[] = [];
  cargando = true;

  constructor(
    private sucursalesService: SucursalesService,
    public sucursalActivaService: SucursalActivaService
  ) {}

  ngOnInit(): void {
    this.sucursalesService.getSucursales().subscribe({
      next: (list) => { this.sucursales = list; this.cargando = false; },
      error: ()    => { this.cargando = false; }
    });
  }

  seleccionar(s: Sucursal): void {
    this.sucursalActivaService.setSucursal(s);
    this.cerrado.emit();
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}
