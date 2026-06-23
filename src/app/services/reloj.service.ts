import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RelojService {

  obtenerFechaActual(): string {
    const h = new Date();
    const dia = h.getDate().toString().padStart(2, '0');
    const mes = (h.getMonth() + 1).toString().padStart(2, '0');
    const anio = h.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  obtenerHoraActual(incluirSegundos: boolean = false): string {
    const h = new Date();
    let horas = h.getHours();
    const minutos = h.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    
    // Convertir a formato de 12 horas
    horas = horas % 12 || 12; 
    const horasStr = horas.toString().padStart(2, '0');

    if (incluirSegundos) {
      const segundos = h.getSeconds().toString().padStart(2, '0');
      return `${horasStr}:${minutos}:${segundos} ${ampm}`;
    }
    
    return `${horasStr}:${minutos} ${ampm}`;
  }
}