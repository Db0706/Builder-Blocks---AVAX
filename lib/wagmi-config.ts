'use client';

import { createConfig, http } from 'wagmi';
import { avalanche, avalancheFuji } from './avalanche-config';
import { arenaConnector } from './arena-connector';

export const config = createConfig({
  chains: [avalancheFuji, avalanche],
  connectors: [
    arenaConnector(), // Uses Arena SDK provider in production
  ],
  transports: {
    [avalancheFuji.id]: http(),
    [avalanche.id]: http(),
  },
  ssr: true,
});
