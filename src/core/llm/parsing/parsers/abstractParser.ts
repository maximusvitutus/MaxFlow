import { BaseAgentResponse } from "../responseSchemas";

/**
 * Abstract base class for all agent response parsers.
 * Defines the interface for parsing raw LLM responses into structured agent responses.
 * 
 * @typeParam T - The type of agent response that this parser produces
 */
export abstract class AgentResponseParser<T extends BaseAgentResponse> {
  /**
   * Parses a raw text response into a structured agent response.
   * 
   * @param rawResponse - The raw text response from the LLM
   * @returns A structured agent response object
   */
  abstract parse(rawResponse: string): T;
}