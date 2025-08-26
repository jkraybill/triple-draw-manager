import { nanoid } from 'nanoid';
import { WildcardEventEmitter } from './base/WildcardEventEmitter.js';
import { TripleDrawGameEngine } from './game/TripleDrawGameEngine.js';
import { TableState, PlayerState } from './types/index.js';
import { validateIntegerAmount } from './utils/validation.js';
import { Deck } from './game/Deck.js';
import { BaseDeck } from './game/BaseDeck.js';
import { DEFAULT_CONFIG } from './constants.js';

/**
 * Represents a triple-draw poker table that manages games and players
 */
export class Table extends WildcardEventEmitter {
  constructor(config = {}) {
    super();

    this.id = config.id || nanoid();

    // Validate blinds are integers
    const validatedBlinds = {
      small: validateIntegerAmount(config.blinds?.small ?? DEFAULT_CONFIG.DEFAULT_SMALL_BLIND, 'small blind'),
      big: validateIntegerAmount(config.blinds?.big ?? DEFAULT_CONFIG.DEFAULT_BIG_BLIND, 'big blind'),
    };

    this.config = {
      ...config,
      variant: config.variant || '2-7-triple-draw',
      maxPlayers: config.maxPlayers || DEFAULT_CONFIG.MAX_PLAYERS_PER_TABLE, // 6 for triple-draw
      minPlayers: config.minPlayers || DEFAULT_CONFIG.MIN_PLAYERS_PER_TABLE,
      blinds: validatedBlinds,
      timeout: config.timeout || DEFAULT_CONFIG.DEFAULT_TIMEOUT,
      limitBetting: config.limitBetting !== false, // Default to limit betting
      betLimit: config.betLimit || validatedBlinds.big, // Default bet is big blind
    };

    // Simulation mode for fast execution without delays
    this.simulationMode = config.simulationMode === true;

    this.players = new Map();
    this.waitingList = [];
    this.state = TableState.WAITING;
    this.gameEngine = null;
    this.gameCount = 0;
    this.deck = null; // Deck instance for custom implementations
    this.handStartingChips = new Map(); // Track chip counts at start of each hand

    // Initialize deck from config or create default
    if (config.deck) {
      this.setDeck(config.deck);
    } else {
      this.deck = new Deck();
    }

    // Dead button rule tracking
    this.playerOrder = []; // Ordered list of player IDs by seat
    this.lastBigBlindPlayerId = null; // Track who posted BB last hand
    this.currentDealerButton = config.dealerButton ?? 0; // Initial button position
    this.nextBigBlindSeatNumber = null; // Track which seat posts BB next
    this.lastHandBlinds = { small: null, big: null }; // Track who posted blinds last hand
    this.isDeadButton = false; // Whether current button is on empty seat
    this.isDeadSmallBlind = false; // Whether small blind is dead this hand
  }

  /**
   * Add a player to the table
   * @param {Player} player - The player to add
   * @returns {boolean} True if player was added successfully
   */
  addPlayer(player) {
    if (this.players.size >= this.config.maxPlayers) {
      this.waitingList.push(player);
      this.emit('player:waiting', {
        player,
        position: this.waitingList.length,
      });
      return false;
    }

    if (this.players.has(player.id)) {
      throw new Error('Player already at table');
    }

    // Player should already have chips set before being added to the table
    this.players.set(player.id, player);
    this.playerOrder.push(player.id);

    this.emit('player:joined', {
      playerId: player.id,
      chipCount: player.chips,
      seatNumber: this.players.size - 1,
    });

    // Auto-start if we have minimum players
    if (this.state === TableState.WAITING && this.players.size >= this.config.minPlayers) {
      if (!this.simulationMode) {
        setTimeout(() => this.tryStartGame(), 1000);
      }
    }

    return true;
  }

  /**
   * Remove a player from the table
   * @param {string} playerId - ID of player to remove
   * @returns {boolean} True if player was removed
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    // If game is in progress, mark player as sitting out
    if (this.state === TableState.IN_PROGRESS && this.gameEngine) {
      const enginePlayer = this.gameEngine.players.find((p) => p.id === playerId);
      if (enginePlayer) {
        enginePlayer.state = PlayerState.SITTING_OUT;
      }
    }

    this.players.delete(playerId);
    this.playerOrder = this.playerOrder.filter((id) => id !== playerId);

    this.emit('player:left', {
      playerId,
      remainingPlayers: this.players.size,
    });

    // Check if we need to pause the game
    if (this.players.size < this.config.minPlayers && this.state === TableState.IN_PROGRESS) {
      this.pauseGame();
    }

    // Add player from waiting list if available
    if (this.waitingList.length > 0) {
      const nextPlayer = this.waitingList.shift();
      this.addPlayer(nextPlayer);
    }

    return true;
  }

  /**
   * Try to start a new game
   */
  async tryStartGame() {
    if (this.state !== TableState.WAITING) {
      return false;
    }

    if (this.players.size < this.config.minPlayers) {
      this.emit('game:waiting', {
        currentPlayers: this.players.size,
        minRequired: this.config.minPlayers,
      });
      return false;
    }

    await this.startGame();
    return true;
  }

