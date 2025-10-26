"use client";

import { useGameContractSecured } from "@/lib/hooks/useGameContractSecured";
import { formatAddress } from "@/lib/utils";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useState } from "react";
import { useArena } from "@/components/ArenaProvider";

export default function LeaderboardSecured() {
  const {
    leaderboard,
    playerData,
    contractBalance,
    prizeAmounts,
    pendingWithdrawal,
    withdrawPrize,
    isPending,
    isConfirming,
    isSuccess,
    refetchPendingWithdrawal,
    refetchBalance,
  } = useGameContractSecured();

  const { address: wagmiAddress } = useAccount();
  const { arenaWalletAddress, isInArena } = useArena();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Use Arena wallet when in Arena, otherwise use wagmi wallet
  const address = isInArena ? arenaWalletAddress : wagmiAddress;

  const [addresses, scores] = leaderboard || [[], []];

  // Handle prize withdrawal
  const handleWithdrawPrize = async () => {
    try {
      setIsWithdrawing(true);
      await withdrawPrize();
      // Wait a bit for tx to confirm, then refetch
      setTimeout(() => {
        refetchPendingWithdrawal();
        refetchBalance();
        setIsWithdrawing(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to withdraw prize:", error);
      setIsWithdrawing(false);
    }
  };

  const hasPendingPrize = !!(pendingWithdrawal && Number(pendingWithdrawal) > 0);

  return (
    <div className="bg-zinc-900/60 border border-orange-500/30 rounded-[18px] p-6 backdrop-blur-sm w-full max-w-md">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4 text-center">
        Leaderboard
      </h2>

      {/* Prize Claim Banner */}
      {hasPendingPrize && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border-2 border-green-500/50 animate-pulse">
          <div className="text-center mb-3">
            <div className="text-sm text-green-400 font-semibold mb-1">🎉 You Won a Prize!</div>
            <div className="text-3xl font-bold text-green-400">
              {Number(formatEther(pendingWithdrawal)).toFixed(4)} AVAX
            </div>
          </div>
          <button
            onClick={handleWithdrawPrize}
            disabled={isWithdrawing || isPending || isConfirming}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isWithdrawing || isPending || isConfirming ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Claiming Prize...
              </span>
            ) : (
              "Claim Your Prize!"
            )}
          </button>
        </div>
      )}

      {/* Prize Pool Section */}
      {!!(contractBalance && Number(contractBalance) > 0) && (
        <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-lg border border-orange-500/50">
          <div className="text-center mb-2">
            <div className="text-sm text-gray-400">Total Prize Pool</div>
            <div className="text-2xl font-bold text-yellow-400">
              {Number(formatEther(contractBalance)).toFixed(4)} AVAX
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Owner distributes 50% to top 5 players
            </div>
          </div>
          {prizeAmounts && (
            <div className="text-xs text-gray-400 space-y-1 mt-3">
              <div className="flex justify-between">
                <span>🥇 1st (20%):</span>
                <span className="text-yellow-400 font-semibold">{Number(formatEther(prizeAmounts[0])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>🥈 2nd (12%):</span>
                <span className="text-gray-300 font-semibold">{Number(formatEther(prizeAmounts[1])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>🥉 3rd (9%):</span>
                <span className="text-orange-400 font-semibold">{Number(formatEther(prizeAmounts[2])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>4th (6%):</span>
                <span className="text-gray-400 font-semibold">{Number(formatEther(prizeAmounts[3])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>5th (3%):</span>
                <span className="text-gray-400 font-semibold">{Number(formatEther(prizeAmounts[4])).toFixed(4)} AVAX</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {addresses && addresses.length > 0 ? (
          addresses.map((addr, index) => {
            const isCurrentUser = addr.toLowerCase() === address?.toLowerCase();
            return (
              <div
                key={addr}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrentUser
                    ? "bg-gradient-to-r from-orange-900/50 to-amber-900/50 border border-orange-500/50"
                    : "bg-zinc-800/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                        ? "text-gray-300"
                        : index === 2
                        ? "text-orange-400"
                        : "text-gray-500"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className={`font-mono text-sm ${
                      isCurrentUser ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {formatAddress(addr)}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-orange-400">
                        (You)
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-white font-bold">
                  {scores[index]?.toString() || "0"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-8">
            No scores yet. Be the first!
          </p>
        )}
      </div>

      {/* Player Stats */}
      {playerData && address && (
        <div className="mt-6 pt-6 border-t border-orange-500/30">
          <h3 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-3">Your Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>High Score:</span>
              <span className="text-white font-bold">
                {playerData.highScore?.toString() || "0"}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Games Played:</span>
              <span className="text-white">
                {playerData.totalGamesPlayed?.toString() || "0"}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Extra Lives Bought:</span>
              <span className="text-white">
                {playerData.extraLivesPurchased?.toString() || "0"}
              </span>
            </div>
            {!!(pendingWithdrawal && Number(pendingWithdrawal) > 0) && (
              <div className="flex justify-between text-gray-400">
                <span>Pending Prize:</span>
                <span className="text-green-400 font-bold">
                  {Number(formatEther(pendingWithdrawal)).toFixed(4)} AVAX
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
