import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from '../src/lib/storage.ts';
import { calculateTeamStats, calculatePlayerStats, calculateHeadToHead, getDailySummary } from '../src/lib/stats.ts';
import type { Team, Player, TournamentSession } from '../src/types/game.ts';

// Mock localStorage and window if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: store.size,
  } as unknown as Storage;
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;
}

describe('Scopa & Scopone Scientifico Game Category Logic', () => {
  it('manages game category active switch (briscola <-> scopa)', () => {
    StorageService.setActiveGameCategory('briscola');
    assert.equal(StorageService.getActiveGameCategory(), 'briscola');

    StorageService.setActiveGameCategory('scopa');
    assert.equal(StorageService.getActiveGameCategory(), 'scopa');

    StorageService.setActiveGameCategory('briscola');
  });

  it('starts a Scopa Normale session with target points', () => {
    StorageService.setActiveGameCategory('scopa');
    const session = StorageService.startTournamentSession(
      'Marghe',
      ['Marghe'],
      'Edd',
      ['Edd'],
      '1vs1',
      undefined,
      undefined,
      undefined,
      'scopa',
      'scopa_normale',
      21
    );

    assert.equal(session.status, 'in_progress');
    assert.equal(session.gameType, 'scopa');
    assert.equal(session.scopaVariant, 'scopa_normale');
    assert.equal(session.targetPoints, 21);
    assert.equal(session.team1Wins, 0);
    assert.equal(session.team2Wins, 0);
    assert.deepEqual(session.scopaRounds, []);

    // Verifica che getActiveTournamentSession('scopa') la trovi
    const active = StorageService.getActiveTournamentSession('scopa');
    assert.ok(active);
    assert.equal(active.id, session.id);
  });

  it('adds turn-by-turn Scopa rounds with categories and updates points', () => {
    const session = StorageService.startTournamentSession(
      'Marghe & Irins',
      ['Marghe', 'Irins'],
      'Edd & Simon',
      ['Edd', 'Simon'],
      '2vs2',
      undefined,
      undefined,
      undefined,
      'scopa',
      'scopone_scientifico',
      21
    );

    // Smazzata 1: Marghe fa 1 scopa, vince Carte e Settebello. Edd fa 0 scope, vince Denari e Primiera.
    // Marghe: 1 scopa + 1 carte + 1 settebello = 3 punti
    // Edd: 1 denari + 1 primiera = 2 punti
    const updated = StorageService.addScopaRound(session.id, {
      scopeTeam1: 1,
      scopeTeam2: 0,
      carteWinner: 1,
      denariWinner: 2,
      settebelloWinner: 1,
      primieraWinner: 2,
      totalPointsTeam1: 3,
      totalPointsTeam2: 2,
    });

    assert.ok(updated);
    assert.equal(updated.team1Wins, 3);
    assert.equal(updated.team2Wins, 2);
    assert.equal(updated.scopaRounds?.length, 1);
    assert.equal(updated.scopaRounds[0].roundNumber, 1);
    assert.equal(updated.scopaRounds[0].scopeTeam1, 1);
    assert.equal(updated.scopaRounds[0].carteWinner, 1);

    // Smazzata 2: Edd fa 2 scope e Napola (3 punti di denari: A-2-3). Marghe vince solo Primiera.
    // Marghe: 1 pt
    // Edd: 2 scope + 3 napola + 1 carte + 1 denari + 1 settebello = 8 pt
    const updated2 = StorageService.addScopaRound(session.id, {
      scopeTeam1: 0,
      scopeTeam2: 2,
      carteWinner: 2,
      denariWinner: 2,
      settebelloWinner: 2,
      primieraWinner: 1,
      napolaPointsTeam2: 3,
      totalPointsTeam1: 1,
      totalPointsTeam2: 8,
    });

    assert.ok(updated2);
    assert.equal(updated2.team1Wins, 4); // 3 + 1
    assert.equal(updated2.team2Wins, 10); // 2 + 8
    assert.equal(updated2.scopaRounds?.length, 2);
  });

  it('undoes the last smazzata with removeLastScopaRound cleanly', () => {
    const session = StorageService.startTournamentSession(
      'Team Alpha',
      ['Alpha'],
      'Team Beta',
      ['Beta'],
      '2vs2',
      undefined,
      undefined,
      undefined,
      'scopa',
      'scopa_normale',
      11
    );

    StorageService.addScopaRound(session.id, {
      scopeTeam1: 2,
      scopeTeam2: 0,
      carteWinner: 1,
      totalPointsTeam1: 3,
      totalPointsTeam2: 0,
    });

    StorageService.addScopaRound(session.id, {
      scopeTeam1: 0,
      scopeTeam2: 1,
      carteWinner: 2,
      totalPointsTeam1: 0,
      totalPointsTeam2: 2,
    });

    const active = StorageService.getActiveTournamentSession('scopa')!;
    assert.equal(active.team1Wins, 3);
    assert.equal(active.team2Wins, 2);
    assert.equal(active.scopaRounds?.length, 2);

    // Annulla ultima smazzata
    const undone = StorageService.removeLastScopaRound(session.id);
    assert.ok(undone);
    assert.equal(undone.team1Wins, 3);
    assert.equal(undone.team2Wins, 0);
    assert.equal(undone.scopaRounds?.length, 1);
  });

  it('filters statistics cleanly between Briscola and Scopa', () => {
    const demoTeams: Team[] = [
      { id: 't1', name: 'Marghe & Irins', playerIds: ['p1', 'p2'], color: '#f59e0b', createdAt: '2026-10-01' },
      { id: 't2', name: 'Edd & Simon', playerIds: ['p4', 'p3'], color: '#10b981', createdAt: '2026-10-01' },
    ];
    const demoPlayers: Player[] = [
      { id: 'p1', name: 'Marghe', avatarSuit: 'coppe', createdAt: '2026-10-01' },
      { id: 'p2', name: 'Irins', avatarSuit: 'denari', createdAt: '2026-10-01' },
      { id: 'p3', name: 'Simon', avatarSuit: 'bastoni', createdAt: '2026-10-01' },
      { id: 'p4', name: 'Edd', avatarSuit: 'spade', createdAt: '2026-10-01' },
    ];

    const briscolaSession: TournamentSession = {
      id: 'sess_briscola_1',
      dateKey: '2026-11-04',
      startedAt: '2026-11-04T18:00:00Z',
      status: 'completed',
      gameType: 'briscola',
      mode: '2vs2',
      team1Name: 'Marghe & Irins',
      team1Players: ['Marghe', 'Irins'],
      team2Name: 'Edd & Simon',
      team2Players: ['Edd', 'Simon'],
      team1Wins: 5,
      team2Wins: 2,
      winnerTeam: '1',
    };

    const scopaSession: TournamentSession = {
      id: 'sess_scopa_1',
      dateKey: '2026-11-04',
      startedAt: '2026-11-04T19:00:00Z',
      status: 'completed',
      gameType: 'scopa',
      scopaVariant: 'scopone_scientifico',
      targetPoints: 21,
      mode: '2vs2',
      team1Name: 'Marghe & Irins',
      team1Players: ['Marghe', 'Irins'],
      team2Name: 'Edd & Simon',
      team2Players: ['Edd', 'Simon'],
      team1Wins: 14,
      team2Wins: 21,
      winnerTeam: '2',
    };

    const sessions = [briscolaSession, scopaSession];

    // 1. Stats solo Briscola
    const briscolaStats = calculateTeamStats(demoTeams, [], demoPlayers, sessions, 'briscola');
    const bT1 = briscolaStats.find((s) => s.team.id === 't1')!;
    const bT2 = briscolaStats.find((s) => s.team.id === 't2')!;
    assert.equal(bT1.wins, 5);
    assert.equal(bT2.wins, 2);

    // 2. Stats solo Scopa
    const scopaStats = calculateTeamStats(demoTeams, [], demoPlayers, sessions, 'scopa');
    const sT1 = scopaStats.find((s) => s.team.id === 't1')!;
    const sT2 = scopaStats.find((s) => s.team.id === 't2')!;
    assert.equal(sT1.wins, 14);
    assert.equal(sT2.wins, 21);

    // 3. Stats combinate (Tutti)
    const allStats = calculateTeamStats(demoTeams, [], demoPlayers, sessions, 'all');
    const aT1 = allStats.find((s) => s.team.id === 't1')!;
    const aT2 = allStats.find((s) => s.team.id === 't2')!;
    assert.equal(aT1.wins, 5 + 14);
    assert.equal(aT2.wins, 2 + 21);

    // 4. Head to head filtrato
    const h2hBriscola = calculateHeadToHead('t1', 't2', demoTeams, [], sessions, 'briscola');
    assert.equal(h2hBriscola?.team1Wins, 5);
    assert.equal(h2hBriscola?.team2Wins, 2);

    const h2hScopa = calculateHeadToHead('t1', 't2', demoTeams, [], sessions, 'scopa');
    assert.equal(h2hScopa?.team1Wins, 14);
    assert.equal(h2hScopa?.team2Wins, 21);
  });
});
