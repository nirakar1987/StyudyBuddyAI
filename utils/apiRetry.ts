/**
 * Retry an async function with exponential backoff.
 * Especially useful for 429 (rate limit) and transient network errors.
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  /** Status codes or error messages that should trigger a retry */
  retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryable'>> & { retryable?: (error: unknown) => boolean } = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryable: (error: unknown) => {
    const msg = String((error as Error)?.message ?? '');
    // Retry on rate limit (429), network errors, or server errors (5xx)
    return (
      msg.includes('429') ||
      msg.toLowerCase().includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('500')
    );
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryable,
  } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !retryable(error)) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, Math.min(delay, maxDelayMs)));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}
