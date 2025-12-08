# REMIE API - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Paystack account (test/live keys)
- Remita merchant account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd remie

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:5000`

---

## 📚 API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Register a new user
```http
POST /auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "institution": "University of Lagos",
  "studentId": "UL/2024/001"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 💳 Wallet Operations

### Get Wallet Balance
```http
GET /wallet
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "balance": 50000,
    "availableBalance": 48000,
    "ledgerBalance": 50000,
    "usdtBalance": 0,
    "usdcBalance": 0,
    "dailyLimit": 100000,
    "monthlyLimit": 500000
  }
}
```

### Fund Wallet
```http
POST /wallet/fund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000,
  "callbackUrl": "https://yourapp.com/payment/callback"
}

Response:
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "REMIE_1234567890_ABC123",
    "accessCode": "abc123xyz"
  }
}
```

**Next Steps:**
1. Redirect user to `authorizationUrl`
2. User completes payment on Paystack
3. Paystack redirects to `callbackUrl`
4. Verify payment using the reference

### Verify Payment
```http
GET /wallet/verify/REMIE_1234567890_ABC123
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Wallet funded successfully",
  "data": {
    "payment": { ... },
    "wallet": {
      "balance": 60000,
      "availableBalance": 60000
    }
  }
}
```

### Withdraw to Bank
```http
POST /wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "bankAccount": {
    "accountNumber": "0123456789",
    "bankCode": "058",
    "accountName": "John Doe"
  },
  "reason": "Withdrawal"
}

Response:
{
  "success": true,
  "message": "Withdrawal initiated. Funds will be sent shortly.",
  "data": {
    "payment": { ... },
    "wallet": { ... }
  }
}
```

### Get Nigerian Banks
```http
GET /wallet/banks
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    { "name": "GTBank", "code": "058", "id": 9 },
    { "name": "Access Bank", "code": "044", "id": 1 },
    ...
  ]
}
```

### Verify Bank Account
```http
POST /wallet/resolve-account
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountNumber": "0123456789",
  "bankCode": "058"
}

Response:
{
  "success": true,
  "data": {
    "account_number": "0123456789",
    "account_name": "JOHN DOE",
    "bank_id": 9
  }
}
```

---

## 📄 RRR Payments

### Generate RRR Code
```http
POST /rrr/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "paymentType": "SCHOOL_FEE",
  "institution": "University of Lagos",
  "institutionCode": "UNILAG",
  "description": "Tuition Fee - 2024/2025 Session"
}

Response:
{
  "success": true,
  "data": {
    "rrr": "220123456789",
    "orderId": "REMIE-1234567890",
    "amount": 50000,
    "expiresAt": "2025-01-15T12:00:00Z"
  }
}
```

### Verify RRR Payment
```http
GET /rrr/verify/220123456789
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "status": "PAID",
    "transactionRef": "ABC123XYZ",
    "paidAt": "2025-01-08T14:30:00Z"
  }
}
```

---

## 🌍 International Remittance

### Get Exchange Rates
```http
GET /remittance/rates
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    { "from": "NGN", "to": "USD", "rate": 0.0013, "fee": 2.5 },
    { "from": "NGN", "to": "GBP", "rate": 0.001, "fee": 2.5 },
    { "from": "NGN", "to": "EUR", "rate": 0.0012, "fee": 2.5 }
  ]
}
```

### Calculate Remittance
```http
POST /remittance/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100000,
  "fromCurrency": "NGN",
  "toCurrency": "USD"
}

Response:
{
  "success": true,
  "data": {
    "sendAmount": 100000,
    "fee": 2500,
    "rate": 0.0013,
    "receiveAmount": 130,
    "total": 102500
  }
}
```

### Send Remittance
```http
POST /remittance/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientEmail": "student@abroad.com",
  "recipientName": "Jane Doe",
  "recipientPhone": "+44123456789",
  "amount": 100000,
  "country": "United Kingdom",
  "relationship": "Family",
  "purpose": "School fees support"
}

Response:
{
  "success": true,
  "message": "Remittance sent successfully",
  "data": {
    "reference": "REM_1234567890_ABC123",
    "sendAmount": 100000,
    "fee": 2500,
    "total": 102500,
    "receiveAmount": 100,
    "currency": "GBP",
    "exchangeRate": 0.001
  }
}
```

### Get Sent Remittances
```http
GET /remittance/sent?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

## 🤝 P2P Transfers

### Send Money to Student
```http
POST /p2p/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientIdentifier": "student2@example.com",
  "amount": 5000,
  "category": "HOSTEL",
  "note": "Hostel contribution"
}

Response:
{
  "success": true,
  "message": "Transfer successful",
  "data": {
    "reference": "P2P_1234567890",
    "amount": 5000,
    "recipient": { ... }
  }
}
```

### Search for Users
```http
GET /p2p/search-users?query=john
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "institution": "University of Lagos"
    }
  ]
}
```

---

## 💰 Loans

### Apply for Loan
```http
POST /loans/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 20000,
  "tenure": 30,
  "purpose": "Tuition fee"
}

Response:
{
  "success": true,
  "message": "Loan application submitted",
  "data": {
    "loanId": "loan-123",
    "amount": 20000,
    "tenure": 30,
    "interestRate": 5,
    "totalRepayment": 20083.33,
    "status": "PENDING"
  }
}
```

### Repay Loan
```http
POST /loans/loan-123/repay
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 20083.33
}

Response:
{
  "success": true,
  "message": "Loan repaid successfully",
  "data": {
    "loan": { ... },
    "repayment": { ... }
  }
}
```

---

## 🧾 Receipts

### Get All Receipts
```http
GET /receipts?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "receiptNumber": "RCP-202501-ABC123",
      "amount": 10000,
      "pdfUrl": "/receipts/receipt_RCP-202501-ABC123.pdf",
      "createdAt": "2025-01-08T10:00:00Z"
    }
  ]
}
```

### Download Receipt
```http
GET /receipts/RCP-202501-ABC123/download
Authorization: Bearer <token>

Returns: PDF file
```

---

## 🔔 Webhooks

### Paystack Webhook
```http
POST /webhooks/paystack
X-Paystack-Signature: <signature>
Content-Type: application/json

{
  "event": "charge.success",
  "data": {
    "reference": "REMIE_1234567890",
    "amount": 1000000,
    "status": "success",
    ...
  }
}
```

**Note**: This endpoint is called by Paystack automatically. You need to configure it in your Paystack dashboard.

---

## 🧪 Testing

### Test with Postman

1. Import the endpoints above
2. Register a new user
3. Login and copy the token
4. Add token to Authorization header for all requests
5. Test each endpoint

### Test Cards (Paystack Test Mode)

**Successful Payment:**
```
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: 12/25
PIN: 0000
```

**Failed Payment:**
```
Card Number: 5060 6666 6666 6666
CVV: 123
Expiry: 12/25
```

---

## 🐛 Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // For validation errors
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📞 Support

- API Documentation: `GET /api/v1`
- Health Check: `GET /health`
- GitHub Issues: [Report bugs]

---

## 🎯 Next Steps

1. ✅ Backend API is complete
2. ⏳ Frontend UI implementation
3. ⏳ Mobile app (React Native)
4. ⏳ Admin dashboard
5. ⏳ Production deployment

---

**Happy Coding! 🚀**
