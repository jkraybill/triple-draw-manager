import { GamePhase, PlayerState, Action } from '../types/index.js';
import { WildcardEventEmitter } from '../base/WildcardEventEmitter.js';
import { Player } from '../Player.js';
import { validateIntegerAmount, ensureInteger } from '../utils/validation.js';
// import { monitor } from '../utils/monitoring.js';
import { DEFAULT_CONFIG } from '../constants.js';
import { LowballHandEvaluator } from './LowballHandEvaluator.js';
import { PotManager } from './PotManager.js';
import { Deck } from './Deck.js';

/**
 * Core game engine that handles 2-7 Triple Draw game logic
 */
export class TripleDrawGameEngine extends WildcardEventEmitter {
  constructor(config) {
    super();

    // Validate and ensure blinds are integers
    this.config = {
      smallBlind: validateIntegerAmount(config.blinds.small, 'small blind'),
      bigBlind: validateIntegerAmount(config.blinds.big, 'big blind'),
      timeout: config.timeout || 30000,
      limitBetting: config.limitBetting !== false, // Default to limit betting
      betLimit: config.betLimit || config.blinds.big, // Default bet size is big blind
      fixedPositions: config.fixedPositions === true, // Don't rotate button/blinds
      allowNegativeChips: config.allowNegativeChips === true, // Allow players to go negative
      ...config,
    };

    // Players are the single source of truth
    this.players = config.players.map((p) => {
      if (p instanceof Player) {
        return p;
      } else if (p.player instanceof Player) {
        p.player.chips = ensureInteger(p.chips, 'player.chips');
        return p.player;
      } else {
        throw new Error('Invalid player format');
      }
    });

    this.phase = GamePhase.WAITING;
    this.deck = null;
    this.potManager = null;
    this.currentPlayerIndex = 0;
    this.dealerButtonIndex =
      config.dealerButton !== undefined
        ? config.dealerButton
        : Math.floor(Math.random() * this.players.length);

    // Triple-draw specific properties
    this.drawsRemaining = 3;
    this.playerHands = new Map(); // Store each player's 5-card hand
    this.drawRequests = new Map(); // Store draw requests for current draw phase
    this.discardPile = []; // Cards that have been discarded

    // Betting tracking
    this.roundBets = new Map();
    this.lastRaiser = null;
    this.bettingCapped = false; // For limit games, track if betting is capped
    this.raisesInRound = 0; // Count raises in current betting round

    // Dead button support
    this.buttonPlayerIndex = config.buttonPlayerIndex;
    this.smallBlindPlayerIndex = config.smallBlindPlayerIndex;
    this.bigBlindPlayerIndex = config.bigBlindPlayerIndex;
    this.isDeadButton = config.isDeadButton || false;
    this.isDeadSmallBlind = config.isDeadSmallBlind || false;

    this.deck = config.deck || null;
    this.simulationMode = config.simulationMode === true;
  }

  /**
   * Start a new hand
   */
  async start() {
    if (this.phase !== GamePhase.WAITING) {
      throw new Error('Game already in progress');
    }

    const positionInfo = this.calculatePositionInfo();

    this.emit('hand:started', {
      players: this.players.map((p) => p.id),
      dealerButton: this.dealerButtonIndex,
      positions: positionInfo,
    });

    this.initializeHand();
    await this.startBettingRound();
  }

  /**
   * Initialize a new hand
   */
  initializeHand() {
    // Reset game state
    this.drawsRemaining = 3;
    this.playerHands.clear();
    this.drawRequests.clear();
    this.discardPile = [];

    // Use provided deck instance or create new one
    if (!this.deck) {
      this.deck = new Deck();
    }
    this.deck.reset();
    this.deck.shuffle();

    // Initialize pot manager
    this.potManager = new PotManager(this.players);

    // Reset player states
    this.players.forEach((player) => {
      player.state = PlayerState.ACTIVE;
      player.bet = 0;
      player.hasActed = false;
      player.lastAction = null;
      player.hasOption = false;
    });

    // Deal initial hands (5 cards each)
    this.dealInitialHands();

    // Post blinds
    this.postBlinds();

    // Set initial phase
    this.phase = GamePhase.PRE_DRAW;
  }

  /**
   * Deal 5 cards to each player
   */
  dealInitialHands() {
    for (const player of this.players) {
      if (player.state === PlayerState.ACTIVE) {
        const hand = this.deck.drawMultiple(DEFAULT_CONFIG.CARDS_PER_HAND);
        this.playerHands.set(player.id, hand);

        // Notify player of their cards
        player.receivePrivateCards(hand);

        this.emit('cards:dealt', {
          playerId: player.id,
          cardCount: hand.length,
        });
      }
    }
  }

