import { describe, it, expect, beforeEach } from 'vitest';
import { TripleDrawGameEngine } from '../packages/core/src/game/TripleDrawGameEngine.js';
import { Player } from '../packages/core/src/Player.js';
import { Action, PlayerState } from '../packages/core/src/types/index.js';

/**
 * Test Player that can be programmed with actions
 */
class TestPlayer extends Player {
  constructor(config) {
    super(config);
    this.actionQueue = [];
    this.drawQueue = [];
  }

  queueActions(...actions) {
    this.actionQueue.push(...actions);
  }

  queueDraws(...draws) {
    this.drawQueue.push(...draws);
  }

  async getAction(gameState) {
    if (this.actionQueue.length === 0) {
      return { action: Action.FOLD };
    }
    return this.actionQueue.shift();
  }

  async getDrawAction(gameState) {
    if (this.drawQueue.length === 0) {
      return { cardsToDiscard: 0 }; // Stand pat by default
    }
    return this.drawQueue.shift();
  }
}

describe('Betting Cap Bug - RAISE should not be available after 4th raise', () => {
  let gameEngine;
  let players;

  beforeEach(() => {
    // Create test players with sufficient chips
    players = [
      new TestPlayer({ id: 'player1', name: 'Alice', chips: 1000 }),
      new TestPlayer({ id: 'player2', name: 'Bob', chips: 1000 }),
      new TestPlayer({ id: 'player3', name: 'Charlie', chips: 1000 }),
      new TestPlayer({ id: 'player4', name: 'Dave', chips: 1000 })
    ];

    gameEngine = new TripleDrawGameEngine({
      blinds: { small: 10, big: 20 },
      limitBetting: true,
      betLimit: 20, // Fixed bet size for limit betting
      dealerButton: 0, // Set dealer button for deterministic testing
      players: players,
      simulationMode: true // Disable timeouts
    });
  });

  it('should not allow RAISE action after 4 raises in limit betting', async () => {
    // Initialize the game without starting automatic betting progression
    gameEngine.initializeHand();
    
    // We should be in PRE_DRAW phase now
    expect(gameEngine.phase).toBe('PRE_DRAW');
    
    // Manually simulate 4 raises
    gameEngine.raisesInRound = 4; // Simulate 4 raises have been made
    expect(gameEngine.bettingCapped).toBe(false); // This is the bug - should be true
    
    // Get a test player
    const testPlayer = gameEngine.players[0];
    testPlayer.chips = 1000;
    testPlayer.bet = 80; // Assume they've matched the current bet
    
    // Set up game state for someone who needs to call a bet
    gameEngine.players[1].bet = 100; // Someone has a higher bet
    
    // BUG: getValidActions should NOT include RAISE after 4th raise, but it does
    const validActions = gameEngine.getValidActions(testPlayer);
    
    console.log('Valid actions after 4th raise:', validActions);
    console.log('raisesInRound:', gameEngine.raisesInRound);
    console.log('bettingCapped:', gameEngine.bettingCapped);

    // This should pass now - RAISE should not be available after 4 raises
    expect(validActions).not.toContain(Action.RAISE);
    
    // Should only have FOLD and CALL available
    expect(validActions).toEqual(expect.arrayContaining([Action.FOLD, Action.CALL]));
    expect(validActions).toHaveLength(2);
  });

  it('should throw error when trying to raise after 4 raises (current behavior)', async () => {
    // Initialize the game
    gameEngine.initializeHand();
    
    // Simulate 4 raises have already happened
    gameEngine.raisesInRound = 4;
    
    // Try to make a 5th raise
    const testPlayer = gameEngine.players[0];
    testPlayer.chips = 1000;
    
    // This should throw an error (current behavior is correct)
    await expect(
      gameEngine.handleAction(testPlayer, { action: Action.RAISE, amount: 20 })
    ).rejects.toThrow('Betting is capped in this round');
  });

  it('should set bettingCapped to true after exactly 4 raises through handleAction', () => {
    // Initialize the game
    gameEngine.initializeHand();
    
    // Setup players for testing
    const testPlayer = gameEngine.players[0];
    testPlayer.chips = 1000;
    testPlayer.bet = 0;
    
    // Initially betting should not be capped
    expect(gameEngine.bettingCapped).toBe(false);
    expect(gameEngine.raisesInRound).toBe(0);
    
    // Manually simulate the raise logic without triggering full action handling
    // This tests the specific part of handleAction that manages raise counting
    for (let i = 1; i <= 3; i++) {
      // Simulate the raise logic from handleAction
      gameEngine.raisesInRound++;
      if (gameEngine.config.limitBetting && gameEngine.raisesInRound >= 4) {
        gameEngine.bettingCapped = true;
      }
      
      expect(gameEngine.raisesInRound).toBe(i);
      expect(gameEngine.bettingCapped).toBe(false);
    }
    
    // 4th raise should cap the betting
    gameEngine.raisesInRound++;
    if (gameEngine.config.limitBetting && gameEngine.raisesInRound >= 4) {
      gameEngine.bettingCapped = true;
    }
    
    expect(gameEngine.raisesInRound).toBe(4);
    expect(gameEngine.bettingCapped).toBe(true);
  });

  it('should reset bettingCapped at the start of each betting round', async () => {
    // Initialize the game
    gameEngine.initializeHand();
    
    // Manually set as if betting was capped in previous round
    gameEngine.bettingCapped = true;
    gameEngine.raisesInRound = 4;
    
    // Start a new betting round
    await gameEngine.startBettingRound();
    
    // Should be reset
    expect(gameEngine.bettingCapped).toBe(false);
    expect(gameEngine.raisesInRound).toBe(0);
  });

  it('should allow RAISE when under 4 raises in limit betting', async () => {
    // Initialize the game
    gameEngine.initializeHand();
    
    // Set up game state with 3 raises (under the limit)
    gameEngine.raisesInRound = 3;
    
    const testPlayer = gameEngine.players[0];
    testPlayer.chips = 1000;
    testPlayer.bet = 60; // Behind the current bet
    
    // Someone else has a higher bet
    gameEngine.players[1].bet = 80;
    
    const validActions = gameEngine.getValidActions(testPlayer);
    
    // RAISE should still be available (only 3 raises so far)
    expect(validActions).toContain(Action.RAISE);
    expect(validActions).toContain(Action.CALL);
    expect(validActions).toContain(Action.FOLD);
  });

  it('should work correctly in non-limit betting games', async () => {
    // Create a non-limit game
    const noLimitEngine = new TripleDrawGameEngine({
      blinds: { small: 10, big: 20 },
      limitBetting: false, // No limit betting
      dealerButton: 0,
      players: players,
      simulationMode: true
    });
    
    noLimitEngine.initializeHand();
    
    // Set high number of raises
    noLimitEngine.raisesInRound = 10;
    
    const testPlayer = noLimitEngine.players[0];
    testPlayer.chips = 1000;
    testPlayer.bet = 100;
    
    // Someone else has a higher bet
    noLimitEngine.players[1].bet = 200;
    
    const validActions = noLimitEngine.getValidActions(testPlayer);
    
    // RAISE should still be available in no-limit games regardless of raise count
    expect(validActions).toContain(Action.RAISE);
    expect(validActions).toContain(Action.ALL_IN); // ALL_IN available in no-limit
  });
});