import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.css']
})
export class TerminosComponent {
  anioActual = new Date().getFullYear();
  fechaActualizacion = '20 de junio de 2026';
}
