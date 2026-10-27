import React, { useRef } from 'react';
import { Settings, Download, Upload, RotateCcw, Trash2, Cloud, GitBranch, Smartphone } from 'lucide-react';
import { StorageService } from '@/lib/storage';

interface SettingsViewProps {
  onDataUpdated: () => void;
}

export function SettingsView({ onDataUpdated }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scarica Backup JSON
  const handleExport = () => {
    const data = StorageService.exportAllData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briscola-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
    if (confirm('Attenzione: cancellerai tutti i dati di partite, squadre e giocatori salvati in questo browser. Procedere?')) {
      StorageService.clearAll();
      onDataUpdated();
      alert('Tutti i dati sono stati cancellati.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Intestazione */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>Impostazioni, Backup &amp; Guida Cloud</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Gestisci i dati salvati, crea backup di sicurezza e scopri come sincronizzare i dispositivi di casa.
        </p>
      </div>

      {/* SEZIONE 1: BACKUP E RIPRISTINO */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-amber-400" />
          <span>Backup &amp; Ripristino Dati</span>
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          I tuoi dati sono conservati nella memoria del browser. Puoi scaricare una copia di sicurezza in formato JSON in qualsiasi momento per archiviarla o trasferirla su un altro telefono/computer.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Download className="w-4 h-4" />
            <span>Esporta Backup (Scarica JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Ripristina da Backup (Carica JSON)</span>
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

      {/* SEZIONE 2: GUIDA MULTI-DISPOSITIVO E HOSTING VERCEL */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 space-y-5">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Come usare l&apos;app su Telefono e Desktop</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Box PWA / Telefono */}
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h3 className="font-bold text-sm text-zinc-200">📱 Installazione come App su Smartphone</h3>
            <p className="text-zinc-400 leading-relaxed">
              Puoi installare questo sito come una vera app nativa a schermo intero:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
              <li><strong>Su iPhone (Safari):</strong> Premi il tasto Condividi e seleziona <em>&quot;Aggiungi alla schermata Home&quot;</em>.</li>
              <li><strong>Su Android (Chrome):</strong> Premi i tre puntini in alto e seleziona <em>&quot;Installa app&quot;</em> o <em>&quot;Aggiungi a Home&quot;</em>.</li>
            </ul>
          </div>

          {/* Box GitHub & Vercel */}
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
              <span>Pubblicazione su GitHub &amp; Vercel</span>
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              Il progetto è già pronto al 100% per Vercel:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300">
              <li>Crea un repository vuoto sul tuo account GitHub.</li>
              <li>Fai il push del codice (istruzioni dettagliate nel file README).</li>
              <li>Vai su <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Vercel.com</a>, premi &quot;Add New Project&quot; e importa la repo!</li>
            </ol>
          </div>
        </div>

        {/* Box Sincronizzazione Cloud Automatica */}
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 p-4 rounded-xl border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-zinc-100">Sincronizzazione Automatica Cloud (Opzionale)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Se vuoi che le partite segnate dal telefono compaiano <strong>all&apos;istante in tempo reale sul PC senza esportare file JSON</strong>, basta collegare un database gratuito come <strong>Supabase</strong> (PostgreSQL) o <strong>Firebase Firestore</strong>. Nel codice il modulo di storage è già predisposto per accettare le variabili d&apos;ambiente in `.env.local`.
          </p>
        </div>
      </div>

      {/* SEZIONE 3: GESTIONE DATI (RESET / PULIZIA) */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 space-y-4">
        <h2 className="text-base font-bold text-zinc-100">Manutenzione Dati</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ricarica Dati Demo</span>
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancella Tutti i Dati</span>
          </button>
        </div>
      </div>
    </div>
  );
}
