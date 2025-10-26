import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TowerBlocksGame contract to Avalanche Fuji...");

  // Get the contract factory
  const TowerBlocksGame = await ethers.getContractFactory("TowerBlocksGame");

  // Deploy the contract
  const game = await TowerBlocksGame.deploy();

  // Wait for deployment to finish
  await game.waitForDeployment();

  const address = await game.getAddress();

  console.log("\n✅ TowerBlocksGame deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("\nNext steps:");
  console.log("1. Update lib/contract-abi.ts with this address:");
  console.log(`   43113: '${address}',`);
  console.log("\n2. Verify the contract on SnowTrace:");
  console.log(`   npx hardhat verify --network fuji ${address}`);
  console.log("\n3. View on explorer:");
  console.log(`   https://testnet.snowtrace.io/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
