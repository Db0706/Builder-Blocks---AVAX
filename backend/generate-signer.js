/**
 * Generate a new wallet for score signing
 *
 * Run this once to generate a signing wallet:
 * node backend/generate-signer.js
 */

const { ethers } = require('ethers');

console.log('🔐 Generating Score Signer Wallet...\n');

const wallet = ethers.Wallet.createRandom();

console.log('✅ New signing wallet generated!\n');
console.log('📋 COPY THESE VALUES:\n');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('\n⚠️  SECURITY INSTRUCTIONS:');
console.log('1. Add this to your .env file:');
console.log(`   SCORE_SIGNER_PRIVATE_KEY=${wallet.privateKey}`);
console.log('\n2. When deploying the contract, use this address as the scoreVerifier:');
console.log(`   ${wallet.address}`);
console.log('\n3. NEVER commit this private key to git!');
console.log('4. Keep this private key secure - it controls score validity!');
console.log('\n✨ Done!\n');
