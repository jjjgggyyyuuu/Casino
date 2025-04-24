import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key');

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { amount, currency, metadata } = await request.json();

    // Validate required fields
    if (!amount || !currency) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret
    return json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating payment intent:', errorMessage);
    return json({ error: errorMessage }, { status: 500 });
  }
} 