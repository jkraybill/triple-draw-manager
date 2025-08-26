# Changelog

## [1.1.4] - 2025-01-26

### Fixed
- Fixed critical allowNegativeChips flag not working properly
  - Players can now correctly go negative when `allowNegativeChips: true`
  - Maintains perfect chip conservation (zero-sum) in simulations
  - Directly manipulates chip values to bypass validation when needed
  - Fixed blind posting and call actions to respect the flag

### Added
- Comprehensive tests for negative chip scenarios (3 new tests)
- Validation of chip conservation in long-running simulations

### Impact
- This fix is critical for accurate position analysis in simulations
- Prevents phantom chip creation that was invalidating statistical analysis
- Ensures true zero-sum poker economics

## [1.1.3] - 2025-01-26

### Fixed
- Fixed critical gameState.players structure bug
  - Players object keys were showing as `[object Object]` when Player.id was incorrectly an object
  - Now properly extracts string ID even if Player.id is mistakenly set to an object
  - Ensures gameState.players uses proper player ID strings as keys
  - This bug was preventing strategies from accessing player data correctly

### Added
- Defensive coding to handle malformed Player.id values
- Tests to prevent regression of this issue (5 new tests)

### Improved
- More robust ID extraction in getGameState method
- Better handling of edge cases in player initialization

## [1.1.2] - 2025-01-26

### Fixed
- Fixed critical PotManager method name mismatch in TripleDrawGameEngine
  - Renamed `getTotal()` to `getTotalPot()` in PotManager to match usage
  - Affects 7 locations where pot totals are retrieved
  - This bug was preventing betting rounds from starting

### Added
- Comprehensive integration test suite (17 new tests)
- PotManager unit tests (9 tests)
- TripleDrawGameEngine integration tests (8 tests)
- Testing guidelines documentation to prevent future interface mismatches
- Better TDD practices with failing tests first approach

### Improved
- Total test coverage increased from 61 to 78 tests
- Added interface contract testing between components
- Established integration testing patterns

## [1.1.1] - 2025-01-26

### Fixed
- Fixed critical PotManager method mismatch in TripleDrawGameEngine
  - Replaced non-existent `addBet()` calls with correct `addToPot()` method
  - Fixed 5 occurrences affecting blinds, calls, raises, and all-in actions
  - This bug was preventing all gameplay functionality

## [1.1.0] - 2025-01-26

### Added
- Added `fixedPositions` option for deterministic player positioning
- Added `allowNegativeChips` option for simulation and testing scenarios

## [1.0.0] - Previous Release

### Features
- Initial release of 2-7 Triple Draw Lowball engine
- Complete game state management
- Comprehensive lowball hand evaluation
- Three draw rounds with betting
- Event-driven architecture