<script lang="ts">
  import { onMount } from 'svelte';
  import KycVerificationModal from './KycVerificationModal.svelte';
  
  export let userId = '';
  export let balance = 0;
  export let onPaymentComplete = (newBalance: number) => {};
  
  let amount = 10;
  let paymentType = 'deposit';
  let loading = false;
  let error = '';
  let message = '';
  let cardNumber = '';
  let expiryDate = '';
  let cvv = '';
  let paymentMethod = 'card';
  let cryptoAddress = '';
  let showKycModal = false;
  let pendingTransaction = null;
  
  // Min/max limits (in dollars)
  const limits = {
    deposit: { min: 10, max: 10000 },
    withdrawal: { min: 20, max: 5000 }
  };
  
  // KYC thresholds (in dollars)
  const kycThresholds = {
    deposit: 5000,
    withdrawal: 1000
  };
  
  onMount(() => {
    // Initialize Stripe Elements (in a real implementation)
    // This is a placeholder where you would initialize Stripe.js
  });
  
  async function handleSubmit() {
    if (loading) return;
    
    // Reset states
    error = '';
    message = '';
    loading = true;
    
    try {
      // Validate amount
      const minAmount = limits[paymentType].min;
      const maxAmount = limits[paymentType].max;
      
      if (amount < minAmount || amount > maxAmount) {
        error = `Amount must be between $${minAmount} and $${maxAmount}`;
        loading = false;
        return;
      }
      
      // Convert dollars to cents for API
      const amountCents = Math.floor(amount * 100);
      
      if (paymentType === 'withdrawal' && amountCents > balance) {
        error = 'Insufficient balance for withdrawal';
        loading = false;
        return;
      }
      
      // Check if KYC is required for this transaction
      const kycThreshold = kycThresholds[paymentType];
      if (amount > kycThreshold) {
        // Store the pending transaction
        pendingTransaction = {
          type: paymentType,
          amount: amountCents,
          paymentMethod: paymentMethod,
          cryptoAddress: cryptoAddress
        };
        
        // Show KYC verification
        showKycModal = true;
        loading = false;
        return;
      }
      
      // Process payment if KYC not needed
      await processPayment(paymentType, amountCents);
    } catch (err) {
      error = 'Payment processing error. Please try again.';
      console.error('Payment error:', err);
    } finally {
      loading = false;
    }
  }
  
  async function processPayment(type, amountCents) {
    if (type === 'deposit') {
      // In a real implementation, you would use Stripe.js to create a token
      // This is simplified for demonstration
      const mockStripeToken = `tok_${Date.now()}`;
      
      // Process deposit
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountCents,
          token: mockStripeToken,
          userId
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        error = result.message || 'Deposit failed';
      } else {
        message = result.message || 'Deposit successful!';
        onPaymentComplete(result.balance);
      }
    } else {
      // Withdrawal logic
      const paymentDetails = paymentMethod === 'crypto' 
        ? { type: 'crypto', address: cryptoAddress }
        : { type: 'bank', account: '****1234' }; // Simplified for demo
      
      const response = await fetch('/api/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountCents,
          userId,
          paymentDetails
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        error = result.message || 'Withdrawal failed';
        
        // Handle KYC requirement
        if (result.requiresKyc) {
          // Redirect to KYC form or display KYC message
          error += '. Please complete KYC verification.';
        }
      } else {
        message = result.message || 'Withdrawal request submitted!';
        onPaymentComplete(result.balance);
      }
    }
  }
  
  function handleKycComplete() {
    showKycModal = false;
    
    // Process the pending transaction
    if (pendingTransaction) {
      processPayment(
        pendingTransaction.type, 
        pendingTransaction.amount
      );
      pendingTransaction = null;
    }
  }
  
  function handleKycCancel() {
    showKycModal = false;
    pendingTransaction = null;
    error = 'Transaction canceled. KYC verification is required for high-value transactions.';
  }
</script>