  /**
   * Post blinds at the start of a hand
   */
  postBlinds() {
    const activePlayers = this.players.filter((p) => p.state === PlayerState.ACTIVE);

    if (activePlayers.length < 2) {
      throw new Error('Not enough active players to post blinds');
    }

    // Calculate blind positions
    let sbIndex, bbIndex;

    if (this.isDeadButton) {
      sbIndex = this.smallBlindPlayerIndex;
      bbIndex = this.bigBlindPlayerIndex;
    } else if (activePlayers.length === 2) {
      // Heads up: dealer posts small blind
      sbIndex = this.dealerButtonIndex;
      bbIndex = (this.dealerButtonIndex + 1) % this.players.length;
    } else {
      // Normal: blinds after dealer
      sbIndex = (this.dealerButtonIndex + 1) % this.players.length;
      bbIndex = (this.dealerButtonIndex + 2) % this.players.length;
    }

    // Post small blind
    const sbPlayer = this.players[sbIndex];
    const sbAmount = this.config.allowNegativeChips
      ? this.config.smallBlind
      : Math.min(sbPlayer.chips, this.config.smallBlind);

    // Directly manipulate _chips to bypass the setter's validation when allowing negative
    if (this.config.allowNegativeChips) {
      sbPlayer._chips = (sbPlayer._chips || 0) - sbAmount;
    } else {
      sbPlayer.chips -= sbAmount;
    }

    sbPlayer.bet = sbAmount;
    this.potManager.addToPot(sbPlayer, sbAmount);

    this.emit('blind:posted', {
      playerId: sbPlayer.id,
      amount: sbAmount,
      type: 'small',
    });

    // Post big blind
    const bbPlayer = this.players[bbIndex];
    const bbAmount = this.config.allowNegativeChips
      ? this.config.bigBlind
      : Math.min(bbPlayer.chips, this.config.bigBlind);

    // Directly manipulate _chips to bypass the setter's validation when allowing negative
    if (this.config.allowNegativeChips) {
      bbPlayer._chips = (bbPlayer._chips || 0) - bbAmount;
    } else {
      bbPlayer.chips -= bbAmount;
    }

    bbPlayer.bet = bbAmount;
    bbPlayer.hasOption = true; // BB has option to raise
    this.potManager.addToPot(bbPlayer, bbAmount);

    this.emit('blind:posted', {
      playerId: bbPlayer.id,
      amount: bbAmount,
      type: 'big',
    });

    // Set current player (first to act pre-draw)
    this.currentPlayerIndex = (bbIndex + 1) % this.players.length;
    while (this.players[this.currentPlayerIndex].state !== PlayerState.ACTIVE) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
  }

  /**
   * Start a betting round
   */
  async startBettingRound() {
    this.roundBets.clear();
    this.lastRaiser = null;
    this.bettingCapped = false;
    this.raisesInRound = 0;

    // Reset player action flags
    this.players.forEach((player) => {
      if (player.state === PlayerState.ACTIVE) {
        player.hasActed = false;
      }
    });

    this.emit('betting:round:started', {
      phase: this.phase,
      pot: this.potManager.getTotalPot(),
    });

    await this.promptNextPlayer();
  }

  /**
   * Prompt the next player for action
   */
  async promptNextPlayer() {
    // Find next active player
    while (this.players[this.currentPlayerIndex].state !== PlayerState.ACTIVE) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    const currentPlayer = this.players[this.currentPlayerIndex];

    // Check if betting round is complete
    if (this.isBettingComplete()) {
      await this.endBettingRound();
      return;
    }

    // Get valid actions for current player
    const validActions = this.getValidActions(currentPlayer);

    const gameState = this.getGameState();

    this.emit('player:to:act', {
      playerId: currentPlayer.id,
      validActions,
      pot: this.potManager.getTotalPot(),
      currentBet: this.getCurrentBet(),
      gameState,
    });

    // Get player action
    try {
      const action = await Promise.race([
        currentPlayer.getAction(gameState),
        this.createTimeout(currentPlayer.id),
      ]);

      await this.handleAction(currentPlayer, action);
    } catch (error) {
      // Handle timeout or error
      await this.handleAction(currentPlayer, { action: Action.FOLD });
    }
  }

