import { describe, it, expect } from 'vitest';
import { TripleDrawGameEngine } from '../packages/core/src/game/TripleDrawGameEngine.js';
import { Player } from '../packages/core/src/Player.js';

describe('Negative chips blind posting bug', () => {
  it('should maintain chip conservation when allowNegativeChips is true', async () => {
    // Setup players with one who can't afford blinds
    const players = [
      new Player({ id: 'BTN' }),
      new Player({ id: 'SB' }),     // Has only 5, needs to post 10
      new Player({ id: 'BB' }),    // Has only 15, needs to post 20
      new Player({ id: 'UTG' }),
      new Player({ id: 'MP' }),
      new Player({ id: 'CO' }),
    ];
    
    // Set chips after creation
    players[0].chips = 1000;
    players[1].chips = 5;
    players[2].chips = 15;
    players[3].chips = 1000;
    players[4].chips = 1000;
    players[5].chips = 1000;
    
    // Calculate total chips before
    const totalBefore = players.reduce((sum, p) => sum + p.chips, 0);
    console.log('Total chips before:', totalBefore);
    
    const engine = new TripleDrawGameEngine({
      players,
      blinds: { small: 10, big: 20 },
      dealerButton: 0,  // BTN is first player
      allowNegativeChips: true,
      simulationMode: true
    });
    
    // Only start the hand, don't complete it
    engine.initializeHand();
    
    // Calculate total chips after blinds posted (before any betting/folding)
    const totalAfter = players.reduce((sum, p) => sum + p.chips, 0);
    console.log('Total chips after:', totalAfter);
    console.log('SB chips:', players[1].chips, 'Expected:', -5);
    console.log('BB chips:', players[2].chips, 'Expected:', -5);
    
    // Check pot contains the full blinds
    const pot = engine.potManager.getTotalPot();
    console.log('Pot:', pot, 'Expected: 30');
    
    // Critical assertions
    expect(totalAfter).toBe(totalBefore - 30); // Total minus what's in pot
    expect(players[1].chips).toBe(-5); // SB should be negative
    expect(players[2].chips).toBe(-5); // BB should be negative
    expect(pot).toBe(30); // Full blinds should be in pot
    
    // Zero-sum check: chips + pot must equal original total
    expect(totalAfter + pot).toBe(totalBefore);
  });
  
  it('should handle the exact reproduction case from the issue', async () => {
    const players = [
      new Player({ id: 'P1' }),
      new Player({ id: 'P2' }),  // Has only 5 chips
      new Player({ id: 'P3' }),
      new Player({ id: 'P4' }),
      new Player({ id: 'P5' }),
      new Player({ id: 'P6' }),
    ];
    
    // Set chips after creation
    players[0].chips = 1000;
    players[1].chips = 5;
    players[2].chips = 1000;
    players[3].chips = 1000;
    players[4].chips = 1000;
    players[5].chips = 1000;

    const totalBefore = players.reduce((sum, p) => sum + p.chips, 0);
    expect(totalBefore).toBe(5005);

    const engine = new TripleDrawGameEngine({
      players: players,
      blinds: { small: 10, big: 20 },
      dealerButton: 0,
      allowNegativeChips: true,  // Should allow P2 to go to -5
      simulationMode: true,
    });

    // Only initialize to test blind posting
    engine.initializeHand();
    
    // Check individual player chips
    console.log('\nReproduction case:');
    players.forEach(p => {
      console.log(`${p.id}: ${p.chips} chips`);
    });
    
    const totalAfter = players.reduce((sum, p) => sum + p.chips, 0);
    const pot = engine.potManager.getTotalPot();
    
    console.log('Total before:', totalBefore);
    console.log('Total after:', totalAfter);
    console.log('Pot:', pot);
    console.log('Total + Pot:', totalAfter + pot);
    
    // P2 posted small blind (10), should have -5
    expect(players[1].chips).toBe(-5);
    
    // Zero-sum: Total chips in play must be conserved
    expect(totalAfter + pot).toBe(totalBefore);
  });
  
  it('should NOT allow negative chips when allowNegativeChips is false', async () => {
    const players = [
      new Player({ id: 'BTN' }),
      new Player({ id: 'SB' }),     // Has only 5, needs to post 10
      new Player({ id: 'BB' }),    // Has only 15, needs to post 20
      new Player({ id: 'UTG' }),
    ];
    
    // Set chips after creation
    players[0].chips = 1000;
    players[1].chips = 5;
    players[2].chips = 15;
    players[3].chips = 1000;
    
    const totalBefore = players.reduce((sum, p) => sum + p.chips, 0);
    
    const engine = new TripleDrawGameEngine({
      players,
      blinds: { small: 10, big: 20 },
      dealerButton: 0,
      allowNegativeChips: false,  // Default behavior
      simulationMode: true
    });
    
    // Only initialize to test blind posting
    engine.initializeHand();
    
    const totalAfter = players.reduce((sum, p) => sum + p.chips, 0);
    const pot = engine.potManager.getTotalPot();
    
    console.log('\nWith allowNegativeChips: false');
    console.log('SB chips:', players[1].chips, 'Expected: 0');
    console.log('BB chips:', players[2].chips, 'Expected: 0');
    console.log('Pot:', pot, 'Expected: 20 (5 from SB, 15 from BB)');
    
    // When not allowing negative, players go to 0
    expect(players[1].chips).toBe(0);
    expect(players[2].chips).toBe(0);
    
    // Pot only gets what players could afford
    expect(pot).toBe(20); // 5 from SB + 15 from BB
    
    // Zero-sum still maintained
    expect(totalAfter + pot).toBe(totalBefore);
  });
});