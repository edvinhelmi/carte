import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { HouseService, DEFAULT_HOUSE } from '../src/lib/houseService.ts';
import { StorageService } from '../src/lib/storage.ts';

describe('HouseService & Multi-Casa Storage System', () => {
  beforeEach(() => {
    // Reset test storage environment
    HouseService.init();
    HouseService.setActiveHouse(DEFAULT_HOUSE.id);
  });

  it('initializes default house "casa_principale"', () => {
    const activeId = HouseService.getActiveHouseId();
    assert.equal(activeId, DEFAULT_HOUSE.id);

    const house = HouseService.getActiveHouse();
    assert.equal(house.id, 'casa_principale');
    assert.equal(house.name, 'Casa Principale');
  });

  it('creates a new house with initial players and sets it as active', () => {
    const newHouse = HouseService.createHouse('Chalet Dolomiti', ['Luca', 'Sara', 'Matteo']);
    assert.ok(newHouse.id.startsWith('casa_'));
    assert.equal(newHouse.name, 'Chalet Dolomiti');
    assert.ok(newHouse.inviteCode.startsWith('BRIS-'));

    // Verify it became the active house
    assert.equal(HouseService.getActiveHouseId(), newHouse.id);

    // Verify initial players were populated for this house
    const players = StorageService.getPlayers();
    assert.equal(players.length, 3);
    assert.deepEqual(
      players.map((p) => p.name),
      ['Luca', 'Sara', 'Matteo']
    );
  });

  it('guarantees complete data isolation between different houses', () => {
    // House 1: Casa Principale
    HouseService.setActiveHouse('casa_principale');
    const house1Players = StorageService.getPlayers();
    assert.ok(house1Players.length > 0);

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

    // Switch back to House 1: Casa Principale
    HouseService.setActiveHouse('casa_principale');
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
    HouseService.setActiveHouse('casa_principale');
    assert.equal(HouseService.getActiveHouseId(), 'casa_principale');

    // Join back by invite code
    const res = await HouseService.joinHouseByCodeOrId(code);
    assert.equal(res.success, true);
    assert.equal(res.house?.id, created.id);
    assert.equal(HouseService.getActiveHouseId(), created.id);
  });

  it('renames an existing house cleanly', () => {
    const created = HouseService.createHouse('Baita Rustica');
    HouseService.renameHouse(created.id, 'Baita Grande');

    const updated = HouseService.getActiveHouse();
    assert.equal(updated.name, 'Baita Grande');
  });
});
