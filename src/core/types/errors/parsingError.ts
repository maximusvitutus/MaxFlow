/**
 * Error class for agent response parsing failures.
 * Provides information about what went wrong during parsing.
 */
export class AgentResponseParseError extends Error {
  /**
   * Creates a new AgentResponseParseError.
   * 
   * @param message - The error message
   * @param originalResponse - The original raw response that failed to parse
   */
  constructor(message: string, public originalResponse?: string) {
    super(message);
    this.name = 'AgentResponseParseError';
  }
}