import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { HouseService, HOUSE_STORAGE_KEYS } from '../src/lib/houseService.ts';
import { StorageService } from '../src/lib/storage.ts';
import { AuthService } from '../src/lib/authService.ts';
import { calculatePlayerStats } from '../src/lib/stats.ts';
import { removeStoredItem, setStoredItem } from '../src/lib/storagePrimitives.ts';

describe('HouseService & Multi-Casa Storage System', () => {
  beforeEach(() => {
    // Reset test storage environment to pure clean state
    removeStoredItem(HOUSE_STORAGE_KEYS.KNOWN_HOUSES);
    removeStoredItem(HOUSE_STORAGE_KEYS.ACTIVE_ID);
    HouseService.init();
  });

  it('starts with no active house on fresh install (empty onboarding state)', () => {
    assert.equal(HouseService.hasActiveHouse(), false);
    assert.equal(HouseService.getActiveHouseId(), '');
    assert.equal(HouseService.getActiveHouse(), null);
    assert.deepEqual(StorageService.getPlayers(), []);
    assert.deepEqual(StorageService.getTeams(), []);
    assert.deepEqual(StorageService.getMatches(), []);
    assert.deepEqual(StorageService.getTournamentSessions(), []);
  });

  it('creates a new house with initial players and sets it as active', () => {
    const newHouse = HouseService.createHouse('Chalet Dolomiti', ['Luca', 'Sara', 'Matteo']);
    assert.ok(newHouse.id.startsWith('casa_'));
    assert.equal(newHouse.name, 'Chalet Dolomiti');
    assert.ok(newHouse.inviteCode.startsWith('BRIS-'));

    // Verify it became the active house
    assert.equal(HouseService.hasActiveHouse(), true);
    assert.equal(HouseService.getActiveHouseId(), newHouse.id);

    // Verify initial players were populated for this house
    const players = StorageService.getPlayers();
    assert.equal(players.length, 3);
    assert.deepEqual(
      players.map((p) => p.name),
      ['Luca', 'Sara', 'Matteo']
    );

    // Verify creator was registered as owner member along with initial house members
    const members = HouseService.getHouseMembers(newHouse.id);
    assert.equal(members.length, 4);
    assert.equal(members[0].role, 'owner');
  });

  it('dynamically derives suggested players from house members and registered players', async () => {
    const newHouse = HouseService.createHouse('Baita Alpi', ['Giulia', 'Marco']);
    const suggestions = HouseService.getSuggestedPlayerNames(newHouse.id);

    // Suggestions must include house creator and initial players, and NO hardcoded demo players
    assert.ok(suggestions.includes('Giulia'));
    assert.ok(suggestions.includes('Marco'));
    assert.ok(!suggestions.includes('Marghe')); // No hardcoded demo slop

    // Test house-specific nickname
    await AuthService.updateHouseNickname(newHouse.id, 'Il Capitano');
    // Refresh member in house
    HouseService.saveHouseMember({
      houseId: newHouse.id,
      userId: AuthService.getCurrentUser().id,
      displayName: AuthService.getCurrentUser().displayName,
      nickname: 'Il Capitano',
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });

    const updatedSuggestions = HouseService.getSuggestedPlayerNames(newHouse.id);
    assert.ok(updatedSuggestions.includes('Il Capitano'));
  });

  it('guarantees complete data isolation between different houses', () => {
    // Create House 1: Casa Montagna
    const house1 = HouseService.createHouse('Casa Montagna', ['Paolo', 'Elena']);
    assert.equal(HouseService.getActiveHouseId(), house1.id);
    const house1Players = StorageService.getPlayers();
    assert.equal(house1Players.length, 2);

    // Create House 2: Casa Mare
    const house2 = HouseService.createHouse('Casa Mare', ['Gigi', 'Anna']);
    assert.equal(HouseService.getActiveHouseId(), house2.id);

    // Add match to House 2
    StorageService.saveMatch({
      id: 'm_mare_1',
      houseId: house2.id,
      gameType: 'briscola',
      timestamp: new Date().toISOString(),
      dateKey: '2026-10-27',
      team1Id: 't_gigi',
      team2Id: 't_anna',
      winnerTeamId: 't_gigi',
      scoreTeam1: 61,
      scoreTeam2: 59,
    });

    const house2Matches = StorageService.getMatches();
    assert.equal(house2Matches.length, 1);
    assert.equal(house2Matches[0].id, 'm_mare_1');

    // Switch back to House 1: Casa Montagna
    HouseService.setActiveHouse(house1.id);
    const house1Matches = StorageService.getMatches();
    // House 1 should NOT contain m_mare_1
    assert.ok(!house1Matches.some((m) => m.id === 'm_mare_1'));

    // Switch back to House 2: Casa Mare
    HouseService.setActiveHouse(house2.id);
    const reloadedHouse2Matches = StorageService.getMatches();
    assert.equal(reloadedHouse2Matches.length, 1);
    assert.equal(reloadedHouse2Matches[0].id, 'm_mare_1');
  });

  it('supports joining a house by invite code or ID', async () => {
    const created = HouseService.createHouse('Casa Amici', ['Davide']);
    const code = created.inviteCode;

    // Switch to another house
    const second = HouseService.createHouse('Altra Casa');
    assert.equal(HouseService.getActiveHouseId(), second.id);

    // Join back by invite code
    const res = await HouseService.joinHouseByCodeOrId(code);
    assert.equal(res.success, true);
    assert.equal(res.house?.id, created.id);
    assert.equal(HouseService.getActiveHouseId(), created.id);
    assert.equal(HouseService.hasActiveHouse(), true);
  });

  it('renames an existing house cleanly', () => {
    const created = HouseService.createHouse('Baita Rustica');
    HouseService.renameHouse(created.id, 'Baita Grande');

    const updated = HouseService.getActiveHouse();
    assert.equal(updated?.name, 'Baita Grande');
  });

  it('returns to empty state when removing the only remaining house', () => {
    const created = HouseService.createHouse('Casa Unica');
    assert.equal(HouseService.hasActiveHouse(), true);

    HouseService.removeHouse(created.id);
    assert.equal(HouseService.hasActiveHouse(), false);
    assert.equal(HouseService.getActiveHouseId(), '');
    assert.equal(HouseService.getActiveHouse(), null);
  });

  it('manages global nickname and house-specific nickname isolation correctly', async () => {
    // Set a global nickname
    await AuthService.updateGlobalNickname('Campione99');
    assert.equal(AuthService.getCurrentUser().displayName, 'Campione99');

    // Create House A and House B
    const houseA = HouseService.createHouse('Casa Alpha');
    const houseB = HouseService.createHouse('Casa Beta');

    // Default effective nickname in both houses is the global nickname
    assert.equal(AuthService.getEffectiveNickname(houseA.id), 'Campione99');
    assert.equal(AuthService.getEffectiveNickname(houseB.id), 'Campione99');

    // Set house-specific nickname ONLY for House A
    await AuthService.updateHouseNickname(houseA.id, 'Il Professore');
    assert.equal(AuthService.getHouseNickname(houseA.id), 'Il Professore');
    assert.equal(AuthService.getHouseNickname(houseB.id), undefined);

    // House A returns house nickname, House B still returns global nickname
    assert.equal(AuthService.getEffectiveNickname(houseA.id), 'Il Professore');
    assert.equal(AuthService.getEffectiveNickname(houseB.id), 'Campione99');

    // Suggestions in House A include 'Il Professore'
    const suggestionsA = HouseService.getSuggestedPlayerNames(houseA.id);
    assert.ok(suggestionsA.includes('Il Professore'));

    // Suggestions in House B include 'Campione99'
    const suggestionsB = HouseService.getSuggestedPlayerNames(houseB.id);
    assert.ok(suggestionsB.includes('Campione99'));
    assert.ok(!suggestionsB.includes('Il Professore'));
  });

  it('automatically purges legacy casa_principale so returning users get clean empty state', () => {
    // Simulate legacy storage state where casa_principale was stored
    setStoredItem(
      HOUSE_STORAGE_KEYS.KNOWN_HOUSES,
      JSON.stringify([
        {
          id: 'casa_principale',
          name: 'Casa Principale',
          inviteCode: 'BRIS-1001',
          joinedAt: '2026-10-01T10:00:00Z',
          lastActiveAt: '2026-10-01T10:00:00Z',
        },
      ])
    );
    setStoredItem(HOUSE_STORAGE_KEYS.ACTIVE_ID, 'casa_principale');

    // Init must purge casa_principale
    HouseService.init();

    assert.equal(HouseService.hasActiveHouse(), false);
    assert.equal(HouseService.getActiveHouseId(), '');
    assert.equal(HouseService.getActiveHouse(), null);
    assert.deepEqual(HouseService.getKnownHouses(), []);
  });

  it('suggests house members alongside registered players for team creation and leaderboards', () => {
    const house = HouseService.createHouse('Casa Amici', ['Davide']);

    const currentUser = AuthService.getCurrentUser();
    const suggestions = HouseService.getSuggestedPlayerNames(house.id);
    assert.ok(suggestions.includes(currentUser.displayName));
    assert.ok(suggestions.includes('Davide'));

    // Adding another member also reflects in members and suggestions
    HouseService.saveHouseMember({
      houseId: house.id,
      userId: 'user_bob',
      displayName: 'Bob',
      nickname: 'Il Mago',
      role: 'member',
      joinedAt: new Date().toISOString(),
    });

    const updatedSuggestions = HouseService.getSuggestedPlayerNames(house.id);
    assert.ok(updatedSuggestions.includes('Il Mago'));
    assert.ok(!updatedSuggestions.includes('Bob')); // Mostra solo il nickname, non il nome
  });

  it('attributes tournament wins correctly when player plays under a house nickname', () => {
    const players = [
      { id: 'p1', name: 'Luca', nickname: 'Il Re', avatarSuit: 'coppe' as const, createdAt: '2026-10-01' },
      { id: 'p2', name: 'Marco', avatarSuit: 'spade' as const, createdAt: '2026-10-01' },
    ];
    const teams = [
      { id: 't1', name: 'Luca', playerIds: ['p1'], color: '#f59e0b', createdAt: '2026-10-01' },
      { id: 't2', name: 'Marco', playerIds: ['p2'], color: '#10b981', createdAt: '2026-10-01' },
    ];

    // Tournament session where player 1 played under his nickname "Il Re"
    const sessions = [
      {
        id: 'sess_1',
        houseId: 'casa_test',
        dateKey: '2026-10-28',
        startedAt: '2026-10-28T20:00:00Z',
        mode: '1vs1' as const,
        team1Name: 'Il Re',
        team1Players: ['Il Re'],
        team2Name: 'Marco',
        team2Players: ['Marco'],
        team1Wins: 3,
        team2Wins: 1,
        status: 'completed' as const,
        winnerTeam: 'Il Re',
      },
    ];

    const stats = calculatePlayerStats(players, teams, [], sessions);
    const lucaStats = stats.find((s) => s.player.name === 'Luca');
    assert.ok(lucaStats);
    assert.equal(lucaStats.wins, 3);
    assert.equal(lucaStats.matchesPlayed, 4);
    assert.equal(lucaStats.winRate, 75);
  });

  it('cleanly migrates guest member to authenticated Google account without leaving ghost records', async () => {
    const house = HouseService.createHouse('Casa Nuova');

    // Simulate guest user in house
    const initialMembers = HouseService.getHouseMembers(house.id);
    assert.equal(initialMembers.length, 1);
    const guestId = initialMembers[0].userId;

    // Simulate Google Login callback
    await AuthService.handleSupabaseUser({
      id: 'uuid-1234-5678-google',
      email: 'mario.rossi@gmail.com',
      user_metadata: {
        full_name: 'Mario Rossi',
        avatar_url: 'https://lh3.googleusercontent.com/photo.jpg',
      },
    });

    // Check house members: the guest record must be replaced, not duplicated
    const finalMembers = HouseService.getHouseMembers(house.id);
    assert.equal(finalMembers.length, 1);
    assert.equal(finalMembers[0].userId, 'uuid-1234-5678-google');
    assert.equal(finalMembers[0].displayName, 'Mario Rossi');
    assert.equal(finalMembers[0].role, 'owner'); // Owner role preserved
    assert.ok(!finalMembers.some((m) => m.userId === guestId));
  });

  it('provides getHouse and getHousePlayers helpers for cross-device synchronization', () => {
    const house = HouseService.createHouse('Casa Lago', ['Ale', 'Sara']);
    const fetched = HouseService.getHouse(house.id);
    assert.ok(fetched);
    assert.equal(fetched.name, 'Casa Lago');
    assert.equal(fetched.inviteCode, house.inviteCode);

    const players = HouseService.getHousePlayers(house.id);
    assert.equal(players.length, 2);
    assert.equal(players[0].name, 'Ale');
    assert.equal(players[1].name, 'Sara');
  });

  it('automatically registers external friend players when entered into tournament and suggests only nicknames', () => {
    const house = HouseService.createHouse('Casa Amici', ['Davide']);

    // House member with custom nickname
    HouseService.saveHouseMember({
      houseId: house.id,
      userId: 'user_luca',
      displayName: 'Gianluca Bianchi',
      nickname: 'Il Maestro',
      role: 'member',
      joinedAt: new Date().toISOString(),
    });

    // Start a tournament with an external friend "Zio Pino"
    StorageService.startTournamentSession(
      'Squadra 1',
      ['Il Maestro'],
      'Squadra 2',
      ['Zio Pino'],
      '2vs2'
    );

    // "Zio Pino" should be automatically registered as friend player
    const players = StorageService.getPlayers();
    const zioPino = players.find((p) => p.name === 'Zio Pino');
    assert.ok(zioPino);
    assert.equal(zioPino.isFriend, true);

    // Suggestions check: ONLY nickname for Gianluca ("Il Maestro", NOT "Gianluca Bianchi")
    const suggestions = HouseService.getSuggestedPlayerNames(house.id);
    assert.ok(suggestions.includes('Il Maestro'));
    assert.ok(!suggestions.includes('Gianluca Bianchi'));
    assert.ok(suggestions.includes('Zio Pino'));
  });

  it('allows deleting house members safely', () => {
    const house = HouseService.createHouse('Casa Collina', []);
    HouseService.saveHouseMember({
      houseId: house.id,
      userId: 'temp_user',
      displayName: 'Ospite Provvisorio',
      nickname: 'Ospite',
      role: 'member',
      joinedAt: new Date().toISOString(),
    });

    assert.ok(HouseService.getHouseMembers(house.id).some((m) => m.userId === 'temp_user'));
    HouseService.deleteHouseMember(house.id, 'temp_user');
    assert.ok(!HouseService.getHouseMembers(house.id).some((m) => m.userId === 'temp_user'));
  });
});
