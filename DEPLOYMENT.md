# Deployment Guide for Crypto Casino Slot on Hostinger

This guide will help you deploy the Crypto Casino Slot game on Hostinger's web hosting service.

## Prerequisites

1. A Hostinger account with web hosting
2. Access to Hostinger's File Manager or FTP credentials
3. A Stripe account with API keys (for payment processing)

## Deployment Steps

### 1. Prepare Environment Variables

Copy the `.env.example` file to `.env` and update it with your actual Stripe API keys:

```
STRIPE_SECRET_KEY=sk_live_your_actual_live_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key_here
NODE_ENV=production
```

**IMPORTANT:** Always use your **live** Stripe API keys for production environments.

### 2. Upload Files to Hostinger

1. Extract the `crypto-casino-slot.zip` file on your local machine
2. Log in to your Hostinger account
3. Navigate to File Manager or use FTP to connect to your hosting
4. Upload the entire `dist` folder to your desired location (usually the public_html folder)

### 3. Configure Hostinger for Single-Page Application

If you're deploying to a subdirectory, you'll need to create an `.htaccess` file in your hosting directory with the following content:

```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

This ensures that all routes are properly handled by the SPA.

### 4. Set Up Environment Variables on Hostinger

Hostinger doesn't directly support `.env` files, so you'll need to:

1. Go to your Hostinger control panel
2. Navigate to "Advanced" > "PHP Configuration"
3. Add your environment variables in the "Environment Variables" section
4. Save changes

### 5. Test Payment Processing

After deployment:

1. Make a small test deposit to ensure Stripe integration is working correctly
2. Check that transaction data is being properly stored
3. Verify that withdrawals can be processed

### 6. Troubleshooting

If you encounter issues with Stripe integration:

1. Check browser console for errors
2. Verify that your Stripe keys are correctly set in the environment variables
3. Ensure your Stripe account is properly configured for live payments
4. Confirm that your domain is whitelisted in your Stripe dashboard

## Security Notes

1. Never expose your Stripe secret key in client-side code
2. Regularly audit access logs for suspicious activity
3. Implement proper KYC/AML procedures for deposits over $1,000
4. Follow responsible gambling guidelines

## Support

If you need further assistance with deployment, contact:
- Hostinger Support: support@hostinger.com
- Stripe Support: https://support.stripe.com 