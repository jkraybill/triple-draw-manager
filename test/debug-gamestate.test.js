import { describe, it, expect } from 'vitest';
import { TripleDrawGameEngine } from '../packages/core/src/game/TripleDrawGameEngine.js';
import { Player } from '../packages/core/src/Player.js';

describe('Debug GameState.players structure', () => {
  it('should investigate the actual structure', async () => {
    // Test with plain objects that might cause the issue
    const players = [
      { id: 'player1', name: 'Player1', chips: 1000 },
      { id: 'player2', name: 'Player2', chips: 1000 },
      { id: 'player3', name: 'Player3', chips: 1000 }
    ];
    
    // Try to create engine with plain objects (should fail)
    try {
      const gameEngine = new TripleDrawGameEngine({
        players,
        blinds: { small: 5, big: 10 },
        betLimit: 10
      });
      
      await gameEngine.start();
      const gameState = gameEngine.getGameState();
      
      console.log('GameState players keys:', Object.keys(gameState.players));
      console.log('GameState players:', JSON.stringify(gameState.players, null, 2));
      
      // This should not be reached
      expect(true).toBe(false);
    } catch (error) {
      console.log('Expected error with plain objects:', error.message);
      expect(error.message).toBe('Invalid player format');
    }
    
    // Now test with Player instances
    const playerInstances = [
      new Player({ id: 'alice', name: 'Alice', chips: 1000 }),
      new Player({ id: 'bob', name: 'Bob', chips: 1000 }),
      new Player({ id: 'charlie', name: 'Charlie', chips: 1000 })
    ];
    
    const gameEngine = new TripleDrawGameEngine({
      players: playerInstances,
      blinds: { small: 5, big: 10 },
      betLimit: 10
    });
    
    await gameEngine.start();
    const gameState = gameEngine.getGameState();
    
    console.log('\n=== With Player Instances ===');
    console.log('GameState players keys:', Object.keys(gameState.players));
    console.log('First player entry:', Object.entries(gameState.players)[0]);
    
    // Check if the bug exists
    const keys = Object.keys(gameState.players);
    if (keys.includes('[object Object]')) {
      console.log('BUG FOUND! [object Object] is a key!');
      console.log('Full gameState.players:', JSON.stringify(gameState.players, null, 2));
    }
    
    expect(keys).toEqual(['alice', 'bob', 'charlie']);
    expect(keys).not.toContain('[object Object]');
  });
  
  // Test what the client might be doing wrong
  it('should test potential client usage patterns', async () => {
    // Maybe they're passing players wrapped in objects?
    const players = [
      { player: new Player({ id: 'p1', name: 'P1' }), chips: 1000 },
      { player: new Player({ id: 'p2', name: 'P2' }), chips: 1000 },
      { player: new Player({ id: 'p3', name: 'P3' }), chips: 1000 }
    ];
    
    const gameEngine = new TripleDrawGameEngine({
      players,
      blinds: { small: 5, big: 10 },
      betLimit: 10
    });
    
    await gameEngine.start();
    const gameState = gameEngine.getGameState();
    
    console.log('\n=== With Wrapped Players ===');
    console.log('GameState players keys:', Object.keys(gameState.players));
    
    const keys = Object.keys(gameState.players);
    expect(keys).toEqual(['p1', 'p2', 'p3']);
    expect(keys).not.toContain('[object Object]');
  });
});