'use client';

import { createConfig, http } from 'wagmi';
import { avalanche, avalancheFuji } from './avalanche-config';
import { arenaConnector } from './arena-connector';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [avalancheFuji, avalanche],
  connectors: [
    arenaConnector(), // Uses Arena SDK provider (when available in production)
    injected(), // Fallback for local development with Core/MetaMask
  ],
  transports: {
    [avalancheFuji.id]: http(),
    [avalanche.id]: http(),
  },
  ssr: true,
});
