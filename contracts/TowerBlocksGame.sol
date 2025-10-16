// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TowerBlocksGame
 * @notice Smart contract for Tower Blocks game on Avalanche
 * @dev Handles extra lives purchases and score tracking
 */
contract TowerBlocksGame {
    // Extra life price in AVAX (0.1 AVAX)
    uint256 public constant EXTRA_LIFE_PRICE = 0.1 ether;

    // Owner of the contract
    address public owner;

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

    // Events
    event ExtraLifePurchased(address indexed player, uint256 amount, uint256 timestamp);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event HighScoreUpdated(address indexed player, uint256 oldScore, uint256 newScore);
    event Withdrawal(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Purchase an extra life with AVAX
     * @dev Sends AVAX to contract and records the purchase
     */
    function buyExtraLife() external payable returns (bool) {
        require(msg.value >= EXTRA_LIFE_PRICE, "Insufficient AVAX sent");

        PlayerData storage player = players[msg.sender];
        player.extraLivesPurchased += 1;
        player.totalSpent += msg.value;

        emit ExtraLifePurchased(msg.sender, msg.value, block.timestamp);

        // Refund excess AVAX
        if (msg.value > EXTRA_LIFE_PRICE) {
            uint256 refund = msg.value - EXTRA_LIFE_PRICE;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }

        return true;
    }

    /**
     * @notice Submit a score after game over
     * @param score The score achieved in the game
     */
    function submitScore(uint256 score) external {
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

        // Keep only top 10
        if (leaderboard.length > 10) {
            leaderboard.pop();
        }

        // Update indices
        for (uint256 i = 0; i < leaderboard.length; i++) {
            leaderboardIndex[leaderboard[i]] = i + 1;
        }
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
     * @notice Withdraw accumulated AVAX (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
