# Testing Guidelines - Triple Draw Manager

## Critical Lessons from getTotalPot() Bug

### The Bug
- **Issue**: TripleDrawGameEngine called `this.potManager.getTotalPot()` 
- **Reality**: PotManager only had `getTotal()` method
- **Impact**: Complete gameplay blockage - 7 call sites affected
- **Root Cause**: No integration tests between components

### Why Our Tests Missed It
1. **Isolated Component Testing**: Only tested LowballEvaluator in isolation
2. **Missing Integration Tests**: No tests exercising GameEngine ↔ PotManager interaction  
3. **No Interface Contract Testing**: No verification that dependent components have matching APIs
4. **Missing End-to-End Scenarios**: No full game flow tests

## Testing Strategy Requirements

### 1. Integration Tests are Mandatory
```javascript
// ✅ GOOD: Test component interactions
describe('GameEngine Integration', () => {
  it('should interact correctly with PotManager', async () => {
    await gameEngine.start();
    const gameState = gameEngine.getGameState(); // This calls PotManager methods
    expect(gameState.pot).toBeDefined();
  });
});
```

### 2. Interface Contract Testing
```javascript
// ✅ GOOD: Verify interfaces match expectations
describe('Component Interfaces', () => {
  it('should have expected PotManager methods', () => {
    const potManager = new PotManager(players);
    expect(typeof potManager.getTotalPot).toBe('function');
  });
});
```

### 3. Test-Driven Development (TDD) for Fixes
When fixing bugs:
1. **Write failing test first** that exposes the bug
2. **Implement minimal fix** to make test pass  
3. **Add comprehensive tests** to prevent regression
4. **Document the interface contract**

### 4. Component Interaction Patterns

#### Before Making Interface Changes
- [ ] Search for all callers: `grep -r "methodName" src/`
- [ ] Check for existing tests that use the method
- [ ] Plan integration tests for the change

#### When Adding New Component Dependencies
- [ ] Write integration test first
- [ ] Test the interface contract
- [ ] Verify error conditions

### 5. Required Test Types

#### Unit Tests
- Test individual component methods
- Mock external dependencies
- Focus on business logic

#### Integration Tests  
- Test component interactions
- Use real instances (minimal mocking)
- Test actual data flow

#### Interface Contract Tests
- Verify method existence and signatures
- Test return types match expectations
- Ensure consistent naming across components

#### Regression Prevention Tests
- Test specific bugs that occurred
- Document what the bug was
- Ensure old behavior would fail

### 6. Test File Organization

```
test/
├── lowball-evaluator.test.js          # Unit tests
├── pot-manager.test.js                # Unit tests  
├── triple-draw-integration.test.js    # Integration tests
└── interface-contracts.test.js        # Interface verification
```

### 7. Pre-Commit Checklist

Before committing changes that modify component interfaces:
- [ ] All existing tests pass
- [ ] New integration tests cover the change
- [ ] Interface contracts are tested
- [ ] No grep results for old method names remain
- [ ] Documentation reflects new interface

## Examples of Interface Bugs to Prevent

### Method Name Mismatches
```javascript
// ❌ BAD: Assuming method names without verification
gameEngine.getTotal() // Assumes PotManager has getTotal()

// ✅ GOOD: Test interface contracts
expect(typeof potManager.getTotalPot).toBe('function');
```

### Parameter Mismatches
```javascript
// ❌ BAD: Calling with wrong parameters
potManager.addToPot(100, player); // Wrong parameter order

// ✅ GOOD: Integration test with real calls
potManager.addToPot(player, 100); // Correct order
expect(potManager.getTotalPot()).toBe(100);
```

### Return Type Assumptions
```javascript
// ❌ BAD: Assuming return type
const total = potManager.getTotalPot();
total.amount; // Assumes object, but returns number

// ✅ GOOD: Test return types
expect(typeof potManager.getTotalPot()).toBe('number');
```

## Command Quick Reference

```bash
# Run all tests before committing
npm test

# Run specific integration tests  
npm test -- integration

# Search for method usage across codebase
grep -r "methodName" packages/core/src/

# Verify no old method names remain
grep -r "getTotal" packages/core/src/
```

## Success Metrics

A robust test suite should:
- ✅ **78+ tests passing** (current baseline)
- ✅ **Integration tests covering all component pairs**
- ✅ **Interface contract tests for all public APIs**
- ✅ **Regression tests for critical bugs**
- ✅ **No method name mismatches possible**

## Remember

> **"The best response to test failures is rarely reducing test scope or duration -- fix the underlying issues!"** - JK

Integration tests are not optional - they're essential for preventing interface bugs that can completely break functionality.