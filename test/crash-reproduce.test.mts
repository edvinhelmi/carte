import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTeamStats, calculatePlayerStats, calculateHeadToHead } from '../src/lib/stats.ts';
import type { Player, Team, Match, TournamentSession } from '../src/types/game.ts';

test('Check stats functions with missing or corrupt fields', () => {
  // Edge case 1: player with undefined name or null nickname
  const dirtyPlayers: Player[] = [
    { id: 'p1', name: 'Mario', createdAt: '2026-01-01' } as Player,
    { id: 'p2', name: undefined as unknown as string, createdAt: '2026-01-01' } as Player,
    { id: 'p3', name: '', nickname: null as unknown as string, createdAt: '2026-01-01' } as Player,
  ];

  const dirtyTeams: Team[] = [
    { id: 't1', name: 'Squadra 1', playerIds: ['p1', 'p2'], createdAt: '2026-01-01' } as Team,
    { id: 't2', name: undefined as unknown as string, playerIds: ['p3'], createdAt: '2026-01-01' } as Team,
  ];

  const dirtySessions: TournamentSession[] = [
    {
      id: 's1',
      dateKey: '2026-10-29',
      mode: '2vs2',
      team1Name: undefined as unknown as string,
      team2Name: 'Team 2',
      team1Wins: 1,
      team2Wins: 2,
      startedAt: '2026-10-29T10:00:00Z',
      status: 'completed',
    } as TournamentSession,
    {
      id: 's2',
      dateKey: '2026-10-29',
      mode: 'a5',
      players5: [
        { name: undefined as unknown as string, wins: 2 },
        { name: 'Luigi', wins: 3 },
      ],
      startedAt: '2026-10-29T10:00:00Z',
      status: 'completed',
    } as TournamentSession,
  ];

  const dirtyMatches: Match[] = [
    {
      id: 'm1',
      gameType: 'briscola',
      timestamp: '2026-10-29T10:00:00Z',
      dateKey: '2026-10-29',
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't1',
    },
  ];

  // Let's run calculateTeamStats
  assert.doesNotThrow(() => {
    calculateTeamStats(dirtyTeams, dirtyMatches, dirtyPlayers, dirtySessions);
  }, 'calculateTeamStats should not crash with dirty data');

  // Let's run calculatePlayerStats
  assert.doesNotThrow(() => {
    calculatePlayerStats(dirtyPlayers, dirtyTeams, dirtyMatches, dirtySessions);
  }, 'calculatePlayerStats should not crash with dirty data');

  // Let's run calculateHeadToHead
  assert.doesNotThrow(() => {
    calculateHeadToHead('t1', 't2', dirtyTeams, dirtyMatches, dirtySessions);
  }, 'calculateHeadToHead should not crash with dirty data');
});
