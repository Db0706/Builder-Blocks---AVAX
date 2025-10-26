'use client';

import { ArenaAppStoreSdk } from '@the-arena/arena-app-store-sdk';

// Initialize Arena SDK lazily (only in browser)
let arenaSDKInstance: ArenaAppStoreSdk | null = null;

// Check if running inside Arena iframe
function checkIfInArena(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't access window.top, we're likely in an iframe
  }
}

export const getArenaSDK = (): ArenaAppStoreSdk => {
  if (typeof window === 'undefined') {
    throw new Error('Arena SDK can only be used in browser');
  }

  if (!arenaSDKInstance) {
    arenaSDKInstance = new ArenaAppStoreSdk({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'faeac2f6960ca82510491391ac612e5f',
      metadata: {
        name: 'Builder Blocks',
        description: 'Stack blocks and earn on Avalanche blockchain',
        url: window.location.href,
        icons: ['https://arena.social/icon.png'] // TODO: Replace with your app icon
      }
    });

    console.log('✅ Arena SDK initialized with provider:', arenaSDKInstance.provider);
  }

  return arenaSDKInstance;
};

// For backward compatibility
export const arenaSDK = typeof window !== 'undefined' ? getArenaSDK() : null as any;

// User profile type
export interface ArenaUserProfile {
  id: string;
  username?: string;
  address?: string;
  [key: string]: any;
}

// Get user profile from Arena
export async function getArenaUserProfile(): Promise<ArenaUserProfile | null> {
  try {
    const sdk = getArenaSDK();
    const profile = await sdk.sendRequest('getUserProfile');
    console.log('✅ Arena user profile:', profile);
    return profile as ArenaUserProfile;
  } catch (error) {
    console.error('❌ Failed to get Arena profile:', error);
    return null;
  }
}

// Check if running inside Arena iframe
export function isRunningInArena(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't access window.top, we're likely in an iframe
  }
}
