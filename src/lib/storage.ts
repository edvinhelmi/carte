import { Player, Team, Match } from '@/types/game';

const STORAGE_KEYS = {
  PLAYERS: 'carte_briscola_players_v1',
  TEAMS: 'carte_briscola_teams_v1',
  MATCHES: 'carte_briscola_matches_v1',
  SETTINGS: 'carte_briscola_settings_v1',
};

// Formatta data come YYYY-MM-DD
export function formatDateKey(date?: Date): string {
  const target = date ? new Date(date) : new Date();
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Dati demo iniziali
const DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'Marco', nickname: 'Il Carico', avatarSuit: 'denari', createdAt: '2026-10-01T10:00:00Z' },
  { id: 'p2', name: 'Matteo', nickname: 'Asso Pigliatutto', avatarSuit: 'bastoni', createdAt: '2026-10-01T10:05:00Z' },
  { id: 'p3', name: 'Sara', nickname: 'Strozza-Re', avatarSuit: 'coppe', createdAt: '2026-10-01T10:10:00Z' },
  { id: 'p4', name: 'Elena', nickname: 'La Tagliatrice', avatarSuit: 'spade', createdAt: '2026-10-01T10:15:00Z' },
];

const DEMO_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'I Bastonatori',
    playerIds: ['p1', 'p2'],
    color: '#10b981', // emerald
    suit: 'bastoni',
    createdAt: '2026-10-01T10:20:00Z',
  },
  {
    id: 't2',
    name: 'Regine di Coppe',
    playerIds: ['p3', 'p4'],
    color: '#f59e0b', // amber
    suit: 'coppe',
    createdAt: '2026-10-01T10:25:00Z',
  },
];

// Genera partite demo per oggi e per i 2 giorni passati
function generateDemoMatches(): Match[] {
  const now = new Date();
  const todayKey = formatDateKey(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoKey = formatDateKey(twoDaysAgo);

  return [
    // 2 giorni fa
    {
      id: 'm1',
      gameType: 'briscola',
      timestamp: `${twoDaysAgoKey}T21:00:00Z`,
      dateKey: twoDaysAgoKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't1',
      scoreTeam1: 68,
      scoreTeam2: 52,
      notes: 'Bella mano finale con tre d assi',
    },
    {
      id: 'm2',
      gameType: 'briscola',
      timestamp: `${twoDaysAgoKey}T21:25:00Z`,
      dateKey: twoDaysAgoKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't2',
      scoreTeam1: 58,
      scoreTeam2: 62,
      notes: 'Vittoria sul filo di lana',
    },
    // Ieri
    {
      id: 'm3',
      gameType: 'briscola',
      timestamp: `${yesterdayKey}T21:10:00Z`,
      dateKey: yesterdayKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't2',
      scoreTeam1: 45,
      scoreTeam2: 75,
      notes: 'Grande partita di Sara',
    },
    {
      id: 'm4',
      gameType: 'briscola',
      timestamp: `${yesterdayKey}T21:40:00Z`,
      dateKey: yesterdayKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't2',
      scoreTeam1: 54,
      scoreTeam2: 66,
      notes: 'Capotto sfiorato',
    },
    {
      id: 'm5',
      gameType: 'briscola',
      timestamp: `${yesterdayKey}T22:05:00Z`,
      dateKey: yesterdayKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't1',
      scoreTeam1: 71,
      scoreTeam2: 49,
      notes: 'Rivincita dei Bastonatori',
    },
    // Oggi
    {
      id: 'm6',
      gameType: 'briscola',
      timestamp: `${todayKey}T18:30:00Z`,
      dateKey: todayKey,
      team1Id: 't1',
      team2Id: 't2',
      winnerTeamId: 't1',
      scoreTeam1: 64,
      scoreTeam2: 56,
      notes: 'Prima mano del pomeriggio',
    },
  ];
}

export const StorageService = {
  // Inizializza con i dati demo se il browser è vuoto
  init() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(STORAGE_KEYS.PLAYERS)) {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEMO_PLAYERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(DEMO_TEAMS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(generateDemoMatches()));
      }
    } catch (e) {
      console.error('Storage init error:', e);
    }
  },

  getPlayers(): Player[] {
    if (typeof window === 'undefined') return DEMO_PLAYERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : DEMO_PLAYERS;
    } catch {
      return DEMO_PLAYERS;
    }
  },

  savePlayer(player: Player): void {
    if (typeof window === 'undefined') return;
    const players = this.getPlayers();
    const index = players.findIndex((p) => p.id === player.id);
    if (index >= 0) {
      players[index] = player;
    } else {
      players.push(player);
    }
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  deletePlayer(playerId: string): void {
    if (typeof window === 'undefined') return;
    const players = this.getPlayers().filter((p) => p.id !== playerId);
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  getTeams(): Team[] {
    if (typeof window === 'undefined') return DEMO_TEAMS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return data ? JSON.parse(data) : DEMO_TEAMS;
    } catch {
      return DEMO_TEAMS;
    }
  },

  saveTeam(team: Team): void {
    if (typeof window === 'undefined') return;
    const teams = this.getTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  deleteTeam(teamId: string): void {
    if (typeof window === 'undefined') return;
    const teams = this.getTeams().filter((t) => t.id !== teamId);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  getMatches(): Match[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMatch(match: Match): void {
    if (typeof window === 'undefined') return;
    const matches = this.getMatches();
    const index = matches.findIndex((m) => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      // Inserisci in cima (più recenti prima)
      matches.unshift(match);
    }
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  deleteMatch(matchId: string): void {
    if (typeof window === 'undefined') return;
    const matches = this.getMatches().filter((m) => m.id !== matchId);
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  // Export completo in formato JSON per backup
  exportAllData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      players: this.getPlayers(),
      teams: this.getTeams(),
      matches: this.getMatches(),
    };
  },

  // Importazione da file JSON
  importAllData(data: { players?: Player[]; teams?: Team[]; matches?: Match[] }) {
    if (typeof window === 'undefined') return;
    if (Array.isArray(data.players)) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
    }
    if (Array.isArray(data.teams)) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(data.teams));
    }
    if (Array.isArray(data.matches)) {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(data.matches));
    }
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  // Reset a dati demo
  resetToDemo() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEMO_PLAYERS));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(DEMO_TEAMS));
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(generateDemoMatches()));
    window.dispatchEvent(new Event('carte_storage_update'));
  },

  // Svuota tutto
  clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    window.dispatchEvent(new Event('carte_storage_update'));
  },
};
