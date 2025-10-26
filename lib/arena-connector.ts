'use client';

import { createConnector } from 'wagmi';
import { getArenaSDK } from './arena-sdk';

export function arenaConnector() {
  return createConnector((config) => ({
    id: 'arena',
    name: 'Arena',
    type: 'injected' as const,

    async setup() {
      // Initialize Arena SDK when connector is set up
      if (typeof window !== 'undefined') {
        try {
          getArenaSDK();
        } catch (error) {
          console.warn('Arena SDK not available:', error);
        }
      }
    },

    async connect(parameters = {} as any) {
      const { chainId, withCapabilities } = parameters;
      const sdk = getArenaSDK();
      const provider = sdk.provider;

      if (!provider) {
        throw new Error('Arena provider not available');
      }

      let accounts: string[] = [];

      // Get accounts from Arena provider
      if (provider.accounts && provider.accounts.length > 0) {
        accounts = provider.accounts;
      } else {
        // Try to request accounts
        try {
          const requestedAccounts = await provider.request({
            method: 'eth_requestAccounts',
          });
          accounts = requestedAccounts as string[];
        } catch (error) {
          console.error('Failed to get Arena accounts:', error);
          throw error;
        }
      }

      const account = accounts[0];
      let currentChainId = chainId;

      // Get current chain ID from provider
      if (!currentChainId) {
        const hexChainId = await provider.request({
          method: 'eth_chainId',
        });
        currentChainId = typeof hexChainId === 'string'
          ? parseInt(hexChainId, 16)
          : Number(hexChainId);
      }

      // Listen for account changes
      provider.on?.('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          config.emitter.emit('disconnect');
        } else {
          config.emitter.emit('change', { accounts: accounts as `0x${string}`[] });
        }
      });

      // Listen for chain changes
      provider.on?.('chainChanged', (chainId: string) => {
        const newChainId = typeof chainId === 'string'
          ? parseInt(chainId, 16)
          : Number(chainId);
        config.emitter.emit('change', { chainId: newChainId });
      });

      // Listen for disconnect
      provider.on?.('disconnect', () => {
        config.emitter.emit('disconnect');
      });

      return {
        accounts: (withCapabilities
          ? [{ address: account as `0x${string}`, capabilities: {} }]
          : [account]) as any,
        chainId: currentChainId,
      } as any;
    },

    async disconnect() {
      const sdk = getArenaSDK();
      const provider = sdk.provider;

      if (provider?.removeListener) {
        provider.removeListener('accountsChanged', () => {});
        provider.removeListener('chainChanged', () => {});
        provider.removeListener('disconnect', () => {});
      }
    },

    async getAccounts() {
      const sdk = getArenaSDK();
      const provider = sdk.provider;

      if (!provider) return [];

      if (provider.accounts && provider.accounts.length > 0) {
        return provider.accounts as `0x${string}`[];
      }

      try {
        const accounts = await provider.request({
          method: 'eth_accounts',
        });
        return (accounts as string[]) as `0x${string}`[];
      } catch {
        return [];
      }
    },

    async getChainId() {
      const sdk = getArenaSDK();
      const provider = sdk.provider;

      if (!provider) {
        throw new Error('Arena provider not available');
      }

      const hexChainId = await provider.request({
        method: 'eth_chainId',
      });

      return typeof hexChainId === 'string'
        ? parseInt(hexChainId, 16)
        : Number(hexChainId);
    },

    async getProvider() {
      const sdk = getArenaSDK();
      return sdk.provider;
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const sdk = getArenaSDK();
      const provider = sdk.provider;

      if (!provider) {
        throw new Error('Arena provider not available');
      }

      const hexChainId = `0x${chainId.toString(16)}`;

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });

      return config.chains.find(c => c.id === chainId) || config.chains[0];
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts.map(x => x as `0x${string}`)
        });
      }
    },

    onChainChanged(chain) {
      const chainId = typeof chain === 'string'
        ? parseInt(chain, 16)
        : Number(chain);
      config.emitter.emit('change', { chainId });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
