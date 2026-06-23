import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { adminGuard } from './admin.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('adminGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RouterTestingModule] });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('permite el acceso si esAdmin es "true"', () => {
    localStorage.setItem('esAdmin', 'true');
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('redirige a /dashboard si no es admin', () => {
    localStorage.setItem('esAdmin', 'false');
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redirige a /dashboard si esAdmin no está en localStorage', () => {
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
