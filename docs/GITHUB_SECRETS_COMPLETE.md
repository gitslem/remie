# 🔐 Complete GitHub Secrets Setup for REMIE

## Where to Add Secrets

Go to your GitHub repository:
```
https://github.com/gitslem/remie/settings/secrets/actions
```

Click **"New repository secret"** for each one below.

---

## 📋 Required Secrets (Copy & Paste Ready)

### 1. FIREBASE_SERVICE_ACCOUNT

**How to get it:**
1. Go to https://console.firebase.google.com/
2. Select project: **remiepay**
3. Click ⚙️ (gear icon) → **Project settings**
4. Go to **Service accounts** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** (downloads a JSON file)
7. Open the JSON file and **copy ALL contents**

**GitHub Secret Setup:**
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: Paste the **entire JSON content** (should start with `{` and end with `}`)

Example format:
```json
{
  "type": "service_account",
  "project_id": "remiepay",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

---

### 2. FIREBASE_PROJECT_ID

**Value:** `remiepay`

(This is your Firebase project ID)

---

### 3. Firebase Config Values

**How to get these:**
1. Go to https://console.firebase.google.com/
2. Select project: **remiepay**
3. Click ⚙️ → **Project settings**
4. Scroll to **"Your apps"** section
5. If no web app exists:
   - Click **"</> (Web app)"** icon
   - Register app with nickname: "REMIE Web"
   - Click **"Register app"**
6. Copy values from the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Copy this
  authDomain: "remiepay.firebaseapp.com",  // ← Copy this
  projectId: "remiepay",         // ← Copy this
  storageBucket: "remiepay.appspot.com",   // ← Copy this
  messagingSenderId: "123456789", // ← Copy this
  appId: "1:123456789:web:abc..."  // ← Copy this
};
```

**GitHub Secrets to Create:**

#### NEXT_PUBLIC_FIREBASE_API_KEY
- Value: `AIzaSy...` (from `apiKey` above)

#### NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- Value: `remiepay.firebaseapp.com` (from `authDomain` above)

#### NEXT_PUBLIC_FIREBASE_PROJECT_ID
- Value: `remiepay` (from `projectId` above)

#### NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- Value: `remiepay.appspot.com` (from `storageBucket` above)

#### NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- Value: `123456789` (from `messagingSenderId` above)

#### NEXT_PUBLIC_FIREBASE_APP_ID
- Value: `1:123456789:web:abc...` (from `appId` above)

---

### 4. NEXT_PUBLIC_API_URL

**Value:** `https://us-central1-remiepay.cloudfunctions.net/api/api/v1`

(Replace `us-central1` with your region if different)

**To verify your region:**
- Go to Firebase Console → Functions
- Or use: `https://[REGION]-[PROJECT-ID].cloudfunctions.net/api/api/v1`

---

## ✅ Complete Secrets Checklist

After adding all secrets, you should have **9 secrets** total:

- [ ] `FIREBASE_SERVICE_ACCOUNT` (JSON file content)
- [ ] `FIREBASE_PROJECT_ID` (remiepay)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` (AIzaSy...)
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (remiepay.firebaseapp.com)
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (remiepay)
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (remiepay.appspot.com)
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (number)
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` (1:...:web:...)
- [ ] `NEXT_PUBLIC_API_URL` (https://us-central1-remiepay...)

---

## 🖼️ Visual Guide

### Step 1: Navigate to Secrets
```
Your Repo → Settings → Secrets and variables → Actions → New repository secret
```

### Step 2: Add Each Secret
For each secret above:
1. Click **"New repository secret"**
2. Enter the **Name** (exactly as shown above)
3. Paste the **Value**
4. Click **"Add secret"**

### Step 3: Verify
After adding all secrets, your page should show:
```
FIREBASE_SERVICE_ACCOUNT          Updated X minutes ago
FIREBASE_PROJECT_ID               Updated X minutes ago
NEXT_PUBLIC_FIREBASE_API_KEY      Updated X minutes ago
... (and so on)
```

---

## 🚀 Test Deployment

Once all secrets are added:

```bash
# Make a small change (to trigger deployment)
echo "# Deploy test" >> README.md
git add README.md
git commit -m "test: Trigger deployment"
git push origin claude/build-remie-app-01SVWLSMDif5E2qtdmPAiUTD
```

Then watch deployment:
- Go to: https://github.com/gitslem/remie/actions
- Click on the latest workflow run
- Watch it build and deploy! 🎉

---

## 🐛 Common Issues

### "Invalid service account"
- Make sure you copied the **entire JSON** including `{` and `}`
- Verify there are no extra spaces or line breaks

### "Secret not found"
- Secret names are **case-sensitive**
- Double-check spelling matches exactly

### "Project not found"
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check Firebase Console → Project settings → Project ID

### "Build failed"
- Check the Actions logs for specific error
- Verify all 9 secrets are added correctly

---

## 📞 Need Help?

If you see errors:
1. Go to https://github.com/gitslem/remie/actions
2. Click on the failed workflow
3. Check the logs to see which step failed
4. Most common issues are missing/incorrect secrets

---

**Quick Copy Template:**

```
FIREBASE_SERVICE_ACCOUNT: { ... } (entire JSON)
FIREBASE_PROJECT_ID: remiepay
NEXT_PUBLIC_FIREBASE_API_KEY: AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: remiepay.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID: remiepay
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: remiepay.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 123456789
NEXT_PUBLIC_FIREBASE_APP_ID: 1:123456789:web:abc...
NEXT_PUBLIC_API_URL: https://us-central1-remiepay.cloudfunctions.net/api/api/v1
```

Replace the values with YOUR actual values from Firebase Console! 🔥
