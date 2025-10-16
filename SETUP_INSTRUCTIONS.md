# 🚀 Setup Instructions

Follow these steps to get your Tower Blocks AVAX game running.

## Step 1: Install Dependencies

```bash
npm install
```

**Expected output**: Should install ~777 packages without errors.

## Step 2: Configure WalletConnect

### Get Your Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign in with GitHub or email
3. Click "Create New Project"
4. Name it "Tower Blocks AVAX"
5. Copy your Project ID (starts with something like `a1b2c3d4...`)

### Update Configuration

Open `lib/wagmi-config.ts` and replace the placeholder:

```typescript
// BEFORE:
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',

// AFTER:
projectId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',  // Your actual ID
```

## Step 3: Set Up Avalanche Fuji Testnet

### Add Network to MetaMask

1. Open MetaMask extension
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network"
4. Click "Add a network manually"
5. Fill in these details:

```
Network Name:        Avalanche Fuji C-Chain
New RPC URL:         https://api.avax-test.network/ext/bc/C/rpc
Chain ID:            43113
Currency Symbol:     AVAX
Block Explorer URL:  https://testnet.snowtrace.io
```

6. Click "Save"
7. Switch to Avalanche Fuji network

### Get Test AVAX

1. Visit [Avalanche Faucet](https://faucet.avax.network/)
2. Select "Fuji (C-Chain)" from dropdown
3. Connect your wallet or enter your address
4. Request tokens (you'll receive 0.5 AVAX)
5. Wait for confirmation (~2 seconds)

## Step 4: Deploy Smart Contract

### Using Remix IDE (Easiest)

1. **Open Remix**
   - Go to https://remix.ethereum.org/
   - Wait for IDE to load

2. **Create Contract File**
   - In File Explorer (left panel), click the "+" icon
   - Name the file: `TowerBlocksGame.sol`
   - Click on the file to open it
   - Copy the entire contract from `contracts/TowerBlocksGame.sol`
   - Paste into Remix editor

3. **Compile Contract**
   - Click "Solidity Compiler" icon (2nd icon on left)
   - Select compiler version: `0.8.20` or higher
   - Enable "Auto compile" (optional but helpful)
   - Click "Compile TowerBlocksGame.sol"
   - Wait for green checkmark ✅

4. **Deploy to Fuji**
   - Click "Deploy & Run Transactions" icon (3rd icon on left)
   - Under "ENVIRONMENT", select "Injected Provider - MetaMask"
   - MetaMask popup will appear - click "Connect"
   - **IMPORTANT**: Verify MetaMask is on "Avalanche Fuji" network
   - Under "CONTRACT", ensure "TowerBlocksGame" is selected
   - Click orange "Deploy" button
   - MetaMask popup: Review transaction (~0.01 AVAX gas)
   - Click "Confirm"
   - Wait for deployment (~2-3 seconds)

5. **Copy Contract Address**
   - Look under "Deployed Contracts" section (bottom of right panel)
   - You'll see "TOWERBLOCKSGAME AT 0x..."
   - Click the copy icon next to the address
   - Save this address - you'll need it!

6. **Update Your Code**
   - Open `lib/contract-abi.ts` in your code editor
   - Find the `CONTRACT_ADDRESSES` object
   - Replace the Fuji address:

   ```typescript
   export const CONTRACT_ADDRESSES = {
     43113: '0xYourContractAddressHere', // ← Paste your address
     43114: '0x0000000000000000000000000000000000000000',
   };
   ```

   - Save the file

## Step 5: Test Your Setup

### Start Development Server

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### Open in Browser

1. Navigate to http://localhost:3000
2. You should see the Tower Blocks game!

### Test Wallet Connection

1. Click "Connect Wallet" button (top right)
2. Select your wallet (MetaMask)
3. Approve connection in wallet popup
4. You should see your address displayed
5. Leaderboard should load (might be empty initially)

### Test the Game

1. Click the canvas or press Space to start
2. Play the game by dropping blocks
3. When you die, you should see:
   - Extra life purchase modal
   - Option to buy for 0.1 AVAX
   - Or restart game

### Test Extra Life Purchase

1. Play until game over
2. Click "Buy Extra Life (0.1 AVAX)"
3. MetaMask popup appears
4. Review transaction details
5. Click "Confirm"
6. Wait for confirmation (~2-3 seconds)
7. Game should resume from where you died! 🎉

### Verify on Blockchain

1. Go to https://testnet.snowtrace.io
2. Search for your contract address
3. You should see:
   - Contract creation transaction
   - Your extra life purchase transaction
   - Score submission transactions

## Step 6: Verify Everything Works

### Checklist

- [ ] ✅ `npm install` completed without errors
- [ ] ✅ WalletConnect Project ID configured
- [ ] ✅ MetaMask has Fuji network added
- [ ] ✅ Received testnet AVAX from faucet
- [ ] ✅ Smart contract deployed successfully
- [ ] ✅ Contract address updated in code
- [ ] ✅ Development server starts (`npm run dev`)
- [ ] ✅ Game loads at localhost:3000
- [ ] ✅ Wallet connects successfully
- [ ] ✅ Game plays correctly
- [ ] ✅ Extra life purchase works
- [ ] ✅ Transaction confirms on blockchain
- [ ] ✅ Leaderboard displays
- [ ] ✅ Player stats show up

## Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Wallet won't connect

**Checklist:**
- [ ] Is MetaMask unlocked?
- [ ] Are you on Fuji network?
- [ ] Did you add Project ID to wagmi-config.ts?
- [ ] Try clearing browser cache
- [ ] Try different browser

### Issue: Transaction fails

**Possible causes:**
1. **Insufficient AVAX**: Get more from faucet
2. **Wrong network**: Switch to Fuji in MetaMask
3. **Wrong contract address**: Double-check in contract-abi.ts
4. **Gas too low**: Try again, MetaMask will estimate

### Issue: Leaderboard empty

**This is normal!** Leaderboard will populate as players submit scores.

**To test:**
- Play a game with wallet connected
- Game will auto-submit score
- Refresh page to see updated leaderboard

### Issue: Game canvas not rendering

**Solutions:**
1. Check browser console (F12) for errors
2. Try clearing localStorage: `localStorage.clear()`
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Try different browser (Chrome recommended)

### Issue: Extra life modal doesn't appear

**Check:**
1. Is wallet connected?
2. Check browser console for errors
3. Verify contract is deployed
4. Make sure you're on the correct network

## Next Steps

### For Development

1. **Customize the game**
   - Edit `components/TowerBlocks.tsx`
   - Change colors, speeds, difficulty
   - Add new features

2. **Modify smart contract**
   - Edit `contracts/TowerBlocksGame.sol`
   - Change extra life price
   - Add new functions
   - Redeploy to get new address

3. **Style the UI**
   - Edit `app/page.tsx` for layout
   - Modify `app/globals.css` for styles
   - Update `components/Leaderboard.tsx`

### For Production

1. **Test thoroughly on Fuji testnet**
   - Play many games
   - Test with different wallets
   - Have friends test it

2. **Deploy to mainnet** (when ready)
   - Follow DEPLOYMENT.md guide
   - Will cost real AVAX (~0.1-0.2 for deployment)
   - Update contract address for chain ID 43114

3. **Deploy frontend**
   - See DEPLOYMENT.md for Vercel/Netlify steps
   - Connect custom domain
   - Set up analytics

## Resources

### Documentation
- 📚 [Full README](./README.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- ⚡ [Quick Start](./QUICKSTART.md)
- 📊 [Project Summary](./PROJECT_SUMMARY.md)

### Avalanche Resources
- [Avalanche Docs](https://docs.avax.network/)
- [HyperSDK](https://www.avax.network/hypersdk)
- [Avalanche Discord](https://discord.gg/avalanche)
- [Avalanche Forum](https://forum.avax.network/)
- [SnowTrace Explorer](https://snowtrace.io/)

### Development Tools
- [Remix IDE](https://remix.ethereum.org/)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [Avalanche Faucet](https://faucet.avax.network/)
- [MetaMask](https://metamask.io/)
- [Core Wallet](https://core.app/)

## Getting Help

### Check These First
1. Browser console (F12 → Console tab)
2. Terminal output where `npm run dev` is running
3. MetaMask activity tab for failed transactions
4. SnowTrace for on-chain activity

### Ask for Help
- GitHub Issues (if you forked/cloned repo)
- Avalanche Discord #developers channel
- Stack Overflow with `avalanche` tag

## Support the Project

If you build something cool with this:
- ⭐ Star the repo
- 🐦 Share on Twitter
- 💬 Join Avalanche community
- 🛠️ Contribute improvements

---

## Quick Command Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for linting errors
npm run lint
```

## Environment Variables Reference

Create `.env.local` (optional):
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

**Ready to build? Let's go! 🚀**

If you've completed all steps above, you should have a fully functional Tower Blocks game running on Avalanche!

Start playing, buying extra lives, and climbing the leaderboard! 🎮🏔️
