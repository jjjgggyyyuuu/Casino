import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath, URL } from 'node:url'

// Seeded random number generator for fair gaming
class SeededRandom {
  seed: number;
  
  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  // Simple but effective seeded random generator
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Get random int in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'configure-server',
      configureServer(server) {
        // Create seeded random instance - changes daily for fairness
        const dailySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        const rng = new SeededRandom(dailySeed);
        
        // Track house edge to maintain fairness
        let spins = 0;
        let playerWinnings = 0;
        
        server.middlewares.use('/api/spin', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { balance, betAmount } = JSON.parse(body);
                
                if (balance < betAmount) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Insufficient balance' }));
                  return;
                }

                // Increment total spins for RTP calculation
                spins++;
                
                // Calculate target RTP (Return To Player) - industry standard is 92-96%
                const targetRTP = 0.94; // 94% RTP
                const currentRTP = spins > 0 ? (playerWinnings / (spins * betAmount)) + 1 : 1;
                
                // Adjust win probability based on current RTP
                // If players are winning too much, decrease win chance
                // If players are losing too much, increase win chance
                let winProbability = 0.30; // Base 30% win rate
                if (currentRTP < targetRTP) {
                  winProbability = 0.40; // Increase win chance
                } else if (currentRTP > targetRTP + 0.05) {
                  winProbability = 0.20; // Decrease win chance
                }

                // Simulate slot machine spin
                const symbols = ['🍒', '7️⃣', '💎', '🍋', '🍊'];
                const weights: Record<string, number> = { '🍒': 30, '🍋': 25, '🍊': 20, '💎': 15, '7️⃣': 10 }; // Symbol weights
                
                // Decide if this spin will be a win based on winProbability
                const isWin = rng.next() < winProbability;
                
                // If win, select a random symbol to match
                let winningSymbol: string | null = null;
                if (isWin) {
                  // Select winning symbol with weighted probabilities
                  // Higher value symbols have lower weights
                  const r = rng.next() * 100;
                  let sum = 0;
                  for (const [symbol, weight] of Object.entries(weights)) {
                    sum += weight;
                    if (r < sum) {
                      winningSymbol = symbol;
                      break;
                    }
                  }
                }
                
                // Generate the reels
                const reels: string[][] = [[], [], []];
                
                // If this is a win, set the middle row to all matching symbols
                if (isWin && winningSymbol) {
                  for (let i = 0; i < 3; i++) {
                    // Fill top row with random symbols
                    reels[i][0] = symbols[rng.nextInt(0, symbols.length - 1)];
                    
                    // Set middle row to winning symbol for all reels
                    reels[i][1] = winningSymbol;
                    
                    // Fill bottom row with random symbols
                    reels[i][2] = symbols[rng.nextInt(0, symbols.length - 1)];
                  }
                } else {
                  // Generate fully random reels for losing spins
                  for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                      reels[i][j] = symbols[rng.nextInt(0, symbols.length - 1)];
                    }
                  }
                  
                  // Ensure it's a true loss by breaking any coincidental wins
                  const middleRow = [reels[0][1], reels[1][1], reels[2][1]];
                  if (middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]) {
                    const differentSymbol = symbols.find(s => s !== middleRow[0]);
                    if (differentSymbol) {
                      reels[2][1] = differentSymbol;
                    }
                  }
                }

                // Check for win (middle row match) and calculate payout
                const middleRow = [reels[0][1], reels[1][1], reels[2][1]];
                let payout = 0;
                let result = 'Loss. Try again!';

                if (middleRow.every(symbol => symbol === middleRow[0])) {
                  const symbol = middleRow[0];
                  payout = betAmount * (symbol === '7️⃣' ? 10 : symbol === '💎' ? 5 : symbol === '🍒' ? 3 : 2);
                  result = `Win! +${payout} tokens (${symbol} match)`;
                  
                  // Update player winnings for RTP tracking
                  playerWinnings += payout - betAmount;
                } else {
                  // Update player winnings for RTP tracking
                  playerWinnings -= betAmount;
                }

                const newBalance = balance - betAmount + payout;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  balance: newBalance, 
                  reels, 
                  result,
                  stats: { 
                    rtp: currentRTP.toFixed(2), 
                    spins 
                  }
                }));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid request' }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '$lib': fileURLToPath(new URL('./src/lib', import.meta.url))
    }
  }
})
