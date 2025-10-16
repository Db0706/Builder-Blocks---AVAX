export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAVAX(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor;

  // Check for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check screen size (under 768px width is typically mobile)
  const isSmallScreen = window.innerWidth < 768;

  return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
}
