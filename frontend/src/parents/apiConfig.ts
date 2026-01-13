// --- CONSTANTS ---
// API_KEY and API_URL are removed. They are no longer needed on the client.
export const MAX_RETRIES = 5;

// --- UTILITY FUNCTIONS ---
// The fetchWithBackoff is still useful for calling your *own* backend.
export async function fetchWithBackoff(url: string, options: RequestInit, retries: number): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 429 && response.status < 500) {
        return response;
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed (network error).`);
    }

    if (i < retries - 1) {
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('All fetch attempts failed.');
}