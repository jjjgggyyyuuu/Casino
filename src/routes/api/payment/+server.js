// @ts-check
import { json, error } from '@sveltejs/kit';
/** 
 * @typedef {import('@sveltejs/kit').RequestEvent} RequestEvent 
 */

// Import from relative path instead of alias to fix module resolution
import * as paymentService from '../../../lib/payment.js';

/**
 * @typedef {Object} TransactionResult
 * @property {Object} [transaction] - The transaction details
 * @property {number} balance - The updated balance
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - Transaction ID
 * @property {string} userId - User identifier
 * @property {string} type - Transaction type (deposit/withdrawal)
 * @property {number} amount - Transaction amount in cents
 * @property {string} paymentId - Payment processor ID
 * @property {Date|string} timestamp - Transaction date/time
 * @property {string} [status] - Transaction status
 */

/**
 * @typedef {Object} TransactionHistoryItem
 * @property {string} id - Transaction ID
 * @property {string} type - Transaction type (deposit/withdrawal)
 * @property {number} amount - Transaction amount
 * @property {string} status - Transaction status
 * @property {string} date - Transaction date
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} page - Page number
 * @property {number} limit - Items per page
 * @property {string} [type] - Filter by transaction type
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Transaction[]} transactions - Array of transaction items
 * @property {Object} pagination - Pagination information
 * @property {number} pagination.total - Total number of items
 * @property {number} pagination.page - Current page
 * @property {number} pagination.pages - Total number of pages
 */

/**
 * Handle deposit requests
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
  try {
    const { amount, paymentMethod } = await event.request.json();
    
    // Get user ID from session (this would be replaced with actual auth logic)
    // This is a mock implementation - in production, use proper authentication
    const userId = 'user123'; // Mock user ID
    
    // Validate amount
    if (!amount || amount < 10 || amount > 5000) {
      throw error(400, { message: 'Invalid deposit amount. Min: $10, Max: $5000' });
    }
    
    // Process deposit through Stripe
    // Convert dollars to cents for the payment processor
    const amountInCents = Math.round(amount * 100);
    const result = await paymentService.processDeposit(amountInCents, paymentMethod, userId);
    
    return json({
      success: true,
      transaction: result.transaction,
      balance: result.balance
    });
  } catch (err) {
    console.error('Deposit error:', err);
    const status = err instanceof Error && 'status' in err ? Number(err.status) || 500 : 500;
    return json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to process deposit'
    }, { status });
  }
}

/**
 * Handle withdrawal requests
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function PUT(event) {
  try {
    const { amount, withdrawalMethod } = await event.request.json();
    
    // Mock user authentication - in production, use proper authentication
    const userId = 'user123'; // Mock user ID
    
    // Validate amount
    if (!amount || amount < 20 || amount > 10000) {
      throw error(400, { message: 'Invalid withdrawal amount. Min: $20, Max: $10000' });
    }
    
    // Check KYC status for higher withdrawals
    if (amount > 1000) {
      const kycVerified = await checkKycStatus(userId);
      if (!kycVerified) {
        throw error(403, { message: 'KYC verification required for withdrawals over $1000' });
      }
    }
    
    // Process withdrawal
    const result = await paymentService.processWithdrawal(userId, amount, withdrawalMethod);
    
    return json({
      success: true,
      transaction: result.transaction,
      balance: result.balance
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    const status = err instanceof Error && 'status' in err ? Number(err.status) || 500 : 500;
    return json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to process withdrawal'
    }, { status });
  }
}

/**
 * Handle transaction history requests
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function GET(event) {
  try {
    const url = new URL(event.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const typeParam = url.searchParams.get('type');
    
    // Validate type parameter
    const type = typeParam === 'deposit' || typeParam === 'withdrawal' ? typeParam : null;
    
    // Mock user authentication - in production, use proper authentication
    const userId = 'user123'; // Mock user ID
    
    // Fetch transaction history
    const transactions = await paymentService.getTransactionHistory(userId, {
      page,
      limit,
      type
    });
    
    // Format the response based on the PaginatedResponse interface
    return json({
      success: true,
      data: transactions.data,
      page: transactions.page,
      totalPages: transactions.totalPages,
      totalItems: transactions.totalItems
    });
  } catch (err) {
    console.error('Transaction history error:', err);
    const status = err instanceof Error && 'status' in err ? Number(err.status) || 500 : 500;
    return json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch transaction history'
    }, { status });
  }
}

/**
 * Check KYC verification status
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function checkKycStatus(userId) {
  // Placeholder - would be replaced with actual KYC verification logic
  return Promise.resolve(true);
} 