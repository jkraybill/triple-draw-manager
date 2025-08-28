# Triple Draw Manager

A comprehensive Node.js library for managing Deuce-to-Seven Triple Draw Lowball poker games. Built with the same robust architecture as the poker-game-manager but specifically designed for triple-draw variants.

## Features

- ✅ Full 2-7 Triple Draw game logic implementation
- ✅ Lowball hand evaluation (straights and flushes count against you)
- ✅ Three drawing rounds with betting after each
- ✅ Support for limit, pot-limit, and no-limit betting structures
- ✅ Event-driven architecture for easy integration
- ✅ Integer-validated chip management (prevents floating point errors)
- ✅ Dead button rule support
- ✅ Comprehensive position tracking
- ✅ Side pot management for all-in scenarios
- ✅ Proper 4-raise betting cap enforcement (5 total bets max per round)
- ✅ Support for negative chips in simulation mode (allowNegativeChips option)
- ✅ Fixed position support for deterministic testing (fixedPositions option)

## Installation

```bash
npm install @jkraybill/triple-draw-manager@1.1.5
```

**Note**: Version 1.1.5 includes critical bug fixes for betting cap enforcement and negative chip handling.

## Quick Start

```javascript
import { Table, Player } from '@jkraybill/triple-draw-manager';

// Create a custom player class
class MyPlayer extends Player {
  async getAction(gameState) {
    // Implement your betting logic
    return { action: 'call' };
  }
  
  async getDrawAction(gameState) {
    // Implement your drawing logic
    return { cardsToDiscard: 2, discardIndices: [0, 1] };
  }
}

// Create a table
const table = new Table({
  blinds: { small: 10, big: 20 },
  maxPlayers: 6,
  limitBetting: true,
  betLimit: 20
});

// Add players
const player1 = new MyPlayer({ id: 'p1', chips: 1000 });
const player2 = new MyPlayer({ id: 'p2', chips: 1000 });

table.addPlayer(player1);
table.addPlayer(player2);

// Start the game
await table.tryStartGame();
```

## Game Flow

1. **Pre-Draw Betting**: Initial betting round after cards are dealt
2. **First Draw**: Players can discard 0-5 cards and draw new ones
3. **Post-First Draw Betting**: Betting round after first draw
4. **Second Draw**: Second drawing opportunity
5. **Post-Second Draw Betting**: Betting round after second draw
6. **Third Draw**: Final drawing opportunity
7. **Post-Third Draw Betting**: Final betting round
8. **Showdown**: Best low hand wins (7-5-4-3-2 is the best possible hand)

## Hand Rankings (Low to High)

In 2-7 Triple Draw, the LOWEST hand wins:

1. **7-5-4-3-2** (The Wheel/Number One) - Best possible hand
2. **8-6-4-3-2** (Number Two)
3. **8-6-5-3-2** (Number Three)
4. **8-6-5-4-2** (Number Four)
5. **8-6-5-4-3** (Number Five)
6. **8-7-4-3-2** (Eight-Seven)
7. ...continuing with worse hands...
8. **Pairs** - Worse than any no-pair hand
9. **Two Pair**
10. **Three of a Kind**
11. **Straights** - Count against you!
12. **Flushes** - Count against you!
13. **Full House**
14. **Four of a Kind**
15. **Straight Flush** - Worst possible hand

Remember:
- Aces are ALWAYS high (not low)
- Straights and flushes count AGAINST you
- The best hand has no pairs, no straight, no flush

## Events

The library emits various events throughout the game:

### Table Events
- `player:joined` - Player joins the table
- `player:left` - Player leaves the table
- `game:started` - New hand begins
- `hand:completed` - Hand ends with results

### Game Events  
- `blind:posted` - Blind posted
- `betting:round:started` - Betting round begins
- `player:to:act` - Player's turn to act
- `player:bet` - Player makes a bet
- `player:raised` - Player raises
- `player:called` - Player calls
- `player:folded` - Player folds
- `draw:phase:started` - Draw phase begins
- `player:stood-pat` - Player draws 0 cards
- `player:drew:cards` - Player draws cards
- `hand:ended` - Showdown and winners

## API Reference

### Table

```javascript
const table = new Table({
  id: 'table-1',                  // Optional table ID
  variant: '2-7-triple-draw',      // Game variant (default)
  maxPlayers: 6,                  // Maximum players (default: 6)
  minPlayers: 2,                  // Minimum to start (default: 2)
  blinds: {
    small: 10,                    // Small blind amount (must be integer)
    big: 20                       // Big blind amount (must be integer)
  },
  limitBetting: true,             // Use fixed limit betting (default: true)
  betLimit: 20,                   // Fixed bet amount (default: big blind)
  timeout: 30000,                 // Action timeout in ms (default: 30000)
  simulationMode: false,          // Fast execution without delays (default: false)
  dealerButton: 0                 // Initial button position (default: random)
});
```

### TripleDrawGameEngine

For advanced usage, you can directly instantiate the game engine:

```javascript
const engine = new TripleDrawGameEngine({
  players: [player1, player2, player3],
  blinds: { small: 10, big: 20 },
  dealerButton: 0,                // Specific button position (0-based index)
  limitBetting: true,              // Enforce limit betting rules
  betLimit: 20,                    // Fixed bet/raise amount for limit games
  timeout: 30000,                  // Player action timeout in ms
  fixedPositions: false,          // Don't rotate button/blinds between hands
  allowNegativeChips: false,      // Allow players to go negative (for simulations)
  simulationMode: false           // Fast execution without delays
});
```

### Player

Players must extend the base `Player` class and implement:

```javascript
class MyPlayer extends Player {
  // Required: Handle betting decisions
  async getAction(gameState) {
    return {
      action: 'call',    // 'fold', 'check', 'call', 'bet', 'raise'
      amount: 20         // For bet/raise actions
    };
  }
  
  // Required: Handle drawing decisions
  async getDrawAction(gameState) {
    return {
      cardsToDiscard: 3,           // 0-5 cards
      discardIndices: [0, 2, 4]    // Which cards to discard
    };
  }
}
```

## Examples

See the `/examples` directory for complete working examples:
- `simple-game.js` - Basic game with bot players
- `SimpleBot.js` - Example bot implementation

## Testing

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## License

MIT

## Credits

Based on the architecture of [poker-game-manager](https://github.com/jkraybill/poker-game-manager).
