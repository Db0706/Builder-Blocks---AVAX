"use client";

import { useGameContract } from "@/lib/hooks/useGameContract";
import { formatAddress } from "@/lib/utils";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

export default function Leaderboard() {
  const { leaderboard, playerData, contractBalance, prizeAmounts } = useGameContract();
  const { address } = useAccount();

  const [addresses, scores] = leaderboard || [[], []];

  // Calculate total prize pool (50% of contract balance)
  const totalPrizePool = contractBalance ? Number(formatEther(contractBalance)) * 0.5 : 0;

  return (
    <div className="bg-zinc-900/60 border border-orange-500/30 rounded-[18px] p-6 backdrop-blur-sm w-full max-w-md">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4 text-center">
        Leaderboard
      </h2>

      {/* Prize Pool Section */}
      {contractBalance && Number(contractBalance) > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-lg border border-orange-500/50">
          <div className="text-center mb-2">
            <div className="text-sm text-gray-400">Total Prize Pool (50%)</div>
            <div className="text-2xl font-bold text-yellow-400">
              {totalPrizePool.toFixed(4)} AVAX
            </div>
          </div>
          {prizeAmounts && (
            <div className="text-xs text-gray-400 space-y-1 mt-3">
              <div className="flex justify-between">
                <span>🥇 1st:</span>
                <span className="text-yellow-400 font-semibold">{Number(formatEther(prizeAmounts[0])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>🥈 2nd:</span>
                <span className="text-gray-300 font-semibold">{Number(formatEther(prizeAmounts[1])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>🥉 3rd:</span>
                <span className="text-orange-400 font-semibold">{Number(formatEther(prizeAmounts[2])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>4th:</span>
                <span className="text-gray-400 font-semibold">{Number(formatEther(prizeAmounts[3])).toFixed(4)} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span>5th:</span>
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
          </div>
        </div>
      )}
    </div>
  );
}
