import { Injectable } from '@angular/core';

export interface Tema {
  id: string;
  nombre: string;
  topbar: string;
  primario: string;
  primarioDark: string;
  peligro: string;
  peligroDark: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private usuarioId: number | null = null;

  readonly temas: Tema[] = [
    { id: 'default',  nombre: 'Verde Oscuro', topbar: '#1e2227', primario: '#4cd96f', primarioDark: '#3cb35a', peligro: '#d10b0b', peligroDark: '#a80909' },
    { id: 'azul',     nombre: 'Azul Marino',  topbar: '#0A2647', primario: '#2196f3', primarioDark: '#1565c0', peligro: '#ef5350', peligroDark: '#b71c1c' },
    { id: 'morado',   nombre: 'Morado',        topbar: '#2d1b69', primario: '#ab47bc', primarioDark: '#7b1fa2', peligro: '#ef5350', peligroDark: '#b71c1c' },
    { id: 'cafe',     nombre: 'Café',           topbar: '#3e2723', primario: '#ffa000', primarioDark: '#e65100', peligro: '#c62828', peligroDark: '#921c1c' },
    { id: 'petroleo', nombre: 'Petróleo',       topbar: '#003d4a', primario: '#00bcd4', primarioDark: '#00838f', peligro: '#ef5350', peligroDark: '#b71c1c' },
    { id: 'rojo',     nombre: 'Rojo Oscuro',    topbar: '#4a0000', primario: '#ff5252', primarioDark: '#c62828', peligro: '#ff8a65', peligroDark: '#e64a19' },
    { id: 'bosque',   nombre: 'Bosque',          topbar: '#1b3a2d', primario: '#69f0ae', primarioDark: '#00c853', peligro: '#ff5252', peligroDark: '#c62828' },
    { id: 'pizarra',  nombre: 'Pizarra',         topbar: '#2c3e50', primario: '#3498db', primarioDark: '#1a5276', peligro: '#e74c3c', peligroDark: '#a93226' },
    { id: 'rosa',     nombre: 'Rosa Oscuro',     topbar: '#4a0d3a', primario: '#f06292', primarioDark: '#c2185b', peligro: '#ef5350', peligroDark: '#b71c1c' },
    { id: 'indigo',   nombre: 'Índigo',           topbar: '#1a237e', primario: '#7986cb', primarioDark: '#3949ab', peligro: '#ef5350', peligroDark: '#b71c1c' },
    { id: 'oliva',    nombre: 'Oliva',            topbar: '#2d3a1a', primario: '#c6e048', primarioDark: '#9caf00', peligro: '#ff7043', peligroDark: '#bf360c' },
    { id: 'cobre',    nombre: 'Cobre',            topbar: '#3d1f00', primario: '#ff8a65', primarioDark: '#e64a19', peligro: '#ef5350', peligroDark: '#b71c1c' },
  ];

  private temaActualId: string = 'default';

  constructor() {
    // Intenta cargar el tema del usuario si ya hay sesión activa (recarga de página)
    const savedId = localStorage.getItem('idUsuario');
    if (savedId) this.usuarioId = Number(savedId);
    const guardado = localStorage.getItem(this.storageKey) ?? 'default';
    this.aplicarTema(guardado);
  }

  private get storageKey(): string {
    return this.usuarioId ? `casac-tema-${this.usuarioId}` : 'casac-tema';
  }

  /** Llamar al hacer login. Aplica el tema guardado en el servidor (color_tema). */
  setUsuario(id: number, colorTemaServidor?: string | null): void {
    this.usuarioId = id;
    const temaLocal  = localStorage.getItem(this.storageKey);
    const temaFinal  = colorTemaServidor || temaLocal || 'default';
    this.aplicarTema(temaFinal);
  }

  aplicarTema(id: string): void {
    const tema = this.temas.find(t => t.id === id) ?? this.temas[0];
    const root = document.documentElement;
    root.style.setProperty('--topbar',       tema.topbar);
    root.style.setProperty('--primario',     tema.primario);
    root.style.setProperty('--primario-dark', tema.primarioDark);
    root.style.setProperty('--peligro',      tema.peligro);
    root.style.setProperty('--peligro-dark', tema.peligroDark);
    localStorage.setItem(this.storageKey, tema.id);
    this.temaActualId = tema.id;
  }

  getTemaActual(): string {
    return this.temaActualId;
  }
}
