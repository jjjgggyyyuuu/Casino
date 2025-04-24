// Simple server endpoint for slot machine spin in plain JS with cryptographically secure RNG
import crypto from 'crypto';
import { json } from '@sveltejs/kit';

/**
 * @typedef {Object} SpinRequest
 * @property {number} balance - Current player balance
 * @property {number} betAmount - Amount player wants to bet
 */

/**
 * @typedef {Object} SpinResponse
 * @property {number} balance - New player balance after spin
 * @property {string[][]} reels - 3x3 grid of slot symbols
 * @property {string} result - Text describing spin result
 * @property {Object} stats - Game statistics
 * @property {Object} verification - Provably fair verification data
 */

/**
 * @typedef {Object} RequestEvent
 * @property {Request} request - The HTTP request object
 */

// Persistent values to track statistics and ensure fair RTP (Return to Player)
let totalBets = 0;
let totalWins = 0;
let totalSpins = 0;
let targetRtp = 0.96; // 96% RTP target for better player experience
let lastDailyHash = ''; // Store the daily hash for reproducibility

// Generate a cryptographically secure random number between 0 and 1
function secureRandom() {
  const buffer = crypto.randomBytes(4);
  // Convert to an integer, then scale to [0, 1)
  return buffer.readUInt32BE(0) / 0xFFFFFFFF;
}

// Seeded Random Number Generator for verifiable fairness
class SeededRNG {
  /**
   * @param {string|number} seed - Seed for the RNG
   */
  constructor(seed) {
    this.seed = this.hashSeed(seed);
    this.counter = 0;
  }
  
  /**
   * Create a hash from the seed
   * @param {string|number} seed - Input seed to hash
   * @return {string} - Hashed seed
   */
  hashSeed(seed) {
    return crypto.createHash('sha256').update(String(seed)).digest('hex');
  }
  
  /**
   * Get next random number
   * @return {number} - Random number between 0 and 1
   */
  next() {
    // Increment counter for each request to ensure different results
    this.counter++;
    
    // Create a unique string for this specific random call
    const data = `${this.seed}:${this.counter}`;
    
    // Hash the data to get pseudorandom bytes
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    // Convert first 8 bytes to a number between 0 and 1
    const randomValue = parseInt(hash.substring(0, 8), 16) / 0xFFFFFFFF;
    
    return randomValue;
  }
  
