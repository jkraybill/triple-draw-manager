import { nanoid } from 'nanoid';
import { WildcardEventEmitter } from './base/WildcardEventEmitter.js';
import { ensureInteger } from './utils/validation.js';

/**
 * Base Player class that implementations should extend or follow as interface
 * This provides a template for what methods a player must implement
 */
export class Player extends WildcardEventEmitter {
  constructor(config = {}) {
    super();

    this.id = config.id || nanoid();
    this.name = config.name || `${this.id}`;
    this.avatar = config.avatar || null;
    this._chips = 0; // Private backing field for chips

    // Game state properties - Player is THE source of truth
    this.bet = 0; // Current bet in the betting round
    this.state = null; // PlayerState enum (ACTIVE, FOLDED, ALL_IN, etc.)
    this.hasActed = false; // Whether player has acted in current betting round
    this.lastAction = null; // Last action taken (Action enum)
    this.hasOption = false; // For big blind option tracking
  }

  /**
   * Get action from player - MUST BE IMPLEMENTED
   * @param {GameState} gameState - Current game state
   * @returns {Promise<PlayerAction>} The player's action
   */
  // eslint-disable-next-line require-await
  getAction(_gameState) {
    throw new Error('getAction() must be implemented by Player subclass');
  }

  /**
   * Receive private cards - SHOULD BE IMPLEMENTED
   * @param {string[]} cards - The hole cards
   */
  receivePrivateCards(_cards) {
    // Default implementation - subclasses should override
    this.emit('cards:received', {
      playerId: this.id,
      cardCount: _cards.length,
    });
  }

  /**
   * Receive a message/notification - OPTIONAL
   * @param {Object} message - Message object
   */
  receiveMessage(message) {
    // Default implementation - subclasses can override
    this.emit('message:received', {
      playerId: this.id,
      messageType: message.type,
    });
  }

  /**
   * Get player info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
    };
  }

  /**
   * Disconnect the player - OPTIONAL
   */
  disconnect() {
    this.emit('disconnected', { playerId: this.id });
    this.removeAllListeners();
  }

  /**
   * Get current chip count
   * @returns {number} Current chip count
   */
  get chips() {
    return this._chips;
  }

  /**
   * Set chip count
   * @param {number} amount - New chip amount
   */
  set chips(amount) {
    // Allow negative values to pass through (ensureInteger might convert negative to 0)
    const numAmount = typeof amount === 'string' ? Number(amount) : amount;
    const intAmount = Math.round(numAmount);
    const oldAmount = this._chips;

    // Allow negative chips if explicitly set (for allowNegativeChips mode)
    // Only clamp to 0 if the value is positive or zero
    this._chips = intAmount;

    if (oldAmount !== this._chips) {
      this.emit('chips:changed', {
        playerId: this.id,
        oldAmount,
        newAmount: this._chips,
        difference: this._chips - oldAmount,
      });
    }
  }

  /**
   * Add chips to player's stack
   * @param {number} amount - Amount to add
   * @returns {number} New chip count
   */
  addChips(amount) {
    // Ensure amount is an integer
    const intAmount = ensureInteger(amount, 'chip amount to add');
    if (intAmount < 0) {
      throw new Error('Cannot add negative chips');
    }
    this.chips = this._chips + intAmount;
    return this._chips;
  }

  /**
   * Remove chips from player's stack
   * @param {number} amount - Amount to remove
   * @returns {number} New chip count
   * @throws {Error} If insufficient chips
   */
  removeChips(amount) {
    if (amount < 0) {
      throw new Error('Cannot remove negative chips');
    }
    if (amount > this._chips) {
      throw new Error(`Insufficient chips: has ${this._chips}, needs ${amount}`);
    }
    this.chips = this._chips - amount;
    return this._chips;
  }

  /**
   * Check if player can afford an amount
   * @param {number} amount - Amount to check
   * @returns {boolean} True if player has enough chips
   */
  canAfford(amount) {
    return this._chips >= amount;
  }

  /**
   * Set initial chip stack (for buy-in)
   * @param {number} amount - Initial stack size
   */
  buyIn(amount) {
    if (amount <= 0) {
      throw new Error('Buy-in must be positive');
    }
    this.chips = amount;
  }
}
