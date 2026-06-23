import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OnboardingPaso {
  id: number;
  label: string;
  completado: boolean;
}

export interface OnboardingStatus {
  pasos: OnboardingPaso[];
  completado: boolean;
  progreso: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  constructor(private http: HttpClient) {}

  getStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${environment.apiUrl}/onboarding`);
  }
}
