"use client";

import TowerBlocks from "@/components/TowerBlocks";
import Leaderboard from "@/components/Leaderboard";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useGameContract } from "@/lib/hooks/useGameContract";
import { formatEther } from "viem";
import { isMobileDevice } from "@/lib/utils";

export default function Home() {
  const { isConnected, address } = useAccount();
  const [currentScore, setCurrentScore] = useState(0);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [hasCheckedDevice, setHasCheckedDevice] = useState(false);
  const { withdraw, contractBalance, contractOwner, refetchBalance, isPending, isConfirming } = useGameContract();

  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  useEffect(() => {
    if (!hasCheckedDevice) {
      const isMobile = isMobileDevice();
      setShowMobileWarning(!isMobile);
      setHasCheckedDevice(true);
    }
  }, [hasCheckedDevice]);

  const handleWithdraw = async () => {
    try {
      await withdraw();
      refetchBalance();
    } catch (error) {
      console.error("Failed to withdraw:", error);
    }
  };

  return (
    <>
      {/* Mobile Warning Modal */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-orange-500/50 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <span className="text-6xl">📱</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
              Best Enjoyed on Mobile
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Builder Blocks is optimized for mobile devices. For the best experience, we recommend playing on your phone or tablet.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowMobileWarning(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
              >
                Continue on Desktop
              </button>
              <p className="text-gray-500 text-xs">
                Or scan QR code on mobile (coming soon)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky App Bar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-orange-500/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://arena.social/icons/logo.svg"
              alt="Arena Social"
              className="h-8 w-8 flex-shrink-0"
            />
          </div>
          <div className="flex-shrink-0">
            <div className="scale-90 origin-right">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
            Builder Blocks
          </h1>
          <p className="text-gray-400 text-[10px]">Powered by Avalanche</p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-6 bg-orange-950/30 border border-orange-500/30 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-orange-300 text-sm text-center">
              ⚠️ Connect your wallet to buy extra lives and save scores
              on-chain!
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Section */}
          <div className="flex flex-col items-center">
            <TowerBlocks onScoreUpdate={setCurrentScore} />
          </div>

          {/* Leaderboard Section */}
          <div className="flex flex-col items-center lg:items-start">
            <Leaderboard />

            {/* Game Features */}
            <div className="mt-8 bg-zinc-900/60 border border-orange-500/30 rounded-[18px] p-6 backdrop-blur-sm w-full max-w-md">
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
                Game Features
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">🎮</span>
                  <div>
                    <strong className="text-white">Stack Blocks:</strong> Drop
                    perfectly to maintain width
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">💎</span>
                  <div>
                    <strong className="text-white">Buy Extra Lives:</strong>{" "}
                    Pay 0.1 AVAX to continue from where you died
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">🏆</span>
                  <div>
                    <strong className="text-white">On-Chain Scores:</strong>{" "}
                    Your high score is stored on Avalanche
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">📊</span>
                  <div>
                    <strong className="text-white">Global Leaderboard:</strong>{" "}
                    Compete with players worldwide
                  </div>
                </li>
              </ul>
            </div>

            {/* Faucet Link */}
            <div className="mt-6 bg-zinc-900/60 border border-orange-500/30 rounded-lg p-4 w-full max-w-md backdrop-blur-sm">
              <p className="text-orange-300 text-xs text-center">
                ℹ️ Playing on Avalanche Fuji Testnet
                <br />
                <a
                  href="https://faucet.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-orange-200 transition-colors font-semibold"
                >
                  Get free testnet AVAX from faucet
                </a>
              </p>
            </div>

            {/* Project Funds Display */}
            <div className="mt-6 bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/50 rounded-lg p-4 w-full max-w-md backdrop-blur-sm">
              <h3 className="text-lg font-bold text-orange-400 mb-3 text-center">
                Project Funds
              </h3>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Total Collected</p>
                <p className="text-white text-2xl font-bold">
                  {contractBalance ? formatEther(contractBalance) : '0'} AVAX
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  From extra life purchases
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Built on Avalanche C-Chain • Powered by Arena Social</p>
          <p className="mt-2">
            <a
              href="https://arena.social"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-400 transition-colors"
            >
              Visit Arena Social
            </a>
            {" • "}
            <a
              href="https://docs.avax.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-400 transition-colors"
            >
              Learn About Avalanche
            </a>
          </p>
        </footer>
      </div>
    </main>
    </>
  );
}
