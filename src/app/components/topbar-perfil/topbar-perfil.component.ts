import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar-perfil',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tp-wrap" (click)="toggleMenu($event)">
      <div class="tp-avatar" [class.tiene-foto]="fotoPerfil">
        <img *ngIf="fotoPerfil" [src]="fotoPerfil" alt="perfil">
        <span *ngIf="!fotoPerfil" class="tp-inicial">{{ inicial }}</span>
      </div>

      <div class="tp-menu" *ngIf="menuAbierto" (click)="$event.stopPropagation()">
        <div class="tp-menu-nombre">{{ nombreCompleto }}</div>
        <hr class="tp-divider">
        <button class="tp-opcion" (click)="irAConfiguracion()">
          ⚙️ Configuración
        </button>
        <button class="tp-opcion tp-logout" (click)="cerrarSesion()">
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .tp-wrap {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .tp-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #2a2a2a;
      border: 2px solid var(--primario, #4cd96f);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s, box-shadow 0.2s;
      flex-shrink: 0;
    }

    .tp-avatar:hover {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primario, #4cd96f) 30%, transparent);
    }

    .tp-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tp-inicial {
      font-size: 16px;
      font-weight: 700;
      color: var(--primario, #4cd96f);
      line-height: 1;
      user-select: none;
    }

    .tp-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      min-width: 190px;
      background: #1e2227;
      border: 1px solid #333;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 9999;
      padding: 8px 0;
      animation: tp-fade-in 0.12s ease;
    }

    @keyframes tp-fade-in {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .tp-menu-nombre {
      padding: 8px 16px 6px;
      font-size: 12px;
      color: #888;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tp-divider {
      border: none;
      border-top: 1px solid #333;
      margin: 4px 0;
    }

    .tp-opcion {
      display: block;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      color: #ddd;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      transition: background 0.12s;
    }

    .tp-opcion:hover {
      background: #2a2e35;
    }

    .tp-logout {
      color: #e57373;
    }

    .tp-logout:hover {
      background: #2a1515;
    }
  `]
})
export class TopbarPerfilComponent implements OnInit {
  fotoPerfil = '';
  inicial = '?';
  nombreCompleto = '';
  menuAbierto = false;

  constructor(private router: Router, private el: ElementRef) {}

  ngOnInit(): void {
    this.fotoPerfil    = localStorage.getItem('casac-foto-perfil') || '';
    this.nombreCompleto = localStorage.getItem('nombreCajero') || localStorage.getItem('usuarioActual') || 'Usuario';
    this.inicial       = this.nombreCompleto[0]?.toUpperCase() ?? '?';
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:click', ['$event'])
  cerrarAlClickFuera(event: MouseEvent): void {
    if (this.menuAbierto && !this.el.nativeElement.contains(event.target)) {
      this.menuAbierto = false;
    }
  }

  irAConfiguracion(): void {
    this.menuAbierto = false;
    this.router.navigate(['/usuarios']);
  }

  cerrarSesion(): void {
    this.menuAbierto = false;
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
