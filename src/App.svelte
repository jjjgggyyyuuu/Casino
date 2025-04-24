<script lang="ts">
  import { onMount } from 'svelte';
  import './app.css';
  import confetti from 'canvas-confetti';
  
  let balance = 100; // Starting with fewer free credits
  let betAmount = 10;
  let reels = [
    ['🍊', '🍋', '🍒'],
    ['🍊', '🍋', '🍒'],
    ['🍊', '🍋', '🍒']
  ];
  let spinning = false;
  let result = 'Place your bet and spin!';
  let stats = { rtp: '0.00', spins: 0, dailySeed: '' };
  let verification = { hash: '', seed: '' };
  let isWin = false;
  
  // Credit system
  let showPurchaseModal = false;
  let selectedPackage = null;
  let hasPurchased = false;
  let freeCreditsUsed = false;
  let processingPayment = false;
  let paymentSuccess = false;
  let paymentError = '';
  
  // Stripe variables
  let stripeLoaded = false;
  let stripe: any;
  let elements: any;
  let card: any;
  let paymentIntent: any;
  
  const creditPackages = [
    { id: 1, name: 'Small', credits: 100, price: 1.99, priceDisplay: '$1.99' },
    { id: 2, name: 'Medium', credits: 300, price: 4.99, priceDisplay: '$4.99' },
    { id: 3, name: 'Large', credits: 1000, price: 9.99, priceDisplay: '$9.99' },
    { id: 4, name: 'Whale', credits: 5000, price: 39.99, priceDisplay: '$39.99' }
  ];

  // Function to increase bet amount - updated for higher limits
  function increaseBet() {
    if (betAmount < 500) {
      if (betAmount < 100) {
        betAmount += 10;
      } else if (betAmount < 200) {
        betAmount += 25;
      } else if (betAmount < 400) {
        betAmount += 50;
      } else {
        betAmount = 500;
      }
    }
  }

  // Function to decrease bet amount - updated for higher limits
  function decreaseBet() {
    if (betAmount > 10) {
      if (betAmount <= 100) {
        betAmount -= 10;
      } else if (betAmount <= 200) {
        betAmount -= 25;
      } else if (betAmount <= 500) {
        betAmount -= 50;
      }
    }
  }
  
  // Check if player can spin
  function canSpin() {
    return !spinning && balance >= betAmount;
  }
  
  // Load Stripe.js
  function loadStripe() {
    if (typeof window !== 'undefined' && !stripeLoaded) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = initializeStripe;
      document.body.appendChild(script);
      stripeLoaded = true;
    }
  }
  
  // Initialize Stripe
  function initializeStripe() {
    // Replace with your actual publishable key
    stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
    elements = stripe.elements();
    
    const style = {
      base: {
        color: '#f8f8f2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        '::placeholder': {
          color: '#6272a4'
        },
      },
      invalid: {
        color: '#ff5555',
        iconColor: '#ff5555'
      }
    };
    
    // Create card element
    card = elements.create('card', { style });
  }
  
  // Mount card element
  function mountCardElement() {
    if (card && document.getElementById('card-element')) {
      card.mount('#card-element');
      card.addEventListener('change', function(event) {
        document.getElementById('card-errors').textContent = event.error ? event.error.message : '';
      });
    }
  }
  
  // Create payment intent
  async function createPaymentIntent(pkg) {
    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: Math.round(pkg.price * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            packageId: pkg.id,
            packageName: pkg.name,
            credits: pkg.credits
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      paymentError = 'Failed to initiate payment process. Please try again.';
      return null;
    }
  }
  
  // Process payment with Stripe
  async function processStripePayment() {
    if (!stripe || !card || !selectedPackage) return;
    
    try {
      processingPayment = true;
      paymentError = '';
      
      // Create a payment intent on the server
      const clientSecret = await createPaymentIntent(selectedPackage);
      
      if (!clientSecret) {
        processingPayment = false;
        return;
      }
      
      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: card }
      });
      
      if (result.error) {
        paymentError = result.error.message;
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment successful
        paymentSuccess = true;
        balance += selectedPackage.credits;
        hasPurchased = true;
        
        // Record the successful payment in your backend
        try {
          await fetch('/api/payment/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paymentIntentId: result.paymentIntent.id,
              packageId: selectedPackage.id,
              credits: selectedPackage.credits,
              amount: selectedPackage.price
            })
          });
        } catch (e) {
          console.error('Error recording payment:', e);
          // Continue anyway since the user got their credits
        }
        
        setTimeout(() => {
          showPurchaseModal = false;
          selectedPackage = null;
          paymentSuccess = false;
        }, 1500);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      paymentError = 'An error occurred during payment processing.';
    } finally {
      processingPayment = false;
    }
  }
  
  // Purchase credits
  function purchaseCredits(pkg) {
    selectedPackage = pkg;
    paymentError = '';
    
    // If Stripe is already initialized, we can show the payment form
    if (stripe && elements) {
      setTimeout(mountCardElement, 100);
    }
  }

  onMount(() => {
    // Initialize game
    loadStripe();
    
    // If the modal is shown, mount the card element when it's ready
    if (showPurchaseModal && stripe && elements) {
      setTimeout(mountCardElement, 100);
    }
  });

  async function spinReels() {
    if (!canSpin()) {
      if (balance < betAmount) {
        showPurchaseModal = true;
        if (stripe && elements) {
          setTimeout(mountCardElement, 100);
        }
        return;
      }
      return;
    }
    
    // Track that free credits have been used
    if (!hasPurchased && balance <= 100) {
      freeCreditsUsed = true;
    }
    
    spinning = true;
    result = 'Spinning...';
    isWin = false;
    
    // Visual spinning effect
    const spinInterval = setInterval(() => {
      reels = reels.map(reel => {
        const newReel = [...reel];
        // Shuffle symbols
        const temp = newReel.pop();
        newReel.unshift(temp);
        return newReel;
      });
    }, 100);
    
    try {
      // Get actual result from server
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance, betAmount })
      });
      
      const data = await response.json();
      
      if (data.error) {
        result = data.error;
        clearInterval(spinInterval);
        spinning = false;
      } else {
        // Stop the visual spinning after 1 second
        setTimeout(() => {
          clearInterval(spinInterval);
          reels = data.reels;
          balance = data.balance;
          result = data.result;
          stats = data.stats || stats;
          verification = data.verification || verification;
          isWin = result.includes('Win');
          spinning = false;
          
          // Check if balance is depleted
          if (balance < betAmount) {
            setTimeout(() => {
              showPurchaseModal = true;
              if (stripe && elements) {
                setTimeout(mountCardElement, 100);
              }
            }, 1500);
          }
          
          // Show confetti for wins
          if (isWin) {
            triggerConfetti();
          }
        }, 1000);
      }
    } catch (error) {
      result = 'Error connecting to server';
      clearInterval(spinInterval);
      spinning = false;
    }
  }

  function triggerConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
