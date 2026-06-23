import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const superadminGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (localStorage.getItem('esSuperAdmin') === 'true') return true;
  router.navigate(['/login']);
  return false;
};
