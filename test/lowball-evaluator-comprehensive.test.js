import { describe, it, expect } from 'vitest';
import { LowballHandEvaluator } from '../packages/core/src/game/LowballHandEvaluator.js';

describe('LowballHandEvaluator - Comprehensive Coverage', () => {
  describe('All Low Hand Types', () => {
    it('should identify nine-low hands', () => {
      const hand = ['9h', '7d', '5c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('nine-low');
      expect(result.rank).toBe(3);
    });
    
    it('should identify ten-low hands', () => {
      const hand = ['Th', '8d', '6c', '4s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('ten-low');
      expect(result.rank).toBe(4);
    });
    
    it('should identify jack-low hands', () => {
      const hand = ['Jh', '9d', '7c', '5s', '3h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('jack-low');
      expect(result.rank).toBe(5);
    });
    
    it('should identify queen-low hands', () => {
      const hand = ['Qh', 'Td', '8c', '6s', '4h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('queen-low');
      expect(result.rank).toBe(6);
    });
    
    it('should identify king-low hands', () => {
      const hand = ['Kh', 'Jd', '9c', '7s', '5h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('king-low');
      expect(result.rank).toBe(7);
    });
  });
  
  describe('Complex Hand Types', () => {
    it('should identify two pair', () => {
      const hand = ['7h', '7d', '4c', '4s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('two-pair');
      expect(result.rank).toBe(10);
    });
    
    it('should identify three of a kind', () => {
      const hand = ['5h', '5d', '5c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('three-of-a-kind');
      expect(result.rank).toBe(11);
    });
    
    it('should identify full house', () => {
      const hand = ['4h', '4d', '4c', '3s', '3h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('full-house');
      expect(result.rank).toBe(14);
    });
    
    it('should identify four of a kind', () => {
      const hand = ['6h', '6d', '6c', '6s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('four-of-a-kind');
      expect(result.rank).toBe(15);
    });
    
    it('should identify straight flush', () => {
      const hand = ['6h', '5h', '4h', '3h', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight-flush');
      expect(result.rank).toBe(16);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle high straights correctly', () => {
      const hand = ['Ah', 'Kd', 'Qc', 'Js', 'Th'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
      expect(result.rank).toBe(12);
    });
    
    it('should handle middle straights correctly', () => {
      const hand = ['9h', '8d', '7c', '6s', '5h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
      expect(result.rank).toBe(12);
    });
    
    it('should reject hands with wrong number of cards', () => {
      expect(() => {
        LowballHandEvaluator.evaluateHand(['7h', '5d', '4c', '3s']);
      }).toThrow('Hand must contain exactly 5 cards');
      
      expect(() => {
        LowballHandEvaluator.evaluateHand(['7h', '5d', '4c', '3s', '2h', 'Ah']);
      }).toThrow('Hand must contain exactly 5 cards');
    });
    
    it('should handle card objects instead of strings', () => {
      const hand = [
        { rank: '7', suit: 'h', toString: () => '7h' },
        { rank: '5', suit: 'd', toString: () => '5d' },
        { rank: '4', suit: 'c', toString: () => '4c' },
        { rank: '3', suit: 's', toString: () => '3s' },
        { rank: '2', suit: 'h', toString: () => '2h' }
      ];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('wheel');
      expect(result.rank).toBe(1);
    });
  });
  
  describe('Famous 2-7 Hands', () => {
    it('should identify "Number Two" (8-6-4-3-2)', () => {
      const hand = ['8h', '6d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('eight-low');
      expect(result.values).toEqual([2, 3, 4, 6, 8]);
    });
    
    it('should identify "Number Three" (8-6-5-3-2)', () => {
      const hand = ['8h', '6d', '5c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('eight-low');
      expect(result.values).toEqual([2, 3, 5, 6, 8]);
    });
    
    it('should identify "Number Four" (8-6-5-4-2)', () => {
      const hand = ['8h', '6d', '5c', '4s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('eight-low');
      expect(result.values).toEqual([2, 4, 5, 6, 8]);
    });
    
    it('should identify "Number Five" (8-6-5-4-3)', () => {
      const hand = ['8h', '6d', '5c', '4s', '3h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('eight-low');
      expect(result.values).toEqual([3, 4, 5, 6, 8]);
    });
  });
  
  describe('Comparison Edge Cases', () => {
    it('should compare different eight-lows correctly', () => {
      const better = ['8h', '6d', '4c', '3s', '2h']; // 8-6-4-3-2
      const worse = ['8h', '7d', '6c', '5s', '4h'];  // 8-7-6-5-4
      
      const comparison = LowballHandEvaluator.compare(better, worse);
      expect(comparison).toBe(-1); // better wins
    });
    
    it('should compare nine-low vs straight (8-7-6-5-4)', () => {
      const nineLow = ['9h', '5d', '4c', '3s', '2h'];  // 9-5-4-3-2 
      const straight = ['8h', '7d', '6c', '5s', '4h']; // 8-7-6-5-4 is a straight!
      
      // Straight is bad in lowball, so nine-low wins
      const comparison = LowballHandEvaluator.compare(nineLow, straight);
      expect(comparison).toBe(-1); // nineLow wins because straight is bad
    });
    
    it('should compare actual nine-low vs eight-low', () => {
      const nineLow = ['9h', '6d', '4c', '3s', '2h'];  // 9-6-4-3-2 (nine-low)
      const eightLow = ['8h', '6d', '5c', '3s', '2h']; // 8-6-5-3-2 (eight-low)
      
      // Eight-low beats nine-low
      const comparison = LowballHandEvaluator.compare(nineLow, eightLow);
      expect(comparison).toBe(1); // nineLow loses to eightLow
    });
    
    it('should compare pairs with different ranks', () => {
      const lowerPair = ['3h', '3d', '7c', '5s', '2h'];
      const higherPair = ['Kh', 'Kd', '4c', '3s', '2h'];
      
      const comparison = LowballHandEvaluator.compare(lowerPair, higherPair);
      expect(comparison).toBe(-1); // lower pair wins in lowball
    });
    
    it('should compare two pair hands correctly', () => {
      const hand1 = ['3h', '3d', '2c', '2s', '7h'];
      const hand2 = ['Kh', 'Kd', 'Qc', 'Qs', '2h'];
      
      const comparison = LowballHandEvaluator.compare(hand1, hand2);
      expect(comparison).toBe(-1); // lower two pair wins
    });
  });
  
  describe('Hand Description Edge Cases', () => {
    it('should describe nine-low correctly', () => {
      const hand = ['9h', '7d', '5c', '3s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('9-7-5-3-2');
    });
    
    it('should describe ten-low correctly', () => {
      const hand = ['Th', '8d', '6c', '4s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('T-8-6-4-2');
    });
    
    it('should describe two pair correctly', () => {
      const hand = ['7h', '7d', '4c', '4s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toContain('Two pair');
    });
    
    it('should describe three of a kind correctly', () => {
      const hand = ['5h', '5d', '5c', '3s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toContain('Three of a kind');
    });
    
    it('should describe full house correctly', () => {
      const hand = ['4h', '4d', '4c', '3s', '3h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('Full house');
    });
    
    it('should describe four of a kind correctly', () => {
      const hand = ['6h', '6d', '6c', '6s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('Four of a kind');
    });
    
    it('should describe straight flush correctly', () => {
      const hand = ['6h', '5h', '4h', '3h', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('Straight flush');
    });
    
    it('should describe ace-low correctly', () => {
      const hand = ['Ah', '9d', '7c', '5s', '3h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('A-9-7-5-3');
    });
    
    it('should describe king-low correctly', () => {
      const hand = ['Kh', 'Jd', '9c', '7s', '5h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('K-J-9-7-5');
    });
  });
  
  describe('FindWinners Edge Cases', () => {
    it('should handle empty hands array', () => {
      const winners = LowballHandEvaluator.findWinners([]);
      expect(winners).toEqual([]);
    });
    
    it('should handle null hands array', () => {
      const winners = LowballHandEvaluator.findWinners(null);
      expect(winners).toEqual([]);
    });
    
    it('should handle single hand', () => {
      const hands = [
        { playerId: 'p1', cards: ['9h', '7d', '5c', '3s', '2h'] }
      ];
      
      const winners = LowballHandEvaluator.findWinners(hands);
      expect(winners).toHaveLength(1);
      expect(winners[0].playerId).toBe('p1');
    });
    
    it('should find winner among many different hand types', () => {
      const hands = [
        { playerId: 'p1', cards: ['7h', '5d', '4c', '3s', '2h'] }, // Wheel
        { playerId: 'p2', cards: ['Ah', 'Kd', 'Qc', 'Js', 'Th'] }, // Straight
        { playerId: 'p3', cards: ['9h', '9d', '4c', '3s', '2h'] }, // Pair
        { playerId: 'p4', cards: ['8h', '6d', '4c', '3s', '2h'] }, // Eight-low
        { playerId: 'p5', cards: ['6h', '5h', '4h', '3h', '2h'] }, // Straight flush
        { playerId: 'p6', cards: ['Th', '8d', '6c', '4s', '2h'] }, // Ten-low
      ];
      
      const winners = LowballHandEvaluator.findWinners(hands);
      
      expect(winners).toHaveLength(1);
      expect(winners[0].playerId).toBe('p1'); // Wheel wins
    });
    
    it('should handle three-way tie', () => {
      const hands = [
        { playerId: 'p1', cards: ['9h', '7d', '5c', '3s', '2h'] },
        { playerId: 'p2', cards: ['9c', '7s', '5h', '3d', '2c'] },
        { playerId: 'p3', cards: ['9s', '7h', '5d', '3c', '2s'] },
      ];
      
      const winners = LowballHandEvaluator.findWinners(hands);
      
      expect(winners).toHaveLength(3);
      expect(winners.map(w => w.playerId)).toContain('p1');
      expect(winners.map(w => w.playerId)).toContain('p2');
      expect(winners.map(w => w.playerId)).toContain('p3');
    });
  });
  
  describe('Straight Detection Edge Cases', () => {
    it('should detect T-9-8-7-6 straight', () => {
      const hand = ['Th', '9d', '8c', '7s', '6h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
    });
    
    it('should detect J-T-9-8-7 straight', () => {
      const hand = ['Jh', 'Td', '9c', '8s', '7h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
    });
    
    it('should detect Q-J-T-9-8 straight', () => {
      const hand = ['Qh', 'Jd', 'Tc', '9s', '8h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
    });
    
    it('should detect K-Q-J-T-9 straight', () => {
      const hand = ['Kh', 'Qd', 'Jc', 'Ts', '9h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
    });
    
    it('should not detect near-straights', () => {
      const hand = ['8h', '7d', '6c', '4s', '3h']; // Missing 5
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('eight-low');
      expect(result.rank).toBe(2);
    });
  });
  
  describe('Flush Detection Edge Cases', () => {
    it('should detect flushes of all suits', () => {
      const hearts = ['Ah', '9h', '7h', '5h', '3h'];
      const diamonds = ['Ad', '9d', '7d', '5d', '3d'];
      const clubs = ['Ac', '9c', '7c', '5c', '3c'];
      const spades = ['As', '9s', '7s', '5s', '3s'];
      
      expect(LowballHandEvaluator.evaluateHand(hearts).type).toBe('flush');
      expect(LowballHandEvaluator.evaluateHand(diamonds).type).toBe('flush');
      expect(LowballHandEvaluator.evaluateHand(clubs).type).toBe('flush');
      expect(LowballHandEvaluator.evaluateHand(spades).type).toBe('flush');
    });
    
    it('should not detect non-flushes', () => {
      const hand = ['Ah', '9d', '7c', '5s', '3h']; // Mixed suits
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('ace-low');
    });
  });
});