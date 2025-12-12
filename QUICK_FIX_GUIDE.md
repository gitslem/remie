# 🚀 Quick Fix Guide - Database Migration Issues

## Problem Summary
1. ❌ Table names were incorrect (uppercase vs lowercase)
2. ❌ `npx prisma` downloads wrong version (7.x instead of 5.7.1)
3. ❌ SQL commands run in terminal instead of psql

## ✅ SOLUTION - 3 Easy Steps

---

### **STEP 1: Run the Fixed Migration**

```bash
cd backend
bash run-migration.sh
```

**OR manually:**
```bash
psql "postgresql://postgres@127.0.0.1:5433/remie-database" -f prisma/migrations/manual_add_nickname_fields_v2.sql
```

---

### **STEP 2: Create Your Admin User**

```bash
cd backend
bash create-admin.sh
```

When prompted, enter: `smuggslem@gmail.com`

**OR manually:**
```bash
psql "postgresql://postgres@127.0.0.1:5433/remie-database"
```

Then inside psql:
```sql
UPDATE "user"
SET role = 'ADMIN', status = 'ACTIVE'
WHERE email = 'smuggslem@gmail.com';

-- Verify it worked
SELECT id, email, role, status FROM "user" WHERE email = 'smuggslem@gmail.com';

-- Exit psql
\q
```

---

### **STEP 3: Generate Prisma Client**

```bash
cd backend
npm run prisma:generate
```

This uses the correct Prisma version (5.7.1).

---

## 🎯 What Was Fixed

### Fixed Migration File
- ✅ Changed `"User"` → `"user"` (lowercase)
- ✅ Changed `"Wallet"` → `"wallet"` (lowercase)
- ✅ Added all missing fields (approvedBy, approvedAt, etc.)
- ✅ Safe to run multiple times (idempotent)

### New Helper Scripts
1. **`run-migration.sh`** - Runs migration and verifies it
2. **`create-admin.sh`** - Interactive admin user creation

### Updated npm Scripts
Now using correct Prisma version:
```bash
npm run prisma:generate   # Use Prisma 5.7.1
npm run prisma:migrate    # Use Prisma 5.7.1
npm run migrate           # Run manual migration
npm run create-admin      # Create admin user
```

---

## 🔍 Verify Everything Works

After running the migration:

```bash
psql "postgresql://postgres@127.0.0.1:5433/remie-database" -c "
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user'
AND column_name IN ('nickname', 'nicknameSetAt', 'approvedBy', 'approvedAt');"
```

You should see all 4 columns listed.

---

## 📋 Common Commands Reference

### Inside psql Shell
```bash
# Connect
psql "postgresql://postgres@127.0.0.1:5433/remie-database"

# List tables
\dt

# Describe a table
\d user

# Run SQL
SELECT * FROM "user" WHERE email = 'your@email.com';

# Exit
\q
```

### From Terminal
```bash
# Run SQL file
psql "YOUR_DATABASE_URL" -f file.sql

# Run single command
psql "YOUR_DATABASE_URL" -c "SELECT * FROM user LIMIT 5;"

# List all users
psql "YOUR_DATABASE_URL" -c "SELECT email, role, status FROM \"user\";"
```

---

## ⚠️ Important Notes

1. **Use Local Prisma**: Always use `npm run prisma:xxx` instead of `npx prisma`
2. **Table Names**: PostgreSQL tables are lowercase: `user`, `wallet`, not `User`, `Wallet`
3. **Quotes**: Always quote table names: `"user"` not `user` (in SQL)
4. **npx Version**: `npx prisma` downloads v7.x which breaks. Use `npx --yes prisma@5.7.1`

---

## 🎉 Next Steps After Migration

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Login as Admin**
   - Go to: http://localhost:3000/auth/login
   - Login with: smuggslem@gmail.com
   - Go to: http://localhost:3000/admin

3. **Test Features**
   - Create a new user (will be PENDING_APPROVAL)
   - Login as admin and approve them
   - Set spending limits
   - Test nickname lock feature

---

## 🆘 Troubleshooting

### Migration fails with "relation does not exist"
- Check table name case: should be lowercase `"user"` not `"User"`
- Use the v2 migration file: `manual_add_nickname_fields_v2.sql`

### "command not found: UPDATE"
- You're running SQL in terminal instead of psql
- Solution: Enter `psql "YOUR_DATABASE_URL"` first, THEN run SQL

### "Prisma schema validation error P1012"
- You're using Prisma 7.x instead of 5.7.1
- Solution: Use `npm run prisma:generate` instead of `npx prisma generate`

### "Cannot find module '@prisma/client'"
- Run: `npm install` and `npm run prisma:generate`

---

All files committed and ready to use! 🚀
