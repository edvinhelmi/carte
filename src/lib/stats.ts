import type { Player, Team, Match, TournamentSession, TeamStats, PlayerStats, HeadToHeadStats } from '@/types/game';

function safeLower(str?: unknown): string {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

export function calculateTeamStats(
  teams: Team[] = [],
  matches: Match[] = [],
  players: Player[] = [],
  tournamentSessions: TournamentSession[] = []
): TeamStats[] {
  const safePlayers = (players || []).filter((p): p is Player => Boolean(p && typeof p.id === 'string'));
  const playerMap = new Map(safePlayers.map((p) => [p.id, p]));
  const playerNameMap = new Map(
    safePlayers.filter((p) => typeof p.name === 'string' && p.name.trim()).map((p) => [safeLower(p.name), p])
  );

  // Includi anche team creati durante i tornei che potrebbero non essere salvati nei preset
  const allTeams = [...(teams || []).filter((t): t is Team => Boolean(t && typeof t.id === 'string'))];
  for (const session of tournamentSessions || []) {
    if (!session) continue;
    if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
      for (const p of session.players5) {
        if (!p || typeof p.name !== 'string' || !p.name.trim()) continue;
        const pClean = p.name.trim();
        const pLower = safeLower(pClean);
        const existingTeam = allTeams.find((t) => safeLower(t.name) === pLower);
        const pId = playerNameMap.get(pLower)?.id;
        if (!existingTeam) {
          allTeams.push({
            id: 'synth_' + pLower.replace(/\s+/g, '_'),
            name: pClean,
            playerIds: pId ? [pId] : [],
            color: '#10b981',
            createdAt: session.startedAt || new Date().toISOString(),
          });
        } else if (existingTeam.playerIds && existingTeam.playerIds.length === 0 && pId) {
          existingTeam.playerIds = [pId];
        }
      }
      continue;
    }

    const sessionTeams: [string, string[]][] = [
      [session.team1Name || '', session.team1Players || []],
      [session.team2Name || '', session.team2Players || []],
    ];
    if (session.team3Name) {
      sessionTeams.push([session.team3Name, session.team3Players || []]);
    }

    for (const [tName, pNames] of sessionTeams) {
      if (!tName || typeof tName !== 'string' || !tName.trim()) continue;
      const tClean = tName.trim();
      const tLower = safeLower(tClean);
      const existingTeam = allTeams.find((t) => safeLower(t.name) === tLower);
      const pIds = (pNames || [])
        .map((pn) => (typeof pn === 'string' ? playerNameMap.get(safeLower(pn))?.id : undefined))
        .filter(Boolean) as string[];

      if (!existingTeam) {
        allTeams.push({
          id: 'synth_' + tLower.replace(/\s+/g, '_'),
          name: tClean,
          playerIds: pIds,
          color: '#10b981',
          createdAt: session.startedAt || new Date().toISOString(),
        });
      } else if (existingTeam.playerIds && existingTeam.playerIds.length === 0 && pIds.length > 0) {
        existingTeam.playerIds = pIds;
      }
    }
  }

  const safeMatches = (matches || []).filter((m): m is Match => Boolean(m && typeof m.id === 'string'));

  const stats: TeamStats[] = allTeams.map((team) => {
    const teamMatches = safeMatches.filter((m) => m.team1Id === team.id || m.team2Id === team.id);
    let wins = teamMatches.filter((m) => m.winnerTeamId === team.id).length;
    let matchesPlayed = teamMatches.length;

    const teamLower = safeLower(team.name);

    // Aggiungi vittorie e partite dalle sessioni di torneo
    for (const session of tournamentSessions || []) {
      if (!session) continue;
      if (session.mode === 'a5' && session.players5) {
        const pEntry = session.players5.find((p) => p && safeLower(p.name) === teamLower);
        if (pEntry) {
          const maxWins = Math.max(0, ...session.players5.map((p) => (p && typeof p.wins === 'number' ? p.wins : 0)));
          const sumWins = session.players5.reduce((sum, p) => sum + (p && typeof p.wins === 'number' ? p.wins : 0), 0);
          const sessionHands = Math.max(pEntry.wins || 0, maxWins, Math.round(sumWins / 2.5));
          wins += pEntry.wins || 0;
          matchesPlayed += sessionHands;
        }
        continue;
      }

      const totalSessionWins = (session.team1Wins || 0) + (session.team2Wins || 0) + (session.team3Wins || 0);
      const isT1 = safeLower(session.team1Name) === teamLower;
      const isT2 = safeLower(session.team2Name) === teamLower;
      const isT3 = Boolean(session.team3Name) && safeLower(session.team3Name) === teamLower;

      if (isT1) {
        wins += session.team1Wins || 0;
        matchesPlayed += totalSessionWins;
      } else if (isT2) {
        wins += session.team2Wins || 0;
        matchesPlayed += totalSessionWins;
      } else if (isT3) {
        wins += session.team3Wins || 0;
        matchesPlayed += totalSessionWins;
      }
    }

    const losses = Math.max(0, matchesPlayed - wins);
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    // Calcolo della striscia attuale
    const sortedMatches = [...teamMatches].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

    let streak = 0;
    for (const m of sortedMatches) {
      if (m.winnerTeamId === team.id) {
        streak++;
      } else {
        break;
      }
    }

    const teamPlayers = (team.playerIds || []).map((id) => playerMap.get(id)).filter(Boolean) as Player[];

    return {
      team,
      players: teamPlayers,
      matchesPlayed,
      wins,
      losses,
      winRate,
      streak,
    };
  });

  // Ordina per vittorie (decrescente), poi per winRate
  return stats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });
}

