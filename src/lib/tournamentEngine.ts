import { Tournament, TournamentMatch, GameType, Team } from '@/types/game';

// Genera un torneo a Girone all'Italiana (Round Robin)
export function createRoundRobinTournament(
  name: string,
  teamIds: string[],
  gameType: GameType = 'briscola'
): Tournament {
  const matches: TournamentMatch[] = [];
  const n = teamIds.length;
  let matchCounter = 1;

  // Genera tutti gli scontri unici
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        id: `tm_${Date.now()}_${matchCounter}`,
        roundIndex: Math.floor((matchCounter - 1) / Math.floor(n / 2)) + 1,
        roundName: `Partita ${matchCounter}`,
        team1Id: teamIds[i],
        team2Id: teamIds[j],
        status: 'pending',
      });
      matchCounter++;
    }
  }

  return {
    id: `tour_${Date.now()}`,
    name,
    gameType,
    format: 'round_robin',
    teamIds,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    matches,
    winnerTeamId: null,
  };
}

// Genera un torneo ad Eliminazione Diretta (Knockout Bracket)
// Supporta 4 o 8 squadre
export function createKnockoutTournament(
  name: string,
  teamIds: string[],
  gameType: GameType = 'briscola'
): Tournament {
  const matches: TournamentMatch[] = [];
  const now = Date.now();

  if (teamIds.length === 4) {
    // 2 Semifinali + 1 Finale
    const finalMatchId = `tm_${now}_final`;

    const semi1: TournamentMatch = {
      id: `tm_${now}_semi1`,
      roundIndex: 1,
      roundName: 'Semifinale 1',
      team1Id: teamIds[0],
      team2Id: teamIds[1],
      status: 'pending',
      nextMatchId: finalMatchId,
      nextMatchSlot: 'team1',
    };

    const semi2: TournamentMatch = {
      id: `tm_${now}_semi2`,
      roundIndex: 1,
      roundName: 'Semifinale 2',
      team1Id: teamIds[2],
      team2Id: teamIds[3],
      status: 'pending',
      nextMatchId: finalMatchId,
      nextMatchSlot: 'team2',
    };

    const finalMatch: TournamentMatch = {
      id: finalMatchId,
      roundIndex: 2,
      roundName: 'Grand Finale 🏆',
      team1Id: null, // da definire dal vincitore semi1
      team2Id: null, // da definire dal vincitore semi2
      status: 'pending',
    };

    matches.push(semi1, semi2, finalMatch);
  } else if (teamIds.length === 8) {
    // 4 Quarti + 2 Semifinali + 1 Finale
    const finalMatchId = `tm_${now}_final`;
    const semi1Id = `tm_${now}_semi1`;
    const semi2Id = `tm_${now}_semi2`;

    const q1: TournamentMatch = {
      id: `tm_${now}_q1`,
      roundIndex: 1,
      roundName: 'Quarto 1',
      team1Id: teamIds[0],
      team2Id: teamIds[1],
      status: 'pending',
      nextMatchId: semi1Id,
      nextMatchSlot: 'team1',
    };
    const q2: TournamentMatch = {
      id: `tm_${now}_q2`,
      roundIndex: 1,
      roundName: 'Quarto 2',
      team1Id: teamIds[2],
      team2Id: teamIds[3],
      status: 'pending',
      nextMatchId: semi1Id,
      nextMatchSlot: 'team2',
    };
    const q3: TournamentMatch = {
      id: `tm_${now}_q3`,
      roundIndex: 1,
      roundName: 'Quarto 3',
      team1Id: teamIds[4],
      team2Id: teamIds[5],
      status: 'pending',
      nextMatchId: semi2Id,
      nextMatchSlot: 'team1',
    };
    const q4: TournamentMatch = {
      id: `tm_${now}_q4`,
      roundIndex: 1,
      roundName: 'Quarto 4',
      team1Id: teamIds[6],
      team2Id: teamIds[7],
      status: 'pending',
      nextMatchId: semi2Id,
      nextMatchSlot: 'team2',
    };

    const semi1: TournamentMatch = {
      id: semi1Id,
      roundIndex: 2,
      roundName: 'Semifinale 1',
      team1Id: null,
      team2Id: null,
      status: 'pending',
      nextMatchId: finalMatchId,
      nextMatchSlot: 'team1',
    };

    const semi2: TournamentMatch = {
      id: semi2Id,
      roundIndex: 2,
      roundName: 'Semifinale 2',
      team1Id: null,
      team2Id: null,
      status: 'pending',
      nextMatchId: finalMatchId,
      nextMatchSlot: 'team2',
    };

    const finalMatch: TournamentMatch = {
      id: finalMatchId,
      roundIndex: 3,
      roundName: 'Grand Finale 🏆',
      team1Id: null,
      team2Id: null,
      status: 'pending',
    };

    matches.push(q1, q2, q3, q4, semi1, semi2, finalMatch);
  } else {
    // Semplice sfida diretta (2 squadre)
    matches.push({
      id: `tm_${now}_final`,
      roundIndex: 1,
      roundName: 'Finale Unica',
      team1Id: teamIds[0] || null,
      team2Id: teamIds[1] || null,
      status: 'pending',
    });
  }

  return {
    id: `tour_${now}`,
    name,
    gameType,
    format: 'knockout',
    teamIds,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    matches,
    winnerTeamId: null,
  };
}