</script>

<main>
  <div class="app">
    <h1>Crypto Casino Slot</h1>
    
    <div class="slot-machine">
      <div class="balance">
        Balance: {balance} tokens
        {#if !hasPurchased && balance <= 100}
          <span class="free-credits-label">FREE CREDITS</span>
        {/if}
      </div>
      
      <div class="reels" class:spinning>
        {#each reels as reel, reelIndex}
          <div class="reel">
            {#each reel as symbol, symbolIndex}
              <div class="symbol" class:highlighted={symbolIndex === 1 && !spinning}>
                {symbol}
              </div>
            {/each}
          </div>
        {/each}
      </div>
      
      <div class="controls">
        <div class="bet-controls">
          <button class="bet-button" on:click={decreaseBet} disabled={spinning}>-</button>
          <div class="bet-amount">Bet: {betAmount}</div>
          <button class="bet-button" on:click={increaseBet} disabled={spinning}>+</button>
        </div>
        
        <button class="spin-button" on:click={spinReels} disabled={!canSpin()}>
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>
    </div>
    
    <div class="result" class:win={isWin} class:loss={!isWin && result !== 'Place your bet and spin!'}>
      {result}
    </div>
    
    <div class="stats">
      RTP: {stats.rtp} | Spins: {stats.spins}
      {#if verification.hash}
        <div class="verification">
          Verification: {verification.hash}
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Purchase credits modal -->
  {#if showPurchaseModal}
    <div class="modal-overlay">
      <div class="modal">
        <h2>Purchase Credits</h2>
        
        {#if balance === 0}
          <p>You've used all your credits! Purchase more to keep playing.</p>
        {:else}
          <p>Your balance is low. Purchase more credits to keep playing.</p>
        {/if}
        
        <!-- Package selection phase -->
        {#if !selectedPackage}
          <div class="package-grid">
            {#each creditPackages as pkg}
              <div class="credit-package" on:click={() => purchaseCredits(pkg)}>
                <h3>{pkg.name} Package</h3>
                <div class="credits">{pkg.credits} Credits</div>
                <div class="price">{pkg.priceDisplay}</div>
              </div>
            {/each}
          </div>
          
          <button class="close-button" on:click={() => showPurchaseModal = false}>
            Close
          </button>
        {:else if paymentSuccess}
          <!-- Success state -->
          <div class="payment-success">
            <div class="success-icon">✓</div>
            <p>Payment successful!</p>
            <p>{selectedPackage.credits} credits have been added to your account.</p>
            <button class="action-button" on:click={() => {
              showPurchaseModal = false;
              selectedPackage = null;
              paymentSuccess = false;
            }}>
              Continue Playing
            </button>
          </div>
        {:else}
          <!-- Payment form -->
          <div class="payment-form">
            <h3>Payment Details</h3>
            <p>Package: {selectedPackage.name} - {selectedPackage.priceDisplay}</p>
            
            <div class="form-group">
              <label for="card-element">Credit or debit card</label>
              <div id="card-element" class="stripe-element"></div>
              <div id="card-errors" class="error-message"></div>
            </div>
            
            {#if paymentError}
              <div class="error-message">{paymentError}</div>
            {/if}
            
            <div class="form-actions">
              <button 
                class="action-button" 
                on:click={processStripePayment} 
                disabled={processingPayment}
              >
                {processingPayment ? 'Processing...' : `Pay ${selectedPackage.priceDisplay}`}
              </button>
              
              <button 
                class="cancel-button" 
                on:click={() => selectedPackage = null} 
                disabled={processingPayment}
              >
                Back
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background-color: #1e1e2e;
    color: white;
  }

  .app {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1rem;
  }

  h1 {
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
    font-size: 2rem;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .balance {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #f8f8f2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .free-credits-label {
    background-color: #50fa7b;
    color: #282a36;
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .slot-machine {
    background: linear-gradient(145deg, #2c2c44, #181825);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 480px;
    margin-bottom: 1.5rem;
    border: 2px solid #ffd700;
  }

  .reels {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
    background-color: #11111b;
    padding: 0.75rem;
    border-radius: 8px;
    border: 2px solid #313244;
  }

  .reel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 220px;
    background: #232334;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .symbol {
    font-size: 3rem;
    height: 73px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center;
    transition: transform 0.1s ease-in-out;
  }

  .symbol.highlighted {
    background-color: rgba(255, 215, 0, 0.2);
    box-shadow: 0 0 15px #ffd700;
    border-radius: 5px;
  }

  .spinning .symbol {
    animation: blur 0.2s infinite;
  }

  @keyframes blur {
    0% { filter: blur(0); }
    50% { filter: blur(4px); }
    100% { filter: blur(0); }
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .bet-controls {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    margin-bottom: 0.75rem;
  }

  .bet-amount {
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f8f8f2;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .spin-button {
    background: linear-gradient(145deg, #ffd700, #e6c000);
    color: #11111b;
    width: 80%;
    max-width: 220px;
    margin: 0 auto;
    padding: 0.75rem;
    font-size: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .spin-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }

  .spin-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .spin-button:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .bet-button {
    background-color: #313244;
    color: #f8f8f2;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    border-radius: 50%;
  }

  .bet-button:hover {
    background-color: #45475a;
  }

  .result {
    font-size: 1.2rem;
    margin: 0.75rem 0;
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    background-color: rgba(49, 50, 68, 0.5);
    width: 90%;
    max-width: 480px;
    transition: all 0.3s ease;
  }

  .win {
    color: #50fa7b;
    background-color: rgba(80, 250, 123, 0.2);
    animation: pulse 2s infinite;
  }

  .loss {
    color: #ff5555;
    background-color: rgba(255, 85, 85, 0.1);
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(80, 250, 123, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(80, 250, 123, 0); }
    100% { box-shadow: 0 0 0 0 rgba(80, 250, 123, 0); }
  }

  .stats {
    font-size: 0.9rem;
    color: #8893a1;
    margin-top: 0.75rem;
    text-align: center;
  }

  .verification {
    font-size: 0.75rem;
    color: #6272a4;
    margin-top: 0.4rem;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .modal {
    background: linear-gradient(145deg, #2c2c44, #181825);
    border-radius: 10px;
    padding: 1.5rem;
    width: 90%;
    max-width: 450px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
    border: 2px solid #bd93f9;
    text-align: center;
  }
  
  .modal h2 {
    color: #bd93f9;
    margin-top: 0;
    font-size: 1.5rem;
  }
  
  .package-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .credit-package {
    background-color: #313244;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #44475a;
  }
  
  .credit-package:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    background-color: #44475a;
  }
  
  .credit-package h3 {
    margin: 0 0 0.5rem 0;
    color: #f8f8f2;
    font-size: 1rem;
  }
  
  .credits {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffb86c;
    margin-bottom: 0.5rem;
  }
  
  .price {
    color: #8be9fd;
    font-weight: bold;
  }
  
  .close-button {
    background-color: #44475a;
    color: #f8f8f2;
    padding: 0.5rem 1.5rem;
    margin-top: 1rem;
  }
  
  .close-button:hover {
    background-color: #6272a4;
  }
  
  /* Payment form styles */
  .payment-form {
    text-align: left;
    margin-top: 1rem;
  }
  
  .payment-form h3 {
    color: #f8f8f2;
    margin-top: 0;
    font-size: 1.2rem;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #f8f8f2;
    font-size: 0.9rem;
  }
  
  .stripe-element {
    background-color: #282a36;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #44475a;
    margin-bottom: 0.5rem;
    height: 2.5rem;
  }
  
  .error-message {
    color: #ff5555;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .action-button {
    background-color: #50fa7b;
    color: #282a36;
    font-weight: bold;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    flex: 1;
  }
  
  .action-button:hover:not(:disabled) {
    background-color: #69ff94;
    transform: translateY(-2px);
  }
  
  .action-button:disabled {
    background-color: #44475a;
    color: #6272a4;
    cursor: not-allowed;
  }
  
  .cancel-button {
    background-color: #44475a;
    color: #f8f8f2;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
  }
  
  .cancel-button:hover:not(:disabled) {
    background-color: #6272a4;
  }
  
  /* Payment success state */
  .payment-success {
    text-align: center;
    padding: 1rem 0;
  }
  
  .success-icon {
    font-size: 3rem;
    color: #50fa7b;
    margin-bottom: 1rem;
    background-color: rgba(80, 250, 123, 0.2);
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem auto;
  }

  /* Responsive adjustments */
  @media (min-width: 768px) {
    .slot-machine {
      width: 80%;
      max-width: 550px;
    }

    .reel {
      height: 250px;
    }

    .symbol {
      font-size: 3.5rem;
      height: 83px;
    }

    h1 {
      font-size: 2.2rem;
    }
    
    .package-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .slot-machine {
      width: 60%;
      max-width: 600px;
    }

    .reel {
      height: 270px;
    }

    .symbol {
      font-size: 3.8rem;
      height: 90px;
    }
    
    .package-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>

<div style="display: contents">
  <slot />
</div>
