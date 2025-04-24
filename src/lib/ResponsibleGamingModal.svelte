<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let playDurationMinutes = 60;
  export let onContinue = () => {};
  export let onTakeBreak = () => {};
  
  let isVisible = false;
  let timer;
  let playStartTime;
  let playerStats = {
    sessionDuration: 0,
    spinCount: 0,
    netProfit: 0
  };
  
  onMount(() => {
    // Start tracking play time
    playStartTime = Date.now();
    startTimer();
    
    // Load player stats from session storage
    const storedStats = sessionStorage.getItem('player_stats');
    if (storedStats) {
      try {
        playerStats = JSON.parse(storedStats);
      } catch (e) {
        console.error('Failed to parse player stats', e);
      }
    }
  });
  
  onDestroy(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
  
  function startTimer() {
    // Clear any existing timer
    if (timer) {
      clearTimeout(timer);
    }
    
    // Set timer for responsible gaming reminder
    timer = setTimeout(() => {
      isVisible = true;
      // Play a sound or add visual effect to get attention
    }, playDurationMinutes * 60 * 1000);
  }
  
  function handleContinue() {
    isVisible = false;
    playStartTime = Date.now(); // Reset timer
    startTimer(); // Restart the timer
    onContinue();
  }
  
  function handleTakeBreak() {
    isVisible = false;
    onTakeBreak();
  }
  
  function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative border-2 border-yellow-500">
      <h2 class="text-2xl font-bold text-yellow-400 mb-4">Time for a Break?</h2>
      <p class="text-white mb-6">You've been at this for an hour—take a goddamn break.</p>
      
      <!-- Player stats -->
      <div class="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 class="text-lg font-bold text-yellow-400 mb-2">Your Session Stats</h3>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-gray-400 text-xs">Time Played</p>
            <p class="text-white font-bold">{formatTime(playerStats.sessionDuration)}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs">Spins</p>
            <p class="text-white font-bold">{playerStats.spinCount}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs">Net Profit</p>
            <p class="{playerStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} font-bold">
              {playerStats.netProfit >= 0 ? '+' : ''}{playerStats.netProfit}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Responsible gambling tips -->
      <div class="mb-6">
        <h3 class="text-lg font-bold text-yellow-400 mb-2">Remember:</h3>
        <ul class="text-gray-300 space-y-1 list-disc pl-5">
          <li>Set a budget and stick to it</li>
          <li>Gambling should be fun, not a way to make money</li>
          <li>Take regular breaks</li>
          <li>Don't chase losses</li>
        </ul>
      </div>
      
      <div class="flex gap-3">
        <button
          on:click={handleTakeBreak}
          class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
          Take a Break
        </button>
        <button
          on:click={handleContinue}
          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
          Continue Playing
        </button>
      </div>
      
      <!-- Self-exclusion option -->
      <div class="mt-4 text-center">
        <a href="#" class="text-yellow-400 text-sm hover:underline">
          Need help? Set up self-exclusion
        </a>
      </div>
    </div>
  </div>
{/if} 