  /**
   * Handle a player's betting action
   */
  async handleAction(player, actionData) {
    const { action, amount } = actionData;

    switch (action) {
      case Action.FOLD:
        player.state = PlayerState.FOLDED;
        this.emit('player:folded', { playerId: player.id });
        break;

      case Action.CHECK:
        if (this.getCurrentBet() > player.bet) {
          throw new Error('Cannot check when there is a bet to match');
        }
        break;

      case Action.CALL: {
        const callAmount = this.getCurrentBet() - player.bet;
        const actualCall = this.config.allowNegativeChips
          ? callAmount
          : Math.min(callAmount, player.chips);

        // Directly manipulate _chips to bypass the setter's validation when allowing negative
        if (this.config.allowNegativeChips) {
          player._chips = (player._chips || 0) - actualCall;
        } else {
          player.chips -= actualCall;
        }

        player.bet += actualCall;
        this.potManager.addToPot(player, actualCall);

        if (player.chips <= 0 && !this.config.allowNegativeChips) {
          player.state = PlayerState.ALL_IN;
        }

        this.emit('player:called', {
          playerId: player.id,
          amount: actualCall,
        });
        break;
      }

      case Action.BET:
      case Action.RAISE: {
        const raiseAmount = ensureInteger(amount, 'raise amount');

        if (this.config.limitBetting) {
          // Enforce limit betting rules
          if (this.raisesInRound >= 4) {
            throw new Error('Betting is capped in this round');
          }
          if (raiseAmount !== this.config.betLimit) {
            throw new Error(`Raise must be exactly ${this.config.betLimit}`);
          }
        }

        player.chips -= raiseAmount;
        player.bet += raiseAmount;
        this.potManager.addToPot(player, raiseAmount);

        if (player.chips === 0) {
          player.state = PlayerState.ALL_IN;
        }

        this.lastRaiser = player.id;
        this.raisesInRound++;

        // Cap betting after 4 raises in limit games
        if (this.config.limitBetting && this.raisesInRound >= 4) {
          this.bettingCapped = true;
        }

        // Reset hasActed for other players
        this.players.forEach((p) => {
          if (p.id !== player.id && p.state === PlayerState.ACTIVE) {
            p.hasActed = false;
          }
        });

        this.emit(action === Action.BET ? 'player:bet' : 'player:raised', {
          playerId: player.id,
          amount: raiseAmount,
          totalBet: player.bet,
        });
        break;
      }

      case Action.ALL_IN: {
        const allInAmount = player.chips;
        player.chips = 0;
        player.bet += allInAmount;
        player.state = PlayerState.ALL_IN;
        this.potManager.addToPot(player, allInAmount);

        this.emit('player:all-in', {
          playerId: player.id,
          amount: allInAmount,
        });
        break;
      }
    }

    player.hasActed = true;
    player.lastAction = action;

    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    await this.promptNextPlayer();
  }

  /**
   * Start a draw phase
   */
  async startDrawPhase() {
    this.drawRequests.clear();

    const drawPhase = this.getDrawPhaseName();

    this.emit('draw:phase:started', {
      phase: drawPhase,
      drawNumber: 4 - this.drawsRemaining,
      pot: this.potManager.getTotalPot(),
    });

    // Collect draw requests from all active players
    for (const player of this.players) {
      if (player.state === PlayerState.ACTIVE) {
        await this.getDrawRequest(player);
      }
    }

    // Process all draws
    await this.processDraws();

    // Move to next betting round
    this.drawsRemaining--;
    this.phase = this.getNextPhase();

    if (this.phase !== GamePhase.SHOWDOWN) {
      await this.startBettingRound();
    } else {
      await this.showdown();
    }
  }

  /**
   * Get draw request from a player
   */
  async getDrawRequest(player) {
    const hand = this.playerHands.get(player.id);
    const gameState = this.getGameState();

    this.emit('player:drawing', {
      playerId: player.id,
      currentHand: hand.length,
    });

    try {
      const drawAction = await Promise.race([
        player.getDrawAction ? player.getDrawAction(gameState) : { cardsToDiscard: 0 },
        this.createTimeout(player.id),
      ]);

      const { cardsToDiscard, discardIndices } = drawAction;

      if (cardsToDiscard === 0) {
        // Standing pat
        this.drawRequests.set(player.id, { standPat: true });
        this.emit('player:stood-pat', { playerId: player.id });
      } else {
        // Validate draw request
        if (cardsToDiscard > DEFAULT_CONFIG.MAX_DISCARD) {
          throw new Error(`Cannot discard more than ${DEFAULT_CONFIG.MAX_DISCARD} cards`);
        }

        this.drawRequests.set(player.id, {
          standPat: false,
          cardsToDiscard,
          discardIndices: discardIndices || this.getDefaultDiscardIndices(cardsToDiscard),
        });

        this.emit('player:drawing:cards', {
          playerId: player.id,
          cardCount: cardsToDiscard,
        });
      }
    } catch (error) {
      // On error or timeout, stand pat
      this.drawRequests.set(player.id, { standPat: true });
      this.emit('player:stood-pat', { playerId: player.id });
    }
  }

