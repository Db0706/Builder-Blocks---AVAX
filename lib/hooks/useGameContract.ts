'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { TOWER_BLOCKS_ABI, CONTRACT_ADDRESSES } from '../contract-abi';

export function useGameContract() {
  const { address, chain } = useAccount();
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;

  // Write functions
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Buy extra life
  const buyExtraLife = async () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI,
      functionName: 'buyExtraLife',
      value: parseEther('0.1'),
    });
  };

  // Submit score
  const submitScore = async (score: number) => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI,
      functionName: 'submitScore',
      args: [BigInt(score)],
    });
  };

  // Distribute prizes (owner only)
  const distributePrizes = async () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI,
      functionName: 'distributePrizes',
    });
  };

  // Withdraw funds (owner only)
  const withdraw = async () => {
    if (!contractAddress) throw new Error('Contract not deployed on this chain');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: TOWER_BLOCKS_ABI,
      functionName: 'withdraw',
    });
  };

  // Read player data
  const { data: playerData, refetch: refetchPlayerData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI,
    functionName: 'getPlayerData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Read leaderboard
  const { data: leaderboard, refetch: refetchLeaderboard } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI,
    functionName: 'getLeaderboard',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Read extra life price
  const { data: extraLifePrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI,
    functionName: 'EXTRA_LIFE_PRICE',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read contract balance
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI,
    functionName: 'getBalance',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI,
    functionName: 'owner',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read prize amounts
  const { data: prizeAmounts, refetch: refetchPrizeAmounts } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TOWER_BLOCKS_ABI,
    functionName: 'getPrizeAmounts',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return {
    // Write functions
    buyExtraLife,
    submitScore,
    distributePrizes,
    withdraw,

    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,

    // Read data
    playerData: playerData as { highScore: bigint; totalGamesPlayed: bigint; extraLivesPurchased: bigint; totalSpent: bigint } | undefined,
    leaderboard: leaderboard as [readonly `0x${string}`[], readonly bigint[]] | undefined,
    extraLifePrice,
    contractBalance,
    contractOwner,
    prizeAmounts: prizeAmounts as readonly bigint[] | undefined,

    // Refetch functions
    refetchPlayerData,
    refetchLeaderboard,
    refetchBalance,
    refetchPrizeAmounts,

    // Contract info
    contractAddress,
  };
}
