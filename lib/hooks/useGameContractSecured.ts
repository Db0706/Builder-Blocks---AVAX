'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, encodeFunctionData } from 'viem';
import { TOWER_BLOCKS_ABI_SECURED, CONTRACT_ADDRESSES } from '../contract-abi-secured';
import { requestScoreSignature } from '../api/score-signing';
import { getArenaSDK, isRunningInArena } from '../arena-sdk';
import { avalanche, avalancheFuji } from '../avalanche-config';
import { useArena } from '@/components/ArenaProvider';

export function useGameContractSecured() {
  const { address: wagmiAddress, chain } = useAccount();
  const { arenaWalletAddress, isInArena } = useArena();

  // Use Arena wallet when in Arena, otherwise use wagmi wallet
  const address = isInArena ? arenaWalletAddress : wagmiAddress;

  // Default to mainnet if no chain detected (Arena usually uses mainnet)
  const chainId = chain?.id || 43114;
  const chainConfig = chain || avalanche; // Use mainnet config as fallback
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  const inArena = isRunningInArena();

  // DEBUG: Log contract info and wallet
  console.log('🔍 CONTRACT DEBUG:', {
    chainId,
    chainName: chainId === 43114 ? 'Mainnet' : 'Fuji Testnet',
    contractAddress,
    inArena,
    walletAddress: address,
    arenaWallet: arenaWalletAddress,
    wagmiWallet: wagmiAddress,
  });

  // State for Arena transactions
  const [arenaHash, setArenaHash] = useState<`0x${string}` | undefined>();
  const [arenaIsPending, setArenaIsPending] = useState(false);
  const [arenaIsConfirming, setArenaIsConfirming] = useState(false);
  const [arenaIsSuccess, setArenaIsSuccess] = useState(false);
  const [arenaError, setArenaError] = useState<Error | null>(null);

  // Write functions (wagmi fallback)
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: wagmiIsConfirming, isSuccess: wagmiIsSuccess } = useWaitForTransactionReceipt({
    hash: !inArena ? hash : undefined // Only use wagmi receipt tracking when NOT in Arena
  });

  // Poll for Arena transaction confirmation
  useEffect(() => {
    if (!inArena || !arenaHash || arenaIsSuccess) return;

    console.log('🔍 Polling for Arena transaction confirmation:', arenaHash);
    let cancelled = false;
    setArenaIsConfirming(true);

    const checkReceipt = async () => {
      try {
        const response = await fetch('https://api.avax.network/ext/bc/C/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [arenaHash],
            id: Date.now(),
          }),
        });

        const data = await response.json();
        if (cancelled) return;

        if (data.result && data.result.status === '0x1') {
          console.log('✅ Arena transaction confirmed:', arenaHash);
          setArenaIsConfirming(false);
          setArenaIsSuccess(true);

          // Immediately refetch game data after confirmation
          console.log('🔄 Refetching game data after transaction...');
          setTimeout(() => {
            if (refetchPlayerData) refetchPlayerData();
            if (refetchLeaderboard) refetchLeaderboard();
            if (refetchBalance) refetchBalance();
          }, 500);
        } else if (data.result && data.result.status === '0x0') {
          console.error('❌ Arena transaction failed on-chain');
          setArenaIsConfirming(false);
          setArenaError(new Error('Transaction failed on-chain'));
        } else {
          // Still pending, check again
          setTimeout(checkReceipt, 1000);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to check transaction receipt:', error);
          setTimeout(checkReceipt, 2000); // Retry on error
        }
      }
    };

    checkReceipt();

    return () => {
      cancelled = true;
    };
  }, [arenaHash, inArena, arenaIsSuccess]);

  // Reset Arena transaction state when starting new transaction
  useEffect(() => {
    if (arenaIsPending) {
      setArenaIsSuccess(false);
    }
  }, [arenaIsPending]);

  // Use Arena states if in Arena, otherwise use wagmi states
  const effectiveHash = inArena ? arenaHash : hash;
  const effectiveIsPending = inArena ? arenaIsPending : isPending;
  const effectiveIsConfirming = inArena ? arenaIsConfirming : wagmiIsConfirming;
  const effectiveIsSuccess = inArena ? arenaIsSuccess : wagmiIsSuccess;
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

    // Check if Arena provider is actually available
    const sdk = inArena ? getArenaSDK() : null;
    const hasArenaProvider = sdk?.provider && sdk.provider !== null;

    if (inArena && hasArenaProvider) {
      console.log('🎮 Using Arena provider for buyExtraLife');
      setArenaIsPending(true);
      setArenaError(null);

      try {
        // Encode the function call
        const data = encodeFunctionData({
          abi: TOWER_BLOCKS_ABI_SECURED,
          functionName: 'buyExtraLife',
        });

        // Send transaction directly through Arena provider
        const txHash = await sdk.provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: contractAddress,
            value: '0x16345785D8A0000', // 0.1 AVAX in hex (100000000000000000 wei)
            data: data,
          }],
        });

        console.log('✅ Arena transaction sent:', txHash);
        setArenaHash(txHash as `0x${string}`);
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
    console.log('📊 submitScore called with:', { score, address, contractAddress, chainId, inArena });

    if (!contractAddress) throw new Error('Contract not deployed on this chain');
    if (!address) throw new Error('Wallet not connected');

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
          // Encode the function call with arguments
          const data = encodeFunctionData({
            abi: TOWER_BLOCKS_ABI_SECURED,
            functionName: 'submitScore',
            args,
          });

          // Send transaction directly through Arena provider
          const txHash = await sdk.provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: address,
              to: contractAddress,
              data: data,
            }],
          });

          console.log('✅ Arena transaction sent:', txHash);
          setArenaHash(txHash as `0x${string}`);
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
    args: address ? [address as `0x${string}`] : undefined,
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

  // Read contract balance - using direct balance check instead of contract function
  const [contractBalance, setContractBalance] = useState<bigint | undefined>();

  // Fetch balance directly via RPC to avoid caching issues
  const refetchBalance = async () => {
    if (!contractAddress) return;

    try {
      const response = await fetch('https://api.avax.network/ext/bc/C/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [contractAddress, 'latest'],
          id: Date.now(), // Unique ID for cache-busting
        }),
      });

      const data = await response.json();
      if (data.result) {
        const balance = BigInt(data.result);
        setContractBalance(balance);
      }
    } catch (error) {
      console.error('Failed to fetch contract balance:', error);
    }
  };

  // Auto-refresh balance every 5 seconds
  useEffect(() => {
    refetchBalance();
    const interval = setInterval(refetchBalance, 5000);
    return () => clearInterval(interval);
  }, [contractAddress]);

  // DEBUG: Log contract balance
  useEffect(() => {
    if (contractBalance !== undefined) {
      console.log('💰 CONTRACT BALANCE:', {
        raw: contractBalance?.toString(),
        avax: (Number(contractBalance) / 1e18).toFixed(4),
        contractAddress,
      });
    }
  }, [contractBalance, contractAddress]);

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
    args: address ? [address as `0x${string}`] : undefined,
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
    isConfirming: effectiveIsConfirming,
    isSuccess: effectiveIsSuccess,
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
