import { Table } from '../packages/core/src/index.js';
import { SimpleBot } from './SimpleBot.js';

/**
 * Example of a simple triple-draw game
 */
async function runSimpleGame() {
  console.log('Starting 2-7 Triple Draw Game Demo\n');
  console.log('=' .repeat(50));
  
  // Create a table
  const table = new Table({
    id: 'table-1',
    variant: '2-7-triple-draw',
    maxPlayers: 6,
    minPlayers: 2,
    blinds: {
      small: 10,
      big: 20,
    },
    limitBetting: true,
    betLimit: 20, // Fixed limit betting
    simulationMode: true, // Fast execution for demo
  });
  
  // Create bot players with different strategies
  const bots = [
    new SimpleBot({ id: 'bot-1', name: 'TightTim', chips: 1000, strategy: 'tight' }),
    new SimpleBot({ id: 'bot-2', name: 'LooseLucy', chips: 1000, strategy: 'loose' }),
    new SimpleBot({ id: 'bot-3', name: 'AggroAlex', chips: 1000, strategy: 'aggressive' }),
    new SimpleBot({ id: 'bot-4', name: 'StandardSam', chips: 1000, strategy: 'tight' }),
  ];
  
  // Add event listeners for game events
  table.on('player:joined', ({ playerId, chipCount }) => {
    console.log(`${playerId} joined the table with ${chipCount} chips`);
  });
  
  table.on('game:started', ({ gameNumber, players }) => {
    console.log(`\n--- Hand #${gameNumber} Started ---`);
    console.log(`Players: ${players.join(', ')}`);
  });
  
  table.on('blind:posted', ({ playerId, amount, type }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} posts ${type} blind: ${amount}`);
  });
  
  table.on('betting:round:started', ({ phase, pot }) => {
    console.log(`\n[${phase}] Betting round started. Pot: ${pot}`);
  });
  
  table.on('player:bet', ({ playerId, amount }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} bets ${amount}`);
  });
  
  table.on('player:raised', ({ playerId, amount, totalBet }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} raises ${amount} (total: ${totalBet})`);
  });
  
  table.on('player:called', ({ playerId, amount }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} calls ${amount}`);
  });
  
  table.on('player:folded', ({ playerId }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} folds`);
  });
  
  table.on('draw:phase:started', ({ phase, drawNumber }) => {
    console.log(`\n[Draw #${drawNumber}] Players drawing cards...`);
  });
  
  table.on('player:stood-pat', ({ playerId }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} stands pat`);
  });
  
  table.on('player:drew:cards', ({ playerId, discarded }) => {
    const player = bots.find(b => b.id === playerId);
    console.log(`${player?.name || playerId} draws ${discarded} card${discarded !== 1 ? 's' : ''}`);
  });
  
  table.on('hand:ended', ({ winners, showdown, allHands }) => {
    console.log('\n--- Showdown ---');
    
    if (showdown && allHands) {
      console.log('Final hands:');
      allHands.forEach(({ playerId, description }) => {
        const player = bots.find(b => b.id === playerId);
        console.log(`  ${player?.name || playerId}: ${description}`);
      });
    }
    
    console.log('\nWinners:');
    winners.forEach(({ playerId, amount, handDescription }) => {
      const player = bots.find(b => b.id === playerId);
      console.log(`  ${player?.name || playerId} wins ${amount} chips${handDescription ? ' with ' + handDescription : ''}`);
    });
  });
  
  table.on('hand:completed', ({ profits }) => {
    console.log('\nChip changes:');
    for (const [playerId, profit] of Object.entries(profits)) {
      const player = bots.find(b => b.id === playerId);
      const sign = profit >= 0 ? '+' : '';
      console.log(`  ${player?.name || playerId}: ${sign}${profit}`);
    }
    console.log('\nFinal chip counts:');
    bots.forEach(bot => {
      console.log(`  ${bot.name}: ${bot.chips}`);
    });
    console.log('=' .repeat(50));
  });
  
  // Add players to the table
  for (const bot of bots) {
    table.addPlayer(bot);
  }
  
  // Start the game
  console.log('\nStarting game...\n');
  await table.tryStartGame();
  
  // Wait for the hand to complete
  await new Promise(resolve => {
    table.once('hand:completed', resolve);
  });
  
  console.log('\nDemo completed!');
  
  // Run a second hand
  console.log('\nStarting second hand...\n');
  await table.tryStartGame();
  
  // Wait for the second hand to complete
  await new Promise(resolve => {
    table.once('hand:completed', resolve);
  });
  
  console.log('\nTwo hands completed successfully!');
  
  // Close the table
  table.close();
}

// Run the demo
runSimpleGame().catch(console.error);