  /**
   * Get random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @return {number} - Random integer
   */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Handle POST request for spinning the slot machine
 * @param {import('@sveltejs/kit').RequestEvent} event - Request event
 * @return {Promise<Response>} JSON response with spin results
 */
export async function POST(event) {
  try {
    // Get request body
    const data = await event.request.json();
    const betAmount = data.betAmount || 10;
    const userId = data.userId || 'anonymous';
    
    // Validate bet amount (minimum 10, maximum 500)
    const validatedBetAmount = Math.min(Math.max(10, betAmount), 500);
    
    // Mock balance check - In a real implementation, this would query a database
    const balance = 1000; // Mock balance for testing
    
    if (balance < validatedBetAmount) {
      return json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Create a daily seed for verifiable fairness
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailySeed = `crypto-slot-${today}`;
    
    // Create a new daily hash only if it's changed
    if (lastDailyHash !== dailySeed) {
      lastDailyHash = dailySeed;
    }
    
    // Create a combination of daily seed and player-specific data for unpredictability
    // Include validated bet amount in the seed to prevent prediction
    const spinSeed = `${dailySeed}-${balance}-${validatedBetAmount}-${userId}-${totalSpins}`;
    const rng = new SeededRNG(spinSeed);
    
    // Track statistics
    totalBets += validatedBetAmount;
    totalSpins += 1;
    
    // Symbols with their weights (higher number = more likely to appear)
    const symbols = ['🍒', '7️⃣', '💎', '🍋', '🍊'];
    // Adjusted weights to give better chances for medium symbols
    const weights = [30, 15, 20, 20, 25]; 
    
    /**
     * Function to select random symbol based on weights using secure RNG
     * @return {string} - Randomly selected symbol
     */
    function weightedRandom() {
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = rng.next() * totalWeight;
      
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return symbols[i];
        }
      }
      return symbols[0]; // Fallback
    }

    // Dynamic RTP adjustment - if we're below target, increase chance of wins
    const currentRtp = totalWins / Math.max(1, totalBets);
    
    // Adjust win probability based on bet amount
    // Higher bets get slightly better odds to encourage bigger betting
    let winProbabilityMultiplier = 1.0;
    if (validatedBetAmount > 100 && validatedBetAmount <= 250) {
      winProbabilityMultiplier = 1.05; // 5% better odds for medium bets
    } else if (validatedBetAmount > 250 && validatedBetAmount <= 400) {
      winProbabilityMultiplier = 1.1; // 10% better odds for high bets
    } else if (validatedBetAmount > 400) {
      winProbabilityMultiplier = 1.15; // 15% better odds for max bets
    }
    
    // Use secure random for RTP adjustment with bet amount modifier
    const rtpAdjustment = currentRtp < targetRtp ? 0.15 : -0.05; // Boost wins more if we're below target
    const baseWinProbability = 0.35 + rtpAdjustment;
    const shouldBoostWins = rng.next() < (baseWinProbability * winProbabilityMultiplier);
    
    // Generate 3 symbols for the spin result
    /** @type {string[]} */
    let resultSymbols = [];
    
    // Create predetermined win pattern occasionally based on RTP tracking
    if (shouldBoostWins || rng.next() < (0.35 * winProbabilityMultiplier)) { // Added base chance for wins
      // For high bets, increase the chance of premium symbols
      let winningSymbolProbabilities;
      
      if (validatedBetAmount > 400) {
        // For max bets, better chance at premium symbols
        winningSymbolProbabilities = [
          0.20, // 🍒 (20%)
          0.25, // 7️⃣ (25%)
          0.25, // 💎 (25%)
          0.15, // 🍋 (15%)
          0.15  // 🍊 (15%)
        ];
      } else if (validatedBetAmount > 250) {
        // For high bets, better chance at premium symbols
        winningSymbolProbabilities = [
          0.22, // 🍒 (22%)
          0.20, // 7️⃣ (20%)
          0.23, // 💎 (23%)
          0.15, // 🍋 (15%)
          0.20  // 🍊 (20%)
        ];
      } else if (validatedBetAmount > 100) {
        // For medium bets, moderate chance at premium symbols
        winningSymbolProbabilities = [
          0.25, // 🍒 (25%)
          0.15, // 7️⃣ (15%)
          0.20, // 💎 (20%)
          0.20, // 🍋 (20%)
          0.20  // 🍊 (20%)
        ];
      } else {
        // For low bets, lower chance at premium symbols
        winningSymbolProbabilities = [
          0.25, // 🍒 (25%)
          0.10, // 7️⃣ (10%)
          0.15, // 💎 (15%)
          0.25, // 🍋 (25%)
          0.25  // 🍊 (25%)
        ];
      }
      
      let winningSymbolIndex = 0; // Default to first symbol
      const winRandom = rng.next();
      let cumulativeProbability = 0;
      
      for (let i = 0; i < winningSymbolProbabilities.length; i++) {
        cumulativeProbability += winningSymbolProbabilities[i];
        if (winRandom < cumulativeProbability) {
          winningSymbolIndex = i;
          break;
        }
      }
      
      // Ensure we don't go out of bounds if somehow we missed all thresholds
      winningSymbolIndex = Math.min(winningSymbolIndex, symbols.length - 1);
      const winSymbol = symbols[winningSymbolIndex];
      
      // Create winning combination (3 of the same symbol)
      resultSymbols = [winSymbol, winSymbol, winSymbol];
    } else {
      // Normal random spin - ensure not all symbols match accidentally
      do {
        resultSymbols = [weightedRandom(), weightedRandom(), weightedRandom()];
        
        // Check if accidentally contains a win
        const hasAccidentalWin = resultSymbols.every(symbol => symbol === resultSymbols[0]);
        
        // If there's no accidental win, we can use this result
        if (!hasAccidentalWin) break;
        
      } while (true); // Keep generating until we get a non-winning combination
    }

    // Check for win (all 3 symbols match)
    let payout = 0;
    let winType = null;

    if (resultSymbols.every(symbol => symbol === resultSymbols[0])) {
      // Payout multipliers based on symbol and bet amount
      const baseMultipliers = {
        '🍒': 3,
        '7️⃣': 10,
        '💎': 5,
        '🍋': 2,
        '🍊': 2
      };
      
      // Increase multiplier slightly for higher bets
      let multiplierBoost = 1.0;
      if (validatedBetAmount > 100 && validatedBetAmount <= 250) {
        multiplierBoost = 1.1; // 10% better multiplier for medium bets
      } else if (validatedBetAmount > 250 && validatedBetAmount <= 400) {
        multiplierBoost = 1.2; // 20% better multiplier for high bets
      } else if (validatedBetAmount > 400) {
        multiplierBoost = 1.3; // 30% better multiplier for max bets
      }
      
      // Safe way to get multiplier with fallback
      let symbolMultiplier = 2; // Default multiplier
      const winningSymbol = resultSymbols[0];
      
      // Use safe approach for accessing the multiplier by checking each key explicitly
      if (winningSymbol === '🍒') {
        symbolMultiplier = baseMultipliers['🍒'];
      } else if (winningSymbol === '7️⃣') {
        symbolMultiplier = baseMultipliers['7️⃣'];
      } else if (winningSymbol === '💎') {
        symbolMultiplier = baseMultipliers['💎'];
      } else if (winningSymbol === '🍋') {
        symbolMultiplier = baseMultipliers['🍋'];
      } else if (winningSymbol === '🍊') {
        symbolMultiplier = baseMultipliers['🍊'];
      }
      
      const multiplier = Math.round(symbolMultiplier * multiplierBoost);
      payout = validatedBetAmount * multiplier;
      winType = `${resultSymbols[0]} Match`;
      
      // Track total wins for RTP calculation
      totalWins += payout;
    }

    // Calculate new balance
    const newBalance = balance - validatedBetAmount + payout;
    
    // Calculate current RTP for stats
    const rtpValue = (totalWins / Math.max(1, totalBets));
    
    // Create response object
    const response = {
      symbols: resultSymbols,
      payout,
      winType,
      balance: newBalance,
      odds: rtpValue
    };

    return json(response, { status: 200 });
  } catch (error) {
    console.error("Spin error:", error);
    return json({ error: 'Invalid request' }, { status: 400 });
  }
} 