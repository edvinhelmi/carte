import type { Player, Team, Match, TournamentSession, TeamStats, PlayerStats, HeadToHeadStats } from '@/types/game';

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
    const sessionTeams: [string, string[]][] = [
      [session.team1Name, session.team1Players],
      [session.team2Name, session.team2Players],
    ];
    if (session.team3Name) {
      sessionTeams.push([session.team3Name, session.team3Players || []]);
    }

    for (const [tName, pNames] of sessionTeams) {
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
      const totalSessionWins = (session.team1Wins || 0) + (session.team2Wins || 0) + (session.team3Wins || 0);
      const isT1 = session.team1Name.toLowerCase() === team.name.toLowerCase();
      const isT2 = session.team2Name.toLowerCase() === team.name.toLowerCase();
      const isT3 = !!session.team3Name && session.team3Name.toLowerCase() === team.name.toLowerCase();

      if (isT1) {
        wins += session.team1Wins;
        matchesPlayed += totalSessionWins;
      } else if (isT2) {
        wins += session.team2Wins;
        matchesPlayed += totalSessionWins;
      } else if (isT3) {
        wins += session.team3Wins || 0;
        matchesPlayed += totalSessionWins;
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
      const inTeam1 =
        session.team1Players.some((p) => p.toLowerCase() === pNameLower) ||
        session.team1Name.toLowerCase() === pNameLower;
      const inTeam2 =
        session.team2Players.some((p) => p.toLowerCase() === pNameLower) ||
        session.team2Name.toLowerCase() === pNameLower;
      const inTeam3 =
        session.team3Players?.some((p) => p.toLowerCase() === pNameLower) ||
        (session.team3Name ? session.team3Name.toLowerCase() === pNameLower : false);

      const totalSessionMatches =
        (session.team1Wins || 0) + (session.team2Wins || 0) + (session.team3Wins || 0);

      if (inTeam1) {
        wins += session.team1Wins;
        matchesPlayed += totalSessionMatches;
      } else if (inTeam2) {
        wins += session.team2Wins;
        matchesPlayed += totalSessionMatches;
      } else if (inTeam3) {
        wins += session.team3Wins || 0;
        matchesPlayed += totalSessionMatches;
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
    const sessionTeams: { name: string; wins: number }[] = [
      { name: session.team1Name, wins: session.team1Wins || 0 },
      { name: session.team2Name, wins: session.team2Wins || 0 },
    ];
    if (session.team3Name) {
      sessionTeams.push({ name: session.team3Name, wins: session.team3Wins || 0 });
    }

    const t1Entry = sessionTeams.find(
      (t) => t.name.toLowerCase() === team1.name.toLowerCase()
    );
    const t2Entry = sessionTeams.find(
      (t) => t.name.toLowerCase() === team2.name.toLowerCase()
    );

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
    daySessions.reduce((acc, s) => acc + s.team1Wins + s.team2Wins + (s.team3Wins || 0), 0);

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
    const sessionTeams: [string, number][] = [
      [s.team1Name, s.team1Wins || 0],
      [s.team2Name, s.team2Wins || 0],
    ];
    if (s.team3Name) {
      sessionTeams.push([s.team3Name, s.team3Wins || 0]);
    }

    for (const [name, wins] of sessionTeams) {
      const t = teams.find((team) => team.name.toLowerCase() === name.toLowerCase());
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

