import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTeamStats,
  calculatePlayerStats,
  calculateHeadToHead,
  getDailySummary,
} from '../src/lib/stats.ts';
import { StorageService } from '../src/lib/storage.ts';
import type { Team, Player, Match, TournamentSession } from '../src/types/game.ts';

describe('Tournament 1vs1vs1, 1vs1, and 2vs2 logic', () => {
  const demoPlayers: Player[] = [
    { id: 'p1', name: 'Marghe', avatarSuit: 'coppe', createdAt: '2026-10-01' },
    { id: 'p2', name: 'Irins', avatarSuit: 'denari', createdAt: '2026-10-01' },
    { id: 'p3', name: 'Simon', avatarSuit: 'bastoni', createdAt: '2026-10-01' },
    { id: 'p4', name: 'Edd', avatarSuit: 'spade', createdAt: '2026-10-01' },
  ];

  const demoTeams: Team[] = [
    {
      id: 't1',
      name: 'Marghe & Irins',
      playerIds: ['p1', 'p2'],
      color: '#f59e0b',
      createdAt: '2026-10-01',
    },
    {
      id: 't2',
      name: 'Edd & Simon',
      playerIds: ['p4', 'p3'],
      color: '#10b981',
      createdAt: '2026-10-01',
    },
    {
      id: 't_simon',
      name: 'Simon',
      playerIds: ['p3'],
      color: '#10b981',
      createdAt: '2026-10-01',
    },
    {
      id: 't_edd',
      name: 'Edd',
      playerIds: ['p4'],
      color: '#38bdf8',
      createdAt: '2026-10-01',
    },
    {
      id: 't_marghe',
      name: 'Marghe',
      playerIds: ['p1'],
      color: '#f59e0b',
      createdAt: '2026-10-01',
    },
  ];

  describe('calculateTeamStats with 1vs1vs1 sessions', () => {
    it('aggregates wins and matches played for all 3 participants in a 1vs1vs1 session', () => {
      const session1vs1vs1: TournamentSession = {
        id: 'tour_trio_1',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        endedAt: '2026-10-27T20:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team3Name: 'Marghe',
        team3Players: ['Marghe'],
        team1Wins: 4,
        team2Wins: 3,
        team3Wins: 5,
        status: 'completed',
        winnerTeam: 3,
      };

      const stats = calculateTeamStats(demoTeams, [], demoPlayers, [session1vs1vs1]);
      const totalSessionMatches = 4 + 3 + 5; // 12

      const simonStats = stats.find((s) => s.team.name === 'Simon');
      assert.ok(simonStats);
      assert.strictEqual(simonStats.wins, 4);
      assert.strictEqual(simonStats.matchesPlayed, totalSessionMatches);
      assert.strictEqual(simonStats.losses, 8);
      assert.strictEqual(simonStats.winRate, Math.round((4 / 12) * 100)); // 33%

      const eddStats = stats.find((s) => s.team.name === 'Edd');
      assert.ok(eddStats);
      assert.strictEqual(eddStats.wins, 3);
      assert.strictEqual(eddStats.matchesPlayed, totalSessionMatches);
      assert.strictEqual(eddStats.losses, 9);
      assert.strictEqual(eddStats.winRate, Math.round((3 / 12) * 100)); // 25%

      const margheStats = stats.find((s) => s.team.name === 'Marghe');
      assert.ok(margheStats);
      assert.strictEqual(margheStats.wins, 5);
      assert.strictEqual(margheStats.matchesPlayed, totalSessionMatches);
      assert.strictEqual(margheStats.losses, 7);
      assert.strictEqual(margheStats.winRate, Math.round((5 / 12) * 100)); // 42%
    });

    it('creates synthetic teams for unlisted team3 participants', () => {
      const sessionWithNewPlayer: TournamentSession = {
        id: 'tour_trio_synth',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team3Name: 'GuestPlayer',
        team3Players: ['GuestPlayer'],
        team1Wins: 2,
        team2Wins: 1,
        team3Wins: 3,
        status: 'completed',
        winnerTeam: 3,
      };

      const stats = calculateTeamStats(demoTeams, [], demoPlayers, [sessionWithNewPlayer]);
      const guestStats = stats.find((s) => s.team.name === 'GuestPlayer');
      assert.ok(guestStats);
      assert.strictEqual(guestStats.wins, 3);
      assert.strictEqual(guestStats.matchesPlayed, 6);
    });
  });

  describe('calculatePlayerStats with 1vs1vs1 and 1vs1 sessions', () => {
    it('accurately counts player wins and total matches played in 1vs1vs1', () => {
      const session1vs1vs1: TournamentSession = {
        id: 'tour_trio_2',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team3Name: 'Marghe',
        team3Players: ['Marghe'],
        team1Wins: 6,
        team2Wins: 2,
        team3Wins: 4,
        status: 'completed',
        winnerTeam: 1,
      };

      const stats = calculatePlayerStats(demoPlayers, demoTeams, [], [session1vs1vs1]);
      const total = 6 + 2 + 4; // 12

      const simon = stats.find((p) => p.player.name === 'Simon');
      assert.ok(simon);
      assert.strictEqual(simon.wins, 6);
      assert.strictEqual(simon.matchesPlayed, total);

      const edd = stats.find((p) => p.player.name === 'Edd');
      assert.ok(edd);
      assert.strictEqual(edd.wins, 2);
      assert.strictEqual(edd.matchesPlayed, total);

      const marghe = stats.find((p) => p.player.name === 'Marghe');
      assert.ok(marghe);
      assert.strictEqual(marghe.wins, 4);
      assert.strictEqual(marghe.matchesPlayed, total);

      // Irins was not in the session
      const irins = stats.find((p) => p.player.name === 'Irins');
      assert.ok(irins);
      assert.strictEqual(irins.wins, 0);
      assert.strictEqual(irins.matchesPlayed, 0);
    });

    it('accurately attributes stats in 1vs1 mode', () => {
      const session1vs1: TournamentSession = {
        id: 'tour_duo_1',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        mode: '1vs1',
        team1Name: 'Edd',
        team1Players: ['Edd'],
        team2Name: 'Simon',
        team2Players: ['Simon'],
        team1Wins: 5,
        team2Wins: 3,
        status: 'completed',
        winnerTeam: 1,
      };

      const stats = calculatePlayerStats(demoPlayers, demoTeams, [], [session1vs1]);
      const edd = stats.find((p) => p.player.name === 'Edd');
      assert.ok(edd);
      assert.strictEqual(edd.wins, 5);
      assert.strictEqual(edd.matchesPlayed, 8);

      const simon = stats.find((p) => p.player.name === 'Simon');
      assert.ok(simon);
      assert.strictEqual(simon.wins, 3);
      assert.strictEqual(simon.matchesPlayed, 8);
    });
  });

  describe('calculateHeadToHead with 1vs1vs1 sessions', () => {
    it('computes direct head-to-head stats when both teams participate in a 3-way session', () => {
      const session1vs1vs1: TournamentSession = {
        id: 'tour_trio_h2h',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team3Name: 'Marghe',
        team3Players: ['Marghe'],
        team1Wins: 4,
        team2Wins: 6,
        team3Wins: 2,
        status: 'completed',
        winnerTeam: 2,
      };

      // Simon vs Edd
      const h2hSimonEdd = calculateHeadToHead('t_simon', 't_edd', demoTeams, [], [session1vs1vs1]);
      assert.ok(h2hSimonEdd);
      assert.strictEqual(h2hSimonEdd.team1Wins, 4);
      assert.strictEqual(h2hSimonEdd.team2Wins, 6);
      assert.strictEqual(h2hSimonEdd.totalMatches, 12);

      // Simon vs Marghe
      const h2hSimonMarghe = calculateHeadToHead('t_simon', 't_marghe', demoTeams, [], [session1vs1vs1]);
      assert.ok(h2hSimonMarghe);
      assert.strictEqual(h2hSimonMarghe.team1Wins, 4);
      assert.strictEqual(h2hSimonMarghe.team2Wins, 2);
      assert.strictEqual(h2hSimonMarghe.totalMatches, 12);

      // Simon vs Marghe & Irins (team not in session -> 0 matches)
      const h2hUnrelated = calculateHeadToHead('t_simon', 't1', demoTeams, [], [session1vs1vs1]);
      assert.ok(h2hUnrelated);
      assert.strictEqual(h2hUnrelated.team1Wins, 0);
      assert.strictEqual(h2hUnrelated.team2Wins, 0);
      assert.strictEqual(h2hUnrelated.totalMatches, 0);
    });
  });

  describe('getDailySummary with 1vs1vs1 sessions', () => {
    it('correctly calculates total matches and crowns team3 when team3 has highest score', () => {
      const session1vs1vs1: TournamentSession = {
        id: 'tour_daily_1',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team3Name: 'Marghe',
        team3Players: ['Marghe'],
        team1Wins: 2,
        team2Wins: 3,
        team3Wins: 7,
        status: 'completed',
        winnerTeam: 3,
      };

      const match: Match = {
        id: 'm1',
        gameType: 'briscola',
        timestamp: '2026-10-27T14:00:00Z',
        dateKey: '2026-10-27',
        team1Id: 't_simon',
        team2Id: 't_edd',
        winnerTeamId: 't_simon',
      };

      const summary = getDailySummary('2026-10-27', [match], demoTeams, [session1vs1vs1]);
      assert.strictEqual(summary.totalMatches, 1 + (2 + 3 + 7)); // 13
      assert.ok(summary.championTeam);
      assert.strictEqual(summary.championTeam.name, 'Marghe');
      assert.strictEqual(summary.championWins, 7);
    });
  });

  describe('Winner calculation in 3-way tournaments', () => {
    const determineWinner = (w1: number, w2: number, w3: number) => {
      if (w1 > w2 && w1 > w3) return 1;
      if (w2 > w1 && w2 > w3) return 2;
      if (w3 > w1 && w3 > w2) return 3;
      return 'pareggio';
    };

    it('identifies winner when team 1, 2, or 3 has strictly highest score', () => {
      assert.strictEqual(determineWinner(5, 3, 2), 1);
      assert.strictEqual(determineWinner(2, 6, 4), 2);
      assert.strictEqual(determineWinner(1, 4, 8), 3);
      assert.strictEqual(determineWinner(5, 5, 2), 'pareggio');
      assert.strictEqual(determineWinner(3, 5, 5), 'pareggio');
      assert.strictEqual(determineWinner(4, 4, 4), 'pareggio');
      assert.strictEqual(determineWinner(0, 0, 0), 'pareggio');
    });
  });

  describe('Edge cases and backward compatibility', () => {
    it('handles legacy tournament sessions without mode or team3 smoothly', () => {
      const legacySession: TournamentSession = {
        id: 'tour_legacy_old',
        dateKey: '2026-10-25',
        startedAt: '2026-10-25T21:00:00Z',
        endedAt: '2026-10-25T23:00:00Z',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team1Wins: 4,
        team2Wins: 2,
        status: 'completed',
        winnerTeam: 1,
      };

      const playerStats = calculatePlayerStats(demoPlayers, demoTeams, [], [legacySession]);
      const simon = playerStats.find((p) => p.player.name === 'Simon');
      assert.ok(simon);
      assert.strictEqual(simon.wins, 4);
      assert.strictEqual(simon.matchesPlayed, 6);

      const teamStats = calculateTeamStats(demoTeams, [], demoPlayers, [legacySession]);
      const simonTeam = teamStats.find((s) => s.team.name === 'Simon');
      assert.ok(simonTeam);
      assert.strictEqual(simonTeam.wins, 4);
      assert.strictEqual(simonTeam.matchesPlayed, 6);

      const summary = getDailySummary('2026-10-25', [], demoTeams, [legacySession]);
      assert.strictEqual(summary.totalMatches, 6);
      assert.strictEqual(summary.championWins, 4);
    });

    it('handles case-insensitive player and team name matching', () => {
      const mixedCaseSession: TournamentSession = {
        id: 'tour_mixed_case',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T18:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'simon',
        team1Players: ['SIMON'],
        team2Name: 'EDD',
        team2Players: ['edd'],
        team3Name: 'mArGhE',
        team3Players: ['Marghe'],
        team1Wins: 3,
        team2Wins: 1,
        team3Wins: 2,
        status: 'completed',
        winnerTeam: 1,
      };

      const playerStats = calculatePlayerStats(demoPlayers, demoTeams, [], [mixedCaseSession]);
      const simon = playerStats.find((p) => p.player.name === 'Simon');
      assert.strictEqual(simon?.wins, 3);
      assert.strictEqual(simon?.matchesPlayed, 6);

      const edd = playerStats.find((p) => p.player.name === 'Edd');
      assert.strictEqual(edd?.wins, 1);
      assert.strictEqual(edd?.matchesPlayed, 6);

      const marghe = playerStats.find((p) => p.player.name === 'Marghe');
      assert.strictEqual(marghe?.wins, 2);
      assert.strictEqual(marghe?.matchesPlayed, 6);
    });

    it('correctly aggregates stats when a player plays across different slots (team1, team2, team3)', () => {
      const s1: TournamentSession = {
        id: 's1',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T10:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Simon',
        team1Players: ['Simon'],
        team2Name: 'Edd',
        team2Players: ['Edd'],
        team3Name: 'Marghe',
        team3Players: ['Marghe'],
        team1Wins: 3,
        team2Wins: 1,
        team3Wins: 1,
        status: 'completed',
        winnerTeam: 1,
      };

      const s2: TournamentSession = {
        id: 's2',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T12:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Marghe',
        team1Players: ['Marghe'],
        team2Name: 'Simon',
        team2Players: ['Simon'],
        team3Name: 'Edd',
        team3Players: ['Edd'],
        team1Wins: 2,
        team2Wins: 4,
        team3Wins: 1,
        status: 'completed',
        winnerTeam: 2,
      };

      const s3: TournamentSession = {
        id: 's3',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T14:00:00Z',
        mode: '1vs1vs1',
        team1Name: 'Edd',
        team1Players: ['Edd'],
        team2Name: 'Marghe',
        team2Players: ['Marghe'],
        team3Name: 'Simon',
        team3Players: ['Simon'],
        team1Wins: 1,
        team2Wins: 1,
        team3Wins: 5,
        status: 'completed',
        winnerTeam: 3,
      };

      // Simon won: 3 (in s1 as team1) + 4 (in s2 as team2) + 5 (in s3 as team3) = 12 wins
      // Total matches per session: (3+1+1=5) + (2+4+1=7) + (1+1+5=7) = 19 matches
      const playerStats = calculatePlayerStats(demoPlayers, demoTeams, [], [s1, s2, s3]);
      const simon = playerStats.find((p) => p.player.name === 'Simon');
      assert.strictEqual(simon?.wins, 12);
      assert.strictEqual(simon?.matchesPlayed, 19);

      // Marghe won: 1 (in s1 as team3) + 2 (in s2 as team1) + 1 (in s3 as team2) = 4 wins
      const marghe = playerStats.find((p) => p.player.name === 'Marghe');
      assert.strictEqual(marghe?.wins, 4);
      assert.strictEqual(marghe?.matchesPlayed, 19);

      // Edd won: 1 (s1) + 1 (s2) + 1 (s3) = 3 wins
      const edd = playerStats.find((p) => p.player.name === 'Edd');
      assert.strictEqual(edd?.wins, 3);
      assert.strictEqual(edd?.matchesPlayed, 19);
    });

    it('correctly attributes player stats when team names are delimited strings without player array', () => {
      const delimitedSession: TournamentSession = {
        id: 's_delimited',
        dateKey: '2026-10-27',
        startedAt: '2026-10-27T15:00:00Z',
        mode: '2vs2',
        team1Name: 'Marghe & Irins',
        team1Players: [], // empty explicit chips
        team2Name: 'Edd e Simon',
        team2Players: [],
        team1Wins: 5,
        team2Wins: 3,
        status: 'completed',
        winnerTeam: 1,
      };

      const stats = calculatePlayerStats(demoPlayers, demoTeams, [], [delimitedSession]);
      const marghe = stats.find((p) => p.player.name === 'Marghe');
      const irins = stats.find((p) => p.player.name === 'Irins');
      const edd = stats.find((p) => p.player.name === 'Edd');
      const simon = stats.find((p) => p.player.name === 'Simon');

      assert.strictEqual(marghe?.wins, 5);
      assert.strictEqual(marghe?.matchesPlayed, 8);
      assert.strictEqual(irins?.wins, 5);
      assert.strictEqual(irins?.matchesPlayed, 8);
      assert.strictEqual(edd?.wins, 3);
      assert.strictEqual(edd?.matchesPlayed, 8);
      assert.strictEqual(simon?.wins, 3);
      assert.strictEqual(simon?.matchesPlayed, 8);
    });
  });

  describe('StorageService lifecycle and score operations for 1vs1vs1 and 1vs1', () => {
    it('manages 1vs1vs1 session creation, increments, decrements, and winner completion', () => {
      // Clear memory store first
      StorageService.clearAll();

      const created = StorageService.startTournamentSession(
        'Simon',
        ['Simon'],
        'Edd',
        ['Edd'],
        '1vs1vs1',
        'Marghe',
        ['Marghe']
      );

      assert.ok(created.id);
      assert.strictEqual(created.mode, '1vs1vs1');
      assert.strictEqual(created.team1Wins, 0);
      assert.strictEqual(created.team2Wins, 0);
      assert.strictEqual(created.team3Wins, 0);
      assert.strictEqual(created.status, 'in_progress');

      // Increment team 3
      StorageService.incrementTournamentWin(created.id, 3);
      StorageService.incrementTournamentWin(created.id, 3);
      // Increment team 1
      StorageService.incrementTournamentWin(created.id, 1);
      // Increment team 2
      StorageService.incrementTournamentWin(created.id, 2);

      const sessions = StorageService.getTournamentSessions();
      let current = sessions.find((s) => s.id === created.id);
      assert.strictEqual(current?.team1Wins, 1);
      assert.strictEqual(current?.team2Wins, 1);
      assert.strictEqual(current?.team3Wins, 2);

      // Decrement team 2 to 0
      StorageService.decrementTournamentWin(created.id, 2);
      // Attempt decrement below 0
      StorageService.decrementTournamentWin(created.id, 2);

      current = StorageService.getTournamentSessions().find((s) => s.id === created.id);
      assert.strictEqual(current?.team2Wins, 0);

      // End session: team 3 has 2 wins, team 1 has 1 win, team 2 has 0 wins -> team 3 winner
      const ended = StorageService.endTournamentSession(created.id);
      assert.ok(ended);
      assert.strictEqual(ended.status, 'completed');
      assert.strictEqual(ended.winnerTeam, 3);
      assert.ok(ended.endedAt);

      // Delete session
      StorageService.deleteTournamentSession(created.id);
      const afterDelete = StorageService.getTournamentSessions().find((s) => s.id === created.id);
      assert.strictEqual(afterDelete, undefined);
    });

    it('correctly handles ties when ending a 1vs1vs1 session', () => {
      StorageService.clearAll();

      const created = StorageService.startTournamentSession(
        'Simon',
        ['Simon'],
        'Edd',
        ['Edd'],
        '1vs1vs1',
        'Marghe',
        ['Marghe']
      );

      // 3-way tie: 2 - 2 - 2
      StorageService.incrementTournamentWin(created.id, 1);
      StorageService.incrementTournamentWin(created.id, 1);
      StorageService.incrementTournamentWin(created.id, 2);
      StorageService.incrementTournamentWin(created.id, 2);
      StorageService.incrementTournamentWin(created.id, 3);
      StorageService.incrementTournamentWin(created.id, 3);

      const endedTie = StorageService.endTournamentSession(created.id);
      assert.strictEqual(endedTie?.winnerTeam, 'pareggio');

      // 2-way tie for 1st place: 3 - 3 - 1
      const created2 = StorageService.startTournamentSession(
        'Simon',
        ['Simon'],
        'Edd',
        ['Edd'],
        '1vs1vs1',
        'Marghe',
        ['Marghe']
      );
      StorageService.incrementTournamentWin(created2.id, 1);
      StorageService.incrementTournamentWin(created2.id, 1);
      StorageService.incrementTournamentWin(created2.id, 1);
      StorageService.incrementTournamentWin(created2.id, 2);
      StorageService.incrementTournamentWin(created2.id, 2);
      StorageService.incrementTournamentWin(created2.id, 2);
      StorageService.incrementTournamentWin(created2.id, 3);

      const endedTwoWayTie = StorageService.endTournamentSession(created2.id);
      assert.strictEqual(endedTwoWayTie?.winnerTeam, 'pareggio');
    });
  });
});

