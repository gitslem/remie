# CORS Configuration Fix

## Problem

The Cloud Functions were blocking requests from the frontend with CORS errors:
```
Access to XMLHttpRequest at 'https://us-central1-remiepay.cloudfunctions.net/api/wallet'
from origin 'https://remiepay.web.app' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

1. The CORS middleware was configured with basic settings that didn't properly handle preflight OPTIONS requests
2. Missing explicit OPTIONS handler for all routes
3. No rewrite rule to proxy API requests through the hosting domain

## Solution

### 1. Enhanced CORS Configuration (functions/src/index.ts)

Updated the CORS configuration to explicitly handle all necessary headers and methods:

```typescript
const corsOptions = {
  origin: true, // Allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
```

### 2. Added API Rewrite Rule (firebase.json)

Added a rewrite rule to proxy API requests through the hosting domain:

```json
"rewrites": [
  {
    "source": "/api/**",
    "function": "api"
  },
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

This allows the frontend to call the API at:
- `https://remiepay.web.app/api/wallet` (no CORS issues!)
- Instead of: `https://us-central1-remiepay.cloudfunctions.net/api/wallet`

## Benefits

1. **No CORS Issues**: Requests from the same domain don't trigger CORS
2. **Better Security**: API is served from the same origin as the frontend
3. **Simpler Configuration**: No need to whitelist specific origins
4. **Better Performance**: Reduced latency for API calls

## API Endpoint Changes

The frontend can now use either:

### Option 1: Same-Origin API (Recommended)
```typescript
const API_URL = '/api'; // Relative URL, no CORS
axios.get(`${API_URL}/wallet`);
```

### Option 2: Direct Cloud Functions URL
```typescript
const API_URL = 'https://us-central1-remiepay.cloudfunctions.net/api';
axios.get(`${API_URL}/wallet`); // CORS headers now properly configured
```

## Testing

After redeployment, test wallet functionality:

1. **Get wallet balance**: `GET /api/wallet`
2. **Fund wallet**: `POST /api/wallet/fund`
3. **Withdraw**: `POST /api/wallet/withdraw`
4. **Get transactions**: `GET /api/wallet/transactions`

All endpoints should now work without CORS errors!

## Deployment

```bash
# Build functions
cd functions
npm run build

# Deploy
firebase deploy --only hosting,functions --project remiepay
```

## Verification

Check that CORS headers are present:

```bash
curl -H "Origin: https://remiepay.web.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://us-central1-remiepay.cloudfunctions.net/api/wallet -v
```

You should see:
- `Access-Control-Allow-Origin: https://remiepay.web.app` (or `*`)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, ...`
