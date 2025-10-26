# 🚀 Deploy Your Secured Contract (FIXED VERSION)

## ⚠️ **IMPORTANT: Redeploy Required!**

The previous contract had a gas estimation issue with `buyExtraLife`. I've fixed it!
**You need to redeploy the contract with the updated version.**

## ✅ Everything is ready!

---

## 📝 **Your Score Signer Address** (IMPORTANT!)

```
0x07174964E3FCd530031f6130f19885a3D70EF7eB
```

**⚠️ COPY THIS ADDRESS - You'll need it in 30 seconds!**

---

## 🎯 **Deploy Contract in 3 Minutes:**

### **Step 1: Open Remix**
Go to: **https://remix.ethereum.org**

### **Step 2: Install OpenZeppelin**
1. Click **Plugin Manager** (plug icon on left)
2. Search for **"OPENZEPPELIN CONTRACTS"**
3. Click **Activate**

### **Step 3: Upload Contract**
1. Create new file: **`TowerBlocksGame.sol`**
2. Copy the ENTIRE contents from:
   - `/Users/ddgaming/Desktop/AVAXTEST/contracts/TowerBlocksGame_SECURED.sol`
3. Paste into Remix

### **Step 4: Compile**
1. Click **Solidity Compiler** (left sidebar)
2. Select compiler: **0.8.20**
3. Click **Compile TowerBlocksGame.sol**
4. Wait for green checkmark ✅

### **Step 5: Connect MetaMask**
1. Click **Deploy & Run Transactions** (left sidebar)
2. Environment: Change to **"Injected Provider - MetaMask"**
3. MetaMask popup → Click **Connect**
4. Make sure MetaMask is on **Avalanche Fuji Testnet**
   - If not, add it:
     - Network: `Avalanche Fuji C-Chain`
     - RPC: `https://api.avax-test.network/ext/bc/C/rpc`
     - Chain ID: `43113`
     - Symbol: `AVAX`

### **Step 6: Deploy Contract** ⚡
1. Under "Deploy", you'll see a field for `_SCOREVERIFIER`
2. **Paste this address:**
   ```
   0x07174964E3FCd530031f6130f19885a3D70EF7eB
   ```
3. Click **Deploy** (orange button)
4. Confirm in MetaMask popup
5. **WAIT** for transaction to confirm (~2 seconds)

### **Step 7: Copy Contract Address**
1. After deployment, you'll see your contract under **"Deployed Contracts"**
2. Click the **copy icon** next to the contract address
3. **SAVE IT!** (You'll need it in the next step)

---

## ✏️ **Update Contract Address in Code**

Edit this file:
```
/Users/ddgaming/Desktop/AVAXTEST/lib/contract-abi-secured.ts
```

**Find line 405** and paste your contract address:
```typescript
43113: '0xYOUR_CONTRACT_ADDRESS_HERE',  // ← Paste here!
```

---

## 🎮 **Start Everything**

### Terminal 1 - Backend Server:
```bash
cd /Users/ddgaming/Desktop/AVAXTEST/backend
npm start
```

### Terminal 2 - Frontend:
```bash
cd /Users/ddgaming/Desktop/AVAXTEST
npm run dev
```

---

## ✅ **Test It Works**

1. Open **http://localhost:3000**
2. Connect wallet to **Avalanche Fuji**
3. Play the game
4. Submit score
5. Check browser console - should see: **"Requesting signature for score..."**
6. Score should appear on leaderboard!

---

## 🔍 **View Your Contract**

After deployment, check it on SnowTrace:
```
https://testnet.snowtrace.io/address/YOUR_CONTRACT_ADDRESS
```

---

## ❓ **Troubleshooting**

**Backend won't start?**
- Make sure you're in the `backend` folder
- Run `npm install` first

**Score submission fails?**
- Check backend is running
- Check browser console for errors
- Make sure contract address is updated

**"Invalid signature" error?**
- Verify you used the correct signer address when deploying
- Check `.env` has the signer private key

---

## 🎉 **You're Done!**

Once it's working on Fuji:
- Deploy to mainnet (Chain ID 43114)
- Update contract address for mainnet
- Deploy backend to production server
- Launch! 🚀

---

**Need help?** Check the full guide in `FRONTEND_INTEGRATION_GUIDE.md`
