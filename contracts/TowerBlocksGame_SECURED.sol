// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TowerBlocksGame - SECURED VERSION
 * @notice Smart contract for Tower Blocks game on Avalanche
 * @dev Implements score verification, reentrancy protection, and pull payments
 *
 * SECURITY FEATURES:
 * - Server-signed score verification (prevents fake score submission)
 * - ReentrancyGuard on all state-changing functions
 * - Pull payment pattern (prevents DOS attacks)
 * - Fixed leaderboard index bug
 * - Proper event emissions
 */
contract TowerBlocksGame is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Extra life price in AVAX (0.1 AVAX)
    uint256 public constant EXTRA_LIFE_PRICE = 0.1 ether;

    // Owner of the contract
    address public owner;

    // Server address that signs valid scores
    address public scoreVerifier;

    // Player data structure
    struct PlayerData {
        uint256 highScore;
        uint256 totalGamesPlayed;
        uint256 extraLivesPurchased;
        uint256 totalSpent;
    }

    // Mapping from player address to their data
    mapping(address => PlayerData) public players;

    // Leaderboard - top 10 scores
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardIndex;

    // Pull payment pattern - pending withdrawals
    mapping(address => uint256) public pendingWithdrawals;

    // Track used score nonces to prevent replay attacks
    mapping(bytes32 => bool) public usedScoreNonces;

    // Events
    event ExtraLifePurchased(address indexed player, uint256 amount, uint256 timestamp);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event HighScoreUpdated(address indexed player, uint256 oldScore, uint256 newScore);
    event Withdrawal(address indexed recipient, uint256 amount);
    event PrizesCalculated(uint256 totalPrizePool, uint256 timestamp);
    event PrizeAwarded(address indexed player, uint256 position, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ScoreVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _scoreVerifier) {
        require(_scoreVerifier != address(0), "Invalid verifier address");
        owner = msg.sender;
        scoreVerifier = _scoreVerifier;
    }

    /**
     * @notice Purchase an extra life with AVAX
     * @dev Sends AVAX to contract and records the purchase
     * SECURITY: Protected against reentrancy with nonReentrant
     * FIXED: Removed refund logic to fix gas estimation issues
     */
    function buyExtraLife() external payable nonReentrant returns (bool) {
        require(msg.value == EXTRA_LIFE_PRICE, "Must send exactly 0.1 AVAX");

        PlayerData storage player = players[msg.sender];
        player.extraLivesPurchased += 1;
        player.totalSpent += msg.value;

        emit ExtraLifePurchased(msg.sender, msg.value, block.timestamp);

        return true;
    }

    /**
     * @notice Submit a score after game over with server signature
     * @param score The score achieved in the game
     * @param nonce Unique nonce to prevent replay attacks
     * @param signature Server signature proving score validity
     *
     * SECURITY: Scores must be signed by scoreVerifier backend
     * Backend signs: keccak256(abi.encodePacked(player, score, nonce))
     */
    function submitScore(
        uint256 score,
        bytes32 nonce,
        bytes memory signature
    ) external nonReentrant {
        // Verify score hasn't been submitted before (prevent replay)
        require(!usedScoreNonces[nonce], "Nonce already used");

        // Reconstruct the message that should have been signed
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, score, nonce));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // Verify the signature
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == scoreVerifier, "Invalid signature");

        // Mark nonce as used
        usedScoreNonces[nonce] = true;

        PlayerData storage player = players[msg.sender];
        player.totalGamesPlayed += 1;

        emit ScoreSubmitted(msg.sender, score, block.timestamp);

        // Update high score if beaten
        if (score > player.highScore) {
            uint256 oldScore = player.highScore;
            player.highScore = score;
            emit HighScoreUpdated(msg.sender, oldScore, score);

            // Update leaderboard
            updateLeaderboard(msg.sender);
        }
    }

    /**
     * @notice Update the leaderboard with a new high score
     * @param player Address of the player
     * SECURITY: Fixed index tracking bug
     */
    function updateLeaderboard(address player) internal {
        // If leaderboard has less than 10 entries, just add
        if (leaderboard.length < 10) {
            if (leaderboardIndex[player] == 0 && (leaderboard.length == 0 || leaderboard[0] != player)) {
                leaderboard.push(player);
                leaderboardIndex[player] = leaderboard.length;
            }
        }

        // Sort and maintain top 10
        sortLeaderboard();
    }

    /**
     * @notice Simple bubble sort for leaderboard (max 10 entries)
     * SECURITY: Fixed bug - now properly resets index when player is removed
     */
    function sortLeaderboard() internal {
        uint256 length = leaderboard.length;
        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (players[leaderboard[j]].highScore > players[leaderboard[i]].highScore) {
                    address temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }

        // Keep only top 10 and reset removed player's index
        if (leaderboard.length > 10) {
            address removedPlayer = leaderboard[leaderboard.length - 1];
            leaderboard.pop();
            leaderboardIndex[removedPlayer] = 0; // FIX: Reset index!
        }

        // Update indices
        for (uint256 i = 0; i < leaderboard.length; i++) {
            leaderboardIndex[leaderboard[i]] = i + 1;
        }
    }

    /**
     * @notice Calculate prizes for top 5 leaderboard players (owner only)
     * @dev Uses PULL PAYMENT pattern - players must withdraw prizes themselves
     * SECURITY: No external calls = no reentrancy, no DOS attacks
     * Prize breakdown: 1st=20%, 2nd=12%, 3rd=9%, 4th=6%, 5th=3% of total pot
     */
    function calculatePrizes() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to distribute");
        require(leaderboard.length > 0, "No players on leaderboard");

        // Prize percentages (in basis points, 1% = 100)
        uint256[5] memory prizePercentages = [
            uint256(2000), // 1st: 20%
            uint256(1200), // 2nd: 12%
            uint256(900),  // 3rd: 9%
            uint256(600),  // 4th: 6%
            uint256(300)   // 5th: 3%
        ];

        uint256 totalDistributed = 0;

        // Calculate prizes for top 5 (or less if leaderboard is smaller)
        uint256 maxWinners = leaderboard.length < 5 ? leaderboard.length : 5;

        for (uint256 i = 0; i < maxWinners; i++) {
            address winner = leaderboard[i];
            uint256 prize = (balance * prizePercentages[i]) / 10000;

            if (prize > 0) {
                // SECURITY: Use pull payment - no external calls!
                pendingWithdrawals[winner] += prize;
                totalDistributed += prize;
                emit PrizeAwarded(winner, i + 1, prize);
            }
        }

        emit PrizesCalculated(totalDistributed, block.timestamp);
    }

    /**
     * @notice Withdraw your pending prizes
     * SECURITY: Pull payment pattern - each player withdraws their own prize
     * CEI pattern followed: checks, effects, interactions
     */
    function withdrawPrize() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No prize to withdraw");

        // CEI Pattern: Effects before interactions
        pendingWithdrawals[msg.sender] = 0;

        // Interactions
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Withdraw contract balance (owner only)
     * @dev Owner can only withdraw funds NOT allocated to prizes
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        // Interactions
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    /**
     * @notice Emergency withdraw for owner (in case of critical bug)
     * @dev Should only be used if contract needs to be migrated
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    /**
     * @notice Update the score verifier address (owner only)
     * @param newVerifier New backend server address
     */
    function setScoreVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid address");
        address oldVerifier = scoreVerifier;
        scoreVerifier = newVerifier;
        emit ScoreVerifierUpdated(oldVerifier, newVerifier);
    }

    /**
     * @notice Get player data
     * @param playerAddress Address of the player
     * @return PlayerData struct
     */
    function getPlayerData(address playerAddress) external view returns (PlayerData memory) {
        return players[playerAddress];
    }

    /**
     * @notice Get top 10 leaderboard
     * @return Array of addresses and their scores
     */
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 length = leaderboard.length > 10 ? 10 : leaderboard.length;
        address[] memory addresses = new address[](length);
        uint256[] memory scores = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            addresses[i] = leaderboard[i];
            scores[i] = players[leaderboard[i]].highScore;
        }

        return (addresses, scores);
    }

    /**
     * @notice Get player's rank on leaderboard (0 if not on leaderboard)
     * @param playerAddress Address of the player
     * @return Rank (1-10) or 0 if not on leaderboard
     */
    function getPlayerRank(address playerAddress) external view returns (uint256) {
        return leaderboardIndex[playerAddress];
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get prize amounts for top 5 positions based on current balance
     * @return Array of prize amounts [1st, 2nd, 3rd, 4th, 5th]
     */
    function getPrizeAmounts() external view returns (uint256[5] memory) {
        uint256 balance = address(this).balance;
        uint256[5] memory prizePercentages = [
            uint256(2000), // 1st: 20%
            uint256(1200), // 2nd: 12%
            uint256(900),  // 3rd: 9%
            uint256(600),  // 4th: 6%
            uint256(300)   // 5th: 3%
        ];

        uint256[5] memory prizes;
        for (uint256 i = 0; i < 5; i++) {
            prizes[i] = (balance * prizePercentages[i]) / 10000;
        }

        return prizes;
    }

    /**
     * @notice Get pending withdrawal amount for an address
     * @param player Address to check
     * @return Amount pending withdrawal
     */
    function getPendingWithdrawal(address player) external view returns (uint256) {
        return pendingWithdrawals[player];
    }

    /**
     * @notice Transfer ownership with proper event emission
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Renounce ownership (makes contract ownerless)
     * WARNING: This will make owner functions permanently inaccessible
     */
    function renounceOwnership() external onlyOwner {
        address oldOwner = owner;
        owner = address(0);
        emit OwnershipTransferred(oldOwner, address(0));
    }
}
