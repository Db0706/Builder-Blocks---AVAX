# ⚡ Quick Start Guide

Get your Tower Blocks game running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Get WalletConnect Project ID

1. Visit [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a free project
3. Copy your Project ID
4. Edit `lib/wagmi-config.ts` and replace `YOUR_WALLETCONNECT_PROJECT_ID`

## 3. Deploy Smart Contract

### Easy Way (Remix IDE)

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create new file `TowerBlocksGame.sol`
3. Copy content from `contracts/TowerBlocksGame.sol`
4. Compile with Solidity 0.8.20+
5. Deploy to Avalanche Fuji Testnet
6. Copy deployed address
7. Update `lib/contract-abi.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  43113: '0xYOUR_ADDRESS_HERE',
  // ...
};
```

## 4. Get Testnet AVAX

1. Add Fuji network to MetaMask:
   - Network: Avalanche Fuji C-Chain
   - RPC: https://api.avax-test.network/ext/bc/C/rpc
   - Chain ID: 43113
   - Symbol: AVAX

2. Get free tokens: [faucet.avax.network](https://faucet.avax.network)

## 5. Run the Game

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Test Features

1. ✅ Connect your wallet
2. ✅ Play the game
3. ✅ Buy an extra life when you die
4. ✅ Check the leaderboard

## Troubleshooting

**Wallet won't connect?**
- Make sure you're on Fuji Testnet
- Clear cache and try again

**Transaction fails?**
- Check contract address in `lib/contract-abi.ts`
- Ensure you have testnet AVAX
- Verify contract is deployed

**Game not loading?**
- Run `npm install` again
- Check browser console for errors
- Clear localStorage

## What's Next?

- Read [README.md](./README.md) for full documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Customize game parameters in `components/TowerBlocks.tsx`

## Need Help?

- Check the [Avalanche Discord](https://discord.gg/avalanche)
- Review [Avalanche Docs](https://docs.avax.network/)
- Open an issue on GitHub

---

**Have fun building! 🎮**
