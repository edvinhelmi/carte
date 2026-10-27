import { Player, Team, Match, TournamentSession, TeamStats, PlayerStats, HeadToHeadStats } from '@/types/game';

export function calculateTeamStats(
  teams: Team[],
  matches: Match[],
  players: Player[],
  tournamentSessions: TournamentSession[] = []
): TeamStats[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const playerNameMap = new Map(players.map((p) => [p.name.toLowerCase(), p]));

  // Includi anche team creati durante i tornei che potrebbero non essere salvati nei preset
  const allTeams = [...teams];
  for (const session of tournamentSessions) {
    for (const [tName, pNames] of [
      [session.team1Name, session.team1Players],
      [session.team2Name, session.team2Players],
    ] as const) {
      if (!tName) continue;
      const exists = allTeams.some((t) => t.name.toLowerCase() === tName.toLowerCase());
      if (!exists) {
        const pIds = pNames
          .map((pn) => playerNameMap.get(pn.toLowerCase())?.id)
          .filter(Boolean) as string[];
        allTeams.push({
          id: 'synth_' + tName.toLowerCase().replace(/\s+/g, '_'),
          name: tName,
          playerIds: pIds,
          color: '#10b981',
          createdAt: session.startedAt,
        });
      }
    }
  }

  const stats: TeamStats[] = allTeams.map((team) => {
    const teamMatches = matches.filter((m) => m.team1Id === team.id || m.team2Id === team.id);
    let wins = teamMatches.filter((m) => m.winnerTeamId === team.id).length;
    let matchesPlayed = teamMatches.length;

    // Aggiungi vittorie e partite dalle sessioni di torneo
    for (const session of tournamentSessions) {
      if (session.team1Name.toLowerCase() === team.name.toLowerCase()) {
        wins += session.team1Wins;
        matchesPlayed += session.team1Wins + session.team2Wins;
      } else if (session.team2Name.toLowerCase() === team.name.toLowerCase()) {
        wins += session.team2Wins;
        matchesPlayed += session.team1Wins + session.team2Wins;
      }
    }

    const losses = matchesPlayed - wins;
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    // Calcolo della striscia attuale
    const sortedMatches = [...teamMatches].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let streak = 0;
    for (const m of sortedMatches) {
      if (m.winnerTeamId === team.id) {
        streak++;
      } else {
        break;
      }
    }

    const teamPlayers = team.playerIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[];

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
  players: Player[],
  teams: Team[],
  matches: Match[],
  tournamentSessions: TournamentSession[] = []
): PlayerStats[] {
  const stats: PlayerStats[] = players.map((player) => {
    const pNameLower = player.name.toLowerCase();
    const playerTeamIds = new Set(teams.filter((t) => t.playerIds.includes(player.id)).map((t) => t.id));

    const playerMatches = matches.filter(
      (m) => playerTeamIds.has(m.team1Id) || playerTeamIds.has(m.team2Id)
    );

    let wins = playerMatches.filter((m) => playerTeamIds.has(m.winnerTeamId)).length;
    let matchesPlayed = playerMatches.length;

    // Aggiungi vittorie e partite disputate nei tornei per il singolo giocatore
    for (const session of tournamentSessions) {
      const inTeam1 = session.team1Players.some((p) => p.toLowerCase() === pNameLower);
      const inTeam2 = session.team2Players.some((p) => p.toLowerCase() === pNameLower);

      if (inTeam1) {
        wins += session.team1Wins;
        matchesPlayed += session.team1Wins + session.team2Wins;
      } else if (inTeam2) {
        wins += session.team2Wins;
        matchesPlayed += session.team1Wins + session.team2Wins;
      }
    }

    const losses = matchesPlayed - wins;
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    const sortedMatches = [...playerMatches].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

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
  teams: Team[],
  matches: Match[],
  tournamentSessions: TournamentSession[] = []
): HeadToHeadStats | null {
  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);

  if (!team1 || !team2) return null;

  const directMatches = matches
    .filter(
      (m) =>
        (m.team1Id === team1Id && m.team2Id === team2Id) ||
        (m.team1Id === team2Id && m.team2Id === team1Id)
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let team1Wins = directMatches.filter((m) => m.winnerTeamId === team1Id).length;
  let team2Wins = directMatches.filter((m) => m.winnerTeamId === team2Id).length;
  let totalMatches = directMatches.length;

  // Aggiungi risultati da tornei
  for (const session of tournamentSessions) {
    const isT1T2 =
      session.team1Name.toLowerCase() === team1.name.toLowerCase() &&
      session.team2Name.toLowerCase() === team2.name.toLowerCase();
    const isT2T1 =
      session.team1Name.toLowerCase() === team2.name.toLowerCase() &&
      session.team2Name.toLowerCase() === team1.name.toLowerCase();

    if (isT1T2) {
      team1Wins += session.team1Wins;
      team2Wins += session.team2Wins;
      totalMatches += session.team1Wins + session.team2Wins;
    } else if (isT2T1) {
      team1Wins += session.team2Wins;
      team2Wins += session.team1Wins;
      totalMatches += session.team1Wins + session.team2Wins;
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
  matches: Match[],
  teams: Team[],
  tournamentSessions: TournamentSession[] = []
) {
  const dayMatches = matches
    .filter((m) => m.dateKey === dateKey)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const daySessions = tournamentSessions.filter((s) => s.dateKey === dateKey);

  const totalMatches =
    dayMatches.length +
    daySessions.reduce((acc, s) => acc + s.team1Wins + s.team2Wins, 0);

  if (totalMatches === 0) {
    return {
      dateKey,
      totalMatches: 0,
      championTeam: null,
      championWins: 0,
      matches: [],
    };
  }

  // Conta le vittorie per ciascun team nel giorno sia da partite singole che da tornei
  const winCount: Record<string, number> = {};
  for (const m of dayMatches) {
    winCount[m.winnerTeamId] = (winCount[m.winnerTeamId] || 0) + 1;
  }

  for (const s of daySessions) {
    const t1 = teams.find((t) => t.name.toLowerCase() === s.team1Name.toLowerCase());
    const t2 = teams.find((t) => t.name.toLowerCase() === s.team2Name.toLowerCase());
    const t1Key = t1 ? t1.id : s.team1Name;
    const t2Key = t2 ? t2.id : s.team2Name;

    winCount[t1Key] = (winCount[t1Key] || 0) + s.team1Wins;
    winCount[t2Key] = (winCount[t2Key] || 0) + s.team2Wins;
  }

  let championKey: string | null = null;
  let maxWins = -1;

  for (const [key, wins] of Object.entries(winCount)) {
    if (wins > maxWins) {
      maxWins = wins;
      championKey = key;
    }
  }

  let championTeam = teams.find((t) => t.id === championKey) || null;
  if (!championTeam && championKey) {
    championTeam = {
      id: 'synth_' + championKey,
      name: championKey,
      playerIds: [],
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
