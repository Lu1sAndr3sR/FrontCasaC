import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScannerSocketService } from '../../services/scanner-socket.service';

@Component({
  selector: 'app-escaner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escaner.component.html',
  styleUrls: ['./escaner.component.css']
})
export class EscanerComponent implements OnInit, OnDestroy {

  salaId: string = '';
  codigoManual: string = '';
  conectado: boolean = false;
  mensajeEstado: string = 'Conectando...';
  escaneando: boolean = false;
  errorCamara: string = '';
  necesitaHttps: boolean = false;
  procesandoFoto: boolean = false;
  hostname: string = window.location.hostname;

  flashActivo: boolean = false;
  mostrandoExito: boolean = false;
  ultimoCodigo: string = '';

  cola: string[] = [];
  enviando: boolean = false;
  mensajeEnvio: string = '';

  private scanner: Html5Qrcode | null = null;
  private ultimasLecturas = new Map<string, number>();
  private readonly COOLDOWN_MS = 2500;

  private readonly configEscaner = {
    verbose: false,
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private scannerSocket: ScannerSocketService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.salaId = this.route.snapshot.paramMap.get('salaId') || '';
    this.scannerSocket.unirseComoMovil(this.salaId);

    setTimeout(() => {
      this.conectado = this.scannerSocket.estaConectado();
      this.mensajeEstado = this.conectado
        ? `Conectado · ${this.salaId}`
        : 'Sin conexión con la caja';
    }, 2000);
  }

  async iniciarCamara(): Promise<void> {
    this.errorCamara = '';
    this.necesitaHttps = false;
    try {
      this.scanner = new Html5Qrcode('qr-reader', this.configEscaner);
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 20, qrbox: { width: 320, height: 100 } },
        (codigo) => { this.zone.run(() => this.alLeerCodigo(codigo)); },
        () => {}
      );
      this.escaneando = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('https') || msg.toLowerCase().includes('not supported') || msg.toLowerCase().includes('permission')) {
        this.necesitaHttps = true;
      } else {
        this.errorCamara = 'No se pudo iniciar la cámara: ' + msg;
      }
    }
  }

  async detenerCamara(): Promise<void> {
    if (this.scanner && this.escaneando) {
      await this.scanner.stop();
      this.scanner.clear();
    }
    this.escaneando = false;
  }

  async onFotoCapturada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.procesandoFoto = true;
    this.errorCamara = '';

    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const respuesta = await fetch('/api/escaner/imagen', { method: 'POST', body: formData });
      const datos = await respuesta.json();
      if (!respuesta.ok || datos.error) {
        this.zone.run(() => {
          this.errorCamara = datos.error ?? 'No se detectó el código. Centra bien y asegura buena luz.';
        });
        return;
      }
      this.zone.run(() => this.alLeerCodigo(datos.codigo));
    } catch {
      this.zone.run(() => {
        this.errorCamara = 'No se pudo conectar al servidor. Verifica tu red.';
      });
    } finally {
      this.zone.run(() => {
        this.procesandoFoto = false;
        input.value = '';
      });
    }
  }

  private alLeerCodigo(codigo: string): void {
    const ahora = Date.now();
    const ultimaVez = this.ultimasLecturas.get(codigo) ?? 0;
    if (ahora - ultimaVez < this.COOLDOWN_MS) return;

    this.ultimasLecturas.set(codigo, ahora);
    this.ultimoCodigo = codigo;
    this.cola = [...this.cola, codigo];
    this.flashActivo = true;
    this.mostrandoExito = true;
    this.beep();
    if (navigator.vibrate) navigator.vibrate(80);

    setTimeout(() => { this.flashActivo = false; }, 400);
    setTimeout(() => { this.mostrandoExito = false; }, 1200);
  }

  quitarDeCola(index: number): void {
    this.cola = this.cola.filter((_, i) => i !== index);
  }

  agregarManual(): void {
    const c = this.codigoManual.trim();
    if (!c) return;
    this.cola = [...this.cola, c];
    this.codigoManual = '';
    this.beep();
  }

  enviarTodo(): void {
    if (this.cola.length === 0) return;
    if (!this.scannerSocket.estaConectado()) {
      this.mensajeEnvio = '⚠️ Sin conexión con la caja. Verifica que la caja esté abierta.';
      return;
    }

    this.enviando = true;
    this.mensajeEnvio = '';

    this.cola.forEach((codigo, i) => {
      setTimeout(() => {
        this.scannerSocket.emitirCodigo(this.salaId, codigo);
      }, i * 300);
    });

    const total = this.cola.length;
    setTimeout(() => {
      this.cola = [];
      this.ultimasLecturas.clear();
      this.enviando = false;
      this.mensajeEnvio = `✓ ${total} código${total > 1 ? 's' : ''} enviado${total > 1 ? 's' : ''} a la caja`;
      setTimeout(() => { this.mensajeEnvio = ''; }, 3000);
    }, total * 300 + 200);
  }

  private beep(): void {
    try {
      const AudioCtx = (window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
      osc.onended = () => ctx.close();
    } catch {}
  }

  ngOnDestroy(): void {
    if (this.scanner && this.escaneando) {
      this.scanner.stop().catch(() => {}).finally(() => this.scanner?.clear());
    }
    this.escaneando = false;
    this.ultimasLecturas.clear();
    this.scannerSocket.desconectar();
  }
}
