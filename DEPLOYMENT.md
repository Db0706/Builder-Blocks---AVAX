# 🚀 Deployment Guide

This guide will walk you through deploying the Tower Blocks game on Avalanche.

## Step 1: Get WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Edit `lib/wagmi-config.ts`:
```typescript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace this
```

## Step 2: Set Up Avalanche Fuji Testnet

### Add Fuji to MetaMask

1. Open MetaMask
2. Click on the network dropdown
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter the following details:

```
Network Name: Avalanche Fuji C-Chain
New RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Currency Symbol: AVAX
Block Explorer URL: https://testnet.snowtrace.io
```

6. Click "Save"

### Get Testnet AVAX

1. Visit the [Avalanche Faucet](https://faucet.avax.network/)
2. Connect your wallet or enter your address
3. Select "Fuji (C-Chain)"
4. Request test tokens (you'll get 0.5 AVAX)

## Step 3: Deploy Smart Contract

### Method 1: Using Remix IDE (Recommended for Beginners)

1. **Open Remix**
   - Go to [https://remix.ethereum.org/](https://remix.ethereum.org/)

2. **Create Contract File**
   - In the File Explorer, click "Create New File"
   - Name it `TowerBlocksGame.sol`
   - Copy the entire contract from `contracts/TowerBlocksGame.sol`
   - Paste it into Remix

3. **Compile Contract**
   - Click the "Solidity Compiler" icon (left sidebar)
   - Select compiler version `0.8.20` or higher
   - Click "Compile TowerBlocksGame.sol"
   - Wait for the green checkmark

4. **Deploy Contract**
   - Click "Deploy & Run Transactions" icon (left sidebar)
   - Environment: Select "Injected Provider - MetaMask"
   - MetaMask will pop up - make sure you're on **Avalanche Fuji Testnet**
   - Click "Deploy"
   - Confirm the transaction in MetaMask (gas fee ~0.01 AVAX)

5. **Copy Contract Address**
   - After deployment, find "Deployed Contracts" section
   - Copy the contract address (starts with 0x...)

6. **Update Your Code**
   - Edit `lib/contract-abi.ts`
   - Replace the Fuji address:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     43113: '0xYOUR_CONTRACT_ADDRESS_HERE', // Paste your address
     43114: '0x0000000000000000000000000000000000000000',
   };
   ```

### Method 2: Using Hardhat (Advanced)

1. **Install Hardhat**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
npx hardhat init
```

2. **Configure Hardhat**

Create `hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: "snowtrace", // No API key needed
      avalanche: "snowtrace",
    },
  },
};

export default config;
```

3. **Create .env file**
```bash
PRIVATE_KEY=your_metamask_private_key_here
```

⚠️ **Security Warning**: NEVER commit your .env file or share your private key!

4. **Create Deployment Script**

Create `scripts/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TowerBlocksGame...");

  const TowerBlocksGame = await ethers.getContractFactory("TowerBlocksGame");
  const game = await TowerBlocksGame.deploy();

  await game.waitForDeployment();
  const address = await game.getAddress();

  console.log("TowerBlocksGame deployed to:", address);
  console.log("Update CONTRACT_ADDRESSES in lib/contract-abi.ts with:", address);

  // Verify on SnowTrace (optional)
  console.log("Waiting for block confirmations...");
  await game.deploymentTransaction()?.wait(5);

  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified!");
  } catch (error) {
    console.log("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

5. **Deploy to Fuji Testnet**
```bash
npx hardhat run scripts/deploy.ts --network fuji
```

6. **Verify Contract (Optional)**
```bash
npx hardhat verify --network fuji YOUR_CONTRACT_ADDRESS
```

## Step 4: Test Your Deployment

1. **Run Development Server**
```bash
npm run dev
```

2. **Open Browser**
   - Go to [http://localhost:3000](http://localhost:3000)

3. **Connect Wallet**
   - Click "Connect Wallet"
   - Select MetaMask or Core
   - Make sure you're on Fuji Testnet

4. **Test Game Features**
   - Play the game
   - When you die, try buying an extra life
   - Check if score is submitted to leaderboard
   - Verify transactions on [Fuji Explorer](https://testnet.snowtrace.io)

## Step 5: Deploy to Mainnet (When Ready)

⚠️ **Only deploy to mainnet after thorough testing!**

1. **Get Mainnet AVAX**
   - You'll need real AVAX for deployment (~0.1-0.2 AVAX)
   - Buy from exchanges (Coinbase, Binance, etc.)
   - Send to your wallet

2. **Switch Network**
   - In MetaMask, switch to "Avalanche Network" (Mainnet)

3. **Deploy Contract**
   - Follow same steps as Fuji deployment
   - Use `--network avalanche` for Hardhat
   - Or connect to Avalanche Mainnet in Remix

4. **Update Contract Address**
```typescript
export const CONTRACT_ADDRESSES = {
  43113: '0xYourFujiAddress...',
  43114: '0xYourMainnetAddress...', // Update this
};
```

## Step 6: Deploy Frontend

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Add Environment Variables (if needed)**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - Redeploy

### Deploy to Netlify

1. **Build Your App**
```bash
npm run build
```

2. **Install Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
```

3. **Deploy**
```bash
netlify deploy --prod
```

## Step 7: Verify Everything Works

### Checklist

- [ ] Wallet connection works
- [ ] Game plays correctly
- [ ] Extra life purchase works
- [ ] Transactions confirm on blockchain
- [ ] Leaderboard updates after game
- [ ] Player stats display correctly
- [ ] Contract verified on SnowTrace
- [ ] Frontend deployed and accessible

## Monitoring Your Contract

1. **View on SnowTrace**
   - Fuji: `https://testnet.snowtrace.io/address/YOUR_CONTRACT_ADDRESS`
   - Mainnet: `https://snowtrace.io/address/YOUR_CONTRACT_ADDRESS`

2. **Monitor Transactions**
   - View all buyExtraLife transactions
   - Check score submissions
   - Track total value locked

3. **Withdraw Funds (Owner Only)**
```bash
# In Remix or using Hardhat console
await game.withdraw()
```

## Troubleshooting

### Contract Deployment Failed
- Check you have enough AVAX for gas
- Verify you're on the correct network
- Try increasing gas limit in MetaMask

### Wallet Won't Connect
- Clear browser cache
- Make sure MetaMask is unlocked
- Verify network is added correctly

### Transactions Failing
- Check contract address is correct
- Ensure you have enough AVAX
- Verify contract is deployed on current network

### Leaderboard Not Updating
- Wait for transaction confirmation
- Try refreshing the page
- Check browser console for errors

## Security Best Practices

1. **Never share your private key**
2. **Use .env for sensitive data**
3. **Test thoroughly on testnet first**
4. **Consider getting contract audited for mainnet**
5. **Use a separate wallet for testing**
6. **Set reasonable gas limits**
7. **Monitor contract for unusual activity**

## Cost Estimates

### Fuji Testnet (FREE)
- Contract deployment: 0 AVAX (testnet)
- Extra life purchase: 0.1 AVAX (testnet)
- Score submission: ~0.001 AVAX (testnet)

### Mainnet
- Contract deployment: ~0.1-0.2 AVAX
- Extra life purchase: 0.1 AVAX + gas (~0.001 AVAX)
- Score submission: ~0.001-0.002 AVAX gas

## Next Steps

1. Customize game parameters (extra life price, etc.)
2. Add more game features
3. Implement token rewards
4. Create NFT achievements
5. Build a tournament system

## Support

- [Avalanche Discord](https://discord.gg/avalanche)
- [Avalanche Documentation](https://docs.avax.network/)
- [HyperSDK Resources](https://www.avax.network/hypersdk)

---

Good luck with your deployment! 🚀
