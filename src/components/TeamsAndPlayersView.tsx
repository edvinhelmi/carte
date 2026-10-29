'use client';

import React, { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, User, Plus, Trash2, Shield, X, ChevronDown, Crown, QrCode, UserPlus } from 'lucide-react';
import { Player, Team, CardSuit } from '@/types/game';
import { StorageService } from '@/lib/storage';
import { HouseService } from '@/lib/houseService';
import { AuthService } from '@/lib/authService';
import type { HouseMember } from '@/types/house';
import { SuitIcon } from './SuitIcon';
import { ShareHouseModal } from './ShareHouseModal';

const emptySubscribe = () => () => {};

interface TeamsAndPlayersViewProps {
  players: Player[];
  teams: Team[];
  onDataUpdated: () => void;
}

export function TeamsAndPlayersView({ players, teams, onDataUpdated }: TeamsAndPlayersViewProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [activeHouseId, setActiveHouseId] = useState<string>(() => HouseService.getActiveHouseId());
  const [houseMembers, setHouseMembers] = useState<HouseMember[]>(() => {
    const id = HouseService.getActiveHouseId();
    return id ? HouseService.getHouseMembers(id) : [];
  });
  const [currentUser] = useState(() => AuthService.getCurrentUser());

  useEffect(() => {
    const handleSync = () => {
      const id = HouseService.getActiveHouseId();
      setActiveHouseId(id);
      setHouseMembers(id ? HouseService.getHouseMembers(id) : []);
    };
    window.addEventListener('carte_auth_change', handleSync);
    window.addEventListener('carte_house_change', handleSync);
    window.addEventListener('carte_storage_update', handleSync);
    return () => {
      window.removeEventListener('carte_auth_change', handleSync);
      window.removeEventListener('carte_house_change', handleSync);
      window.removeEventListener('carte_storage_update', handleSync);
    };
  }, []);

  // Separa i giocatori amici da quelli della casa
  const friendPlayers = useMemo(() => {
    const memberNameSet = new Set(
      (houseMembers || []).flatMap((m) => [
        typeof m?.displayName === 'string' ? m.displayName.trim().toLowerCase() : '',
        typeof m?.nickname === 'string' ? m.nickname.trim().toLowerCase() : '',
      ]).filter(Boolean)
    );

    return (players || []).filter((p) => {
      if (!p || !p.id) return false;
      if (typeof p.id === 'string' && p.id.startsWith('p_mem_')) return false;
      if (p.isFriend) return true;
      const pName = typeof p.name === 'string' ? p.name.trim().toLowerCase() : '';
      if (pName && memberNameSet.has(pName)) return false;
      const pNick = typeof p.nickname === 'string' ? p.nickname.trim().toLowerCase() : '';
      if (pNick && memberNameSet.has(pNick)) return false;
      return true;
    });
  }, [players, houseMembers]);

  // Giocatori selezionabili per comporre una squadra: SOLO NICKNAME
  const selectablePlayers = useMemo(() => {
    const list: { id: string; name: string; isMember: boolean }[] = [];
    const seenNames = new Set<string>();

    // 1. Membri della Casa
    for (const m of (houseMembers || [])) {
      if (!m) continue;
      const effName = (typeof m.nickname === 'string' && m.nickname.trim())
        ? m.nickname.trim()
        : (typeof m.displayName === 'string' && m.displayName.trim())
          ? m.displayName.trim()
          : 'Membro';
      const effKey = effName.toLowerCase();
      if (!seenNames.has(effKey)) {
        seenNames.add(effKey);
        list.push({
          id: `p_mem_${m.userId || 'unknown'}`,
          name: effName,
          isMember: true,
        });
      }
    }

    // 2. Giocatori Amici
    for (const p of (friendPlayers || [])) {
      if (!p) continue;
      const effName = (typeof p.nickname === 'string' && p.nickname.trim())
        ? p.nickname.trim()
        : (typeof p.name === 'string' && p.name.trim())
          ? p.name.trim()
          : 'Giocatore';
      const effKey = effName.toLowerCase();
      if (!seenNames.has(effKey)) {
        seenNames.add(effKey);
        list.push({
          id: p.id,
          name: effName,
          isMember: false,
        });
      }
    }

    return list;
  }, [houseMembers, friendPlayers]);

  // Gestione modali
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberNickname, setNewMemberNickname] = useState('');

  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendNickname, setFriendNickname] = useState('');
  const [friendSuit, setFriendSuit] = useState<CardSuit>('denari');

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedPlayer1, setSelectedPlayer1] = useState('');
  const [selectedPlayer2, setSelectedPlayer2] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!showMemberModal && !showFriendModal && !showTeamModal && !showShareModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMemberModal(false);
        setShowFriendModal(false);
        setShowTeamModal(false);
        setShowShareModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMemberModal, showFriendModal, showTeamModal, showShareModal]);

  const activeHouse = HouseService.getActiveHouse();

  // Salvataggio nuovo membro della casa
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMemberName.trim();
    if (!cleanName || !activeHouseId) return;

    const newMember: HouseMember = {
      houseId: activeHouseId,
      userId: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      displayName: cleanName,
      nickname: newMemberNickname.trim() || cleanName,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    HouseService.saveHouseMember(newMember);
    setNewMemberName('');
    setNewMemberNickname('');
    setShowMemberModal(false);
    onDataUpdated();
  };

  // Eliminazione membro della casa
  const handleDeleteMember = (userId: string, memberName: string) => {
    if (confirm(`Rimuovere "${memberName}" dai membri della casa?`)) {
      HouseService.deleteHouseMember(activeHouseId, userId);
      onDataUpdated();
    }
  };

  // Salvataggio nuovo giocatore amico
  const handleSaveFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = friendName.trim();
    if (!cleanName) return;

    const newFriend: Player = {
      id: `p_friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      houseId: activeHouseId || undefined,
      name: cleanName,
      nickname: friendNickname.trim() || undefined,
      avatarSuit: friendSuit,
      createdAt: new Date().toISOString(),
      isFriend: true,
    };

    StorageService.savePlayer(newFriend);
    setFriendName('');
    setFriendNickname('');
    setShowFriendModal(false);
    onDataUpdated();
  };

  // Eliminazione giocatore amico
  const handleDeleteFriend = (playerId: string) => {
    if (confirm('Eliminare questo giocatore amico?')) {
      StorageService.deletePlayer(playerId);
      onDataUpdated();
    }
  };

  // Salvataggio squadra
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    if (!selectedPlayer1) {
      alert('Seleziona almeno il primo giocatore per la squadra');
      return;
    }

    const playerIds = [selectedPlayer1];
    const p1Obj = selectablePlayers.find((p) => p.id === selectedPlayer1);
    if (p1Obj && selectedPlayer1.startsWith('p_mem_') && !players.some((p) => p.id === selectedPlayer1)) {
      StorageService.savePlayer({
        id: selectedPlayer1,
        houseId: activeHouseId || undefined,
        name: p1Obj.name,
        avatarSuit: 'denari',
        createdAt: new Date().toISOString(),
      });
    }

    if (selectedPlayer2 && selectedPlayer2 !== selectedPlayer1) {
      playerIds.push(selectedPlayer2);
      const p2Obj = selectablePlayers.find((p) => p.id === selectedPlayer2);
      if (p2Obj && selectedPlayer2.startsWith('p_mem_') && !players.some((p) => p.id === selectedPlayer2)) {
        StorageService.savePlayer({
          id: selectedPlayer2,
          houseId: activeHouseId || undefined,
          name: p2Obj.name,
          avatarSuit: 'coppe',
          createdAt: new Date().toISOString(),
        });
      }
    }

    const newTeam: Team = {
      id: 't_' + Date.now(),
      houseId: activeHouseId || undefined,
      name: teamName.trim(),
      playerIds,
      color: '#10b981',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveTeam(newTeam);
    setTeamName('');
    setSelectedPlayer1('');
    setSelectedPlayer2('');
    setShowTeamModal(false);
    onDataUpdated();
  };

  // Eliminazione squadra
  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa squadra?')) {
      StorageService.deleteTeam(teamId);
      onDataUpdated();
    }
  };

  return (
    <div className="space-y-8" data-reveal="rise">
      {/* Intestazione Pagina */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[var(--accent)]" />
          <span>Membri &amp; Squadre di Casa</span>
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Gestisci le persone che vivono in casa, i giocatori amici e le squadre registrate per la Briscola.
        </p>
      </div>

      {/* SEZIONE 1: MEMBRI DELLA CASA */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">
              Membri della Casa ({houseMembers.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {activeHouse && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
                title="Condividi codice invito o QR"
              >
                <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Invita</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMemberModal(true)}
              className="touch-target inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Aggiungi Membro</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Persone che vivono in casa o ne fanno parte stabilmente. Il loro soprannome viene suggerito automaticamente per le partite.
        </p>

        {houseMembers.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 text-center text-xs text-[var(--text-muted)]">
            Nessun membro trovato. Aggiungi il primo coinquilino o invita altri con il codice QR!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {houseMembers.map((m) => {
              const isMe = Boolean(currentUser?.id && m.userId === currentUser.id);
              const effNick = (typeof m.nickname === 'string' && m.nickname.trim())
                ? m.nickname.trim()
                : (typeof m.displayName === 'string' && m.displayName.trim())
                  ? m.displayName.trim()
                  : 'Membro';
              const hasDiffName = Boolean(
                m.nickname &&
                m.displayName &&
                m.nickname.trim().toLowerCase() !== m.displayName.trim().toLowerCase()
              );
              const avatarInitials = (m.displayName || m.nickname || 'ME').slice(0, 2).toUpperCase();

              return (
                <div
                  key={m.userId}
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] hover:border-[var(--control-border)] p-4 flex items-center justify-between gap-3 shadow-sm transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.avatarUrl}
                        alt={m.displayName || 'Avatar'}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-[var(--accent)]/40 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center text-[var(--accent)] font-bold text-xs shrink-0">
                        {avatarInitials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                          {effNick}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-semibold text-[var(--text-subtle)] bg-[var(--surface-raised)] px-1.5 py-0.2 rounded-full border border-[var(--divider)] shrink-0">
                            Tu
                          </span>
                        )}
                        {m.role === 'owner' ? (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                            Proprietario
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-alt)] px-1.5 py-0.5 rounded-full shrink-0">
                            Membro
                          </span>
                        )}
                      </div>
                      {hasDiffName && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          Nome: {m.displayName}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.userId, effNick)}
                      aria-label={`Rimuovi ${effNick}`}
                      title={`Rimuovi ${effNick}`}
                      className="touch-target p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEZIONE 2: SQUADRE REGISTRATE */}
      <div className="space-y-4 pt-4 border-t border-[var(--divider)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">
              Squadre Registrate ({teams.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            className="touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Nuova Squadra</span>
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] p-5 text-center text-xs text-[var(--text-muted)]">
            Nessuna squadra registrata. Crea una nuova coppia di gioco con il pulsante &quot;Nuova Squadra&quot;!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const playerIds = Array.isArray(team?.playerIds) ? team.playerIds : [];
              const teamPlayerLabels = playerIds.map((id) => {
                const sel = selectablePlayers.find((p) => p.id === id);
                if (sel) return sel.name;
                const pl = (players || []).find((p) => p.id === id);
                if (pl) return (pl.nickname && pl.nickname.trim()) || pl.name || id;
                const mem = (houseMembers || []).find((m) => `p_mem_${m.userId}` === id);
                if (mem) return (mem.nickname && mem.nickname.trim()) || mem.displayName || id;
                return id;
              });
              const teamInitials = (typeof team?.name === 'string' && team.name.trim() ? team.name.trim() : 'SQ')
                .slice(0, 2)
                .toUpperCase();
              const teamDisplayName = (typeof team?.name === 'string' && team.name.trim()) ? team.name.trim() : 'Squadra';

              return (
                <div
                  key={team.id}
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--divider)] hover:border-[var(--control-border)] p-5 interactive-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center text-[var(--accent)] font-bold text-xs font-mono">
                          {teamInitials}
                        </div>
                        <h3 className="font-heading font-bold text-base text-[var(--text)]">{teamDisplayName}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id)}
                        aria-label="Elimina squadra"
                        className="touch-target p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-1.5">
                      <span className="text-[11px] font-semibold text-[var(--text-subtle)] block">
                        Formazione:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {teamPlayerLabels.length > 0 ? (
                          teamPlayerLabels.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--divider)]"
                            >
                              <span>{name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Nessun giocatore</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--divider)] text-[11px] text-[var(--text-subtle)]">
                    {playerIds.length === 2 ? 'Squadra da 2 (Coppia standard)' : 'Giocatore singolo (1v1)'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEZIONE 3: GIOCATORI AMICI (ESTERNI ALLA CASA) */}
      <div className="space-y-4 pt-4 border-t border-[var(--divider)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">
              Giocatori Amici ({friendPlayers.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowFriendModal(true)}
            className="touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-alt)] border border-[var(--control-border)] hover:border-[var(--control-border-hover)] text-xs font-semibold text-[var(--text)] btn-tactile cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Nuovo Amico</span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Amici e ospiti che giocano con noi ma non sono della casa. Compaiono qui automaticamente quando inserisci un loro nome nelle squadre dei tornei, oppure puoi aggiungerli a mano.
        </p>

        {friendPlayers.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--control-border)] p-6 text-center">
            <User className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-[var(--text)]">
              Nessun giocatore amico registrato per ora
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
              Quando inserisci il nome di un amico o ospite nelle squadre dei tornei, comparirà qui automaticamente!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {friendPlayers.map((player) => {
              const effName = (typeof player.nickname === 'string' && player.nickname.trim())
                ? player.nickname.trim()
                : (typeof player.name === 'string' && player.name.trim())
                  ? player.name.trim()
                  : 'Amico';
              const hasDiff = Boolean(
                player.nickname &&
                player.name &&
                player.nickname.trim().toLowerCase() !== player.name.trim().toLowerCase()
              );

              return (
                <div
                  key={player.id}
                  className="bg-[var(--surface)] rounded-xl border border-[var(--divider)] hover:border-[var(--control-border)] p-3.5 flex items-center justify-between interactive-card group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--control-border)] flex items-center justify-center shrink-0 group-hover:border-[var(--accent)]/50 transition-colors">
                      <SuitIcon suit={player.avatarSuit} className="w-4 h-4 text-[var(--accent)] icon-hover-tilt" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm text-[var(--text)] block truncate">
                        {effName}
                      </span>
                      {hasDiff && (
                        <span className="text-[10px] text-[var(--text-muted)] block truncate">
                          {player.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFriend(player.id)}
                    aria-label={`Elimina amico ${effName}`}
                    title={`Elimina amico ${effName}`}
                    className="touch-target p-1.5 rounded-md text-[var(--text-subtle)] hover:text-rose-400 hover:bg-[var(--surface-raised)] transition-colors shrink-0 cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: AGGIUNGI MEMBRO DELLA CASA */}
      {showMemberModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => setShowMemberModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6 modal-safe-container">
            <div
              className="relative z-10 w-full max-w-sm my-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] animate-scale-in text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)]">Aggiungi Membro Casa</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Chi vive o gioca stabilmente in casa</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="touch-target p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
                <form onSubmit={handleSaveMember} className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Nome:</label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Marco, Giulia..."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                      Soprannome in casa (opzionale):
                    </label>
                    <p className="text-[11px] text-[var(--text-muted)] mb-1">
                      Se impostato, comparirà solo questo nei suggerimenti per le partite.
                    </p>
                    <input
                      type="text"
                      placeholder="Es. Il Maestro, Teo..."
                      value={newMemberNickname}
                      onChange={(e) => setNewMemberNickname(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--divider)]">
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(false)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-xs btn-tactile cursor-pointer shadow-sm"
                    >
                      Salva Membro
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: AGGIUNGI GIOCATORE AMICO */}
      {showFriendModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => setShowFriendModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6 modal-safe-container">
            <div
              className="relative z-10 w-full max-w-sm my-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] animate-scale-in text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text)]">Nuovo Giocatore Amico</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Amici o ospiti che non sono della casa</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFriendModal(false)}
                  className="touch-target p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
                <form onSubmit={handleSaveFriend} className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Nome:</label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Luca, Zio Pino..."
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                      Soprannome (opzionale):
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Il Cecchino..."
                      value={friendNickname}
                      onChange={(e) => setFriendNickname(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                      Seme preferito:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['coppe', 'denari', 'spade', 'bastoni'] as CardSuit[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFriendSuit(s)}
                          className={`min-h-[52px] p-2 rounded-xl flex flex-col items-center justify-center border btn-tactile cursor-pointer ${
                            friendSuit === s
                              ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent-text)]'
                              : 'bg-[var(--surface-alt)] border-[var(--divider)] text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <SuitIcon suit={s} className="w-5 h-5 mb-1" />
                          <span className="text-[10px] capitalize font-medium">{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--divider)]">
                    <button
                      type="button"
                      onClick={() => setShowFriendModal(false)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-xs btn-tactile cursor-pointer shadow-sm"
                    >
                      Salva Amico
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: CREA SQUADRA */}
      {showTeamModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => setShowTeamModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6 modal-safe-container">
            <div
              className="relative z-10 w-full max-w-md my-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--control-border-hover)] ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] animate-scale-in text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] bg-[var(--surface-raised)] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[var(--text)]">Crea Nuova Squadra</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="touch-target p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
                <form onSubmit={handleSaveTeam} className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Nome Squadra:</label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Gli Invincibili"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">Giocatore 1:</label>
                      <div className="relative">
                        <select
                          required
                          value={selectedPlayer1}
                          onChange={(e) => setSelectedPlayer1(e.target.value)}
                          className="w-full appearance-none bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl pl-3.5 pr-8 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer truncate"
                        >
                          <option value="">Seleziona...</option>
                          <optgroup label="Membri della Casa">
                            {selectablePlayers
                              .filter((p) => p.isMember)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </optgroup>
                          {selectablePlayers.some((p) => !p.isMember) && (
                            <optgroup label="Giocatori Amici">
                              {selectablePlayers
                                .filter((p) => !p.isMember)
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1.5 font-medium">
                        Giocatore 2 (opzionale):
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPlayer2}
                          onChange={(e) => setSelectedPlayer2(e.target.value)}
                          className="w-full appearance-none bg-[var(--surface-alt)] border border-[var(--control-border)] rounded-xl pl-3.5 pr-8 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer truncate"
                        >
                          <option value="">Nessuno (1v1)</option>
                          <optgroup label="Membri della Casa">
                            {selectablePlayers
                              .filter((p) => p.isMember)
                              .map((p) => (
                                <option key={p.id} value={p.id} disabled={p.id === selectedPlayer1}>
                                  {p.name}
                                </option>
                              ))}
                          </optgroup>
                          {selectablePlayers.some((p) => !p.isMember) && (
                            <optgroup label="Giocatori Amici">
                              {selectablePlayers
                                .filter((p) => !p.isMember)
                                .map((p) => (
                                  <option key={p.id} value={p.id} disabled={p.id === selectedPlayer1}>
                                    {p.name}
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--divider)]">
                    <button
                      type="button"
                      onClick={() => setShowTeamModal(false)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] font-bold text-xs btn-tactile cursor-pointer shadow-sm"
                    >
                      Salva Squadra
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: CONDIVIDI CASA / QR */}
      {showShareModal && activeHouse && (
        <ShareHouseModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          house={activeHouse}
        />
      )}
    </div>
  );
}
