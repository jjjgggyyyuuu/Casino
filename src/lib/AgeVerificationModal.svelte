<script lang="ts">
  import { onMount } from 'svelte';
  
  export let onVerify = () => {};
  export let onReject = () => {};
  
  let isVisible = true;
  let birthdateDay = '';
  let birthdateMonth = '';
  let birthdateYear = '';
  let country = '';
  let error = '';
  
  // List of prohibited countries
  const prohibitedCountries = ["USA", "UK", "FR", "CN", "RU"];
  
  onMount(() => {
    // Check if verification has already been done in this session
    const verified = sessionStorage.getItem('age_verified');
    if (verified === 'true') {
      isVisible = false;
      onVerify();
    }
    
    // Try to get user's country using geolocation
    try {
      navigator.geolocation.getCurrentPosition((position) => {
        // In a real app, you would use a proper geolocation API to convert coordinates to country
        // This is just a placeholder - would be replaced with actual API call
        console.log('Got location', position.coords);
      });
    } catch (e) {
      console.error('Geolocation error', e);
    }
  });
  
  function verifyAge() {
    error = '';
    
    // Validate inputs
    if (!birthdateDay || !birthdateMonth || !birthdateYear) {
      error = 'Please provide your complete date of birth';
      return;
    }
    
    if (!country) {
      error = 'Please select your country';
      return;
    }
    
    // Check prohibited countries
    if (prohibitedCountries.includes(country)) {
      error = 'Gambling is not allowed in your location. Get lost.';
      return;
    }
    
    // Calculate age
    const birthDate = new Date(
      parseInt(birthdateYear),
      parseInt(birthdateMonth) - 1,
      parseInt(birthdateDay)
    );
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Check if user is at least 21
    if (age < 21) {
      error = 'You must be 21+ to play. Nice try, kid.';
      return;
    }
    
    // Success - close modal and notify parent
    sessionStorage.setItem('age_verified', 'true');
    isVisible = false;
    onVerify();
  }
  
  function handleReject() {
    isVisible = false;
    onReject();
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative">
      <h2 class="text-2xl font-bold text-yellow-400 mb-4">Age Verification Required</h2>
      <p class="text-white mb-6">You must be 21+ to play. Prove your age, asshole.</p>
      
      {#if error}
        <div class="bg-red-900 bg-opacity-50 text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      {/if}
      
      <div class="mb-4">
        <label class="block text-gray-300 mb-2">Date of Birth</label>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-gray-400 mb-1 block">Day</label>
            <input
              type="number"
              bind:value={birthdateDay}
              min="1"
              max="31"
              placeholder="DD"
              class="w-full py-2 px-3 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400 mb-1 block">Month</label>
            <input
              type="number"
              bind:value={birthdateMonth}
              min="1"
              max="12"
              placeholder="MM"
              class="w-full py-2 px-3 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400 mb-1 block">Year</label>
            <input
              type="number"
              bind:value={birthdateYear}
              min="1900"
              max="2010"
              placeholder="YYYY"
              class="w-full py-2 px-3 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
      
      <div class="mb-6">
        <label class="block text-gray-300 mb-2">Country of Residence</label>
        <select
          bind:value={country}
          class="w-full py-2 px-3 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
        >
          <option value="">Select your country</option>
          <option value="AF">Afghanistan</option>
          <option value="AU">Australia</option>
          <option value="BR">Brazil</option>
          <option value="CA">Canada</option>
          <option value="CN">China</option>
          <option value="FR">France</option>
          <option value="DE">Germany</option>
          <option value="IN">India</option>
          <option value="JP">Japan</option>
          <option value="MX">Mexico</option>
          <option value="NL">Netherlands</option>
          <option value="RU">Russia</option>
          <option value="SG">Singapore</option>
          <option value="ZA">South Africa</option>
          <option value="ES">Spain</option>
          <option value="SE">Sweden</option>
          <option value="CH">Switzerland</option>
          <option value="UK">United Kingdom</option>
          <option value="USA">United States</option>
        </select>
      </div>
      
      <div class="flex gap-3">
        <button
          on:click={verifyAge}
          class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
          Verify Age
        </button>
        <button
          on:click={handleReject}
          class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
          Leave Site
        </button>
      </div>
      
      <p class="text-xs text-gray-400 mt-4">
        By clicking "Verify Age" you confirm that you are at least 21 years old and agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  </div>
{/if} 