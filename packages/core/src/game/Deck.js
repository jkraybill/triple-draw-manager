import { BaseDeck } from './BaseDeck.js';

/**
 * Standard 52-card deck implementation
 */
export class Deck extends BaseDeck {
  constructor() {
    super();
    this.cards = [];
    this.reset();
  }

  /**
   * Reset deck to full 52 cards
   */
  reset() {
    this.cards = [];
    const suits = ['h', 'd', 'c', 's']; // Use pokersolver format
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']; // T instead of 10

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(this.createCard(rank, suit));
      }
    }
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Draw multiple cards from the deck
   * @param {number} count - Number of cards to draw
   * @returns {Array} Array of drawn cards
   */
  drawMultiple(count) {
    if (count > this.cards.length) {
      throw new Error(`Cannot draw ${count} cards, only ${this.cards.length} remaining`);
    }

    const drawn = [];
    for (let i = 0; i < count; i++) {
      drawn.push(this.draw());
    }
    return drawn;
  }

  /**
   * Return cards to the deck (for discards)
   * Cards go to the bottom of the deck
   * @param {Array} cards - Cards to return
   */
  returnCards(cards) {
    // Add discarded cards to the bottom of the deck
    // In a real game, these would go to a discard pile
    // and only be reshuffled if the deck runs out
    this.cards.unshift(...cards);
  }

  /**
   * Draw a card from the deck
   */
  draw() {
    if (this.cards.length === 0) {
      throw new Error('Cannot draw from empty deck');
    }
    return this.cards.shift();
  }

  /**
   * Get remaining card count
   */
  getRemaining() {
    return this.cards.length;
  }

  /**
   * Deal hole cards to a player
   * @param {string} _playerId - The player's ID
   * @param {number} _seatPosition - The player's seat position
   * @returns {Array} Array of 2 cards
   */
  dealHoleCards(_playerId, _seatPosition) {
    return [this.draw(), this.draw()];
  }

  /**
   * Deal the flop (3 community cards)
   * @returns {Array} Array of 3 cards
   */
  dealFlop() {
    return [this.draw(), this.draw(), this.draw()];
  }

  /**
   * Deal the turn (1 community card)
   * @returns {Object} Single card object
   */
  dealTurn() {
    return this.draw();
  }

  /**
   * Deal the river (1 community card)
   * @returns {Object} Single card object
   */
  dealRiver() {
    return this.draw();
  }
}
