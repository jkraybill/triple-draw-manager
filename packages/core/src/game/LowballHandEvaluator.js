import { LowballRank, Ranks, RankValues } from '../constants.js';

/**
 * Evaluates and compares 2-7 lowball poker hands
 * In 2-7 lowball:
 * - Aces are always high (not low)
 * - Straights and flushes count against you
 * - The best hand is 7-5-4-3-2 (called "the wheel" or "number one")
 * - Lower hands beat higher hands
 */
export class LowballHandEvaluator {
  /**
   * Convert card to our internal format
   * @param {Object|string} card - Card object or string
   * @returns {Object} Card with rank and suit
   */
  static parseCard(card) {
    if (typeof card === 'string') {
      // Parse string format like 'As', '2h', 'Tc'
      const rank = card[0];
      const suit = card[1];
      return { rank, suit };
    }
    return card;
  }

  /**
   * Check if hand contains a flush
   * @param {Array} cards - Array of card objects
   * @returns {boolean} True if flush exists
   */
  static hasFlush(cards) {
    const suits = {};
    for (const card of cards) {
      const parsed = this.parseCard(card);
      suits[parsed.suit] = (suits[parsed.suit] || 0) + 1;
      if (suits[parsed.suit] >= 5) return true;
    }
    return false;
  }

  /**
   * Check if hand contains a straight
   * @param {Array} ranks - Sorted array of rank values
   * @returns {boolean} True if straight exists
   */
  static hasStraight(ranks) {
    if (ranks.length < 5) return false;
    
    // Check for any sequence of 5 consecutive ranks
    for (let i = 0; i <= ranks.length - 5; i++) {
      let isConsecutive = true;
      for (let j = 0; j < 4; j++) {
        if (ranks[i + j + 1] - ranks[i + j] !== 1) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) return true;
    }
    
    // Note: In 2-7, A-2-3-4-5 is a straight (ace high), not a low hand
    // Check for ace-low straight (counts as a straight, which is bad)
    if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && 
        ranks.includes(4) && ranks.includes(5)) {
      return true;
    }
    
