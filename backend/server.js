/**
 * Score Signing Server for TowerBlocksGame
 *
 * SECURITY: This server signs valid game scores to prevent cheating
 * The smart contract will only accept scores signed by this server
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// IMPORTANT: Set this in your .env file
// This private key signs the scores - keep it SECRET!
const SIGNING_PRIVATE_KEY = process.env.SCORE_SIGNER_PRIVATE_KEY;

if (!SIGNING_PRIVATE_KEY) {
  console.error('❌ ERROR: SCORE_SIGNER_PRIVATE_KEY not set in .env');
  console.error('Generate one with: node backend/generate-signer.js');
  process.exit(1);
}

const signer = new ethers.Wallet(SIGNING_PRIVATE_KEY);

console.log('🔐 Score Signer Address:', signer.address);
console.log('📝 IMPORTANT: Use this address when deploying the contract!');
console.log('');

/**
 * Generate a unique nonce for score submission
 */
function generateNonce() {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Sign a score for a player
 *
 * In production, add validation here:
 * - Check if score is realistic
 * - Rate limit per player
 * - Verify game session
 */
app.post('/api/sign-score', async (req, res) => {
  try {
    const { player, score } = req.body;

    // Validation
    if (!player || !ethers.isAddress(player)) {
      return res.status(400).json({ error: 'Invalid player address' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    // TODO: Add anti-cheat validation here
    // - Check if score is within reasonable range
    // - Verify game session token
    // - Rate limit submissions
    const MAX_REASONABLE_SCORE = 10000;
    if (score > MAX_REASONABLE_SCORE) {
      console.warn(`⚠️  Suspicious score: ${score} from ${player}`);
      // For now just warn, but you should reject or flag
    }

    // Generate unique nonce
    const nonce = generateNonce();

    // Create message hash matching smart contract
    // keccak256(abi.encodePacked(player, score, nonce))
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'bytes32'],
      [player, score, nonce]
    );

    // Sign the message
    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    console.log(`✅ Signed score: ${score} for ${player.slice(0, 6)}...${player.slice(-4)}`);

    res.json({
      success: true,
      nonce,
      signature,
      signer: signer.address,
    });

  } catch (error) {
    console.error('❌ Error signing score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    signer: signer.address,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Score signing server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log('');
});
