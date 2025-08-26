import { describe, it, expect } from 'vitest';
import { LowballHandEvaluator } from '../packages/core/src/game/LowballHandEvaluator.js';

describe('LowballHandEvaluator', () => {
  describe('Hand Evaluation', () => {
    it('should identify the wheel (7-5-4-3-2) as the best hand', () => {
      const hand = ['7h', '5d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('wheel');
      expect(result.rank).toBe(1); // Best possible rank
    });
    
    it('should identify eight-low hands', () => {
      const hand = ['8h', '6d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('eight-low');
      expect(result.rank).toBe(2);
    });
    
    it('should identify pairs as worse than no-pair hands', () => {
      const hand = ['7h', '7d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('pair');
      expect(result.rank).toBe(9);
    });
    
    it('should identify straights as bad hands', () => {
      const hand = ['6h', '5d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
      expect(result.rank).toBe(12);
    });
    
    it('should identify flushes as bad hands', () => {
      const hand = ['9h', '7h', '5h', '3h', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('flush');
      expect(result.rank).toBe(13);
    });
    
    it('should treat aces as high cards', () => {
      const hand = ['Ah', '6d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('ace-low');
      expect(result.rank).toBe(8);
      expect(result.values[4]).toBe(14); // Ace value is 14 (high)
    });
    
    it('should identify A-2-3-4-5 as a straight (not a low hand)', () => {
      const hand = ['Ah', '5d', '4c', '3s', '2h'];
      const result = LowballHandEvaluator.evaluateHand(hand);
      
      expect(result.type).toBe('straight');
      expect(result.rank).toBe(12);
    });
  });
  
  describe('Hand Comparison', () => {
    it('should rank wheel better than any eight-low', () => {
      const wheel = ['7h', '5d', '4c', '3s', '2h'];
      const eightLow = ['8h', '6d', '4c', '3s', '2h'];
      
      const comparison = LowballHandEvaluator.compare(wheel, eightLow);
      expect(comparison).toBe(-1); // wheel wins
    });
    
    it('should rank 8-6-4-3-2 better than 8-7-4-3-2', () => {
      const hand1 = ['8h', '6d', '4c', '3s', '2h'];
      const hand2 = ['8h', '7d', '4c', '3s', '2h'];
      
      const comparison = LowballHandEvaluator.compare(hand1, hand2);
      expect(comparison).toBe(-1); // hand1 wins (lower second card)
    });
    
    it('should rank no-pair hands better than pairs', () => {
      const noPair = ['Kh', 'Qd', 'Jc', '9s', '8h']; // Terrible no-pair
      const pair = ['7h', '7d', '4c', '3s', '2h']; // Good pair
      
      const comparison = LowballHandEvaluator.compare(noPair, pair);
      expect(comparison).toBe(-1); // no-pair wins
    });
    
    it('should identify exact ties', () => {
      const hand1 = ['7h', '5d', '4c', '3s', '2h'];
      const hand2 = ['7c', '5s', '4h', '3d', '2c'];
      
      const comparison = LowballHandEvaluator.compare(hand1, hand2);
      expect(comparison).toBe(0); // tie
    });
  });
  
  describe('Find Winners', () => {
    it('should find single winner', () => {
      const hands = [
        { playerId: 'p1', cards: ['7h', '5d', '4c', '3s', '2h'] }, // Wheel
        { playerId: 'p2', cards: ['8h', '6d', '4c', '3s', '2h'] }, // Eight-low
        { playerId: 'p3', cards: ['9h', '7d', '5c', '3s', '2h'] }, // Nine-low
      ];
      
      const winners = LowballHandEvaluator.findWinners(hands);
      
      expect(winners).toHaveLength(1);
      expect(winners[0].playerId).toBe('p1');
    });
    
    it('should find multiple winners in case of tie', () => {
      const hands = [
        { playerId: 'p1', cards: ['7h', '5d', '4c', '3s', '2h'] }, // Wheel
        { playerId: 'p2', cards: ['7c', '5s', '4h', '3d', '2c'] }, // Also wheel
        { playerId: 'p3', cards: ['8h', '6d', '4c', '3s', '2h'] }, // Eight-low
      ];
      
      const winners = LowballHandEvaluator.findWinners(hands);
      
      expect(winners).toHaveLength(2);
      expect(winners.map(w => w.playerId)).toContain('p1');
      expect(winners.map(w => w.playerId)).toContain('p2');
    });
  });
  
  describe('Hand Description', () => {
    it('should describe the wheel correctly', () => {
      const hand = ['7h', '5d', '4c', '3s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('7-5-4-3-2 (the wheel)');
    });
    
    it('should describe eight-low correctly', () => {
      const hand = ['8h', '6d', '4c', '3s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toBe('8-6-4-3-2');
    });
    
    it('should describe pairs correctly', () => {
      const hand = ['7h', '7d', '4c', '3s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toContain('Pair');
    });
    
    it('should describe straights correctly', () => {
      const hand = ['6h', '5d', '4c', '3s', '2h'];
      const description = LowballHandEvaluator.describeHand(hand);
      
      expect(description).toContain('Straight');
    });
  });
});