<script lang="ts">
  import { onMount } from 'svelte';
  
  export let userId = '';
  export let limit = 10;
  
  let transactions = [];
  let loading = true;
  let error = '';
  let currentPage = 0;
  let totalPages = 0;
  let filterType = 'all'; // 'all', 'deposit', 'withdrawal'
  
  onMount(() => {
    loadTransactions();
  });
  
  async function loadTransactions() {
    if (!userId) {
      error = 'User ID is required';
      loading = false;
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const offset = currentPage * limit;
      const type = filterType === 'all' ? '' : filterType;
      
      const response = await fetch(`/api/payment?userId=${userId}&limit=${limit}&offset=${offset}&type=${type}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        error = data.message || 'Failed to load transactions';
        return;
      }
      
      transactions = data.transactions || [];
      
      // Calculate total pages
      const total = data.pagination?.total || 0;
      totalPages = Math.ceil(total / limit);
    } catch (err) {
      console.error('Error loading transactions:', err);
      error = 'Failed to load transaction history';
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  function formatAmount(amount, type) {
    // Amount is in cents, convert to dollars
    const dollars = amount / 100;
    return type === 'deposit' ? `+$${dollars.toFixed(2)}` : `-$${dollars.toFixed(2)}`;
  }
  
  function nextPage() {
    if (currentPage < totalPages - 1) {
      currentPage++;
      loadTransactions();
    }
  }
  
  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      loadTransactions();
    }
  }
  
  function changeFilter(type) {
    filterType = type;
    currentPage = 0;
    loadTransactions();
  }
</script>

<div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-auto">
  <h2 class="text-2xl font-bold text-yellow-400 mb-4">Transaction History</h2>
  
  <!-- Filter options -->
  <div class="flex gap-2 mb-6">
    <button 
      class="py-2 px-4 rounded-md {filterType === 'all' ? 'bg-blue-600' : 'bg-gray-700'}"
      on:click={() => changeFilter('all')}
    >
      All
    </button>
    <button 
      class="py-2 px-4 rounded-md {filterType === 'deposit' ? 'bg-green-600' : 'bg-gray-700'}"
      on:click={() => changeFilter('deposit')}
    >
      Deposits
    </button>
    <button 
      class="py-2 px-4 rounded-md {filterType === 'withdrawal' ? 'bg-yellow-600' : 'bg-gray-700'}"
      on:click={() => changeFilter('withdrawal')}
    >
      Withdrawals
    </button>
  </div>
  
  {#if loading}
    <div class="text-center py-8">
      <div class="inline-block w-8 h-8 border-4 border-gray-400 border-t-yellow-400 rounded-full animate-spin"></div>
      <p class="mt-2 text-gray-300">Loading transactions...</p>
    </div>
  {:else if error}
    <div class="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-md">
      {error}
    </div>
  {:else if transactions.length === 0}
    <div class="text-center py-8 text-gray-400">
      <p>No transactions found.</p>
      {#if filterType !== 'all'}
        <button 
          class="text-yellow-400 underline mt-2"
          on:click={() => changeFilter('all')}
        >
          Show all transactions
        </button>
      {/if}
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left border-b border-gray-700">
            <th class="pb-2 pr-4">Date</th>
            <th class="pb-2 pr-4">Type</th>
            <th class="pb-2 pr-4">Amount</th>
            <th class="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each transactions as tx}
            <tr class="border-b border-gray-700 hover:bg-gray-700">
              <td class="py-3 pr-4">{formatDate(tx.timestamp)}</td>
              <td class="py-3 pr-4 capitalize">{tx.type}</td>
              <td class="py-3 pr-4 {tx.type === 'deposit' ? 'text-green-400' : 'text-yellow-400'}">
                {formatAmount(tx.amount, tx.type)}
              </td>
              <td class="py-3">
                <span class="px-2 py-1 rounded-full text-xs {tx.status === 'completed' ? 'bg-green-900 text-green-200' : tx.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'}">
                  {tx.status || 'completed'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex justify-between items-center mt-6">
        <button 
          class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === 0}
          on:click={prevPage}
        >
          Previous
        </button>
        
        <div class="text-gray-300">
          Page {currentPage + 1} of {totalPages}
        </div>
        
        <button 
          class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === totalPages - 1}
          on:click={nextPage}
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div> 