{#if showKycModal}
  <KycVerificationModal 
    userId={userId}
    onComplete={handleKycComplete}
    onCancel={handleKycCancel}
  />
{/if}

<div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto">
  <h2 class="text-2xl font-bold text-yellow-400 mb-4">
    {paymentType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
  </h2>
  
  <div class="mb-4">
    <div class="flex gap-2 mb-4">
      <button 
        class="flex-1 py-2 px-4 rounded-md {paymentType === 'deposit' ? 'bg-green-600' : 'bg-gray-700'}"
        on:click={() => paymentType = 'deposit'}
      >
        Deposit
      </button>
      <button 
        class="flex-1 py-2 px-4 rounded-md {paymentType === 'withdrawal' ? 'bg-yellow-600' : 'bg-gray-700'}"
        on:click={() => paymentType = 'withdrawal'}
      >
        Withdraw
      </button>
    </div>
    
    <div class="mb-4">
      <label class="block text-gray-300 mb-1">Amount (USD)</label>
      <div class="relative">
        <span class="absolute left-3 top-2 text-gray-400">$</span>
        <input
          type="number"
          bind:value={amount}
          min={limits[paymentType].min}
          max={limits[paymentType].max}
          class="w-full py-2 pl-8 pr-4 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <p class="text-xs text-gray-400 mt-1">
        Min: ${limits[paymentType].min}, Max: ${limits[paymentType].max}
      </p>
      {#if amount > kycThresholds[paymentType]}
        <p class="text-xs text-yellow-400 mt-1">
          KYC verification required for {paymentType === 'deposit' ? 'deposits' : 'withdrawals'} over ${kycThresholds[paymentType]}
        </p>
      {/if}
    </div>
    
    {#if paymentType === 'deposit'}
      <div class="space-y-3">
        <div>
          <label class="block text-gray-300 mb-1">Card Number</label>
          <input
            type="text"
            bind:value={cardNumber}
            placeholder="4242 4242 4242 4242"
            class="w-full py-2 px-4 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
          />
        </div>
        
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-gray-300 mb-1">Expiry Date</label>
            <input
              type="text"
              bind:value={expiryDate}
              placeholder="MM/YY"
              class="w-full py-2 px-4 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>
          <div class="flex-1">
            <label class="block text-gray-300 mb-1">CVV</label>
            <input
              type="text"
              bind:value={cvv}
              placeholder="123"
              class="w-full py-2 px-4 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    {:else}
      <div class="mb-4">
        <label class="block text-gray-300 mb-2">Withdrawal Method</label>
        <div class="flex gap-2 mb-3">
          <button 
            class="flex-1 py-2 px-4 rounded-md {paymentMethod === 'bank' ? 'bg-blue-600' : 'bg-gray-700'}"
            on:click={() => paymentMethod = 'bank'}
          >
            Bank Transfer
          </button>
          <button 
            class="flex-1 py-2 px-4 rounded-md {paymentMethod === 'crypto' ? 'bg-purple-600' : 'bg-gray-700'}"
            on:click={() => paymentMethod = 'crypto'}
          >
            Crypto
          </button>
        </div>
        
        {#if paymentMethod === 'crypto'}
          <div>
            <label class="block text-gray-300 mb-1">Crypto Address</label>
            <input
              type="text"
              bind:value={cryptoAddress}
              placeholder="Enter your wallet address"
              class="w-full py-2 px-4 bg-gray-700 rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>
        {:else}
          <p class="text-gray-400 text-sm">Funds will be sent to your verified bank account.</p>
        {/if}
      </div>
    {/if}
    
    {#if error}
      <div class="bg-red-900 bg-opacity-50 text-red-200 p-3 rounded-md mb-4">
        {error}
      </div>
    {/if}
    
    {#if message}
      <div class="bg-green-900 bg-opacity-50 text-green-200 p-3 rounded-md mb-4">
        {message}
      </div>
    {/if}
    
    <button
      on:click={handleSubmit}
      disabled={loading}
      class="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {#if loading}
        Processing...
      {:else}
        {paymentType === 'deposit' ? 'Deposit Funds' : 'Request Withdrawal'}
      {/if}
    </button>
  </div>
</div> 