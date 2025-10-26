/**
 * Score Signing API Client
 * Communicates with backend server to get signatures for score submissions
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SignScoreResponse {
  success: boolean;
  nonce: string;
  signature: string;
  signer: string;
}

export interface SignScoreError {
  error: string;
}

/**
 * Request a signature for a score from the backend
 * @param playerAddress - The player's wallet address
 * @param score - The score achieved
 * @returns Signature data needed for blockchain submission
 */
export async function requestScoreSignature(
  playerAddress: string,
  score: number
): Promise<SignScoreResponse> {
  console.log('🔍 API_URL:', API_URL);
  console.log('🎯 Requesting signature from:', `${API_URL}/api/sign-score`);

  try {
    const response = await fetch(`${API_URL}/api/sign-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player: playerAddress,
        score: score,
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData: SignScoreError = await response.json();
      console.error('❌ Backend error:', errorData);
      throw new Error(errorData.error || 'Failed to get score signature');
    }

    const data: SignScoreResponse = await response.json();
    console.log('✅ Got signature:', data);

    if (!data.success) {
      throw new Error('Backend rejected score signature request');
    }

    return data;
  } catch (error) {
    console.error('❌ Error requesting score signature:', error);
    throw error;
  }
}

/**
 * Check if backend server is healthy
 * @returns True if server is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
