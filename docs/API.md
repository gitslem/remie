# REMIE API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "studentId": "STU001",
  "institution": "University of Lagos"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password/:token
Content-Type: application/json

{
  "password": "newSecurePassword123"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### RRR Payments

#### Generate RRR
```http
POST /rrr/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "institutionCode": "UNILAG",
  "institutionName": "University of Lagos",
  "serviceTypeId": "4430731",
  "payerName": "John Doe",
  "payerEmail": "student@example.com",
  "payerPhone": "+2348012345678",
  "description": "Acceptance Fee Payment"
}
```

#### Verify RRR Payment
```http
GET /rrr/verify/:rrr
Authorization: Bearer <token>
```

#### Get RRR Details
```http
GET /rrr/:rrr
Authorization: Bearer <token>
```

#### Get User RRR Payments
```http
GET /rrr?page=1&limit=20
Authorization: Bearer <token>
```

### Wallet

#### Get Wallet Balance
```http
GET /wallet
Authorization: Bearer <token>
```

#### Fund Wallet
```http
POST /wallet/fund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000,
  "paymentMethod": "CARD"
}
```

#### Withdraw from Wallet
```http
POST /wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "bankCode": "058",
  "accountNumber": "0123456789"
}
```

### P2P Transfers

#### Send Money
```http
POST /p2p/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverIdentifier": "receiver@example.com",
  "amount": 2000,
  "description": "Hostel contribution",
  "category": "hostel"
}
```

#### Get Transfers
```http
GET /p2p/transfers?type=all&page=1&limit=20
Authorization: Bearer <token>
```

Query Parameters:
- `type`: `sent`, `received`, or `all`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get Transfer Details
```http
GET /p2p/transfers/:reference
Authorization: Bearer <token>
```

#### Search Users
```http
GET /p2p/search-users?q=john
Authorization: Bearer <token>
```

### Loans

#### Apply for Loan
```http
POST /loans/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 25000,
  "purpose": "Urgent tuition payment",
  "purposeType": "SCHOOL_FEE",
  "tenure": 30
}
```

#### Repay Loan
```http
POST /loans/:loanId/repay
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "paymentMethod": "WALLET"
}
```

#### Get User Loans
```http
GET /loans?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Loan Details
```http
GET /loans/:loanId
Authorization: Bearer <token>
```

### Cryptocurrency

#### Get Platform Wallet Address
```http
GET /crypto/wallet-address
```

#### Get Crypto Prices
```http
GET /crypto/prices
```

#### Deposit Crypto
```http
POST /crypto/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "cryptoType": "USDT",
  "amount": 100,
  "txHash": "0x..."
}
```

#### Withdraw Crypto
```http
POST /crypto/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "cryptoType": "USDC",
  "amount": 50,
  "toAddress": "0x..."
}
```

#### Get Crypto Transactions
```http
GET /crypto/transactions?page=1&limit=20
Authorization: Bearer <token>
```

### Notifications

#### Get All Notifications
```http
GET /notifications?page=1&limit=20
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /notifications/read-all
Authorization: Bearer <token>
```

### Receipts

#### Get All Receipts
```http
GET /receipts?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Receipt
```http
GET /receipts/:id
Authorization: Bearer <token>
```

#### Download Receipt
```http
GET /receipts/:id/download
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error
