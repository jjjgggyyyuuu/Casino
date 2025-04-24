<script lang="ts">
  import { onMount } from 'svelte';
  import PaymentForm from '$lib/PaymentForm.svelte';
  import TransactionHistory from '$lib/TransactionHistory.svelte';
  import AgeVerificationModal from '$lib/AgeVerificationModal.svelte';
  import ResponsibleGamingModal from '$lib/ResponsibleGamingModal.svelte';
  
  // Mock user data - in a real app this would come from authentication
  let userId = 'user_' + Math.random().toString(36).substring(2, 10);
  let balance = 1000; // Simulated crypto balance in tokens
  let betAmount = 10;
  let reels = [['🍒', '7️⃣', '💎'], ['🍒', '7️⃣', '💎'], ['🍒', '7️⃣', '💎']];
  let spinning = false;
  let result = '';
  let activeTab = 'game'; // 'game', 'deposit', 'history'
  let stats = {
    rtp: '0.00',
    spins: 0,
    dailySeed: ''
  };
  
  // Game session tracking
  let isAgeVerified = false;
  let spinCount = 0;
  let initialBalance = 1000;
  let playStartTime = Date.now();
  
  // Tracking for responsible gaming
  function updatePlayerStats(newBalance) {
    const currentTime = Date.now();
    const sessionDuration = currentTime - playStartTime;
    const netProfit = newBalance - initialBalance;
    
    // Update session storage
    const playerStats = {
      sessionDuration,
      spinCount,
      netProfit
    };
    
    sessionStorage.setItem('player_stats', JSON.stringify(playerStats));
  }

  onMount(() => {
    // Check for stored balance in local storage
    const storedBalance = localStorage.getItem('casinoBalance');
    if (storedBalance) {
      balance = parseInt(storedBalance, 10);
      initialBalance = balance;
    }
    
    // Track user sessions for real-time analytics
    trackSession();
  });

  function trackSession() {
    // In a real implementation, this would send data to a tracking service
    console.log('User session started', { userId });
  }

  async function spinReels() {
    if (spinning || balance < betAmount) return;
    spinning = true;
    result = '';
    
    try {
      spinCount++;
      
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance, betAmount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        result = errorData.error || 'Error occurred. Try again!';
        spinning = false;
        return;
      }
      
      const data = await response.json();
      balance = data.balance;
      reels = data.reels;
      result = data.result;
      
      // Update stats
      if (data.stats) {
        stats = data.stats;
      }
      
      // Update player stats for responsible gaming
      updatePlayerStats(balance);
      
      // Store balance in local storage
      localStorage.setItem('casinoBalance', balance.toString());
    } catch (error) {
      result = 'Network error. Try again!';
    } finally {
      spinning = false;
    }
  }

  function updateBetAmount(amount) {
    if (amount >= 10 && amount <= 500) {
      betAmount = amount;
    }
  }
  
  function handlePaymentComplete(newBalance) {
    balance = newBalance;
    // Store updated balance
    localStorage.setItem('casinoBalance', balance.toString());
    // Update player stats
    updatePlayerStats(balance);
  }
  
  function handleAgeVerified() {
    isAgeVerified = true;
  }
  
  function handleAgeRejected() {
    // Redirect to an appropriate page
    window.location.href = 'https://www.google.com';
  }
  
  function handleTakeBreak() {
    // Reset session stats and pause game
    sessionStorage.removeItem('player_stats');
    playStartTime = Date.now();
    spinCount = 0;
    
    // Switch to deposit/withdraw tab
    activeTab = 'deposit';
  }
</script>

