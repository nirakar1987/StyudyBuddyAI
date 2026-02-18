/**
 * Safely parse JSON with a user-friendly error message on failure.
 */
export function safeJsonParse<T>(json: string, fallbackMessage: string): T {
  try {
    const trimmed = json?.trim?.() ?? '';
    if (!trimmed) {
      throw new Error('Empty response from AI. Please try again.');
    }
    return JSON.parse(trimmed) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `${fallbackMessage} The AI returned invalid data. Please try again.`
      );
    }
    throw error;
  }
}
