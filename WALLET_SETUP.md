# Wallet Setup with Paystack Integration

## Overview

The REMIE wallet system has been redesigned with full Paystack integration for secure payments and withdrawals.

## Critical Setup Requirements

### 1. Paystack Configuration

You **MUST** configure Paystack API keys in Firebase Functions for the wallet to work:

1. Go to your Firebase Console
2. Navigate to **Functions > Configuration**
3. Add the following environment variables:

```bash
PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY
```

### How to get Paystack API Keys:

1. Sign up or log in to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to **Settings > API Keys & Webhooks**
3. Copy your **Secret Key** and **Public Key**
4. Use **Test Keys** for development/testing
5. Switch to **Live Keys** for production

### 2. Set Firebase Functions Environment Variables

Using Firebase CLI:

```bash
# Set Paystack Secret Key
firebase functions:config:set paystack.secret_key="sk_live_YOUR_SECRET_KEY"

# Verify configuration
firebase functions:config:get
```

Or via Firebase Console:
1. Go to **Firebase Console > Functions**
2. Click on **Configuration** tab
3. Add environment variables:
   - Key: `PAYSTACK_SECRET_KEY`
   - Value: `sk_live_YOUR_SECRET_KEY`

### 3. Deploy Functions

After setting the configuration, redeploy your functions:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Features Implemented

### ✅ Full Paystack Integration

- **Fund Wallet**: Initialize payments via Paystack
- **Verify Payments**: Automatic verification after successful payment
- **Withdraw Funds**: Transfer money to Nigerian bank accounts
- **Account Resolution**: Verify bank account details before withdrawal
- **Banks List**: Fetch all Nigerian banks from Paystack API

### ✅ API Endpoints (Firebase Functions)

All endpoints are available at: `https://YOUR_PROJECT.web.app/api/wallet`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wallet` | GET | Get wallet balance |
| `/wallet/fund` | POST | Initialize wallet funding |
| `/wallet/verify/:reference` | GET | Verify payment |
| `/wallet/withdraw` | POST | Withdraw funds |
| `/wallet/transactions` | GET | Get transaction history |
| `/wallet/banks` | GET | List Nigerian banks |
| `/wallet/resolve-account` | POST | Verify bank account |

### ✅ Frontend UI/UX Improvements

- Modern gradient design with card layout
- Real-time balance display
- Improved transaction list
- Enhanced modals for funding and withdrawal
- Better error handling and user feedback
- Responsive design for mobile and desktop

## Wallet Flow

### Funding Flow:

1. User enters amount (₦100 - ₦1,000,000)
2. System creates pending payment record
3. Paystack payment initialized
4. User redirected to Paystack payment page
5. User completes payment
6. User redirected back to wallet page
7. Payment verified with Paystack API
8. Wallet balance updated
9. Success notification shown

### Withdrawal Flow:

1. User selects bank and enters account number
2. Account verified via Paystack API
3. Account name displayed for confirmation
4. User enters withdrawal amount
5. Transfer recipient created on Paystack
6. Transfer initiated via Paystack API
7. Available balance immediately decremented
8. Transfer processed by Paystack
9. Funds sent to bank account

## Testing

### Test with Paystack Test Mode:

1. Use Paystack **Test Keys** (starts with `sk_test_` and `pk_test_`)
2. Use Paystack test card numbers:
   - **Success**: 4084084084084081
   - **Insufficient Funds**: 5060666666666666666
   - **Invalid Card**: 5078585078585078585

3. Test CVV: Any 3 digits
4. Test Expiry: Any future date
5. Test PIN: 1234

### Test Bank Accounts:

For withdrawals in test mode, use:
- **Account Number**: 0690000031 (Access Bank)
- **Account Number**: 0690000032 (GTBank)

## Security Notes

- ✅ All payments processed through Paystack (PCI-DSS compliant)
- ✅ No card details stored in your database
- ✅ API keys stored securely in Firebase Functions config
- ✅ Account verification before withdrawals
- ✅ Daily and monthly withdrawal limits enforced

## Troubleshooting

### Issue: "Paystack not configured" error

**Solution**: Set the `PAYSTACK_SECRET_KEY` environment variable in Firebase Functions configuration.

```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY"
firebase deploy --only functions
```

### Issue: Payment verification fails

**Solution**: Check that:
1. Paystack webhook secret is correct
2. Payment reference is valid
3. Payment was actually completed on Paystack

### Issue: Withdrawal fails

**Solution**: Ensure:
1. Sufficient balance in wallet
2. Valid Nigerian bank account (10 digits)
3. Paystack has funds in transfer balance
4. Account name verified before withdrawal

### Issue: Banks list not loading

**Solution**: The system has a fallback to major Nigerian banks if Paystack API fails. Check Paystack API status or your API key.

## Production Checklist

Before going live:

- [ ] Switch to Paystack **Live Keys**
- [ ] Test funding with real cards
- [ ] Test withdrawal to real bank accounts
- [ ] Verify webhook is working
- [ ] Set up Paystack webhook URL
- [ ] Enable 2FA on Paystack account
- [ ] Review daily/monthly limits
- [ ] Test error scenarios
- [ ] Monitor transaction logs

## Support

For Paystack-related issues:
- Email: support@paystack.com
- Documentation: https://paystack.com/docs
- Status Page: https://status.paystack.com

For REMIE wallet issues:
- Check Firebase Functions logs
- Review Firestore wallet and payments collections
- Verify API configuration

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Structure

### Wallets Collection

```typescript
{
  userId: string;
  balance: number;
  availableBalance: number;
  ledgerBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Payments Collection

```typescript
{
  userId: string;
  type: 'WALLET_FUNDING' | 'WITHDRAWAL';
  method: 'CARD' | 'BANK_TRANSFER';
  amount: number;
  reference: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  description: string;
  metadata: object;
  gatewayResponse: object;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

---

**Last Updated**: 2025-01-10
**Version**: 2.0.0
