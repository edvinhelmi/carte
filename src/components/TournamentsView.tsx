import React, { useState, useMemo } from 'react';
import { Trophy, Plus, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { Tournament, Team, Player } from '@/types/game';
import { CreateTournamentModal } from './CreateTournamentModal';
import { TournamentDetailView } from './TournamentDetailView';
import { StorageService } from '@/lib/storage';

interface TournamentsViewProps {
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  onDataUpdated: () => void;
}

export function TournamentsView({
  tournaments,
  teams,
  players,
  onDataUpdated,
}: TournamentsViewProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId) || null;

  const filteredTournaments = useMemo(() => {
    if (filter === 'in_progress') return tournaments.filter((t) => t.status === 'in_progress');
    if (filter === 'completed') return tournaments.filter((t) => t.status === 'completed');
    return tournaments;
  }, [tournaments, filter]);

  // Se è selezionato un torneo, mostra il dettaglio live
  if (selectedTournament) {
    return (
      <TournamentDetailView
        tournament={selectedTournament}
        teams={teams}
        players={players}
        onBack={() => setSelectedTournamentId(null)}
        onTournamentUpdated={onDataUpdated}
      />
    );
  }

  const handleDeleteTournament = (tId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Vuoi davvero eliminare questo torneo?')) {
      StorageService.deleteTournament(tId);
      onDataUpdated();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Sezione Tornei */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Tornei &amp; Campionati Live</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Crea tornei a eliminazione diretta o gironi all’italiana e aggiorna i risultati in tempo reale.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crea Nuovo Torneo</span>
        </button>
      </div>

      {/* Filtri */}
      <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Tutti ({tournaments.length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'in_progress'
              ? 'bg-amber-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          In Corso ({tournaments.filter((t) => t.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-amber-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Conclusi ({tournaments.filter((t) => t.status === 'completed').length})
        </button>
      </div>

      {/* Lista Tornei */}
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-200">Nessun torneo trovato</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Organizza una serata speciale creando il tuo primo torneo tra amici e familiari.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer hover:bg-amber-400"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crea Primo Torneo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTournaments.map((tournament) => {
            const completedCount = tournament.matches.filter((m) => m.status === 'completed').length;
            const totalCount = tournament.matches.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const champion = tournament.winnerTeamId ? teamMap.get(tournament.winnerTeamId) : null;

            return (
              <div
                key={tournament.id}
                onClick={() => setSelectedTournamentId(tournament.id)}
                className="group relative overflow-hidden rounded-2xl bg-zinc-900/85 border border-zinc-800 p-5 hover:border-amber-500/50 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
              >
                <div>
                  {/* Badges in alto */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/80 text-amber-400 capitalize">
                      {tournament.format === 'knockout' ? 'Eliminazione Diretta' : 'Girone all’Italiana'}
                    </span>

                    <div className="flex items-center gap-1">
                      {tournament.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Concluso</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>Live In Corso</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDeleteTournament(tournament.id, e)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
                        title="Elimina torneo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Titolo Torneo */}
                  <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                    {tournament.name}
                  </h3>

                  {/* Se concluso: Vincitore */}
                  {champion && (
                    <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Campioni: {champion.name}</span>
                    </div>
                  )}

                  {/* Info Squadre partecipanti */}
                  <p className="text-xs text-zinc-400 mt-2">
                    {tournament.teamIds.length} squadre in gara • {tournament.matches.length} partite totali
                  </p>
                </div>

                {/* Barra di avanzamento e bottone apri */}
                <div className="mt-5 pt-3 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Avanzamento</span>
                    <span className="font-bold text-zinc-300">
                      {completedCount}/{totalCount} ({progress}%)
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Apri Tabellone Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Creazione Torneo */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        teams={teams}
        onTournamentCreated={(newTour) => {
          onDataUpdated();
          setSelectedTournamentId(newTour.id);
        }}
      />
    </div>
  );
}