  /**
   * Process all draw requests
   */
  async processDraws() {
    for (const [playerId, request] of this.drawRequests) {
      if (!request.standPat) {
        const hand = this.playerHands.get(playerId);
        const { cardsToDiscard, discardIndices } = request;

        // Remove discarded cards
        const discardedCards = [];
        const newHand = [];

        for (let i = 0; i < hand.length; i++) {
          if (discardIndices.includes(i)) {
            discardedCards.push(hand[i]);
            this.discardPile.push(hand[i]);
          } else {
            newHand.push(hand[i]);
          }
        }

        // Draw new cards
        const drawnCards = this.deck.drawMultiple(cardsToDiscard);
        newHand.push(...drawnCards);

        // Update player's hand
        this.playerHands.set(playerId, newHand);

        // Notify player of new cards
        const player = this.players.find((p) => p.id === playerId);
        player.receivePrivateCards(newHand);

        this.emit('player:drew:cards', {
          playerId,
          discarded: cardsToDiscard,
          newCards: drawnCards.length,
        });
      }
    }
  }

  /**
   * Perform showdown
   */
  async showdown() {
    this.phase = GamePhase.SHOWDOWN;

    const activePlayers = this.players.filter((p) => p.state === PlayerState.ACTIVE);

    if (activePlayers.length === 1) {
      // Only one player left, they win
      const winner = activePlayers[0];
      const pot = this.potManager.getTotalPot();
      winner.chips += pot;

      this.emit('hand:ended', {
        winners: [{ playerId: winner.id, amount: pot }],
        showdown: false,
      });
    } else {
      // Multiple players, evaluate hands
      const hands = activePlayers.map((player) => ({
        playerId: player.id,
        cards: this.playerHands.get(player.id),
      }));

      const winners = LowballHandEvaluator.findWinners(hands);
      const pot = this.potManager.getTotalPot();
      const splitAmount = Math.floor(pot / winners.length);

      // Distribute pot
      const winnerPayouts = winners.map((winner) => {
        const player = this.players.find((p) => p.id === winner.playerId);
        player.chips += splitAmount;
        return {
          playerId: winner.playerId,
          amount: splitAmount,
          hand: winner.cards,
          handDescription: LowballHandEvaluator.describeHand(winner.cards),
        };
      });

      this.emit('hand:ended', {
        winners: winnerPayouts,
        showdown: true,
        allHands: hands.map((h) => ({
          playerId: h.playerId,
          cards: h.cards,
          description: LowballHandEvaluator.describeHand(h.cards),
        })),
      });
    }

    this.phase = GamePhase.ENDED;
  }

  /**
   * Check if betting round is complete
   */
  isBettingComplete() {
    const activePlayers = this.players.filter((p) => p.state === PlayerState.ACTIVE);

    if (activePlayers.length <= 1) {
      return true;
    }

    // Check if all active players have acted and matched the current bet
    const currentBet = this.getCurrentBet();

    for (const player of activePlayers) {
      if (!player.hasActed) {
        return false;
      }
      if (player.bet < currentBet && player.state === PlayerState.ACTIVE) {
        return false;
      }
    }

    return true;
  }

  /**
   * End the current betting round
   */
  async endBettingRound() {
    // Reset bets for next round
    this.players.forEach((player) => {
      player.bet = 0;
      player.hasActed = false;
      player.hasOption = false;
    });

    this.emit('betting:round:ended', {
      phase: this.phase,
      pot: this.potManager.getTotalPot(),
    });

    // Determine next phase
    if (this.phase === GamePhase.PRE_DRAW) {
      this.phase = GamePhase.FIRST_DRAW;
      await this.startDrawPhase();
    } else if (this.phase === GamePhase.POST_FIRST_DRAW) {
      this.phase = GamePhase.SECOND_DRAW;
      await this.startDrawPhase();
    } else if (this.phase === GamePhase.POST_SECOND_DRAW) {
      this.phase = GamePhase.THIRD_DRAW;
      await this.startDrawPhase();
    } else if (this.phase === GamePhase.POST_THIRD_DRAW) {
      await this.showdown();
    }
  }

