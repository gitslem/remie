# ⚡ RUN THIS NOW - 3 Commands to Fix Everything

## 🎯 All your errors are now fixed! Just run these 3 commands:

### **1️⃣ Run Migration** (Adds database columns)
```bash
cd ~/remie/backend
bash run-migration.sh
```

### **2️⃣ Create Admin** (Make yourself admin)
```bash
bash create-admin.sh
```
*When prompted, enter: `smuggslem@gmail.com`*

### **3️⃣ Generate Prisma** (Update code)
```bash
npm run prisma:generate
```

---

## ✅ That's it! Now test:

```bash
# Start the backend
npm run dev

# In another terminal, start frontend
cd ~/remie/frontend
npm run dev
```

**Go to:** http://localhost:3000/admin

---

## 📝 What Was Wrong & What I Fixed:

| ❌ Error | ✅ Fixed With |
|----------|---------------|
| `relation "User" does not exist` | Changed to lowercase `"user"` |
| `Prisma version 7.x error` | Use Prisma 5.7.1 in package.json |
| `command not found: UPDATE` | Created helper scripts |
| `command not found: SELECT` | Use `psql` first, then SQL |

---

## 🆘 If Migration Fails:

**Option 1: Manual SQL** (Inside psql)
```bash
psql "postgresql://postgres@127.0.0.1:5433/remie-database"
```

Then copy-paste this:
```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nicknameSetAt" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "user_nickname_key" ON "user"("nickname");

ALTER TABLE "wallet" ADD COLUMN IF NOT EXISTS "dailyFundingSpent" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "wallet" ADD COLUMN IF NOT EXISTS "monthlyFundingSpent" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "wallet" ADD COLUMN IF NOT EXISTS "lastDailyReset" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "wallet" ADD COLUMN IF NOT EXISTS "lastMonthlyReset" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "wallet" ADD COLUMN IF NOT EXISTS "lastTransactionAt" TIMESTAMP(3);

\q
```

**Option 2: Run SQL File Directly**
```bash
psql "postgresql://postgres@127.0.0.1:5433/remie-database" \
  -f backend/prisma/migrations/manual_add_nickname_fields_v2.sql
```

---

## 🎉 After Running Commands:

All features will work:
- ✅ P2P wallet shows correct balance
- ✅ Text inputs are readable in settings/support
- ✅ Nickname locks after first save
- ✅ Admin can approve new users
- ✅ Admin can set spending limits
- ✅ Admin can change nicknames

---

**See `QUICK_FIX_GUIDE.md` for detailed explanations!**
