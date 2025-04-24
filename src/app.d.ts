/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
  // interface Error {}
  interface Locals {
    userId: string | null;
    isAuthenticated: boolean;
    kycVerified: boolean;
  }
  // interface PageData {}
  // interface Platform {}
}

// Custom type definitions for our casino application
declare interface SpinRequest {
  betAmount: number;
  userId: string;
}

declare interface SpinResponse {
  symbols: string[];
  payout: number;
  winType: string | null;
  balance: number;
  odds?: number;
}

declare interface TransactionHistoryItem {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  paymentMethod?: string;
  details?: string;
}

declare interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

// Payment service types
declare interface PaymentResult {
  transaction: {
    id: string;
    userId: string;
    type: string;
    amount: number;
    status: string;
    timestamp: string;
    paymentMethod?: string;
    withdrawalMethod?: string;
  };
  balance: number;
}

declare interface TransactionHistoryResult {
  data: TransactionHistoryItem[];
  page: number;
  totalPages: number;
  totalItems: number;
}

// RNG utility type
declare class SeededRNG {
  constructor(seed: string);
  next(): number;
  nextInt(min: number, max: number): number;
} 