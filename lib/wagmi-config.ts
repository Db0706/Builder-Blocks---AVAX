'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalanche, avalancheFuji } from './avalanche-config';

export const config = getDefaultConfig({
  appName: 'Tower Blocks AVAX',
  projectId: 'faeac2f6960ca82510491391ac612e5f', // Got from https://cloud.walletconnect.com
  chains: [avalancheFuji, avalanche],
  ssr: true,
});
