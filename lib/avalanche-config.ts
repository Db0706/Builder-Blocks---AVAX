import { Chain } from 'viem';

// Avalanche C-Chain (Mainnet)
export const avalanche: Chain = {
  id: 43114,
  name: 'Avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: [
        'https://avalanche-c-chain-rpc.publicnode.com',
        'https://api.avax.network/ext/bc/C/rpc',
        'https://rpc.ankr.com/avalanche',
        'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc',
      ]
    },
    public: {
      http: [
        'https://avalanche-c-chain-rpc.publicnode.com',
        'https://api.avax.network/ext/bc/C/rpc',
        'https://rpc.ankr.com/avalanche',
        'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc',
      ]
    },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 11_907_934,
    },
  },
};

// Avalanche Fuji Testnet
export const avalancheFuji: Chain = {
  id: 43113,
  name: 'Avalanche Fuji',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: [
        'https://avalanche-fuji-c-chain-rpc.publicnode.com',
        'https://api.avax-test.network/ext/bc/C/rpc',
        'https://rpc.ankr.com/avalanche_fuji',
        'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc',
      ]
    },
    public: {
      http: [
        'https://avalanche-fuji-c-chain-rpc.publicnode.com',
        'https://api.avax-test.network/ext/bc/C/rpc',
        'https://rpc.ankr.com/avalanche_fuji',
        'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc',
      ]
    },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://testnet.snowtrace.io' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 7_096_959,
    },
  },
  testnet: true,
};
