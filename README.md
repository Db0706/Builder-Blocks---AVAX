# 🎮 Tower Blocks - Avalanche Edition

A blockchain-powered isometric stacking game built on Avalanche. Stack blocks, compete on the leaderboard, and buy extra lives with AVAX!

## ✨ Features

- **Isometric 3D Block Stacking**: Beautiful canvas-based game with smooth animations
- **Blockchain Integration**: Built on Avalanche C-Chain for fast, low-cost transactions
- **Extra Lives**: Buy additional lives with 0.1 AVAX to continue from where you died
- **On-Chain Leaderboard**: Your high scores are permanently stored on the blockchain
- **Wallet Connect**: Seamless integration with Core, MetaMask, and other Web3 wallets
- **Player Statistics**: Track your games played, high scores, and total spent

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (Core Wallet or MetaMask)
- Avalanche Fuji testnet AVAX ([Get from faucet](https://faucet.avax.network/))

### Installation

1. Clone the repository:
```bash
cd tower-blocks-avax
```

2. Install dependencies:
```bash
npm install
```

3. Configure WalletConnect:
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Create a new project
   - Copy your Project ID
   - Edit `lib/wagmi-config.ts` and replace `YOUR_WALLETCONNECT_PROJECT_ID`

4. Deploy the smart contract (see [Contract Deployment](#contract-deployment))

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📝 Contract Deployment

### Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org/)

2. Create a new file `TowerBlocksGame.sol` and paste the contract from `contracts/TowerBlocksGame.sol`

3. Compile the contract:
   - Click "Solidity Compiler" tab
   - Select Solidity version `0.8.20+`
   - Click "Compile TowerBlocksGame.sol"

4. Deploy to Avalanche Fuji Testnet:
   - Click "Deploy & Run Transactions" tab
   - Environment: Select "Injected Provider - MetaMask"
   - Make sure MetaMask is connected to Avalanche Fuji Testnet
   - Click "Deploy"
   - Confirm the transaction in MetaMask

5. Copy the deployed contract address

6. Update `lib/contract-abi.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  43113: '0xYOUR_DEPLOYED_CONTRACT_ADDRESS', // Fuji Testnet
  43114: '0x0000000000000000000000000000000000000000', // Mainnet (deploy later)
};
```

### Avalanche Fuji Testnet Configuration

Add Fuji testnet to MetaMask:
- **Network Name**: Avalanche Fuji C-Chain
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Chain ID**: 43113
- **Symbol**: AVAX
- **Explorer**: https://testnet.snowtrace.io

Get testnet AVAX from the [Avalanche Faucet](https://faucet.avax.network/).

### Using Hardhat (Alternative)

1. Install Hardhat:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. Create `hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: ["YOUR_PRIVATE_KEY"] // NEVER commit this!
    }
  }
};

export default config;
```

3. Create deployment script `scripts/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  const TowerBlocksGame = await ethers.getContractFactory("TowerBlocksGame");
  const game = await TowerBlocksGame.deploy();
  await game.waitForDeployment();
  console.log("TowerBlocksGame deployed to:", await game.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

4. Deploy:
```bash
npx hardhat run scripts/deploy.ts --network fuji
```

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Start Game**: Click or press Space to start
3. **Stack Blocks**: Drop blocks by clicking, tapping, or pressing Space
4. **Perfect Alignment**: Align blocks perfectly to maintain width
5. **Game Over**: When you miss, you can:
   - Buy an extra life for 0.1 AVAX to continue
   - Restart the game
6. **Compete**: Your high score is submitted to the on-chain leaderboard

## 🏗️ Project Structure

```
tower-blocks-avax/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main game page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── TowerBlocks.tsx   # Main game component
│   ├── Leaderboard.tsx   # Leaderboard display
│   └── Providers.tsx     # Web3 providers wrapper
├── contracts/            # Solidity smart contracts
│   └── TowerBlocksGame.sol
├── lib/                  # Utility libraries
│   ├── avalanche-config.ts    # Avalanche chain configs
│   ├── wagmi-config.ts       # Wagmi configuration
│   ├── contract-abi.ts       # Contract ABI and addresses
│   ├── utils.ts              # Helper functions
│   └── hooks/
│       └── useGameContract.ts # Contract interaction hooks
└── README.md
```

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env.local`:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Chain Configuration

The app supports both Fuji Testnet and Mainnet. Edit `lib/avalanche-config.ts` to modify chain settings.

## 🎯 Smart Contract Functions

### Player Functions
- `buyExtraLife()`: Purchase an extra life for 0.1 AVAX
- `submitScore(uint256 score)`: Submit your score to the blockchain
- `getPlayerData(address player)`: View player statistics
- `getLeaderboard()`: Get top 10 players and scores

### Owner Functions
- `withdraw()`: Withdraw accumulated AVAX (owner only)
- `transferOwnership(address newOwner)`: Transfer contract ownership

## 🔐 Security Notes

- Smart contract is unaudited - use at your own risk
- Start with testnet before deploying to mainnet
- Never share your private keys
- Use a separate wallet for testing

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Go to [Vercel](https://vercel.com)

3. Import your repository

4. Add environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

5. Deploy!

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=.next
```

## 📚 Resources

- [Avalanche Documentation](https://docs.avax.network/)
- [HyperSDK Introduction](https://www.avax.network/about/blog/introducing-hypersdk-a-foundation-for-the-fastest-blockchains-of-the-future)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Avalanche Faucet](https://faucet.avax.network/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🎊 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Avalanche](https://www.avax.network/)
- [Viem](https://viem.sh/)

## 🐛 Troubleshooting

### Wallet Connection Issues
- Make sure you're on the correct network (Fuji Testnet)
- Clear your browser cache and reconnect
- Try a different wallet

### Transaction Failures
- Ensure you have enough AVAX for gas fees
- Check that the contract is deployed on the current network
- Verify the contract address in `lib/contract-abi.ts`

### Game Not Loading
- Check browser console for errors
- Ensure all dependencies are installed (`npm install`)
- Try clearing localStorage: `localStorage.clear()`

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the Avalanche Discord
- Review the documentation

---

**Happy Stacking! 🎮🏔️**
