"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameContractSecured } from "@/lib/hooks/useGameContractSecured";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

type Block = {
  x: number;
  w: number;
  row: number;
  hue: number;
  moving?: boolean;
  dir?: 1 | -1;
  yOffset?: number;
};

type Slice = {
  x: number;
  w: number;
  row: number;
  hue: number;
  vx: number;
  vy: number;
  life: number;
};

const W = 360;
const H = 560;

const TOP_THICK = 22;
const BODY_DEPTH = 26;
const START_WIDTH = 180;
const START_X = (W - START_WIDTH) / 2;
const L_PAD = 26;
const SPEED0 = 2.0;
const SPEED_GAIN = 0.035;
const DROP_SPEED = 9.5;
const STEP_Y = TOP_THICK + 18;
const PERFECT_TOL = 3;
const CAMERA_START_ROW = 7;
const CAMERA_RISE = STEP_Y; // Match camera movement to block spacing

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function colorTop(h: number) { return `#1a1a1a`; }
function colorLeft(h: number) { return `#0a0a0a`; }
function colorRight(h: number) { return `#050505`; }

interface TowerBlocksProps {
  onScoreUpdate?: (score: number) => void;
}

export default function TowerBlocks({ onScoreUpdate }: TowerBlocksProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [showExtraLifeModal, setShowExtraLifeModal] = useState(false);
  const [deathPosition, setDeathPosition] = useState<{ row: number; x: number; w: number; hue: number } | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isBuyingExtraLife, setIsBuyingExtraLife] = useState(false);
  const lastProcessedHashRef = useRef<string | null>(null);
  const scoreSubmissionHashRef = useRef<string | null>(null);

  // Blockchain hooks
  const { address, isConnected } = useAccount();
  const {
    buyExtraLife,
    submitScore: submitScoreToChain,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    playerData,
    refetchPlayerData,
    refetchLeaderboard,
    refetchBalance,
  } = useGameContractSecured();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("tower_best") || 0);
      setBest(saved);
    }
  }, []);

  // Update best score from blockchain if available
  useEffect(() => {
    if (playerData && playerData.highScore) {
      const chainScore = Number(playerData.highScore);
      setBest(prev => Math.max(prev, chainScore));
    }
  }, [playerData]);

  // Notify parent of score changes
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, onScoreUpdate]);

  const state = useRef({
    blocks: [] as Block[],
    slices: [] as Slice[],
    speed: SPEED0,
    gameOver: false,
    dropping: false,
    camera: 0,
    baseY: H - 150,
    hueSeed: 260 + Math.random() * 70,
    cameraTarget: 0,
    hasExtraLife: false,
  });

  // Reset game
  const reset = useCallback(() => {
    const s = state.current;
    s.hueSeed = 260 + Math.random() * 70;
    const base: Block = { x: START_X, w: START_WIDTH, row: 0, hue: s.hueSeed };
    const mover: Block = { x: L_PAD, w: START_WIDTH, row: 1, hue: s.hueSeed + 10, moving: true, dir: 1 };

    s.blocks = [base, mover];
    s.slices = [];
    s.speed = SPEED0;
    s.gameOver = false;
    s.dropping = false;
    s.camera = 0;
    s.cameraTarget = 0;
    s.hasExtraLife = false;

    setScore(0);
    setRunning(true);
    setShowExtraLifeModal(false);
    setDeathPosition(null);
  }, []);

  // Continue from death position with extra life
  const continueWithExtraLife = useCallback(() => {
    if (!deathPosition) return;

    const s = state.current;

    // Start fresh with a full starting block at the death position
    const newStartBlock: Block = {
      x: START_X,
      w: START_WIDTH,
      row: deathPosition.row + 1,
      hue: deathPosition.hue + 10,
      moving: false,
    };

    // Create a new moving block above it
    const mover: Block = {
      x: L_PAD,
      w: START_WIDTH,
      row: deathPosition.row + 2,
      hue: deathPosition.hue + 20,
      moving: true,
      dir: 1,
    };

    s.blocks.push(newStartBlock, mover);
    s.gameOver = false;
    s.dropping = false;
    s.hasExtraLife = false; // Reset to false so next death requires payment

    setRunning(true);
    setShowExtraLifeModal(false);
    setDeathPosition(null); // Clear death position
  }, [deathPosition]);

  // Handle extra life purchase
  const handleBuyExtraLife = () => {
    console.log('🎮 Buy Extra Life clicked');
    console.log('States:', {
      isConnected,
      isBuyingExtraLife,
      isSubmittingScore,
      isPending,
      isConfirming
    });

    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (isPending || isConfirming) {
      console.warn('⚠️ Transaction already in progress');
      return;
    }

    try {
      // Reset ALL flags before starting
      console.log('💳 Initiating extra life purchase...');
      setIsSubmittingScore(false);
      setIsBuyingExtraLife(true);
      lastProcessedHashRef.current = null;
      buyExtraLife();
    } catch (error) {
      console.error("❌ Failed to buy extra life:", error);
      setIsBuyingExtraLife(false);
    }
  };

  // Monitor extra life purchase transaction success
  useEffect(() => {
    // ONLY run if buying extra life (not submitting score!)
    if (isBuyingExtraLife && !isSubmittingScore && isSuccess && hash && hash !== lastProcessedHashRef.current) {
      console.log('✅ Extra life purchase confirmed! Hash:', hash);
      lastProcessedHashRef.current = hash; // Mark this transaction as processed
      setIsBuyingExtraLife(false);
      refetchPlayerData();
      refetchBalance(); // Update contract balance in UI
      continueWithExtraLife(); // Continue game from death position
    }
  }, [isBuyingExtraLife, isSubmittingScore, isSuccess, hash, continueWithExtraLife, refetchPlayerData, refetchBalance]);

  // Reset states when transaction is no longer pending
  useEffect(() => {
    if (!isPending && !isConfirming) {
      // Transaction completed (either success or failure)
      console.log('Transaction state reset - isPending:', isPending, 'isConfirming:', isConfirming);
    }
  }, [isPending, isConfirming]);

  // Drop block
  const drop = useCallback(() => {
    const s = state.current;
    if (!running || s.gameOver || s.dropping) return;
    const m = s.blocks[s.blocks.length - 1];
    if (!m.moving) return;
    s.dropping = true;
    m.moving = false;
    m.yOffset = -200;
  }, [running]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        // Prevent any action if modal is showing
        if (showExtraLifeModal) return;
        if (!running || state.current.gameOver) reset();
        else drop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, reset, drop, showExtraLifeModal]);

  // Pointer
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onDown = () => {
      // Prevent any action if modal is showing
      if (showExtraLifeModal) return;
      if (!running || state.current.gameOver) {
        reset();
        return;
      }
      drop();
    };
    c.addEventListener("pointerdown", onDown);
    return () => c.removeEventListener("pointerdown", onDown);
  }, [running, reset, drop, showExtraLifeModal]);

  // Submit score and start new game
  const handleSubmitScoreAndPlayAgain = useCallback(async () => {
    console.log('📊 Submit Score clicked');
    console.log('States:', {
      isConnected,
      score,
      isBuyingExtraLife,
      isSubmittingScore,
      isPending,
      isConfirming
    });

    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (score === 0) {
      reset();
      return;
    }

    if (isPending || isConfirming) {
      console.warn('⚠️ Transaction already in progress');
      return;
    }

    try {
      // Reset ALL flags before starting
      console.log('📝 Initiating score submission...');
      setIsBuyingExtraLife(false);
      setIsSubmittingScore(true);
      scoreSubmissionHashRef.current = null;
      // Submit score - this will trigger wallet popup
      await submitScoreToChain(score);
    } catch (error) {
      console.error("❌ Failed to submit score:", error);
      setIsSubmittingScore(false);
      // Even if error, allow user to continue
      setShowExtraLifeModal(false);
      reset();
    }
  }, [isConnected, score, submitScoreToChain, reset, isBuyingExtraLife, isSubmittingScore, isPending, isConfirming]);

  // Monitor score submission transaction success
  useEffect(() => {
    // ONLY run if submitting score (not buying extra life!)
    if (isSubmittingScore && !isBuyingExtraLife && isSuccess && hash && hash !== scoreSubmissionHashRef.current) {
      scoreSubmissionHashRef.current = hash;

      // Wait for transaction confirmation, then refresh leaderboard and close modal
      const refreshAndReset = async () => {
        await refetchPlayerData();
        await refetchLeaderboard();
        await refetchBalance(); // Update contract balance in UI
        setIsSubmittingScore(false);
        setShowExtraLifeModal(false); // Close the modal
        reset(); // Start new game
      };

      // Small delay to ensure blockchain state is updated
      setTimeout(refreshAndReset, 1500);
    }
  }, [isSubmittingScore, isBuyingExtraLife, isSuccess, hash, refetchPlayerData, refetchLeaderboard, refetchBalance, reset]);

  // Handle game over - no automatic submission
  const handleGameOver = useCallback(async (finalScore: number) => {
    // Game over, wait for user action
  }, []);

  // Drawing logic
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const DPR = clamp(Math.round(window.devicePixelRatio || 1), 1, 3);
    c.width = W * DPR;
    c.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;

    let last = performance.now();

    const drawIso = (x: number, yTop: number, w: number, hue: number) => {
      const skew = 10;
      const h = BODY_DEPTH;
      const t = TOP_THICK;

      const p0 = { x, y: yTop };
      const p1 = { x: x + w, y: yTop };
      const p2 = { x: x + w - skew, y: yTop + t };
      const p3 = { x: x - skew, y: yTop + t };

      const p4 = { x: p3.x, y: p3.y + h };
      const p5 = { x: p2.x, y: p2.y + h };
      const p6 = { x: p1.x, y: p1.y + h };
      const p7 = { x: p0.x, y: p0.y + h };

      ctx.fillStyle = colorTop(hue);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colorRight(hue);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p5.x, p5.y);
      ctx.lineTo(p6.x, p6.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colorLeft(hue);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.lineTo(p7.x, p7.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `#000000`;
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p5.x, p5.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
    };

    const drawBasePlatform = () => {
      ctx.fillStyle = "#f97316";
      ctx.fillRect(0, 0, W, H);

      const r = 18;
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(W, 0, W, H, r);
      ctx.arcTo(W, H, 0, H, r);
      ctx.arcTo(0, H, 0, 0, r);
      ctx.arcTo(0, 0, W, 0, r);
      ctx.closePath();
      ctx.stroke();

      const cx = W / 2;
      const cy = state.current.baseY + state.current.camera;
      const d = 150;

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.lineTo(cx + d / 2, cy + 14 + d / 3);
      ctx.lineTo(cx, cy + 14 + (2 * d) / 3);
      ctx.lineTo(cx - d / 2, cy + 14 + d / 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + d / 2, cy + d / 3);
      ctx.lineTo(cx, cy + (2 * d) / 3);
      ctx.lineTo(cx - d / 2, cy + d / 3);
      ctx.closePath();
      ctx.fill();
    };

    const placeAndTrim = () => {
      const S = state.current;
      const n = S.blocks.length;
      const m = S.blocks[n - 1];
      const below = S.blocks[n - 2];

      if (Math.abs(m.x - below.x) <= PERFECT_TOL) m.x = below.x;
      if (Math.abs(m.x + m.w - (below.x + below.w)) <= PERFECT_TOL) {
        m.x = below.x + below.w - m.w;
      }

      const left = Math.max(m.x, below.x);
      const right = Math.min(m.x + m.w, below.x + below.w);
      let overlap = right - left;

      if (overlap <= 0) {
        // Game over - show extra life modal
        S.gameOver = true;
        setDeathPosition({
          row: below.row,
          x: below.x,
          w: below.w,
          hue: below.hue,
        });
        setShowExtraLifeModal(true);

        handleGameOver(score);

        setBest(prev => {
          const nb = Math.max(prev, score);
          if (typeof window !== "undefined") {
            localStorage.setItem("tower_best", String(nb));
          }
          return nb;
        });
        return;
      }

      if (m.x < below.x) {
        const wSlice = Math.min(below.x - m.x, m.w);
        S.slices.push({
          x: m.x,
          w: wSlice,
          row: m.row,
          hue: m.hue,
          vx: -2.3,
          vy: 0,
          life: 130,
        });
      } else if (m.x + m.w > below.x + below.w) {
        const over = m.x + m.w - (below.x + below.w);
        const wSlice = Math.min(over, m.w);
        S.slices.push({
          x: m.x + m.w - wSlice,
          w: wSlice,
          row: m.row,
          hue: m.hue,
          vx: 2.3,
          vy: 0,
          life: 130,
        });
      }

      m.x = left;
      m.w = overlap;

      const next: Block = {
        x: m.x,
        w: m.w,
        row: m.row + 1,
        hue: below.hue + 8,
        moving: true,
        dir: Math.random() > 0.5 ? 1 : -1,
      };
      S.blocks.push(next);

      S.speed += SPEED_GAIN;
      setScore(v => v + 1);

      if (next.row > CAMERA_START_ROW) {
        S.cameraTarget = (next.row - CAMERA_START_ROW) * CAMERA_RISE;
      }
    };

    const tick = (t: number) => {
      const dt = (t - last) / (1000 / 60);
      last = t;

      drawBasePlatform();

      const S = state.current;
      const mover = S.blocks[S.blocks.length - 1];

      // Pause all game logic when modal is showing
      if (!showExtraLifeModal) {
        S.camera += (S.cameraTarget - S.camera) * 0.1;
      }

      // Only update game logic when modal is not showing
      if (!showExtraLifeModal) {
        if (mover?.moving) {
          const minX = L_PAD;
          const maxX = W - L_PAD - mover.w;
          mover.x += S.speed * (mover.dir || 1) * dt;
          if (mover.x <= minX) {
            mover.x = minX;
            mover.dir = 1;
          }
          if (mover.x >= maxX) {
            mover.x = maxX;
            mover.dir = -1;
          }
        }

        if (S.dropping && mover && !mover.moving) {
          mover.yOffset = (mover.yOffset ?? -200) + DROP_SPEED * dt * 2.2;
          if ((mover.yOffset ?? 0) >= 0) {
            S.dropping = false;
            mover.yOffset = 0;
            placeAndTrim();
          }
        }

        for (const sl of S.slices) {
          sl.vy += 0.28 * dt;
          sl.x += sl.vx * dt;
          sl.life -= 1 * dt;
        }
        S.slices = S.slices.filter(sl => sl.life > 0);
      }

      for (let i = 0; i < S.blocks.length; i++) {
        const b = S.blocks[i];
        const yTop = S.baseY + S.camera - b.row * STEP_Y + (b.yOffset || 0);
        drawIso(b.x, yTop, b.w, b.hue);
      }

      for (const sl of S.slices) {
        const fall = (130 - sl.life) * 1.0;
        const yTop = S.baseY + S.camera - sl.row * STEP_Y + fall;
        drawIso(sl.x, yTop, sl.w, sl.hue);
      }

      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.font = "bold 28px monospace";
      ctx.fillText(String(score), W / 2, 64);

      if (!running || S.gameOver) {
        if (!showExtraLifeModal) {
          const label = !running ? "START" : "RESTART";
          const bw = 170,
            bh = 56,
            bx = (W - bw) / 2,
            by = H / 2 - 40;

          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(bx + 6, by + 10, bw, bh);

          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(bx, by, bw, bh);

          ctx.fillStyle = "#f97316";
          ctx.font = "bold 22px monospace";
          ctx.fillText(label, W / 2, by + 36);

          if (S.gameOver) {
            const b = Math.max(best, score);
            ctx.font = "14px monospace";
            ctx.fillStyle = "#000";
            ctx.fillText(`Score ${score}  ·  Best ${b}`, W / 2, by - 18);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, best, score, showExtraLifeModal, handleGameOver]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={360}
        height={560}
        className="w-full h-auto max-h-[80vh] rounded-[18px] bg-[#0a0c13] shadow-[0_0_0_1px_#131621_inset]"
      />

      {/* Extra Life Modal - Full Screen Overlay */}
      {showExtraLifeModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-[18px] z-50">
          <div className="bg-[#1e2432] p-8 rounded-lg max-w-sm mx-4 text-center border-2 border-[#314058]">
            <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-gray-300 mb-2 text-xl">Score: {score}</p>
            <p className="text-gray-400 text-sm mb-6">
              Buy an extra life with 0.1 AVAX to continue from where you died!
            </p>

            {isConnected ? (
              <div className="space-y-3">
                <button
                  onClick={handleBuyExtraLife}
                  disabled={isBuyingExtraLife || isSubmittingScore}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isBuyingExtraLife ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Buy Extra Life (0.1 AVAX)"
                  )}
                </button>
                <button
                  onClick={handleSubmitScoreAndPlayAgain}
                  disabled={isBuyingExtraLife || isSubmittingScore}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSubmittingScore ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Score & Updating Leaderboard...
                    </span>
                  ) : (
                    "Submit Score & Play Again"
                  )}
                </button>
                <div className="text-center mt-2">
                  <button
                    onClick={reset}
                    disabled={isSubmittingScore}
                    className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    or try again
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-yellow-400 text-sm mb-4">
                  Connect your wallet to submit scores and buy extra lives!
                </p>
                <button
                  onClick={reset}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