    return false;
  }

  /**
   * Count pairs, trips, quads in a hand
   * @param {Array} cards - Array of card objects
   * @returns {Object} Counts of each rank and hand type info
   */
  static countRanks(cards) {
    const rankCounts = {};
    const parsedCards = cards.map(c => this.parseCard(c));
    
    for (const card of parsedCards) {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }
    
    let pairs = 0;
    let trips = 0;
    let quads = 0;
    
    for (const count of Object.values(rankCounts)) {
      if (count === 2) pairs++;
      else if (count === 3) trips++;
      else if (count === 4) quads++;
    }
    
    return { rankCounts, pairs, trips, quads };
  }

  /**
   * Get the lowball rank of a hand
   * @param {Array} cards - Array of card objects
   * @returns {Object} Hand rank and value
   */
  static evaluateHand(cards) {
    if (cards.length !== 5) {
      throw new Error('Hand must contain exactly 5 cards');
    }
    
    const { rankCounts, pairs, trips, quads } = this.countRanks(cards);
    const hasFlush = this.hasFlush(cards);
    
    // Get rank values and sort them
    const rankValues = cards.map(c => {
      const parsed = this.parseCard(c);
      return RankValues[parsed.rank];
    }).sort((a, b) => a - b);
    
    const hasStraight = this.hasStraight(rankValues);
    
    // Determine hand type (remember: worse is higher rank number)
    let handType;
    let handRank;
    
    if (quads > 0) {
      handType = 'four-of-a-kind';
      handRank = LowballRank.FOUR_OF_A_KIND;
    } else if (trips > 0 && pairs > 0) {
      handType = 'full-house';
      handRank = LowballRank.FULL_HOUSE;
    } else if (hasFlush && hasStraight) {
      handType = 'straight-flush';
      handRank = LowballRank.STRAIGHT_FLUSH;
    } else if (hasFlush) {
      handType = 'flush';
      handRank = LowballRank.FLUSH;
    } else if (hasStraight) {
      handType = 'straight';
      handRank = LowballRank.STRAIGHT;
    } else if (trips > 0) {
      handType = 'three-of-a-kind';
      handRank = LowballRank.THREE_OF_A_KIND;
    } else if (pairs >= 2) {
      handType = 'two-pair';
      handRank = LowballRank.TWO_PAIR;
    } else if (pairs === 1) {
      handType = 'pair';
      handRank = LowballRank.PAIR;
    } else {
      // No pair - determine which low hand it is
      const highCard = rankValues[4]; // Highest card determines the low type
      
      if (highCard === 7 && rankValues.join(',') === '2,3,4,5,7') {
        handType = 'wheel';
        handRank = LowballRank.WHEEL;
      } else if (highCard === 8) {
        handType = 'eight-low';
        handRank = LowballRank.EIGHT_LOW;
      } else if (highCard === 9) {
        handType = 'nine-low';
        handRank = LowballRank.NINE_LOW;
      } else if (highCard === 10) {
        handType = 'ten-low';
        handRank = LowballRank.TEN_LOW;
      } else if (highCard === 11) {
        handType = 'jack-low';
        handRank = LowballRank.JACK_LOW;
      } else if (highCard === 12) {
        handType = 'queen-low';
        handRank = LowballRank.QUEEN_LOW;
      } else if (highCard === 13) {
        handType = 'king-low';
        handRank = LowballRank.KING_LOW;
      } else {
        handType = 'ace-low';
        handRank = LowballRank.ACE_LOW;
      }
    }
    
    return {
      rank: handRank,
      type: handType,
      values: rankValues,
      cards: cards.map(c => this.parseCard(c))
    };
  }

  /**
   * Compare two hands to determine winner
   * @param {Array} hand1 - First hand
   * @param {Array} hand2 - Second hand
   * @returns {number} -1 if hand1 wins, 1 if hand2 wins, 0 if tie
   */
  static compare(hand1, hand2) {
    const eval1 = this.evaluateHand(hand1);
    const eval2 = this.evaluateHand(hand2);
    
    // Lower rank number is better in lowball
    if (eval1.rank !== eval2.rank) {
      return eval1.rank < eval2.rank ? -1 : 1;
    }
    
    // Same hand type, compare card by card from highest to lowest
    // In lowball, we want lower cards
    for (let i = 4; i >= 0; i--) {
      if (eval1.values[i] !== eval2.values[i]) {
        return eval1.values[i] < eval2.values[i] ? -1 : 1;
      }
    }
    
    return 0; // Exact tie
  }

  /**
   * Find the best hand(s) from multiple hands
   * @param {Array} hands - Array of hands with player info
   * @returns {Array} Array of winning hand(s) with player info
   */
  static findWinners(hands) {
    if (!hands || hands.length === 0) {
      return [];
    }
    
    // Evaluate all hands
    const evaluatedHands = hands.map(handInfo => ({
      ...handInfo,
      evaluation: this.evaluateHand(handInfo.cards)
    }));
    
    // Sort by hand strength (remember: lower rank is better)
    evaluatedHands.sort((a, b) => {
      const comparison = this.compare(a.cards, b.cards);
      return comparison;
    });
    
    // Find all hands that tie with the best hand
    const winners = [];
    const bestHand = evaluatedHands[0];
    
    for (const hand of evaluatedHands) {
      if (this.compare(bestHand.cards, hand.cards) === 0) {
        winners.push(hand);
      } else {
        break; // No more ties
      }
    }
    
    return winners;
  }

  /**
   * Get a readable description of a hand
   * @param {Array} cards - Hand to describe
   * @returns {string} Human-readable description
   */
  static describeHand(cards) {
    const evaluation = this.evaluateHand(cards);
    const cardStrings = evaluation.values.map(v => {
      for (const [rank, value] of Object.entries(RankValues)) {
        if (value === v) return rank;
      }
    }).reverse().join('-');
    
    switch (evaluation.type) {
      case 'wheel':
        return `7-5-4-3-2 (the wheel)`;
      case 'eight-low':
      case 'nine-low':
      case 'ten-low':
      case 'jack-low':
      case 'queen-low':
      case 'king-low':
      case 'ace-low':
        return `${cardStrings}`;
      case 'pair':
        return `Pair (${cardStrings})`;
      case 'two-pair':
        return `Two pair (${cardStrings})`;
      case 'three-of-a-kind':
        return `Three of a kind (${cardStrings})`;
      case 'straight':
        return `Straight (${cardStrings})`;
      case 'flush':
        return `Flush (${cardStrings})`;
      case 'full-house':
        return `Full house`;
      case 'four-of-a-kind':
        return `Four of a kind`;
      case 'straight-flush':
        return `Straight flush`;
      default:
        return cardStrings;
    }
  }
}