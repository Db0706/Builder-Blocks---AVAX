// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TowerBlocksGame - STANDALONE VERSION (No OpenZeppelin)
 * @notice Smart contract for Tower Blocks game on Avalanche
 * @dev Implements score verification with inlined security features
 */
contract TowerBlocksGame {
    // Extra life price in AVAX (0.1 AVAX)
    uint256 public constant EXTRA_LIFE_PRICE = 0.1 ether;

    // Owner of the contract
    address public owner;

    // Server address that signs valid scores
    address public scoreVerifier;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Player data structure
    struct PlayerData {
        uint256 highScore;
        uint256 totalGamesPlayed;
        uint256 extraLivesPurchased;
        uint256 totalSpent;
    }

    // Mappings
    mapping(address => PlayerData) public players;
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardIndex;
    mapping(address => uint256) public pendingWithdrawals;
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
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _scoreVerifier) {
        require(_scoreVerifier != address(0), "Invalid verifier");
        owner = msg.sender;
        scoreVerifier = _scoreVerifier;
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Purchase an extra life with AVAX
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
     * @notice Submit a score with server signature
     */
    function submitScore(
        uint256 score,
        bytes32 nonce,
        bytes memory signature
    ) external nonReentrant {
        require(!usedScoreNonces[nonce], "Nonce already used");

        // Reconstruct message hash
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, score, nonce));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // Verify signature
        address signer = recoverSigner(ethSignedMessageHash, signature);
        require(signer == scoreVerifier, "Invalid signature");

        usedScoreNonces[nonce] = true;

        PlayerData storage player = players[msg.sender];
        player.totalGamesPlayed += 1;

        emit ScoreSubmitted(msg.sender, score, block.timestamp);

        if (score > player.highScore) {
            uint256 oldScore = player.highScore;
            player.highScore = score;
            emit HighScoreUpdated(msg.sender, oldScore, score);
            updateLeaderboard(msg.sender);
        }
    }

    /**
     * @notice Recover signer from signature
     */
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /**
     * @notice Update leaderboard
     */
    function updateLeaderboard(address player) internal {
        if (leaderboard.length < 10) {
            if (leaderboardIndex[player] == 0 &&
                (leaderboard.length == 0 || leaderboard[0] != player)) {
                leaderboard.push(player);
                leaderboardIndex[player] = leaderboard.length;
            }
        }
        sortLeaderboard();
    }

    /**
     * @notice Sort leaderboard
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

        if (leaderboard.length > 10) {
            address removedPlayer = leaderboard[leaderboard.length - 1];
            leaderboard.pop();
            leaderboardIndex[removedPlayer] = 0;
        }

        for (uint256 i = 0; i < leaderboard.length; i++) {
            leaderboardIndex[leaderboard[i]] = i + 1;
        }
    }

    /**
     * @notice Calculate prizes for top 5 (owner only)
     */
    function calculatePrizes() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        require(leaderboard.length > 0, "No players");

        uint256[5] memory prizePercentages = [
            uint256(2000), // 20%
            uint256(1200), // 12%
            uint256(900),  // 9%
            uint256(600),  // 6%
            uint256(300)   // 3%
        ];

        uint256 totalDistributed = 0;
        uint256 maxWinners = leaderboard.length < 5 ? leaderboard.length : 5;

        for (uint256 i = 0; i < maxWinners; i++) {
            address winner = leaderboard[i];
            uint256 prize = (balance * prizePercentages[i]) / 10000;

            if (prize > 0) {
                pendingWithdrawals[winner] += prize;
                totalDistributed += prize;
                emit PrizeAwarded(winner, i + 1, prize);
            }
        }

        emit PrizesCalculated(totalDistributed, block.timestamp);
    }

    /**
     * @notice Withdraw prize
     */
    function withdrawPrize() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No prize");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Owner withdraw
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    /**
     * @notice Emergency withdraw
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Failed");

        emit Withdrawal(owner, balance);
    }

    /**
     * @notice Update score verifier
     */
    function setScoreVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid address");
        address oldVerifier = scoreVerifier;
        scoreVerifier = newVerifier;
        emit ScoreVerifierUpdated(oldVerifier, newVerifier);
    }

    // View functions
    function getPlayerData(address playerAddress) external view returns (PlayerData memory) {
        return players[playerAddress];
    }

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

    function getPlayerRank(address playerAddress) external view returns (uint256) {
        return leaderboardIndex[playerAddress];
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getPrizeAmounts() external view returns (uint256[5] memory) {
        uint256 balance = address(this).balance;
        uint256[5] memory prizePercentages = [
            uint256(2000),
            uint256(1200),
            uint256(900),
            uint256(600),
            uint256(300)
        ];

        uint256[5] memory prizes;
        for (uint256 i = 0; i < 5; i++) {
            prizes[i] = (balance * prizePercentages[i]) / 10000;
        }

        return prizes;
    }

    function getPendingWithdrawal(address player) external view returns (uint256) {
        return pendingWithdrawals[player];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function renounceOwnership() external onlyOwner {
        address oldOwner = owner;
        owner = address(0);
        emit OwnershipTransferred(oldOwner, address(0));
    }
}
