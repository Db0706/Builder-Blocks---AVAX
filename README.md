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

