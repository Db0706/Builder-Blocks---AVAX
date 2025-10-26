'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, encodeFunctionData, createWalletClient, custom } from 'viem';
import { TOWER_BLOCKS_ABI_SECURED, CONTRACT_ADDRESSES } from '../contract-abi-secured';
import { requestScoreSignature } from '../api/score-signing';
import { getArenaSDK, isRunningInArena } from '../arena-sdk';

export function useGameContractSecured() {
  const { address, chain } = useAccount();
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;
  const inArena = isRunningInArena();

  // State for Arena transactions
  const [arenaHash, setArenaHash] = useState<`0x${string}` | undefined>();
  const [arenaIsPending, setArenaIsPending] = useState(false);
  const [arenaError, setArenaError] = useState<Error | null>(null);

  // Write functions (wagmi fallback)
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: inArena ? arenaHash : hash
  });

  // Use Arena states if in Arena, otherwise use wagmi states
  const effectiveHash = inArena ? arenaHash : hash;
  const effectiveIsPending = inArena ? arenaIsPending : isPending;
  const effectiveError = inArena ? arenaError : writeError;

  // Log any errors from the hook
  useEffect(() => {
    if (effectiveError) {
      console.error('🚨 Transaction error:', effectiveError);
    }
  }, [effectiveError]);

  // Buy extra life
  const buyExtraLife = async () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');
    if (!address) throw new Error('Wallet not connected');
    if (!chain) throw new Error('Chain not detected');

    // Check if Arena provider is actually available
    const sdk = inArena ? getArenaSDK() : null;
    const hasArenaProvider = sdk?.provider && sdk.provider !== null;

    if (inArena && hasArenaProvider) {
      console.log('🎮 Using Arena provider for buyExtraLife');
      setArenaIsPending(true);
      setArenaError(null);

      try {
        const walletClient = createWalletClient({
          account: address,
          chain: chain,
          transport: custom(sdk.provider as any),
        });

        const txHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: TOWER_BLOCKS_ABI_SECURED,
          functionName: 'buyExtraLife',
          value: parseEther('0.1'),
        });

        console.log('✅ Arena transaction sent:', txHash);
        setArenaHash(txHash);
        setArenaIsPending(false);
      } catch (error) {
        console.error('❌ Arena transaction failed:', error);
        setArenaError(error as Error);
        setArenaIsPending(false);
        throw error;
      }
    } else {
      if (inArena && !hasArenaProvider) {
        console.warn('⚠️ Running in Arena but provider is null - falling back to wagmi (local dev mode)');
      }
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: TOWER_BLOCKS_ABI_SECURED,
        functionName: 'buyExtraLife',
        value: parseEther('0.1'),
      });
    }
  };

  // Submit score WITH SIGNATURE
  const submitScore = async (score: number) => {
    console.log('📊 submitScore called with:', { score, address, contractAddress, chain: chain?.id, inArena });

    if (!contractAddress) throw new Error('Contract not deployed on this chain');
    if (!address) throw new Error('Wallet not connected');
    if (!chain) throw new Error('Chain not detected');

    try {
      // Request signature from backend
      console.log('🔐 Requesting signature for score:', score);
      const signatureData = await requestScoreSignature(address, score);
      console.log('✅ Got signature data:', signatureData);

      const args = [BigInt(score), signatureData.nonce as `0x${string}`, signatureData.signature as `0x${string}`] as const;

      // Check if Arena provider is actually available
      const sdk = inArena ? getArenaSDK() : null;
      const hasArenaProvider = sdk?.provider && sdk.provider !== null;

      if (inArena && hasArenaProvider) {
        console.log('🎮 Using Arena provider for submitScore');
        setArenaIsPending(true);
        setArenaError(null);

        try {
          const walletClient = createWalletClient({
            account: address,
            chain: chain,
            transport: custom(sdk.provider as any),
          });

          const txHash = await walletClient.writeContract({
            address: contractAddress as `0x${string}`,
            abi: TOWER_BLOCKS_ABI_SECURED,
            functionName: 'submitScore',
            args,
          });

          console.log('✅ Arena transaction sent:', txHash);
          setArenaHash(txHash);
          setArenaIsPending(false);
        } catch (error) {
          console.error('❌ Arena transaction failed:', error);
          setArenaError(error as Error);
          setArenaIsPending(false);
          throw error;
        }
      } else {
        if (inArena && !hasArenaProvider) {
          console.warn('⚠️ Running in Arena but provider is null - falling back to wagmi (local dev mode)');
        }
        console.log('📝 Using wagmi writeContract');
        writeContract({
          address: contractAddress as `0x${string}`,
          abi: TOWER_BLOCKS_ABI_SECURED,
          functionName: 'submitScore',
          args,
        });
        console.log('🚀 wagmi writeContract called');
      }
    } catch (error) {
      console.error('❌ Failed to submit score:', error);
      throw error;
    }
  };

  // Calculate prizes (owner only)
  const calculatePrizes = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI_SECURED,
      functionName: 'calculatePrizes',
    });
  };

  // Withdraw prize (for winners)
  const withdrawPrize = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI_SECURED,
      functionName: 'withdrawPrize',
    });
  };

  // Withdraw funds (owner only)
  const withdraw = () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI_SECURED,
      functionName: 'withdraw',
    });
  };

  // Read player data
  const { data: playerData, refetch: refetchPlayerData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'getPlayerData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 5000,
    },
  });

  // Read leaderboard
  const { data: leaderboard, refetch: refetchLeaderboard } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'getLeaderboard',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000,
    },
  });

  // Read extra life price
  const { data: extraLifePrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'EXTRA_LIFE_PRICE',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read contract balance
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'getBalance',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000,
    },
  });

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'owner',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read prize amounts
  const { data: prizeAmounts, refetch: refetchPrizeAmounts } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'getPrizeAmounts',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000,
    },
  });

  // Read pending withdrawal for current user
  const { data: pendingWithdrawal, refetch: refetchPendingWithdrawal } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI_SECURED,
    functionName: 'getPendingWithdrawal',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 5000,
    },
  });

  return {
    // Write functions
    buyExtraLife,
    submitScore,
    calculatePrizes,
    withdrawPrize,
    withdraw,

    // Transaction state (using Arena states if in Arena)
    isPending: effectiveIsPending,
    isConfirming,
    isSuccess,
    error: effectiveError,
    hash: effectiveHash,

    // Read data
    playerData: playerData as { highScore: bigint; totalGamesPlayed: bigint; extraLivesPurchased: bigint; totalSpent: bigint } | undefined,
    leaderboard: leaderboard as [readonly `0x${string}`[], readonly bigint[]] | undefined,
    extraLifePrice,
    contractBalance,
    contractOwner,
    prizeAmounts: prizeAmounts as readonly bigint[] | undefined,
    pendingWithdrawal,

    // Refetch functions
    refetchPlayerData,
    refetchLeaderboard,
    refetchBalance,
    refetchPrizeAmounts,
    refetchPendingWithdrawal,

    // Contract info
    contractAddress,
  };
}
