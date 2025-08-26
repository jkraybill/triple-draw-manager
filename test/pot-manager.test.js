import { describe, it, expect, beforeEach } from 'vitest';
import { PotManager } from '../packages/core/src/game/PotManager.js';
import { Player } from '../packages/core/src/Player.js';

describe('PotManager Unit Tests', () => {
  let potManager;
  let players;

  beforeEach(() => {
    players = [
      new Player({ id: 'player1', name: 'Alice', chips: 1000 }),
      new Player({ id: 'player2', name: 'Bob', chips: 1000 }),
      new Player({ id: 'player3', name: 'Charlie', chips: 1000 })
    ];
    
    potManager = new PotManager(players);
  });

  describe('Method Existence and Interface', () => {
    it('should have getTotalPot() method', () => {
      expect(typeof potManager.getTotalPot).toBe('function');
    });

    it('should NOT have getTotal() method (renamed to getTotalPot)', () => {
      expect(potManager.getTotal).toBeUndefined();
    });

    it('getTotalPot() should return a number', () => {
      const total = potManager.getTotalPot();
      expect(typeof total).toBe('number');
    });

    it('should return 0 for empty pot initially', () => {
      expect(potManager.getTotalPot()).toBe(0);
    });
  });

  describe('Pot Total Calculation', () => {
    it('should calculate total across all pots', () => {
      // Add some money to the pot
      potManager.addToPot(players[0], 50);
      potManager.addToPot(players[1], 100);
      
      expect(potManager.getTotalPot()).toBe(150);
    });

    it('should handle dead money additions', () => {
      potManager.addDeadMoney(25);
      expect(potManager.getTotalPot()).toBe(25);
    });

    it('should combine regular bets and dead money', () => {
      potManager.addDeadMoney(10);
      potManager.addToPot(players[0], 50);
      potManager.addToPot(players[1], 75);
      
      expect(potManager.getTotalPot()).toBe(135);
    });
  });

  describe('Side Pot Scenarios', () => {
    it('should calculate total across multiple pots', () => {
      // Simulate all-in scenario that creates side pots
      potManager.addToPot(players[0], 100);
      potManager.addToPot(players[1], 100);
      potManager.addToPot(players[2], 100);
      
      // Simulate player going all-in which creates side pot
      potManager.handleAllIn(players[0], 100);
      
      // Add more to side pot
      potManager.addToPot(players[1], 50);
      potManager.addToPot(players[2], 50);
      
      // Should total main pot + side pot
      expect(potManager.getTotalPot()).toBe(400);
    });
  });

  describe('Interface Documentation', () => {
    it('should document that getTotalPot() is the correct method name', () => {
      // This test serves as documentation that getTotalPot() is the intended interface
      expect(potManager.getTotalPot()).toBe(0);
      
      // Add money and verify it tracks correctly
      potManager.addToPot(players[0], 50);
      expect(potManager.getTotalPot()).toBe(50);
      
      // This confirms getTotalPot() is working correctly
    });
  });
});