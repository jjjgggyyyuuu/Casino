<script lang="ts">
  import { onMount } from 'svelte';
  
  export let userId = '';
  export let onComplete = () => {};
  export let onCancel = () => {};
  
  let isVisible = true;
  let currentStep = 1; // 1: ID selection, 2: Upload, 3: Processing, 4: Complete
  let idType = 'passport';
  let uploadProgress = 0;
  let uploadComplete = false;
  let processingComplete = false;
  let error = '';
  
  // Mock file upload
  let selectedFile = null;
  let previewUrl = '';
  
  // File input ref
  let fileInput;
  
  onMount(() => {
    // Check if KYC has already been completed
    const kycStatus = localStorage.getItem(`kyc_status_${userId}`);
    if (kycStatus === 'verified') {
      isVisible = false;
      onComplete();
    }
  });
  
  function handleIdTypeSelect(type) {
    idType = type;
  }
  
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error = 'File too large. Maximum size is 5MB.';
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      error = 'Invalid file type. Please upload JPEG, PNG, or PDF.';
      return;
    }
    
    selectedFile = file;
    error = '';
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      previewUrl = '';
    }
  }
  
  function handleUpload() {
    if (!selectedFile) {
      error = 'Please select a file to upload';
      return;
    }
    
    // Reset states
    uploadProgress = 0;
    uploadComplete = false;
    error = '';
    
    // Simulated upload progress
    const interval = setInterval(() => {
      uploadProgress += 10;
      
      if (uploadProgress >= 100) {
        clearInterval(interval);
        uploadComplete = true;
        currentStep = 3; // Move to processing step
        
        // Simulate processing delay
        setTimeout(() => {
          processingComplete = true;
          currentStep = 4; // Move to complete step
          
          // Store KYC status
          localStorage.setItem(`kyc_status_${userId}`, 'verified');
        }, 3000);
      }
    }, 500);
  }
  
  function handleTriggerFileInput() {
    fileInput.click();
  }
  
  function handleCancel() {
    isVisible = false;
    onCancel();
  }
  
  function handleComplete() {
    isVisible = false;
    onComplete();
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative">
      <h2 class="text-2xl font-bold text-yellow-400 mb-4">
        {#if currentStep === 4}
          KYC Verification Complete
        {:else}
          KYC Verification Required
        {/if}
      </h2>
      
      {#if currentStep !== 4}
        <p class="text-white mb-6">
          You're depositing big bucks—upload your ID, bitch.
        </p>
      {/if}
      
      <!-- Progress steps -->
      <div class="flex mb-8">
        <div class="flex-1 flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 1 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}">
            1
          </div>
          <div class="text-xs mt-1 {currentStep >= 1 ? 'text-white' : 'text-gray-500'}">Select ID</div>
        </div>
        <div class="flex-1 flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 2 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}">
            2
          </div>
          <div class="text-xs mt-1 {currentStep >= 2 ? 'text-white' : 'text-gray-500'}">Upload</div>
        </div>
        <div class="flex-1 flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 3 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}">
            3
          </div>
          <div class="text-xs mt-1 {currentStep >= 3 ? 'text-white' : 'text-gray-500'}">Processing</div>
        </div>
        <div class="flex-1 flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center {currentStep >= 4 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}">
            4
          </div>
          <div class="text-xs mt-1 {currentStep >= 4 ? 'text-white' : 'text-gray-500'}">Complete</div>
        </div>
      </div>
      
      {#if error}
        <div class="bg-red-900 bg-opacity-50 text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      {/if}
      
      <!-- Step 1: ID Selection -->
      {#if currentStep === 1}
        <div class="mb-6">
          <label class="block text-gray-300 mb-2">Select ID Document Type</label>
          <div class="grid grid-cols-2 gap-3">
            <button 
              class="py-3 px-4 rounded-md flex flex-col items-center justify-center {idType === 'passport' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}"
              on:click={() => handleIdTypeSelect('passport')}
            >
              <span class="text-xl mb-1">🛂</span>
              <span>Passport</span>
            </button>
            <button 
              class="py-3 px-4 rounded-md flex flex-col items-center justify-center {idType === 'drivers_license' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}"
              on:click={() => handleIdTypeSelect('drivers_license')}
            >
              <span class="text-xl mb-1">🚗</span>
              <span>Driver's License</span>
            </button>
            <button 
              class="py-3 px-4 rounded-md flex flex-col items-center justify-center {idType === 'national_id' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}"
              on:click={() => handleIdTypeSelect('national_id')}
            >
              <span class="text-xl mb-1">🪪</span>
              <span>National ID</span>
            </button>
            <button 
              class="py-3 px-4 rounded-md flex flex-col items-center justify-center {idType === 'residence_permit' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}"
              on:click={() => handleIdTypeSelect('residence_permit')}
            >
              <span class="text-xl mb-1">📄</span>
              <span>Residence Permit</span>
            </button>
          </div>
        </div>
        
        <div class="flex justify-between">
          <button
            on:click={handleCancel}
            class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
          >
            Cancel
          </button>
          <button
            on:click={() => currentStep = 2}
            class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md"
          >
            Next
          </button>
        </div>
      
      <!-- Step 2: Upload -->
      {:else if currentStep === 2}
        <div class="mb-6">
          <label class="block text-gray-300 mb-2">Upload Your {idType.replace('_', ' ')} (Front)</label>
          
          <input 
            type="file" 
            bind:this={fileInput}
            on:change={handleFileSelect}
            class="hidden" 
            accept="image/jpeg,image/png,application/pdf"
          />
          
          <!-- Upload area -->
          <div 
            class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500 transition-colors"
            on:click={handleTriggerFileInput}
          >
            {#if previewUrl}
              <img src={previewUrl} alt="ID Preview" class="max-h-40 mx-auto mb-4">
              <p class="text-gray-300">{selectedFile.name}</p>
            {:else}
              <div class="text-4xl mb-2">📄</div>
              <p class="text-gray-300">Click to select a file or drag and drop</p>
              <p class="text-xs text-gray-500 mt-1">JPEG, PNG or PDF, max 5MB</p>
            {/if}
          </div>
        </div>
        
        <div class="flex justify-between">
          <button
            on:click={() => currentStep = 1}
            class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
          >
            Back
          </button>
          <button
            on:click={handleUpload}
            disabled={!selectedFile}
            class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      
      <!-- Step 3: Processing -->
      {:else if currentStep === 3}
        <div class="mb-6 text-center">
          <div class="w-20 h-20 mx-auto mb-4 border-4 border-gray-600 border-t-yellow-500 rounded-full animate-spin"></div>
          
          <p class="text-white mb-3">
            {#if uploadComplete}
              Processing your document...
            {:else}
              Uploading your document...
            {/if}
          </p>
          
          {#if !uploadComplete}
            <div class="bg-gray-700 h-2 rounded-full overflow-hidden">
              <div class="bg-yellow-500 h-full" style="width: {uploadProgress}%"></div>
            </div>
            <p class="text-xs text-gray-400 mt-1">{uploadProgress}% complete</p>
          {/if}
        </div>
      
      <!-- Step 4: Complete -->
      {:else if currentStep === 4}
        <div class="text-center mb-6">
          <div class="w-20 h-20 mx-auto mb-4 bg-green-800 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <p class="text-white mb-1">Your verification is complete!</p>
          <p class="text-gray-400 text-sm mb-6">You can now make large deposits and withdrawals.</p>
          
          <button
            on:click={handleComplete}
            class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-md"
          >
            Continue to Casino
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if} 