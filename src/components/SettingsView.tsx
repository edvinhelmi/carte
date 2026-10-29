import React, { useRef, useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Smartphone,
  Home,
  QrCode,
  Cloud,
  ShieldCheck,
  Cookie,
  FileText,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { HouseService } from '@/lib/houseService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { ShareHouseModal } from './ShareHouseModal';

interface SettingsViewProps {
  onDataUpdated: () => void;
  onOpenLegal?: (tab: 'privacy' | 'cookie' | 'terms') => void;
}

export function SettingsView({ onDataUpdated, onOpenLegal }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeHouse, setActiveHouse] = useState(() => HouseService.getActiveHouse());
  const [showShareModal, setShowShareModal] = useState(false);
  const hasCloud = isSupabaseConfigured();

  React.useEffect(() => {
    const handleSync = () => {
      setActiveHouse(HouseService.getActiveHouse());
    };
    window.addEventListener('carte_house_change', handleSync);
    window.addEventListener('carte_storage_update', handleSync);
    return () => {
      window.removeEventListener('carte_house_change', handleSync);
      window.removeEventListener('carte_storage_update', handleSync);
    };
  }, []);

  // Scarica Backup JSON
  const handleExport = () => {
    const data = StorageService.exportAllData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briscola-club-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Carica Backup da File JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        StorageService.importAllData(parsed);
        alert('Dati ripristinati con successo!');
        onDataUpdated();
      } catch {
        alert('File non valido o corrotto.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Ricarica Dati Demo
  const handleResetDemo = () => {
    if (confirm('Vuoi ripristinare i dati di prova (giocatori, squadre e partite demo) in questa casa?')) {
      StorageService.resetToDemo();
      onDataUpdated();
      alert('Dati demo ricaricati!');
    }
  };

  // Svuota tutto
  const handleClearAll = () => {
    if (
      confirm(
        'Attenzione: cancellerai tutti i dati di partite, squadre e giocatori salvati in questo browser per la casa corrente. Procedere?'
      )
    ) {
      StorageService.clearAll();
      onDataUpdated();
      alert('Tutti i dati sono stati cancellati.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" data-reveal="rise">
      {/* Intestazione */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[var(--accent)]" />
          <span>Impostazioni &amp; Gestione Dati</span>
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Gestione della casa, salvataggio e backup dei dati, note legali e privacy.
        </p>
      </div>

      {/* SEZIONE 1: CASA ATTIVA E CONDIVISIONE */}
      {activeHouse && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[var(--text)] flex items-center gap-2">
              <Home className="w-4 h-4 text-[var(--accent)]" />
              <span>Casa Attiva: {activeHouse.name}</span>
            </h2>
            <span className="font-mono text-xs font-bold text-[var(--accent)] px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--control-border)]">
              {activeHouse.inviteCode}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            I suggerimenti dei giocatori e lo storico partite sono isolati per questa casa. Puoi condividere l&apos;accesso immediato con amici o coinquilini tramite QR Code o Link diretto.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] text-xs font-bold btn-tactile cursor-pointer shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>Mostra QR Code &amp; Link Casa</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--control-border)] text-xs text-[var(--text-muted)]">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {hasCloud ? 'Supabase Cloud: Connesso' : 'Persistenza: Local-First (Offline)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SEZIONE 2: BACKUP E RIPRISTINO */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-4 shadow-sm">
        <h2 className="font-heading font-bold text-base text-[var(--text)] flex items-center gap-2">
          <Download className="w-4 h-4 text-[var(--accent)]" />
          <span>Backup &amp; Ripristino Dati</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          I dati delle partite e delle squadre sono memorizzati localmente. Scarica un archivio JSON per conservare lo storico o importarlo su un altro dispositivo.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Download className="w-4 h-4 text-[var(--accent)]" />
            <span>Esporta Backup (Scarica JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Ripristina da File JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json,application/json"
            className="hidden"
          />
        </div>
      </div>

      {/* SEZIONE 3: GUIDA PWA / TELEFONO */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-4 shadow-sm">
        <h2 className="font-heading font-bold text-base text-[var(--text)] flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[var(--accent)]" />
          <span>Uso su Telefono &amp; Installazione PWA</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[var(--surface-raised)] p-4 rounded-xl border border-[var(--divider)] space-y-1.5">
            <h3 className="font-bold text-sm text-[var(--text)]">iPhone (Safari)</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Tocca il tasto Condividi in basso nel browser Safari e seleziona <em>&quot;Aggiungi alla schermata Home&quot;</em> per avviare il tracker a schermo intero come una vera app.
            </p>
          </div>

          <div className="bg-[var(--surface-raised)] p-4 rounded-xl border border-[var(--divider)] space-y-1.5">
            <h3 className="font-bold text-sm text-[var(--text)]">Android (Chrome)</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Tocca i tre puntini in alto a destra e seleziona <em>&quot;Installa app&quot;</em> o <em>&quot;Aggiungi a Home&quot;</em> per averla subito a portata di mano sul tavolo da gioco.
            </p>
          </div>
        </div>
      </div>

      {/* SEZIONE 4: MANUTENZIONE DATI */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-4 shadow-sm">
        <h2 className="font-heading font-bold text-base text-[var(--text)]">Manutenzione Dati</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetDemo}
            className="touch-target inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-semibold border border-[var(--control-border)] btn-tactile cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ricarica Dati Demo</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="touch-target inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 text-xs font-semibold btn-tactile cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Azzera Tutti i Dati</span>
          </button>
        </div>
      </div>

      {/* SEZIONE 5: PRIVACY, COOKIE & NOTE LEGALI */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-[var(--text)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <span>Privacy, Cookie &amp; Note Legali</span>
          </h2>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Briscola Club rispetta la tua privacy e tutela i tuoi dati personali. Utilizziamo esclusivamente cookie e memoria locale strettamente tecnici per il segnapunti e la sincronizzazione. Nessun dato viene venduto o ceduto per finalità di marketing o profilazione.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onOpenLegal?.('privacy')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Informativa Privacy</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLegal?.('cookie')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Cookie &amp; Storage</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLegal?.('terms')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Termini di Servizio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('carte_cookie_consent');
                window.dispatchEvent(new Event('carte_cookie_consent_change'));
                alert('Preferenze cookie reimpostate. Il banner comparirà nuovamente.');
              } catch {
                // ignore
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text-subtle)] hover:text-[var(--text)] btn-tactile cursor-pointer sm:ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rivedi Consenso Cookie</span>
          </button>
        </div>
      </div>

      {activeHouse && (
        <ShareHouseModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          house={activeHouse}
        />
      )}
    </div>
  );
}
