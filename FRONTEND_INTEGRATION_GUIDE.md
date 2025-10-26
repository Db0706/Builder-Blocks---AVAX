# 🎮 Frontend Integration Guide - Secured Contract

This guide shows you **step-by-step** how to integrate the secured contract into your existing frontend.

---

## 📁 Files I've Created For You

### ✅ New Files:
1. `lib/contract-abi-secured.ts` - New ABI with secured functions
2. `lib/api/score-signing.ts` - API client for backend
3. `lib/hooks/useGameContractSecured.ts` - Secured contract hook
4. `components/LeaderboardSecured.tsx` - Leaderboard with prize claims

### 📝 Files You Need to Update:
- `app/page.tsx` - Import secured components
- `.env` - Add backend URL

---

## 🚀 STEP-BY-STEP INTEGRATION

### **Step 1: Set Up Backend Server**

First, let's get the backend running so scores can be signed:

```bash
# Generate signing wallet
cd backend
npm install
npm run generate-signer
```

**IMPORTANT:** Copy the output! You'll see:
```
Address: 0xABC123...  <- USE THIS when deploying contract
Private Key: 0xdef456...  <- Add to .env
```

**Update your `.env` file:**
```bash
# Add these lines
SCORE_SIGNER_PRIVATE_KEY=0xdef456...  # From above
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Start the backend:**
```bash
cd backend
npm start
```

Leave this running in a separate terminal!

---

### **Step 2: Deploy Secured Contract**

Go to Remix (https://remix.ethereum.org):

1. **Create file:** `TowerBlocksGame_SECURED.sol`
2. **Copy content** from: `contracts/TowerBlocksGame_SECURED.sol`
3. **Install OpenZeppelin:** Plugin Manager → "OPENZEPPELIN CONTRACTS"
4. **Compile:** Version 0.8.20
5. **Deploy:**
   - Environment: **Injected Provider - MetaMask**
   - Network: **Avalanche Fuji** (for testing first!)
   - Constructor param `_scoreVerifier`: **Paste the signer address from Step 1**
   - Click Deploy
6. **Copy the deployed contract address**

**Update contract address:**

Edit `lib/contract-abi-secured.ts` line 405:
```typescript
43113: '0xYOUR_NEW_CONTRACT_ADDRESS_HERE',  // Fuji testnet
```

---

### **Step 3: Update Frontend Code**

Now let's switch your app to use the secured components.

#### **Option A: Quick Switch (Recommended for testing)**

Edit `app/page.tsx`:

**Change these imports:**
```typescript
// OLD:
import { useGameContract } from "@/lib/hooks/useGameContract";
import Leaderboard from "@/components/Leaderboard";

// NEW:
import { useGameContractSecured } from "@/lib/hooks/useGameContractSecured";
import LeaderboardSecured from "@/components/LeaderboardSecured";
```

**Update the component:**
```typescript
export default function Home() {
  // OLD:
  // const { ... } = useGameContract();

  // NEW:
  const { withdraw, contractBalance, contractOwner, refetchBalance, isPending, isConfirming }
    = useGameContractSecured();

  // ... rest stays the same

  return (
    <>
      {/* ... */}

      {/* OLD: */}
      {/* <Leaderboard /> */}

      {/* NEW: */}
      <LeaderboardSecured />

      {/* ... */}
    </>
  );
}
```

**That's it for the leaderboard!** The new one has prize claiming built in.

---

#### **Option B: Update TowerBlocks Component**

The `TowerBlocks` component needs NO changes! Here's why:

The secured hook (`useGameContractSecured`) has the **same interface** as the old one. The only difference is:

**Old:**
```typescript
submitScore(score) // Just score
```

**New:**
```typescript
submitScore(score) // Automatically requests signature from backend!
```

The hook handles signature request internally. Your TowerBlocks component will work as-is!

**Just update the import:**
```typescript
// In components/TowerBlocks.tsx, change line 3:

// OLD:
import { useGameContract } from "@/lib/hooks/useGameContract";

// NEW:
import { useGameContractSecured } from "@/lib/hooks/useGameContractSecured";
```

---

### **Step 4: Test Everything**

**Start your frontend:**
```bash
npm run dev
```

**Make sure both are running:**
- ✅ Backend server: `http://localhost:3001`
- ✅ Frontend: `http://localhost:3000`

**Test these flows:**

1. **Connect Wallet** → Should work as before
2. **Play Game** → Should work as before
3. **Game Over → Submit Score:**
   - Click "Submit Score & Play Again"
   - Check browser console - should see: "Requesting signature for score..."
   - MetaMask should pop up
   - Score should appear on leaderboard
