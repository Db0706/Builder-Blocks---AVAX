'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getArenaSDK, getArenaUserProfile, isRunningInArena, type ArenaUserProfile } from '@/lib/arena-sdk';
import { useAccount, useConnect } from 'wagmi';

interface ArenaContextType {
  isInArena: boolean;
  arenaProfile: ArenaUserProfile | null;
  arenaWalletAddress: string | null;
  isLoading: boolean;
}

const ArenaContext = createContext<ArenaContextType>({
  isInArena: false,
  arenaProfile: null,
  arenaWalletAddress: null,
  isLoading: true,
});

export function useArena() {
  return useContext(ArenaContext);
}

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [isInArena, setIsInArena] = useState(false);
  const [arenaProfile, setArenaProfile] = useState<ArenaUserProfile | null>(null);
  const [arenaWalletAddress, setArenaWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address: wagmiAddress } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Check if running in Arena
    const inArena = isRunningInArena();
    setIsInArena(inArena);

    if (inArena) {
      console.log('🎮 Running inside Arena platform');

      const initializeArena = async () => {
        try {
          // Initialize Arena SDK
          const sdk = getArenaSDK();
          console.log('✅ Arena SDK initialized');

          // IMPORTANT: Connect the Arena provider first
          if (sdk.provider) {
            console.log('🔌 Connecting Arena provider...');
            try {
              // Call connect() on the provider to establish connection
              if (typeof sdk.provider.connect === 'function') {
                await sdk.provider.connect();
                console.log('✅ Arena provider connected');
              } else if (typeof sdk.provider.request === 'function') {
                // Try requesting accounts as an alternative connect method
                const accounts = await sdk.provider.request({ method: 'eth_requestAccounts' });
                console.log('✅ Arena provider connected via eth_requestAccounts:', accounts);
              }
            } catch (connectError) {
              console.error('❌ Failed to connect Arena provider:', connectError);
            }
          }

          // Get user profile
          const profile = await getArenaUserProfile();
          setArenaProfile(profile);

          // Listen for wallet changes
          sdk.on('walletChanged', ({ address }: { address: string }) => {
            console.log('👛 Arena wallet changed:', address);
            setArenaWalletAddress(address);
          });

          // Get initial wallet address
          if (sdk.provider?.accounts?.[0]) {
            const address = sdk.provider.accounts[0];
            console.log('💰 Arena wallet address:', address);
            setArenaWalletAddress(address);

            // Connect wagmi to Arena provider using custom Arena connector
            try {
              const arenaConn = connectors.find(c => c.id === 'arena');
              if (arenaConn && !wagmiAddress) {
                console.log('🔌 Connecting wagmi to Arena connector...');
                const result = await connect({ connector: arenaConn });
                console.log('✅ Wagmi connected to Arena provider', result);
              } else if (!arenaConn) {
                console.error('❌ Arena connector not found! Available connectors:', connectors.map(c => c.id));
              } else if (wagmiAddress) {
                console.log('✅ Wagmi already connected to:', wagmiAddress);
              }
            } catch (error) {
              console.error('❌ Failed to connect wagmi to Arena:', error);
            }
          } else {
            console.warn('⚠️ No Arena provider available - app will not function outside Arena platform');
          }

          setIsLoading(false);
        } catch (error) {
          console.error('❌ Failed to initialize Arena:', error);
          setIsLoading(false);
        }
      };

      initializeArena();
    } else {
      console.log('🌐 Running standalone (not in Arena)');
      setIsLoading(false);
    }
  }, [connect, connectors, wagmiAddress]);

  // Use Arena wallet if available, otherwise use wagmi
  const effectiveWallet = isInArena && arenaWalletAddress ? arenaWalletAddress : wagmiAddress;

  useEffect(() => {
    if (effectiveWallet) {
      console.log('💰 Active wallet:', effectiveWallet);
    }
  }, [effectiveWallet]);

  return (
    <ArenaContext.Provider
      value={{
        isInArena,
        arenaProfile,
        arenaWalletAddress: effectiveWallet || null,
        isLoading
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
}
