# Port Conflict Fix - EADDRINUSE Error

## Problem

When running `npm run dev`, you get this error:

```
Error: listen EADDRINUSE: address already in use :::5000
```

This means port 5000 is already being used by another process.

---

## Quick Fixes

### Option 1: Kill the Process Using Port 5000 (Recommended)

**On macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

**On Windows (Command Prompt):**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**On Windows (PowerShell):**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

Then run `npm run dev` again.

---

### Option 2: Use a Different Port

The backend now uses port **3001** by default (configured in `.env` file).

If you need to change it:

1. Open `backend/.env`
2. Change the `PORT` value:
   ```
   PORT=3001  # or any available port
   API_URL=http://localhost:3001
   ```
3. Run `npm run dev`

---

## Common Causes

1. **Previous dev server still running** - You started the server before and it didn't shut down properly
2. **Another application using port 5000** - macOS AirPlay Receiver uses port 5000 by default
3. **Multiple terminal windows** - You have multiple terminal windows running the dev server

---

## How to Check What's Using Port 5000

**macOS/Linux:**
```bash
lsof -i :5000
```

**Windows:**
```cmd
netstat -ano | findstr :5000
```

---

## Disable AirPlay Receiver on macOS (if that's the issue)

Port 5000 is used by macOS AirPlay Receiver by default. To disable it:

1. Open **System Preferences** / **System Settings**
2. Go to **Sharing**
3. Turn off **AirPlay Receiver**

Or change the backend port to 3001 (already configured in `.env`)

---

## Verify Backend is Running

After starting the server, you should see:

```
🚀 REMIE API server running on port 3001
📝 Environment: development
🔗 API URL: http://localhost:3001
```

Test the API:
```bash
curl http://localhost:3001/api/health
```

---

## Still Having Issues?

1. Restart your computer
2. Make sure no other instances of the backend are running
3. Check your `.env` file exists and has the correct PORT setting
4. Try a completely different port (e.g., 8080, 8000, 4000)
