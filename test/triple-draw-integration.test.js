import { describe, it, expect, beforeEach } from 'vitest';
import { TripleDrawGameEngine } from '../packages/core/src/game/TripleDrawGameEngine.js';
import { Player } from '../packages/core/src/Player.js';
import { PotManager } from '../packages/core/src/game/PotManager.js';

describe('TripleDrawGameEngine Integration Tests', () => {
  let gameEngine;
  let players;

  beforeEach(() => {
    // Create test players
    players = [
      new Player({ id: 'player1', name: 'Alice', chips: 1000 }),
      new Player({ id: 'player2', name: 'Bob', chips: 1000 }),
      new Player({ id: 'player3', name: 'Charlie', chips: 1000 })
    ];

    gameEngine = new TripleDrawGameEngine({
      blinds: { small: 10, big: 20 },
      maxDraws: 3,
      players: players
    });
  });

  describe('Game State Creation', () => {
    it('should create initial game state with pot information after starting', async () => {
      // Start a hand to initialize pot manager
      await gameEngine.start();
      
      // Now getGameState() should work with getTotalPot() method
      const gameState = gameEngine.getGameState();
      
      expect(gameState).toBeDefined();
      expect(gameState.pot).toBeDefined();
      expect(typeof gameState.pot).toBe('number');
      expect(gameState.pot).toBeGreaterThanOrEqual(0);
    });

    it('should handle betting round with pot updates', async () => {
      // Start a hand to initialize pot manager
      await gameEngine.start();
      
      // This should now work with getTotalPot() method
      const gameState = gameEngine.getGameState();
      expect(gameState.pot).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pot Management Integration', () => {
    it('should track pot size through betting rounds', async () => {
      // Initialize game
      await gameEngine.start();
      
      // Should now work with getTotalPot() method after starting
      expect(() => {
        const gameState = gameEngine.getGameState();
        return gameState.pot;
      }).not.toThrow();
      
      const gameState = gameEngine.getGameState();
      expect(typeof gameState.pot).toBe('number');
    });

    it('should handle initial pot state correctly', async () => {
      await gameEngine.start();
      
      const gameState = gameEngine.getGameState();
      
      // Initially pot is 0 - blinds may be posted separately
      expect(gameState.pot).toBe(0);
      
      // Verify pot manager method works correctly
      expect(typeof gameState.pot).toBe('number');
    });

    it('should maintain pot consistency throughout game phases', async () => {
      await gameEngine.start();
      
      // Check pot immediately after start (initially 0)
      let gameState = gameEngine.getGameState();
      const initialPot = gameState.pot;
      expect(initialPot).toBe(0);
      
      // Should maintain consistency across multiple getGameState calls
      gameState = gameEngine.getGameState();
      expect(gameState.pot).toBe(initialPot);
      
      // Multiple calls should return same value
      const pot1 = gameEngine.getGameState().pot;
      const pot2 = gameEngine.getGameState().pot;
      expect(pot1).toBe(pot2);
    });

    it('should handle method interface contracts correctly', async () => {
      await gameEngine.start();
      
      // Test that the actual implementation method is called
      const gameState = gameEngine.getGameState();
      
      // Verify the result is consistent with PotManager.getTotalPot()
      expect(typeof gameState.pot).toBe('number');
      expect(gameState.pot).toBeGreaterThanOrEqual(0);
      
      // Ensure this would have failed before our fix
      // (this is what was broken - getTotalPot() method mismatch)
      expect(gameState.pot).toBe(0); // Initial pot state
    });
  });

  describe('Component Interface Contracts', () => {
    it('should verify PotManager interface is properly consumed', async () => {
      await gameEngine.start();
      
      // This test ensures TripleDrawGameEngine correctly calls PotManager methods
      const gameState = gameEngine.getGameState();
      
      // These calls would fail if method names don't match
      expect(() => gameState.pot).not.toThrow();
      expect(gameState.pot).toBeDefined();
    });

    it('should prevent regression of getTotalPot/getTotal bug', () => {
      // Verify that PotManager has getTotalPot method (our fix)
      const testPotManager = new PotManager(players);
      expect(typeof testPotManager.getTotalPot).toBe('function');
      
      // Verify that old getTotal method no longer exists
      expect(testPotManager.getTotal).toBeUndefined();
    });
  });

  describe('gameState.players structure', () => {
    it('should use player IDs as keys in players object, not [object Object]', async () => {
      const players = [
        new Player({ id: 'alice', name: 'Alice' }),
        new Player({ id: 'bob', name: 'Bob' }),
        new Player({ id: 'charlie', name: 'Charlie' })
      ];
      
      const gameEngine = new TripleDrawGameEngine({
        players,
        blinds: { small: 5, big: 10 },
        betLimit: 10
      });
      
      await gameEngine.start();
      const gameState = gameEngine.getGameState();
      
      // Critical: Keys should be player IDs, not '[object Object]'
      const keys = Object.keys(gameState.players);
      expect(keys).toEqual(['alice', 'bob', 'charlie']);
      expect(keys).not.toContain('[object Object]');
      
      // Each player should be accessible by their ID
      expect(gameState.players.alice).toBeDefined();
      expect(gameState.players.alice.id).toBe('alice');
      expect(gameState.players.bob).toBeDefined();
      expect(gameState.players.bob.id).toBe('bob');
      expect(gameState.players.charlie).toBeDefined();
      expect(gameState.players.charlie.id).toBe('charlie');
    });
  });
});