export function calculatePlayerStats(
  players: Player[] = [],
  teams: Team[] = [],
  matches: Match[] = [],
  tournamentSessions: TournamentSession[] = []
): PlayerStats[] {
  const safePlayers = (players || []).filter((p): p is Player => Boolean(p && typeof p.id === 'string'));
  const allPlayers = [...safePlayers];
  const knownPlayerNames = new Set(
    safePlayers.filter((p) => typeof p.name === 'string' && p.name.trim()).map((p) => safeLower(p.name))
  );

  for (const session of tournamentSessions || []) {
    if (!session) continue;
    if (session.mode === 'a5' && session.players5) {
      for (const p of session.players5) {
        if (p && typeof p.name === 'string' && p.name.trim()) {
          const pClean = p.name.trim();
          const pLower = safeLower(pClean);
          if (!knownPlayerNames.has(pLower)) {
            knownPlayerNames.add(pLower);
            allPlayers.push({
              id: 'synth_p_' + pLower.replace(/\s+/g, '_'),
              name: pClean,
              avatarSuit: 'denari',
              createdAt: session.startedAt || new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  const safeTeams = (teams || []).filter((t): t is Team => Boolean(t && typeof t.id === 'string'));
  const safeMatches = (matches || []).filter((m): m is Match => Boolean(m && typeof m.id === 'string'));

  const stats: PlayerStats[] = allPlayers.map((player) => {
    const pNameLower = safeLower(player.name);
    const pNickLower = safeLower(player.nickname);

    const matchesNameOrNick = (target?: string | null): boolean => {
      if (!target || typeof target !== 'string') return false;
      const lower = safeLower(target);
      if (!lower) return false;
      if (lower === pNameLower) return true;
      if (pNickLower && lower === pNickLower) return true;
      const parts = lower.split(/\s*(?:&|\+|\be\b|\bed\b|,)\s*/);
      return parts.includes(pNameLower) || (pNickLower ? parts.includes(pNickLower) : false);
    };

    const playerTeamIds = new Set(
      safeTeams.filter((t) => Array.isArray(t.playerIds) && t.playerIds.includes(player.id)).map((t) => t.id)
    );

    const playerMatches = safeMatches.filter(
      (m) => playerTeamIds.has(m.team1Id) || playerTeamIds.has(m.team2Id)
    );

    let wins = playerMatches.filter((m) => playerTeamIds.has(m.winnerTeamId)).length;
    let matchesPlayed = playerMatches.length;

    // Aggiungi vittorie e partite disputate nei tornei per il singolo giocatore
    for (const session of tournamentSessions || []) {
      if (!session) continue;
      if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
        const pEntry = session.players5.find((p) => p && matchesNameOrNick(p.name));
        if (pEntry) {
          const maxWins = Math.max(0, ...session.players5.map((p) => (p && typeof p.wins === 'number' ? p.wins : 0)));
          const sumWins = session.players5.reduce((sum, p) => sum + (p && typeof p.wins === 'number' ? p.wins : 0), 0);
          const sessionHands = Math.max(pEntry.wins || 0, maxWins, Math.round(sumWins / 2.5));
          wins += pEntry.wins || 0;
          matchesPlayed += sessionHands;
        }
        continue;
      }

      const inTeam1 =
        session.team1Players?.some((p) => matchesNameOrNick(p)) ||
        matchesNameOrNick(session.team1Name);

      const inTeam2 =
        session.team2Players?.some((p) => matchesNameOrNick(p)) ||
        matchesNameOrNick(session.team2Name);

      const inTeam3 =
        session.team3Players?.some((p) => matchesNameOrNick(p)) ||
        matchesNameOrNick(session.team3Name);

      const totalSessionMatches =
        (session.team1Wins || 0) + (session.team2Wins || 0) + (session.team3Wins || 0);

      if (inTeam1) {
        wins += session.team1Wins || 0;
        matchesPlayed += totalSessionMatches;
      } else if (inTeam2) {
        wins += session.team2Wins || 0;
        matchesPlayed += totalSessionMatches;
      } else if (inTeam3) {
        wins += session.team3Wins || 0;
        matchesPlayed += totalSessionMatches;
      }
    }

    const losses = Math.max(0, matchesPlayed - wins);
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    const sortedMatches = [...playerMatches].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

    let streak = 0;
    for (const m of sortedMatches) {
      if (playerTeamIds.has(m.winnerTeamId)) {
        streak++;
      } else {
        break;
      }
    }

    return {
      player,
      matchesPlayed,
      wins,
      losses,
      winRate,
      streak,
    };
  });

  return stats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });
}

export function calculateHeadToHead(
  team1Id: string,
  team2Id: string,
  teams: Team[] = [],
  matches: Match[] = [],
  tournamentSessions: TournamentSession[] = []
): HeadToHeadStats | null {
  if (!team1Id || !team2Id) return null;
  const team1 = (teams || []).find((t) => t && t.id === team1Id);
  const team2 = (teams || []).find((t) => t && t.id === team2Id);

  if (!team1 || !team2) return null;

  const directMatches = (matches || [])
    .filter(
      (m) =>
        m &&
        ((m.team1Id === team1Id && m.team2Id === team2Id) ||
          (m.team1Id === team2Id && m.team2Id === team1Id))
    )
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

  let team1Wins = directMatches.filter((m) => m.winnerTeamId === team1Id).length;
  let team2Wins = directMatches.filter((m) => m.winnerTeamId === team2Id).length;
  let totalMatches = directMatches.length;

  const t1Lower = safeLower(team1.name);
  const t2Lower = safeLower(team2.name);

  // Aggiungi risultati da tornei
  for (const session of tournamentSessions || []) {
    if (!session) continue;
    if (session.mode === 'a5' && session.players5 && session.players5.length > 0) {
      const p1Entry = session.players5.find((p) => p && safeLower(p.name) === t1Lower);
      const p2Entry = session.players5.find((p) => p && safeLower(p.name) === t2Lower);
      if (p1Entry && p2Entry) {
        team1Wins += p1Entry.wins || 0;
        team2Wins += p2Entry.wins || 0;
        const maxWins = Math.max(0, ...session.players5.map((p) => (p && typeof p.wins === 'number' ? p.wins : 0)));
        const sumWins = session.players5.reduce((sum, p) => sum + (p && typeof p.wins === 'number' ? p.wins : 0), 0);
        totalMatches += Math.max(p1Entry.wins || 0, p2Entry.wins || 0, maxWins, Math.round(sumWins / 2.5));
      }
      continue;
    }

    const sessionTeams: { name: string; wins: number }[] = [
      { name: session.team1Name || '', wins: session.team1Wins || 0 },
      { name: session.team2Name || '', wins: session.team2Wins || 0 },
    ];
    if (session.team3Name) {
      sessionTeams.push({ name: session.team3Name, wins: session.team3Wins || 0 });
    }

    const t1Entry = sessionTeams.find((t) => safeLower(t.name) === t1Lower);
    const t2Entry = sessionTeams.find((t) => safeLower(t.name) === t2Lower);

    if (t1Entry && t2Entry) {
      const totalSessionWins = sessionTeams.reduce((sum, t) => sum + t.wins, 0);
      team1Wins += t1Entry.wins;
      team2Wins += t2Entry.wins;
      totalMatches += totalSessionWins;
    }
  }

  return {
    team1,
    team2,
    team1Wins,
    team2Wins,
    totalMatches,
    lastMatches: directMatches.slice(0, 5),
  };
}

export function getDailySummary(
  dateKey: string,
  matches: Match[] = [],
  teams: Team[] = [],
  tournamentSessions: TournamentSession[] = []
) {
  const dayMatches = (matches || [])
    .filter((m) => m && m.dateKey === dateKey)
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

  const daySessions = (tournamentSessions || []).filter((s) => s && s.dateKey === dateKey);

  const totalMatches =
    dayMatches.length +
    daySessions.reduce((acc, s) => {
      if (!s) return acc;
      if (s.mode === 'a5' && s.players5) {
        const maxWins = Math.max(0, ...s.players5.map((p) => (p && typeof p.wins === 'number' ? p.wins : 0)));
        const sumWins = s.players5.reduce((sum, p) => sum + (p && typeof p.wins === 'number' ? p.wins : 0), 0);
        return acc + Math.max(maxWins, Math.round(sumWins / 2.5));
      }
      return acc + (s.team1Wins || 0) + (s.team2Wins || 0) + (s.team3Wins || 0);
    }, 0);

  if (totalMatches === 0) {
    return {
      dateKey,
      totalMatches: 0,
      championTeam: null,
      championWins: 0,
      matches: [],
    };
  }

  const winCount: Record<string, number> = {};
  for (const m of dayMatches) {
    if (m.winnerTeamId) {
      winCount[m.winnerTeamId] = (winCount[m.winnerTeamId] || 0) + 1;
    }
  }

  for (const s of daySessions) {
    if (s.mode === 'a5' && s.players5) {
      for (const p of s.players5) {
        if (!p || typeof p.name !== 'string') continue;
        const pLower = safeLower(p.name);
        const t = (teams || []).find((team) => team && safeLower(team.name) === pLower);
        const key = t ? t.id : p.name;
        winCount[key] = (winCount[key] || 0) + (p.wins || 0);
      }
      continue;
    }

    const sessionTeams: [string, number][] = [
      [s.team1Name || '', s.team1Wins || 0],
      [s.team2Name || '', s.team2Wins || 0],
    ];
    if (s.team3Name) {
      sessionTeams.push([s.team3Name, s.team3Wins || 0]);
    }

    for (const [name, wins] of sessionTeams) {
      if (!name) continue;
      const nLower = safeLower(name);
      const t = (teams || []).find((team) => team && safeLower(team.name) === nLower);
      const key = t ? t.id : name;
      winCount[key] = (winCount[key] || 0) + wins;
    }
  }

  let championKey: string | null = null;
  let maxWins = -1;

  for (const [key, wins] of Object.entries(winCount)) {
    if (wins > maxWins) {
      maxWins = wins;
      championKey = key;
    }
  }

  let championTeam = (teams || []).find((t) => t && t.id === championKey) || null;
  if (!championTeam && championKey) {
    championTeam = {
      id: 'synth_' + championKey,
      name: championKey,
      playerIds: [championKey],
      color: '#10b981',
      createdAt: '',
    };
  }

  return {
    dateKey,
    totalMatches,
    championTeam,
    championWins: maxWins > 0 ? maxWins : 0,
    matches: dayMatches,
  };
}
