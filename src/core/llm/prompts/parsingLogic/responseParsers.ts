import { BaseAgentResponse } from "./schemas";
import { ConversationAgentResponse } from "./schemas";

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

/**
 * Parser for conversation agent responses.
 * Validates and converts raw JSON responses into ConversationAgentResponse objects.
 */
export class ConversationAgentResponseParser extends AgentResponseParser<ConversationAgentResponse> {
  private validator: SchemaValidator;

  /**
   * Initializes a new instance of the ConversationAgentResponseParser.
   * Sets up the schema validator with the expected response format.
   */
  constructor() {
    super();
    this.validator = new SchemaValidator({
      reasoning: {
        type: 'string',
        required: true,
      },
      answerToUser: {
        type: 'string',
        required: true,
      },
      toolCalls: {
        type: 'string',
        required: true,
      }
    });
  }

  /**
   * Parses a raw JSON response into a ConversationAgentResponse object.
   * 
   * @param rawResponse - The raw JSON string from the LLM
   * @returns A structured ConversationAgentResponse object
   * @throws AgentResponseParseError if parsing or validation fails
   */
  parse(rawResponse: string): ConversationAgentResponse {
    try {
      const parsedResponse = JSON.parse(rawResponse);
      
      const validation = this.validator.validate(parsedResponse);
      if (!validation.valid) {
        throw new AgentResponseParseError(
          `Invalid response format: ${validation.errors.join(', ')}`,
          rawResponse
        );
      }
      
      return parsedResponse as ConversationAgentResponse;
    } catch (error) {
      // Maybe fix idk
      const err = error as Error
      if (err instanceof AgentResponseParseError) {
        throw err;
      }
      throw new AgentResponseParseError(`Failed to parse response: ${err.message}`, rawResponse);
    }
  }
}

/**
 * Error class for agent response parsing failures.
 * Provides information about what went wrong during parsing.
 */
class AgentResponseParseError extends Error {
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