4. **Buy Extra Life** → Should work as before
5. **Check for Prize:**
   - If you're in top 5, you should see pending prize in stats
   - Green banner should appear if you have a claimable prize
6. **Claim Prize** (if you have one):
   - Click "Claim Your Prize!" button
   - Confirm in MetaMask
   - Prize should be sent to your wallet

---

## 🔍 Debugging

### **Problem: "Failed to get score signature"**

**Solution:**
- Check backend is running: `curl http://localhost:3001/health`
- Check `.env` has `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Check backend console for errors

### **Problem: "Invalid signature"**

**Solution:**
- Make sure you deployed contract with correct `scoreVerifier` address
- Verify signer address matches in backend console output
- Check `SCORE_SIGNER_PRIVATE_KEY` in `.env`

### **Problem: Score submission fails**

**Solution:**
1. Open browser console (F12)
2. Look for error message
3. Check:
   - Backend is reachable
   - Signature was received
   - Enough gas in wallet
   - Connected to correct network

---

## 📊 What Changed for Users?

### **Score Submission:**
**Before:** Click button → MetaMask popup
**After:** Click button → Backend signs → MetaMask popup

*User experience is the same, but scores are now verified!*

### **Prize Distribution:**
**Before:** Owner calls `distributePrizes()` → Funds sent automatically
**After:**
1. Owner calls `calculatePrizes()` (calculates prizes)
2. Winners see "You Won a Prize!" banner
3. Winners click "Claim Your Prize!" to withdraw

*This prevents malicious contracts from blocking prize distribution!*

---

## 🎯 Going to Mainnet

Once everything works on Fuji testnet:

1. **Deploy contract to mainnet** (Chain ID: 43114)
2. **Update address in `contract-abi-secured.ts`:**
   ```typescript
   43114: '0xYOUR_MAINNET_CONTRACT_ADDRESS',
   ```
3. **Deploy backend to production server** (not localhost!)
4. **Update `.env` production URL:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.com
   ```
5. **Test with small amounts first!**

---

## 🔐 Production Backend Deployment

For production, deploy backend to:
- **Vercel/Railway:** Easy deployment
- **AWS/DigitalOcean:** Full control
- **Heroku:** Quick setup

**Requirements:**
- Add HTTPS (Let's Encrypt)
- Add rate limiting
- Add monitoring
- Set environment variables in platform
- Use PM2 for process management (if VPS)

---

## ✅ Integration Checklist

Test on Fuji first:
- [ ] Backend server generated signer wallet
- [ ] Deployed secured contract with signer address
- [ ] Backend server running locally
- [ ] Updated `.env` with API_URL and signer key
- [ ] Frontend imports changed to secured versions
- [ ] Can play game
- [ ] Can submit score (check console for "Requesting signature...")
- [ ] Score appears on leaderboard
- [ ] Can buy extra life
- [ ] Owner can calculate prizes
- [ ] Winners see prize banner
- [ ] Winners can claim prizes
- [ ] All transactions confirm on SnowTrace

Once Fuji works perfectly:
- [ ] Deploy to mainnet
- [ ] Deploy backend to production
- [ ] Update production env vars
- [ ] Test with real (small) amounts
- [ ] Monitor for issues
- [ ] Launch! 🚀

---

## 💡 Quick Reference

### Import Changes:
```typescript
// OLD
import { useGameContract } from "@/lib/hooks/useGameContract";
import Leaderboard from "@/components/Leaderboard";

// NEW
import { useGameContractSecured } from "@/lib/hooks/useGameContractSecured";
import LeaderboardSecured from "@/components/LeaderboardSecured";
```

### New Functions Available:
```typescript
const {
  // New:
  withdrawPrize,              // For winners to claim prizes
  pendingWithdrawal,          // Check if user has pending prize
  refetchPendingWithdrawal,   // Refresh prize data

  // Changed:
  calculatePrizes,            // Replaces distributePrizes
  submitScore,                // Now requires signature (handled automatically)

  // Same as before:
  buyExtraLife,
  withdraw,
  // ... all other functions
} = useGameContractSecured();
```

---

## 🎉 You're Done!

Your app is now **secured and ready for mainnet**!

The secured version protects against:
- ✅ Fake score submissions
- ✅ Reentrancy attacks
- ✅ Prize DOS attacks
- ✅ Leaderboard manipulation

**Questions?** Check the `SECURITY_DEPLOYMENT_GUIDE.md` for more details.

Good luck with your launch! 🚀
