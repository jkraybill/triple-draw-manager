/**
 * Core type definitions for the triple-draw game manager
 */

export const TableState = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
};

export const PlayerState = {
  WAITING: 'WAITING',
  ACTIVE: 'ACTIVE',
  FOLDED: 'FOLDED',
  ALL_IN: 'ALL_IN',
  SITTING_OUT: 'SITTING_OUT',
  DISCONNECTED: 'DISCONNECTED',
};

export const GamePhase = {
  WAITING: 'WAITING',
  PRE_DRAW: 'PRE_DRAW', // Initial betting round before first draw
  FIRST_DRAW: 'FIRST_DRAW', // First draw phase
  POST_FIRST_DRAW: 'POST_FIRST_DRAW', // Betting after first draw
  SECOND_DRAW: 'SECOND_DRAW', // Second draw phase
  POST_SECOND_DRAW: 'POST_SECOND_DRAW', // Betting after second draw
  THIRD_DRAW: 'THIRD_DRAW', // Third and final draw phase
  POST_THIRD_DRAW: 'POST_THIRD_DRAW', // Final betting round
  SHOWDOWN: 'SHOWDOWN',
  ENDED: 'ENDED',
};

export const Action = {
  CHECK: 'CHECK',
  BET: 'BET',
  CALL: 'CALL',
  RAISE: 'RAISE',
  FOLD: 'FOLD',
  ALL_IN: 'ALL_IN',
  DRAW: 'DRAW', // New action for drawing cards
  STAND_PAT: 'STAND_PAT', // Choose to draw zero cards
};

// Lowball hand rankings (reversed - lower is better)
export const LowballRank = {
  WHEEL: 1, // 7-5-4-3-2 (best hand in 2-7)
  EIGHT_LOW: 2, // 8-x-x-x-x with no pair
  NINE_LOW: 3, // 9-x-x-x-x with no pair
  TEN_LOW: 4, // 10-x-x-x-x with no pair
  JACK_LOW: 5, // J-x-x-x-x with no pair
  QUEEN_LOW: 6, // Q-x-x-x-x with no pair
  KING_LOW: 7, // K-x-x-x-x with no pair
  ACE_LOW: 8, // A-x-x-x-x with no pair (Ace is high in 2-7)
  PAIR: 9,
  TWO_PAIR: 10,
  THREE_OF_A_KIND: 11,
  STRAIGHT: 12, // Straights count against you in 2-7
  FLUSH: 13, // Flushes count against you in 2-7
  FULL_HOUSE: 14,
  FOUR_OF_A_KIND: 15,
  STRAIGHT_FLUSH: 16, // Worst possible hand
};

/**
 * @typedef {Object} DrawAction
 * @property {string} playerId - The player making the draw
 * @property {number} cardsToDiscard - Number of cards to discard (0-5)
 * @property {number[]} [discardIndices] - Indices of cards to discard
 */

/**
 * @typedef {Object} PlayerAction
 * @property {string} playerId - The player making the action
 * @property {Action} action - The action type
 * @property {number} [amount] - The amount (for bet/raise)
 * @property {DrawAction} [drawInfo] - Draw information (for draw action)
 * @property {number} timestamp - When the action was made
 */

/**
 * @typedef {Object} GameState
 * @property {string} tableId - The table ID
 * @property {GamePhase} phase - Current game phase
 * @property {number} pot - Current pot size
 * @property {number} currentBet - Current bet to match
 * @property {string} currentPlayer - ID of player to act
 * @property {Object.<string, PlayerGameState>} players - Player states
 * @property {PlayerAction[]} actionHistory - History of actions
 * @property {number} drawsRemaining - Number of draws remaining (0-3)
 * @property {Object.<string, number>} drawCounts - Cards drawn per player in current draw
 */

/**
 * @typedef {Object} PlayerGameState
 * @property {string} id - Player ID
 * @property {string[]} hand - Player's current hand (5 cards)
 * @property {number} chips - Current chip count
 * @property {number} bet - Current bet in this round
 * @property {PlayerState} state - Player's state
 * @property {boolean} hasActed - Whether player has acted this round
 * @property {boolean} standingPat - Whether player stood pat on last draw
 */

/**
 * @typedef {Object} TableConfig
 * @property {string} [id] - Table ID
 * @property {string} [variant='2-7-triple-draw'] - Poker variant
 * @property {number} [maxPlayers=6] - Maximum players (typically 6 for triple draw)
 * @property {number} [minPlayers=2] - Minimum players to start
 * @property {Object} [blinds] - Blind structure
 * @property {number} [blinds.small=10] - Small blind
 * @property {number} [blinds.big=20] - Big blind
 * @property {number} [timeout=30000] - Action timeout in ms
 * @property {boolean} [limitBetting=true] - Use limit betting structure
 * @property {number} [betLimit] - Fixed bet limit (if limitBetting is true)
 */

/**
 * @typedef {Object} GameResult
 * @property {string[]} winners - Array of winner IDs
 * @property {Object.<string, number>} payouts - Payout amounts by player ID
 * @property {Object.<string, number>} finalChips - Final chip counts
 * @property {Object.<string, string[]>} showdownHands - Revealed hands
 * @property {Object.<string, LowballRank>} handRanks - Hand rankings
 */

/**
 * @typedef {Object} DrawResult
 * @property {string} playerId - Player who drew
 * @property {number} cardsDiscarded - Number of cards discarded
 * @property {string[]} newCards - New cards received
 */
