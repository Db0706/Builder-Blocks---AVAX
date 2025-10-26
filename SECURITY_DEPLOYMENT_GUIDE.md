# 🔒 SECURE DEPLOYMENT GUIDE - TowerBlocksGame

## ⚠️ CRITICAL: DO NOT SKIP ANY STEPS

This guide will help you deploy the SECURED version of TowerBlocksGame to mainnet safely.

---

## 📋 Pre-Deployment Checklist

### ✅ Files Created:
- `contracts/TowerBlocksGame_SECURED.sol` - Secured smart contract
- `backend/server.js` - Score signing server
- `backend/generate-signer.js` - Wallet generator
- `backend/package.json` - Backend dependencies

---

## 🔧 STEP 1: Generate Score Signer Wallet

```bash
cd backend
npm install
npm run generate-signer
```

**You'll see output like:**
```
Address: 0xABC123...
Private Key: 0xdef456...
```

**IMPORTANT:**
1. **COPY BOTH VALUES** to a secure location
2. Add private key to `.env`:
   ```
   SCORE_SIGNER_PRIVATE_KEY=0xdef456...
   ```
3. **SAVE THE ADDRESS** - you'll need it for contract deployment!

---

## 🚀 STEP 2: Deploy Secured Contract

### Option A: Deploy via Remix (Recommended)

1. **Open Remix:** https://remix.ethereum.org

2. **Install OpenZeppelin:**
   - In Remix, go to Plugin Manager
   - Install "OPENZEPPELIN CONTRACTS"

3. **Create new file:** `TowerBlocksGame_SECURED.sol`
   - Copy contents from `contracts/TowerBlocksGame_SECURED.sol`

4. **Compile:**
   - Solidity Compiler → Version `0.8.20`
   - Click "Compile"

5. **Deploy:**
   - Environment: **Injected Provider - MetaMask**
   - Switch MetaMask to **Avalanche C-Chain (Mainnet)**
   - Contract: **TowerBlocksGame**
   - Constructor parameter `_SCOREVERIFIER`: **Paste the signer address from Step 1**
   - Click **Deploy**
   - Confirm in MetaMask

6. **SAVE THE CONTRACT ADDRESS!**

### Option B: Deploy via Hardhat

```bash
# Update hardhat config
npx hardhat compile

# Deploy (replace with your signer address)
npx hardhat run scripts/deploy-secured.ts --network mainnet
```

---

## 🔑 STEP 3: Update Frontend Configuration

### 1. Update Contract Address

Edit `lib/contract-abi.ts`:
```typescript
43114: '0xYOUR_NEW_MAINNET_CONTRACT_ADDRESS',
```

### 2. Update Contract ABI

**IMPORTANT:** The ABI has changed! You need to:

1. Go to Remix → Deployed Contract
2. Click "Copy ABI" button
3. Replace the entire `TOWER_BLOCKS_ABI` in `lib/contract-abi.ts`

Or manually add these new functions to the ABI:
- `submitScore(uint256,bytes32,bytes)` - **Changed signature!**
- `calculatePrizes()` - **Replaces distributePrizes()**
- `withdrawPrize()` - **New function**
- `getPendingWithdrawal(address)` - **New function**

---

## 🖥️ STEP 4: Start Backend Server

```bash
cd backend
npm start
```

**You should see:**
```
🔐 Score Signer Address: 0xABC123...
🚀 Score signing server running on port 3001
```

**For production deployment:**
- Deploy to a VPS (Digital Ocean, AWS, etc.)
- Use PM2 for process management
- Add HTTPS with Let's Encrypt
- Set up monitoring and logging

---

## 🎮 STEP 5: Update Frontend to Use Score Signing

You need to update your `TowerBlocks.tsx` component to:

1. **Request signature from backend when game ends**
2. **Pass signature to smart contract**

Example:
```typescript
const handleSubmitScore = async (score: number) => {
  // Request signature from backend
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sign-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player: address,
      score: score
    })
  });

  const { nonce, signature } = await response.json();

  // Submit to blockchain with signature
  await submitScoreToChain(score, nonce, signature);
};
```

