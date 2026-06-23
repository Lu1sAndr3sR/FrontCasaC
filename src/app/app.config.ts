import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import * as Sentry from '@sentry/angular';
import { environment } from '../environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    tracesSampleRate: 0.2
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      BrowserAnimationsModule,
      ReactiveFormsModule,
      MaterialModule
    ),
    ...(environment.sentryDsn ? [{ provide: ErrorHandler, useValue: Sentry.createErrorHandler() }] : [])
  ]
};