// Aggiorna il risultato di una partita del torneo
export function recordTournamentMatchResult(
  tournament: Tournament,
  matchId: string,
  winnerId: string,
  score1?: number,
  score2?: number
): Tournament {
  const updatedMatches = tournament.matches.map((m) => {
    if (m.id === matchId) {
      return {
        ...m,
        winnerTeamId: winnerId,
        scoreTeam1: score1,
        scoreTeam2: score2,
        status: 'completed' as const,
      };
    }
    return m;
  });

  const currentMatch = updatedMatches.find((m) => m.id === matchId);

  // Se è un torneo ad eliminazione diretta e c'è una partita successiva, promuovi il vincitore
  if (tournament.format === 'knockout' && currentMatch && currentMatch.nextMatchId) {
    const nextId = currentMatch.nextMatchId;
    const slot = currentMatch.nextMatchSlot;

    const targetIdx = updatedMatches.findIndex((m) => m.id === nextId);
    if (targetIdx >= 0) {
      const nextMatch = { ...updatedMatches[targetIdx] };
      if (slot === 'team1') {
        nextMatch.team1Id = winnerId;
      } else {
        nextMatch.team2Id = winnerId;
      }
      updatedMatches[targetIdx] = nextMatch;
    }
  }

  // Verifica se tutte le partite sono completate
  const allCompleted = updatedMatches.every((m) => m.status === 'completed');
  let winnerTeamId = tournament.winnerTeamId;

  if (tournament.format === 'knockout') {
    // In eliminazione diretta, il vincitore del torneo è il vincitore della finale (ultima partita)
    const finalMatch = updatedMatches[updatedMatches.length - 1];
    if (finalMatch && finalMatch.status === 'completed') {
      winnerTeamId = finalMatch.winnerTeamId;
    }
  } else if (tournament.format === 'round_robin' && allCompleted) {
    // Nel girone, trova chi ha più vittorie
    const winCounts: Record<string, number> = {};
    for (const m of updatedMatches) {
      if (m.winnerTeamId) {
        winCounts[m.winnerTeamId] = (winCounts[m.winnerTeamId] || 0) + 1;
      }
    }
    let topTeam = null;
    let maxWins = -1;
    for (const [tId, wins] of Object.entries(winCounts)) {
      if (wins > maxWins) {
        maxWins = wins;
        topTeam = tId;
      }
    }
    winnerTeamId = topTeam;
  }

  return {
    ...tournament,
    matches: updatedMatches,
    status: allCompleted ? 'completed' : 'in_progress',
    winnerTeamId,
  };
}

// Calcola la classifica per torneo a girone (Round Robin)
export interface RoundRobinStanding {
  teamId: string;
  team: Team | undefined;
  played: number;
  wins: number;
  losses: number;
  points: number; // 3 per vittoria, 0 per sconfitta
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
}

export function calculateRoundRobinStandings(
  tournament: Tournament,
  allTeams: Team[]
): RoundRobinStanding[] {
  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const standingsMap: Record<string, RoundRobinStanding> = {};

  for (const tId of tournament.teamIds) {
    standingsMap[tId] = {
      teamId: tId,
      team: teamMap.get(tId),
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreDiff: 0,
    };
  }

  for (const m of tournament.matches) {
    if (m.status !== 'completed' || !m.winnerTeamId || !m.team1Id || !m.team2Id) continue;

    const s1 = standingsMap[m.team1Id];
    const s2 = standingsMap[m.team2Id];

    if (s1) {
      s1.played++;
      if (m.winnerTeamId === m.team1Id) {
        s1.wins++;
        s1.points += 3;
      } else {
        s1.losses++;
      }
      if (m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined) {
        s1.scoreFor += m.scoreTeam1;
        s1.scoreAgainst += m.scoreTeam2;
      }
    }

    if (s2) {
      s2.played++;
      if (m.winnerTeamId === m.team2Id) {
        s2.wins++;
        s2.points += 3;
      } else {
        s2.losses++;
      }
      if (m.scoreTeam1 !== undefined && m.scoreTeam2 !== undefined) {
        s2.scoreFor += m.scoreTeam2;
        s2.scoreAgainst += m.scoreTeam1;
      }
    }
  }

  // Calcola differenza punti
  for (const s of Object.values(standingsMap)) {
    s.scoreDiff = s.scoreFor - s.scoreAgainst;
  }

  // Ordina per punti decrescenti, poi vittorie, poi differenza punti
  return Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.scoreDiff - a.scoreDiff;
  });
}
