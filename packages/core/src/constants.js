/**
 * Constants used throughout the triple-draw game manager
 */

// Default configuration values
export const DEFAULT_CONFIG = {
  MAX_TABLES: 1000,
  MAX_PLAYERS_PER_TABLE: 6, // Triple draw is typically 6-max
  MIN_PLAYERS_PER_TABLE: 2,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  DEFAULT_SMALL_BLIND: 10,
  DEFAULT_BIG_BLIND: 20,
  DEFAULT_MIN_BUY_IN: 1000,
  DEFAULT_MAX_BUY_IN: 10000,
  TIME_BETWEEN_HANDS: 5000, // 5 seconds
  MAX_DRAWS: 3, // Three draw rounds in triple draw
  CARDS_PER_HAND: 5, // Each player gets 5 cards
  MAX_DISCARD: 5, // Can discard all 5 cards
};

// Poker variants
export const Variants = {
  DEUCE_TO_SEVEN_TRIPLE_DRAW: '2-7-triple-draw',
  DEUCE_TO_SEVEN_SINGLE_DRAW: '2-7-single-draw', // Future support
  BADUGI: 'badugi', // Future support
};

// Card suits
export const Suits = {
  HEARTS: 'h',
  DIAMONDS: 'd',
  CLUBS: 'c',
  SPADES: 's',
};

// Card ranks (for 2-7, Ace is high)
export const Ranks = {
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: 'T',
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  ACE: 'A',
};

// Rank values for lowball comparison (lower is better, Ace is high)
export const RankValues = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14, // Ace is high in 2-7
};

// Betting limits
export const Limits = {
  NO_LIMIT: 'no-limit',
  POT_LIMIT: 'pot-limit',
  FIXED_LIMIT: 'fixed-limit', // Most common for triple draw
};

// Tournament types
export const TournamentTypes = {
  SINGLE_TABLE: 'single-table',
  MULTI_TABLE: 'multi-table',
  SIT_N_GO: 'sit-n-go',
  SCHEDULED: 'scheduled',
};

// Time limits (in milliseconds)
export const TimeLimits = {
  QUICK: 15000, // 15 seconds
  STANDARD: 30000, // 30 seconds
  SLOW: 60000, // 60 seconds
  UNLIMITED: 0, // No time limit
};

// Draw phases mapping
export const DrawPhases = {
  FIRST: 'FIRST_DRAW',
  SECOND: 'SECOND_DRAW',
  THIRD: 'THIRD_DRAW',
};

// Betting rounds in triple draw
export const BettingRounds = {
  PRE_DRAW: 'PRE_DRAW',
  POST_FIRST_DRAW: 'POST_FIRST_DRAW',
  POST_SECOND_DRAW: 'POST_SECOND_DRAW',
  POST_THIRD_DRAW: 'POST_THIRD_DRAW',
};

// Error messages
export const ErrorMessages = {
  INVALID_ACTION: 'Invalid action',
  NOT_YOUR_TURN: 'It is not your turn',
  INSUFFICIENT_CHIPS: 'Insufficient chips',
  TABLE_FULL: 'Table is full',
  GAME_IN_PROGRESS: 'Game already in progress',
  NO_ADAPTER: 'No adapter configured for player',
  TIMEOUT: 'Action timeout',
  INVALID_DRAW: 'Invalid draw request',
  TOO_MANY_CARDS: 'Cannot draw more than 5 cards',
  NOT_DRAW_PHASE: 'Not in a draw phase',
  INVALID_DISCARD: 'Invalid cards to discard',
};

// Best possible hands in 2-7 lowball
export const BestHands = {
  WHEEL: ['7', '5', '4', '3', '2'], // Best possible hand
  NUMBER_TWO: ['8', '6', '4', '3', '2'], // Second best
  NUMBER_THREE: ['8', '6', '5', '3', '2'], // Third best
  NUMBER_FOUR: ['8', '6', '5', '4', '2'], // Fourth best
  NUMBER_FIVE: ['8', '6', '5', '4', '3'], // Fifth best
};

// Hand evaluation constants
export const HandEvaluation = {
  STRAIGHT_CHECK: true, // Straights count against you in 2-7
  FLUSH_CHECK: true, // Flushes count against you in 2-7
  ACE_HIGH: true, // Ace is always high in 2-7
};