  /**
   * Get current bet to match
   */
  getCurrentBet() {
    return Math.max(...this.players.map((p) => p.bet), 0);
  }

  /**
   * Get valid actions for a player
   */
  getValidActions(player) {
    const actions = [];
    const currentBet = this.getCurrentBet();
    const toCall = currentBet - player.bet;

    // Check if betting should be capped due to raise limit
    const isBettingCapped =
      this.bettingCapped || (this.config.limitBetting && this.raisesInRound >= 4);

    if (toCall === 0) {
      actions.push(Action.CHECK);
      if (!isBettingCapped) {
        actions.push(Action.BET);
      }
    } else {
      actions.push(Action.FOLD);
      if (player.chips >= toCall) {
        actions.push(Action.CALL);
        if (!isBettingCapped) {
          actions.push(Action.RAISE);
        }
      }
    }

    if (player.chips > 0 && !this.config.limitBetting) {
      actions.push(Action.ALL_IN);
    }

    return actions;
  }

  /**
   * Get current game state
   */
  getGameState() {
    return {
      tableId: this.config.tableId,
      phase: this.phase,
      pot: this.potManager.getTotalPot(),
      currentBet: this.getCurrentBet(),
      currentPlayer: this.players[this.currentPlayerIndex]?.id,
      players: Object.fromEntries(
        this.players.map((p) => {
          // Ensure we get a string ID, not an object
          const playerId =
            typeof p.id === 'string'
              ? p.id
              : p.id && typeof p.id === 'object' && p.id.id
                ? p.id.id
                : String(p.id);

          // Use the original p.id for Map lookup (even if it's an object)
          // but use playerId (string) for the key
          return [
            playerId,
            {
              id: playerId,
              hand: this.playerHands.get(p.id) || [],
              chips: p.chips,
              bet: p.bet,
              state: p.state,
              hasActed: p.hasActed,
            },
          ];
        })
      ),
      drawsRemaining: this.drawsRemaining,
      limitBetting: this.config.limitBetting,
      betLimit: this.config.betLimit,
      raisesInRound: this.raisesInRound,
    };
  }

  /**
   * Calculate position information
   */
  calculatePositionInfo() {
    const positions = {};
    const activePlayers = this.players.filter((p) => p.state === PlayerState.ACTIVE);

    activePlayers.forEach((player, index) => {
      if (index === this.dealerButtonIndex) {
        positions[player.id] = 'button';
      } else if (index === (this.dealerButtonIndex + 1) % activePlayers.length) {
        positions[player.id] = activePlayers.length === 2 ? 'big-blind' : 'small-blind';
      } else if (
        index === (this.dealerButtonIndex + 2) % activePlayers.length &&
        activePlayers.length > 2
      ) {
        positions[player.id] = 'big-blind';
      } else {
        positions[player.id] = `position-${index}`;
      }
    });

    return positions;
  }

  /**
   * Get the name of the current draw phase
   */
  getDrawPhaseName() {
    switch (this.drawsRemaining) {
      case 3:
        return 'first-draw';
      case 2:
        return 'second-draw';
      case 1:
        return 'third-draw';
      default:
        return 'unknown-draw';
    }
  }

  /**
   * Get the next phase after current one
   */
  getNextPhase() {
    switch (this.phase) {
      case GamePhase.FIRST_DRAW:
        return GamePhase.POST_FIRST_DRAW;
      case GamePhase.SECOND_DRAW:
        return GamePhase.POST_SECOND_DRAW;
      case GamePhase.THIRD_DRAW:
        return GamePhase.POST_THIRD_DRAW;
      default:
        return GamePhase.SHOWDOWN;
    }
  }

  /**
   * Get default discard indices (discard worst cards)
   */
  getDefaultDiscardIndices(count) {
    // Simple strategy: discard the first N cards
    // In a real implementation, this could be smarter
    const indices = [];
    for (let i = 0; i < count; i++) {
      indices.push(i);
    }
    return indices;
  }

  /**
   * Create timeout promise
   */
  createTimeout(playerId) {
    if (this.simulationMode) {
      return new Promise(() => {}); // Never resolve in simulation mode
    }

    return new Promise((_, reject) => {
      setTimeout(() => {
        this.emit('player:timeout', { playerId });
        reject(new Error('Player action timeout'));
      }, this.config.timeout);
    });
  }
}
