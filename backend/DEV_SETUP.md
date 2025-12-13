# Development Setup Guide

## Quick Start

### Minimal Required Environment Variables

To run the development server, you only need these **essential** variables:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/remie?schema=public"

# JWT Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server (REQUIRED)
PORT=5000
NODE_ENV=development
```

### Optional Services

These services are **optional** and will be automatically disabled if not configured:

#### Paystack Payment Gateway
```bash
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```
*Required for: Wallet funding, withdrawals, payment processing*

#### Cryptocurrency Support
```bash
POLYGON_RPC_URL=https://polygon-rpc.com
CRYPTO_PRIVATE_KEY=your-private-key-for-backend-wallet
USDT_CONTRACT_ADDRESS=0xc2132D05D31c914a87C6611C10748AEb04B58e8F
USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```
*Required for: USDT/USDC deposits and withdrawals*

#### Email Service
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@remie.app
```
*Required for: Email notifications, receipts, account verification*

## Running the Server

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your database credentials and JWT secret

3. Run database migrations:
```bash
npm run migrate
```

4. Start the development server:
```bash
npm run dev
```

The server will start even if optional services (Paystack, Crypto, Email) are not configured. Those features will simply be unavailable until you configure them.

## Service Status

When you start the server, you'll see warnings for any optional services that are disabled:

```
⚠ Paystack service is disabled - missing PAYSTACK_SECRET_KEY environment variable
⚠ Crypto service is disabled - missing environment variables (CRYPTO_PRIVATE_KEY, USDT_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS)
```

These warnings are normal in development if you haven't configured those services yet.

## Full Configuration

For a complete list of all available environment variables, see `.env.example`.
