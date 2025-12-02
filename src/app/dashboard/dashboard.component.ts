import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  constructor(private router: Router) {}

  goCaja() {
    this.router.navigate(['/caja']);
  }

  goInventario() {
    this.router.navigate(['/inventario']);
  }
   goNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }
}
