import { ConversationAgentResponse } from "../responseSchemas";
import { AgentResponseParseError } from "../../../../types/errors/parsingError";
import { AgentResponseParser } from "./abstractParser";
import { SchemaValidator } from "../schemaValidator";

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