---

## 🧪 STEP 6: Testing on Fuji Testnet First

**BEFORE MAINNET, TEST ON FUJI!**

1. Deploy secured contract to Fuji
2. Run backend locally
3. Test ALL flows:
   - Score submission with signature
   - Extra life purchase
   - Prize calculation (calculatePrizes)
   - Prize withdrawal (withdrawPrize)
4. Try to exploit it yourself!
5. Monitor gas costs

---

## 💰 STEP 7: Prize Distribution (New Process)

The secured contract uses **pull payments**:

### As Owner:
```javascript
// Calculate prizes (doesn't send funds)
await contract.calculatePrizes();
```

### As Player:
```javascript
// Check if you have a prize
const pending = await contract.getPendingWithdrawal(playerAddress);

// Withdraw your prize
if (pending > 0) {
  await contract.withdrawPrize();
}
```

**Update your Leaderboard component to:**
1. Show pending prizes for each player
2. Add "Claim Prize" button for winners

---

## 🔐 SECURITY BEST PRACTICES

### 1. Backend Security:
- ✅ Use environment variables (never hardcode keys)
- ✅ Add rate limiting (express-rate-limit)
- ✅ Add request validation
- ✅ Log suspicious activity
- ✅ Use HTTPS in production
- ✅ Implement session tokens to verify game legitimacy

### 2. Smart Contract Security:
- ✅ Test thoroughly on testnet
- ✅ Consider professional audit (Certik, Consensys Diligence)
- ✅ Start with low prize pools
- ✅ Monitor contract for anomalies
- ✅ Have emergency pause mechanism ready

### 3. Operational Security:
- ✅ Use multi-sig wallet for ownership (Gnosis Safe)
- ✅ Set up monitoring/alerts
- ✅ Have incident response plan
- ✅ Regular security audits
- ✅ Bug bounty program

---

## 🚨 WHAT'S FIXED:

| Vulnerability | Status | How Fixed |
|--------------|--------|-----------|
| Fake Score Submission | ✅ FIXED | Server signature required |
| Reentrancy in Prizes | ✅ FIXED | Pull payment + ReentrancyGuard |
| Prize DOS Attack | ✅ FIXED | Pull payment pattern |
| Leaderboard Index Bug | ✅ FIXED | Index reset on removal |
| Missing Events | ✅ FIXED | All events added |
| Owner Centralization | ⚠️ IMPROVED | Can renounce ownership |

---

## 📊 Gas Cost Estimates (Approximate)

| Function | Gas | Cost @ 25 gwei |
|----------|-----|----------------|
| buyExtraLife() | ~50,000 | $0.05 |
| submitScore() | ~120,000 | $0.12 |
| calculatePrizes() | ~150,000 | $0.15 |
| withdrawPrize() | ~45,000 | $0.045 |

---

## 🎯 Launch Checklist

- [ ] Generated score signer wallet
- [ ] Deployed secured contract to Fuji testnet
- [ ] Tested all functions on Fuji
- [ ] Updated frontend ABI
- [ ] Integrated backend score signing
- [ ] Tested score submission with signatures
- [ ] Tested prize withdrawal flow
- [ ] Backend deployed to production server
- [ ] Set up HTTPS for backend
- [ ] Added rate limiting and validation
- [ ] Deployed to mainnet
- [ ] Verified contract on SnowTrace
- [ ] Tested on mainnet with small amounts
- [ ] Set up monitoring
- [ ] Announced launch!

---

## 📞 Need Help?

If you run into issues:
1. Check backend logs for signing errors
2. Verify signer address matches contract
3. Test signature generation manually
4. Check contract events on explorer

---

## 🎉 You're Ready!

This secured version is **production-ready** for moderate prize pools.

For high-value deployments (>$10k prizes):
- Get professional security audit
- Use multi-sig wallet
- Add circuit breaker/pause mechanism
- Implement gradual rollout

Good luck! 🚀
