import React, { useRef, useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Smartphone,
  Share2,
  Check,
  Radio,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { RealtimeSyncService } from '@/lib/realtimeSync';

interface SettingsViewProps {
  onDataUpdated: () => void;
}

export function SettingsView({ onDataUpdated }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [roomInput, setRoomInput] = useState(() => RealtimeSyncService.getRoom());
  const [roomSaved, setRoomSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
    if (confirm('Vuoi ripristinare i dati di prova (giocatori, squadre e partite demo)?')) {
      StorageService.resetToDemo();
      onDataUpdated();
      alert('Dati demo ricaricati!');
    }
  };

  // Svuota tutto
  const handleClearAll = () => {
    if (
      confirm(
        'Attenzione: cancellerai tutti i dati di partite, squadre e giocatori salvati in questo browser. Procedere?'
      )
    ) {
      StorageService.clearAll();
      onDataUpdated();
      alert('Tutti i dati sono stati cancellati.');
    }
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    RealtimeSyncService.setRoom(roomInput.trim());
    setRoomSaved(true);
    setTimeout(() => setRoomSaved(false), 2500);
  };

  const handleCopyShareLink = () => {
    if (typeof window === 'undefined') return;
    const room = RealtimeSyncService.getRoom();
    const url = `${window.location.origin}?room=${room}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      });
    } else {
      prompt('Copia questo link e invialo a chi gioca al tavolo:', url);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" data-reveal="rise">
      {/* Intestazione */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[var(--accent)]" />
          <span>Impostazioni &amp; Sincronizzazione</span>
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Gestione dei dati di casa, stanza live in tempo reale e salvataggio offline.
        </p>
      </div>

      {/* SEZIONE 1: LIVE CLOUD SYNC & ROOM CODE */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-[var(--text)] flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Stanza Live Cloud Multi-Dispositivo</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Attiva</span>
          </span>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Tutti i dispositivi (smartphone, tablet o PC) connessi alla stessa stanza vedono e aggiornano i punteggi contemporaneamente in tempo reale.
        </p>

        <form onSubmit={handleSaveRoom} className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="flex-1">
            <label className="text-[11px] text-[var(--text-subtle)] block mb-1 font-medium">
              Codice Stanza Tavolo:
            </label>
            <input
              type="text"
              required
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="Es. carte_briscola_live_casa"
              className="w-full bg-[var(--surface-raised)] border border-[var(--control-border)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
            >
              {roomSaved ? '✓ Salvata' : 'Salva Stanza'}
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] text-xs font-bold btn-tactile cursor-pointer shadow-sm"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{linkCopied ? 'Copiato!' : 'Copia Link Tavolo'}</span>
            </button>
          </div>
        </form>
      </div>

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
    </div>
  );
}