  /**
   * Start a new game
   */
  async startGame() {
    this.state = TableState.IN_PROGRESS;
    this.gameCount++;

    // Store starting chips
    this.handStartingChips.clear();
    for (const [id, player] of this.players) {
      this.handStartingChips.set(id, player.chips);
    }

    // Determine dealer button position
    let dealerButtonIndex = this.currentDealerButton;

    // Handle dead button rules
    const activePlayers = Array.from(this.players.values()).filter(
      (p) => p.state !== PlayerState.SITTING_OUT
    );

    if (this.gameCount === 1 || !this.lastBigBlindPlayerId) {
      // First hand or no previous BB, random button
      dealerButtonIndex = Math.floor(Math.random() * activePlayers.length);
    } else {
      // Move button clockwise from last position
      dealerButtonIndex = (this.currentDealerButton + 1) % activePlayers.length;

      // Check for dead button
      const buttonPlayer = activePlayers[dealerButtonIndex];
      if (!buttonPlayer || buttonPlayer.state === PlayerState.SITTING_OUT) {
        this.isDeadButton = true;
      }
    }

    this.currentDealerButton = dealerButtonIndex;

    // Create game engine with current players
    const engineConfig = {
      ...this.config,
      tableId: this.id,
      players: Array.from(this.players.values()),
      dealerButton: dealerButtonIndex,
      deck: this.deck,
      simulationMode: this.simulationMode,
      buttonPlayerIndex: dealerButtonIndex,
      isDeadButton: this.isDeadButton,
      isDeadSmallBlind: this.isDeadSmallBlind,
    };

    this.gameEngine = new TripleDrawGameEngine(engineConfig);

    // Forward game engine events
    this.setupEngineEventForwarding();

    // Handle hand end
    this.gameEngine.once('hand:ended', async (result) => {
      await this.handleHandEnded(result);
    });

    this.emit('game:started', {
      gameNumber: this.gameCount,
      players: Array.from(this.players.keys()),
      dealerButton: dealerButtonIndex,
    });

    // Start the hand
    try {
      await this.gameEngine.start();
    } catch (error) {
      this.emit('game:error', { error: error.message });
      this.state = TableState.WAITING;
    }
  }

  /**
   * Handle hand ended event
   */
  async handleHandEnded(result) {
    // Update chip counts
    for (const [id, player] of this.players) {
      const enginePlayer = this.gameEngine.players.find((p) => p.id === id);
      if (enginePlayer) {
        player.chips = enginePlayer.chips;
      }
    }

    // Check for eliminated players
    const eliminatedPlayers = [];
    for (const [id, player] of this.players) {
      if (player.chips <= 0) {
        eliminatedPlayers.push(id);
        this.removePlayer(id);
      }
    }

    if (eliminatedPlayers.length > 0) {
      this.emit('players:eliminated', { playerIds: eliminatedPlayers });
    }

    // Calculate profit/loss for each player
    const profits = new Map();
    for (const [id, startingChips] of this.handStartingChips) {
      const player = this.players.get(id);
      if (player) {
        profits.set(id, player.chips - startingChips);
      }
    }

    this.emit('hand:completed', {
      gameNumber: this.gameCount,
      winners: result.winners,
      profits: Object.fromEntries(profits),
      eliminatedPlayers,
    });

    this.gameEngine = null;
    this.state = TableState.WAITING;

    // Auto-start next hand if we have enough players
    if (this.players.size >= this.config.minPlayers && !this.simulationMode) {
      setTimeout(() => this.tryStartGame(), DEFAULT_CONFIG.TIME_BETWEEN_HANDS);
    }
  }

  /**
   * Setup event forwarding from game engine
   */
  setupEngineEventForwarding() {
    if (!this.gameEngine) return;

    // Forward all game engine events with table context
    const eventsToForward = [
      'hand:started',
      'cards:dealt',
      'blind:posted',
      'betting:round:started',
      'betting:round:ended',
      'player:to:act',
      'player:folded',
      'player:called',
      'player:bet',
      'player:raised',
      'player:all-in',
      'player:timeout',
      'draw:phase:started',
      'player:drawing',
      'player:stood-pat',
      'player:drawing:cards',
      'player:drew:cards',
      'showdown',
    ];

    eventsToForward.forEach((eventName) => {
      this.gameEngine.on(eventName, (data) => {
        this.emit(eventName, {
          ...data,
          tableId: this.id,
          gameNumber: this.gameCount,
        });
      });
    });
  }

  /**
   * Pause the current game
   */
  pauseGame() {
    if (this.state !== TableState.IN_PROGRESS) {
      return;
    }

    this.state = TableState.PAUSED;
    this.emit('game:paused', {
      reason: 'Not enough players',
      currentPlayers: this.players.size,
    });
  }

  /**
   * Resume a paused game
   */
  resumeGame() {
    if (this.state !== TableState.PAUSED) {
      return;
    }

    if (this.players.size < this.config.minPlayers) {
      this.emit('game:cannot:resume', {
        reason: 'Still not enough players',
        currentPlayers: this.players.size,
        minRequired: this.config.minPlayers,
      });
      return;
    }

    this.state = TableState.IN_PROGRESS;
    this.emit('game:resumed');
  }

  /**
   * Close the table
   */
  close() {
    this.state = TableState.CLOSED;

    // Remove all players
    for (const playerId of this.players.keys()) {
      this.removePlayer(playerId);
    }

    this.emit('table:closed', { tableId: this.id });
  }

  /**
   * Set a custom deck implementation
   */
  setDeck(deck) {
    if (!(deck instanceof BaseDeck)) {
      throw new Error('Deck must extend BaseDeck');
    }
    this.deck = deck;
  }

  /**
   * Get current table state
   */
  getState() {
    return {
      id: this.id,
      state: this.state,
      variant: this.config.variant,
      players: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        state: p.state,
      })),
      config: this.config,
      gameCount: this.gameCount,
      waitingList: this.waitingList.length,
      currentGame: this.gameEngine ? this.gameEngine.getGameState() : null,
    };
  }
}