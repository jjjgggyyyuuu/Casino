import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { 
  processDeposit, 
  processWithdrawal, 
  getTransactionHistory,
  type PaymentResult,
  type PaymentDetails,
  type TransactionHistoryOptions,
  type TransactionHistoryResult
} from '$lib/payment';

// Define KYC threshold amount in cents ($1000)
const KYC_THRESHOLD = 100000;

/**
 * Handle deposit requests
 * Processes payments via Stripe and updates user balance
 */
export async function POST({ request, locals }: RequestEvent): Promise<Response> {
  try {
    // Check if user is authenticated
    const userId = locals.userId;
    if (!userId) {
      return json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // Get deposit request data
    const data = await request.json();
    const { amount, token } = data;

    // Process deposit
    const result: PaymentResult = await processDeposit(
      amount,
      token,
      userId
    );

    return json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('Deposit processing error:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Server error" 
    }, { status: 500 });
  }
}

/**
 * Handle withdrawal requests
 * Processes withdrawals and updates user balance
 * Enforces KYC for larger withdrawals
 */
export async function PUT({ request, locals }: RequestEvent): Promise<Response> {
  try {
    // Check if user is authenticated
    const userId = locals.userId;
    if (!userId) {
      return json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // Get withdrawal request data
    const data = await request.json();
    const { amount, paymentDetails } = data;

    // Check if KYC is required and verified for higher withdrawals
    if (amount >= KYC_THRESHOLD) {
      const kycVerified = await checkKycStatus(userId);
      if (!kycVerified) {
        return json({
          success: false,
          message: "KYC verification required for withdrawals over $1000"
        }, { status: 403 });
      }
    }

    // Process withdrawal
    const result: PaymentResult = await processWithdrawal(
      amount,
      userId,
      paymentDetails as PaymentDetails
    );

    return json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('Withdrawal processing error:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Server error" 
    }, { status: 500 });
  }
}

/**
 * Handle transaction history requests
 * Returns paginated transaction history for a user
 */
export async function GET({ url, locals }: RequestEvent): Promise<Response> {
  try {
    // Check if user is authenticated
    const userId = locals.userId;
    if (!userId) {
      return json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // Get query parameters
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const type = url.searchParams.get('type') as 'deposit' | 'withdrawal' | null;

    // Get transaction history
    const historyOptions: TransactionHistoryOptions = { page, limit, type };
    const result: TransactionHistoryResult = await getTransactionHistory(userId, historyOptions);

    return json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Server error" 
    }, { status: 500 });
  }
}

/**
 * Check if a user has completed KYC verification
 * @param userId - User ID to check
 * @returns Promise resolving to boolean indicating KYC status
 */
async function checkKycStatus(userId: string): Promise<boolean> {
  // In a real implementation, this would check your KYC/AML service
  // For now, returning a placeholder value
  return false;
} 