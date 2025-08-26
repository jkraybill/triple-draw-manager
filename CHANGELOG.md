# Changelog

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