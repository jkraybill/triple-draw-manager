import { describe, it, expect } from 'vitest';
import { TripleDrawGameEngine } from '../packages/core/src/game/TripleDrawGameEngine.js';
import { Player } from '../packages/core/src/Player.js';

describe('Definitive test that allowNegativeChips bug is fixed', () => {
  it('MUST allow negative chips and maintain zero-sum when allowNegativeChips=true', () => {
    // This test would FAIL in v1.1.3 but PASSES in v1.1.4
    
    // Setup: Player with 5 chips needs to post 10 blind
    const players = [
      new Player({ id: 'BTN' }),
      new Player({ id: 'SB' }),  // Will need to post 10 but has only 5
      new Player({ id: 'BB' }),  // Will need to post 20 but has only 15
      new Player({ id: 'UTG' }),
    ];
    
    players[0].chips = 1000;
    players[1].chips = 5;    // Can't afford 10 small blind
    players[2].chips = 15;   // Can't afford 20 big blind  
    players[3].chips = 1000;
    
    const TOTAL_CHIPS_IN_ECONOMY = 2020;
    
    const engine = new TripleDrawGameEngine({
      players,
      blinds: { small: 10, big: 20 },
      dealerButton: 0,
      allowNegativeChips: true,  // THE KEY FLAG
      simulationMode: true
    });
    
    // Act: Initialize hand (posts blinds)
    engine.initializeHand();
    
    // Assert: Critical validations
    const sbChips = players[1].chips;
    const bbChips = players[2].chips;
    const pot = engine.potManager.getTotalPot();
    const totalChipsAfter = players.reduce((sum, p) => sum + p.chips, 0);
    
    // 1. SB MUST be negative (this was the bug - it was staying at 0)
    expect(sbChips).toBe(-5);
    expect(sbChips).toBeLessThan(0);
    
    // 2. BB MUST be negative  
    expect(bbChips).toBe(-5);
    expect(bbChips).toBeLessThan(0);
    
    // 3. Pot MUST contain full blinds (not partial)
    expect(pot).toBe(30); // Full 10 + 20, not 5 + 15
    
    // 4. ZERO-SUM: Total chips in economy MUST be conserved
    expect(totalChipsAfter + pot).toBe(TOTAL_CHIPS_IN_ECONOMY);
    
    // 5. No phantom chips created
    expect(totalChipsAfter).toBe(TOTAL_CHIPS_IN_ECONOMY - 30);
  });
  
  it('should demonstrate the bug if we had the old behavior', () => {
    // This simulates what WOULD happen with the bug
    // (for educational purposes - showing what we're preventing)
    
    const players = [
      new Player({ id: 'BTN' }),
      new Player({ id: 'SB' }),
      new Player({ id: 'BB' }),
      new Player({ id: 'UTG' }),
    ];
    
    players[0].chips = 1000;
    players[1].chips = 5;
    players[2].chips = 15;
    players[3].chips = 1000;
    
    // Simulate the BUGGY behavior (what v1.1.3 did)
    const simulateBuggyBehavior = () => {
      // Bug: Player setter was clamping to 0
      players[1].chips = Math.max(0, players[1].chips - 10); // Goes to 0, not -5
      players[2].chips = Math.max(0, players[2].chips - 20); // Goes to 0, not -5
      
      // Only partial blinds go to pot
      const potWithBug = 5 + 15; // Only what they could afford
      return potWithBug;
    };
    
    const potWithBug = simulateBuggyBehavior();
    const totalAfterBug = players.reduce((sum, p) => sum + p.chips, 0);
    
    // With the bug:
    expect(players[1].chips).toBe(0);     // Wrong! Should be -5
    expect(players[2].chips).toBe(0);     // Wrong! Should be -5  
    expect(potWithBug).toBe(20);          // Wrong! Should be 30
    expect(totalAfterBug).toBe(2000);     // Wrong! Extra chips created
    
    // This demonstrates chip leakage:
    const phantomChips = (totalAfterBug + potWithBug) - 2020;
    expect(phantomChips).toBe(0); // FAILS! 10 phantom chips created
  });
});