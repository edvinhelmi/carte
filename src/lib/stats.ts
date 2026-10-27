import { Player, Team, Match, TeamStats, PlayerStats, HeadToHeadStats } from '@/types/game';

export function calculateTeamStats(teams: Team[], matches: Match[], players: Player[]): TeamStats[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const stats: TeamStats[] = teams.map((team) => {
    const teamMatches = matches.filter((m) => m.team1Id === team.id || m.team2Id === team.id);
    const wins = teamMatches.filter((m) => m.winnerTeamId === team.id).length;
    const matchesPlayed = teamMatches.length;
    const losses = matchesPlayed - wins;
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    // Calcolo della striscia attuale (ordinando le partite da più recenti a più vecchie)
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

export function calculatePlayerStats(players: Player[], teams: Team[], matches: Match[]): PlayerStats[] {
  const stats: PlayerStats[] = players.map((player) => {
    // Trova tutti i team di cui fa parte il giocatore
    const playerTeamIds = new Set(teams.filter((t) => t.playerIds.includes(player.id)).map((t) => t.id));

    // Trova tutte le partite in cui ha partecipato almeno uno di questi team
    const playerMatches = matches.filter(
      (m) => playerTeamIds.has(m.team1Id) || playerTeamIds.has(m.team2Id)
    );

    const wins = playerMatches.filter((m) => playerTeamIds.has(m.winnerTeamId)).length;
    const matchesPlayed = playerMatches.length;
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
  matches: Match[]
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

  const team1Wins = directMatches.filter((m) => m.winnerTeamId === team1Id).length;
  const team2Wins = directMatches.filter((m) => m.winnerTeamId === team2Id).length;

  return {
    team1,
    team2,
    team1Wins,
    team2Wins,
    totalMatches: directMatches.length,
    lastMatches: directMatches.slice(0, 5),
  };
}

export function getDailySummary(dateKey: string, matches: Match[], teams: Team[]) {
  const dayMatches = matches
    .filter((m) => m.dateKey === dateKey)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (dayMatches.length === 0) {
    return {
      dateKey,
      totalMatches: 0,
      championTeam: null,
      matches: [],
    };
  }

  // Conta le vittorie per ciascun team nel giorno
  const winCount: Record<string, number> = {};
  for (const m of dayMatches) {
    winCount[m.winnerTeamId] = (winCount[m.winnerTeamId] || 0) + 1;
  }

  let championTeamId: string | null = null;
  let maxWins = -1;

  for (const [teamId, wins] of Object.entries(winCount)) {
    if (wins > maxWins) {
      maxWins = wins;
      championTeamId = teamId;
    }
  }

  const championTeam = teams.find((t) => t.id === championTeamId) || null;

  return {
    dateKey,
    totalMatches: dayMatches.length,
    championTeam,
    championWins: maxWins,
    matches: dayMatches,
  };
}