<main>
  <!-- Age verification modal -->
  <AgeVerificationModal 
    onVerify={handleAgeVerified} 
    onReject={handleAgeRejected} 
  />
  
  <!-- Responsible gaming modal -->
  <ResponsibleGamingModal 
    playDurationMinutes={60}
    onContinue={() => {}}
    onTakeBreak={handleTakeBreak}
  />
  
  <div class="min-h-screen bg-gray-900 text-white flex flex-col">
    <header class="bg-gray-800 p-4 shadow-lg">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-3xl font-bold text-yellow-400">Crypto Casino Slots</h1>
        
        <div class="bg-gray-700 p-2 rounded-lg shadow-inner">
          <span class="text-gray-300">Balance:</span>
          <span class="text-yellow-400 font-bold ml-1">{balance} Tokens</span>
        </div>
      </div>
    </header>
    
    <!-- Navigation tabs -->
    <div class="bg-gray-800 border-t border-gray-700">
      <div class="container mx-auto">
        <div class="flex">
          <button 
            class="px-6 py-3 {activeTab === 'game' ? 'bg-gray-900 text-yellow-400 border-t-2 border-yellow-400' : 'text-gray-300 hover:bg-gray-700'}"
            on:click={() => activeTab = 'game'}
          >
            Slot Game
          </button>
          <button 
            class="px-6 py-3 {activeTab === 'deposit' ? 'bg-gray-900 text-yellow-400 border-t-2 border-yellow-400' : 'text-gray-300 hover:bg-gray-700'}"
            on:click={() => activeTab = 'deposit'}
          >
            Deposit/Withdraw
          </button>
          <button 
            class="px-6 py-3 {activeTab === 'history' ? 'bg-gray-900 text-yellow-400 border-t-2 border-yellow-400' : 'text-gray-300 hover:bg-gray-700'}"
            on:click={() => activeTab = 'history'}
          >
            Transaction History
          </button>
        </div>
      </div>
    </div>
    
    <div class="container mx-auto p-6 flex-grow">
      {#if activeTab === 'game'}
        <div class="flex flex-col lg:flex-row lg:justify-between">
          <div class="lg:w-2/3 flex flex-col items-center justify-center">
            <!-- Bet Control -->
            <div class="mb-6 w-full max-w-md">
              <div class="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-gray-300">Bet Amount:</span>
                  <div class="flex items-center">
                    <button 
                      class="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-l"
                      on:click={() => updateBetAmount(betAmount - 10)}
                      disabled={betAmount <= 10}
                    >-</button>
                    <input 
                      type="number" 
                      bind:value={betAmount}
                      min="10"
                      max="500"
                      class="bg-gray-700 text-white w-20 h-8 text-center"
                    />
                    <button 
                      class="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-r"
                      on:click={() => updateBetAmount(betAmount + 10)}
                      disabled={betAmount >= 500}
                    >+</button>
                  </div>
                </div>
                
                <div class="text-xs text-gray-400 text-right">
                  Min: 10 | Max: 500
                </div>
              </div>
            </div>
            
            <!-- Slot Machine -->
            <div class="flex flex-col bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-md mb-6">
              <div class="grid grid-cols-3 gap-4 mb-4">
                {#each reels as reel, reelIndex}
                  <div class="flex flex-col items-center justify-between bg-gray-700 rounded-lg p-2 h-48">
                    {#each reel as symbol, symbolIndex}
                      <div class="transition-all duration-500 {spinning ? 'animate-spin' : ''} {symbolIndex === 1 ? 'text-4xl bg-gray-600 p-2 rounded-full' : 'text-2xl opacity-50'}">
                        {symbol}
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
              <button 
                on:click={spinReels}
                disabled={spinning || balance < betAmount}
                class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {spinning ? 'Spinning...' : 'Spin'}
              </button>
            </div>
            
            <!-- Result Display -->
            <div class="w-full max-w-md text-center">
              <div class="text-xl {result.includes('Win') ? 'text-green-400' : 'text-red-400'} font-semibold mb-4">
                {result || 'Place your bet and spin!'}
              </div>
            </div>
          </div>
          
          <div class="lg:w-1/3 mt-6 lg:mt-0">
            <!-- Game Stats -->
            <div class="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
              <h3 class="text-xl font-bold text-yellow-400 mb-3">Game Stats</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">RTP (Return to Player):</span>
                  <span class="text-green-400 font-bold">{stats.rtp}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Total Spins:</span>
                  <span class="text-white">{stats.spins}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Session Spins:</span>
                  <span class="text-white">{spinCount}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Daily Seed:</span>
                  <span class="text-gray-400 text-xs break-all">{stats.dailySeed}</span>
                </div>
              </div>
            </div>
            
            <!-- Payout Table -->
            <div class="bg-gray-800 rounded-lg p-4 shadow-lg">
              <h3 class="text-xl font-bold text-yellow-400 mb-3">Payout Table</h3>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="text-2xl">7️⃣ 7️⃣ 7️⃣</span>
                  </div>
                  <span class="text-green-400">10x</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="text-2xl">💎 💎 💎</span>
                  </div>
                  <span class="text-green-400">5x</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="text-2xl">🍒 🍒 🍒</span>
                  </div>
                  <span class="text-green-400">3x</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="text-2xl">🍋 🍋 🍋</span>
                  </div>
                  <span class="text-green-400">2x</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center">
                    <span class="text-2xl">🍊 🍊 🍊</span>
                  </div>
                  <span class="text-green-400">2x</span>
                </div>
              </div>
              
              <!-- Responsible gaming reminder -->
              <div class="mt-6 pt-4 border-t border-gray-700">
                <div class="flex items-center text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-semibold">Gamble Responsibly</span>
                </div>
                <p class="text-xs text-gray-400 mt-2">
                  Set limits, take breaks, and never bet more than you can afford to lose.
                </p>
              </div>
            </div>
          </div>
        </div>
      {:else if activeTab === 'deposit'}
        <PaymentForm 
          userId={userId} 
          balance={balance}
          onPaymentComplete={handlePaymentComplete}
        />
      {:else if activeTab === 'history'}
        <TransactionHistory userId={userId} />
      {/if}
    </div>
    
    <footer class="bg-gray-800 text-gray-400 p-4 text-center text-sm">
      <p>© 2025 Crypto Casino - All rights reserved</p>
      <p class="mt-1">Remember to gamble responsibly. Must be 21+ to play.</p>
    </footer>
  </div>
</main>

<style>
  @keyframes spin {
    0% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(5px); opacity: 0.5; }
    100% { transform: translateY(0); opacity: 1; }
  }
  .animate-spin {
    animation: spin 0.5s ease-in-out infinite;
  }
  
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
</style> 