import { Player, Action } from '../packages/core/src/index.js';

/**
 * Simple bot player for triple-draw
 */
export class SimpleBot extends Player {
  constructor(config = {}) {
    super(config);
    this.strategy = config.strategy || 'tight'; // 'tight', 'loose', 'aggressive'
  }

  /**
   * Get betting action
   */
  async getAction(gameState) {
    const validActions = this.getValidActionsFromState(gameState);
    
    // Simple strategy based on position and hand strength
    const myHand = gameState.players[this.id].hand;
    const pot = gameState.pot;
    const currentBet = gameState.currentBet;
    const myBet = gameState.players[this.id].bet;
    const toCall = currentBet - myBet;
    
    // Random delay to simulate thinking
    await this.simulateThinking();
    
    // Fold if we have no cards (shouldn't happen)
    if (!myHand || myHand.length === 0) {
      return { action: Action.FOLD };
    }
    
    // Simple decision logic
    if (this.strategy === 'tight') {
      // Tight player - only play good hands
      if (toCall === 0) {
        // No bet to match - check or bet
        if (Math.random() < 0.3) {
          return { action: Action.BET, amount: gameState.betLimit || gameState.bigBlind };
        }
        return { action: Action.CHECK };
      } else {
        // There's a bet - call with decent hands, fold otherwise
        if (Math.random() < 0.4) {
          return { action: Action.CALL };
        }
        return { action: Action.FOLD };
      }
    } else if (this.strategy === 'aggressive') {
      // Aggressive player - bet and raise often
      if (toCall === 0) {
        // No bet - usually bet
        if (Math.random() < 0.7) {
          return { action: Action.BET, amount: gameState.betLimit || gameState.bigBlind };
        }
        return { action: Action.CHECK };
      } else {
        // There's a bet - often raise
        if (validActions.includes(Action.RAISE) && Math.random() < 0.5) {
          return { action: Action.RAISE, amount: gameState.betLimit || gameState.bigBlind };
        }
        if (Math.random() < 0.8) {
          return { action: Action.CALL };
        }
        return { action: Action.FOLD };
      }
    } else {
      // Loose player - play many hands
      if (toCall === 0) {
        if (Math.random() < 0.5) {
          return { action: Action.BET, amount: gameState.betLimit || gameState.bigBlind };
        }
        return { action: Action.CHECK };
      } else {
        if (Math.random() < 0.7) {
          return { action: Action.CALL };
        }
        return { action: Action.FOLD };
      }
    }
  }

  /**
   * Get draw action
   */
  async getDrawAction(gameState) {
    const myHand = gameState.players[this.id].hand;
    
    // Random delay to simulate thinking
    await this.simulateThinking();
    
    // Simple draw strategy - draw high cards
    const highCards = [];
    for (let i = 0; i < myHand.length; i++) {
      const card = myHand[i];
      const rank = card[0]; // First character is rank
      
      // Consider high cards (T, J, Q, K, A) and pairs as bad
      if (['T', 'J', 'Q', 'K', 'A'].includes(rank)) {
        highCards.push(i);
      }
    }
    
    // Check for pairs (simplified)
    const ranks = myHand.map(c => c[0]);
    const rankCounts = {};
    for (const rank of ranks) {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    }
    
    const pairIndices = [];
    for (let i = 0; i < myHand.length; i++) {
      if (rankCounts[myHand[i][0]] > 1) {
        pairIndices.push(i);
      }
    }
    
    // Decide what to discard
    let discardIndices = [];
    
    if (pairIndices.length > 0) {
      // Have pairs - discard some of them
      discardIndices = pairIndices.slice(0, Math.min(3, pairIndices.length));
    } else if (highCards.length > 0) {
      // Have high cards - discard them
      discardIndices = highCards.slice(0, Math.min(3, highCards.length));
    } else if (Math.random() < 0.2) {
      // Sometimes stand pat with decent hands
      return { cardsToDiscard: 0 };
    } else {
      // Draw 1-2 cards randomly
      const numDraw = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numDraw; i++) {
        discardIndices.push(i);
      }
    }
    
    return {
      cardsToDiscard: discardIndices.length,
      discardIndices: discardIndices,
    };
  }

  /**
   * Helper to get valid actions from game state
   */
  getValidActionsFromState(gameState) {
    const actions = [];
    const myState = gameState.players[this.id];
    const toCall = gameState.currentBet - myState.bet;
    
    if (toCall === 0) {
      actions.push(Action.CHECK);
      if (!gameState.bettingCapped) {
        actions.push(Action.BET);
      }
    } else {
      actions.push(Action.FOLD);
      if (myState.chips >= toCall) {
        actions.push(Action.CALL);
        if (!gameState.bettingCapped && gameState.raisesInRound < 4) {
          actions.push(Action.RAISE);
        }
      }
    }
    
    return actions;
  }

  /**
   * Simulate thinking time
   */
  async simulateThinking() {
    const thinkTime = Math.random() * 1000 + 500; // 0.5-1.5 seconds
    return new Promise(resolve => setTimeout(resolve, thinkTime));
  }

  /**
   * Receive private cards
   */
  receivePrivateCards(cards) {
    // Bot doesn't need to do anything special with cards
    super.receivePrivateCards(cards);
  }
}