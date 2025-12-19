import { DEFAULT_CONFIG } from '../config.js';

interface RetryError {
  status?: number;
  message?: string;
}

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const NON_RETRYABLE_STATUS_CODES = new Set([401, 404, 422]);

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = DEFAULT_CONFIG.retryAttempts,
  initialDelay: number = DEFAULT_CONFIG.retryDelay
): Promise<T> {
  let lastError: RetryError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as RetryError;

      // Don't retry on certain errors
      if (lastError.status && NON_RETRYABLE_STATUS_CODES.has(lastError.status)) {
        throw error;
      }

      // If it's the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * delay; // Add up to 30% jitter

      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

/**
 * Wrap an API call with retry logic
 */
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  description: string = 'API call'
): Promise<T> {
  try {
    return await retryWithBackoff(apiCall);
  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error';
    throw new Error(`${description} failed after retries: ${errorMessage}`);
  }
}
