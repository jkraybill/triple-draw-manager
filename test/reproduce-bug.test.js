import { describe, it, expect } from 'vitest';
import { TripleDrawGameEngine } from '../packages/core/src/game/TripleDrawGameEngine.js';
import { Player } from '../packages/core/src/Player.js';

describe('Reproduce client bug - [object Object] keys', () => {
  it('should reproduce if Player is initialized with object as id', async () => {
    // What if client is doing this by mistake?
    const players = [
      new Player({ id: { id: 'player1', name: 'Player1' }, name: 'Player1', chips: 1000 }),
      new Player({ id: { id: 'player2', name: 'Player2' }, name: 'Player2', chips: 1000 }),
      new Player({ id: { id: 'player3', name: 'Player3' }, name: 'Player3', chips: 1000 })
    ];
    
    console.log('Player IDs:', players.map(p => p.id));
    console.log('Player ID types:', players.map(p => typeof p.id));
    console.log('First player ID:', players[0].id);
    
    const gameEngine = new TripleDrawGameEngine({
      players,
      blinds: { small: 5, big: 10 },
      betLimit: 10
    });
    
    await gameEngine.start();
    const gameState = gameEngine.getGameState();
    
    console.log('\nGameState players keys:', Object.keys(gameState.players));
    
    const firstKey = Object.keys(gameState.players)[0];
    console.log('First key:', firstKey);
    console.log('First key is "[object Object]"?', firstKey === '[object Object]');
    
    if (firstKey === '[object Object]') {
      console.log('\n🔴 BUG REPRODUCED! The issue happens when Player.id is an object!');
      console.log('gameState.players:', JSON.stringify(gameState.players, null, 2));
    }
    
    // This test SHOULD fail if we've reproduced the bug
    expect(Object.keys(gameState.players)).not.toContain('[object Object]');
  });
  
  it('should verify what happens when object is used as key', () => {
    const obj = { id: 'test', name: 'Test' };
    const map = {};
    map[obj] = 'value';
    
    console.log('Object as key test:');
    console.log('Keys:', Object.keys(map));
    console.log('Map:', map);
    
    expect(Object.keys(map)[0]).toBe('[object Object]');
  });
});