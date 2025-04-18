import { ConversationAgentResponse } from "../responseSchemas";
import { AgentResponseParseError } from "../../../types/errors/parsingError";
import { AgentResponseParser } from "./abstractParser";
import { SchemaValidator } from "../schemaValidator";
import { ToolCall } from "../../../types/toolCall";

/**
 * Parser for conversation agent responses.
 * Validates and converts raw JSON responses into ConversationAgentResponse objects.
 */
export class ConversationAgentParser extends AgentResponseParser<ConversationAgentResponse> {
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
        type: 'array',
        required: false,
        validate: (value: any[]) => {
          if (!Array.isArray(value)) return true; // Skip validation if not provided
          return value.every(item => 
            typeof item === 'object' && 
            typeof item.name === 'string' && 
            typeof item.arguments === 'object'
          );
        }
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
      console.log("(ConversationAgentResponseParser) Parsed response:", parsedResponse);
      
      const validation = this.validator.validate(parsedResponse);
      if (!validation.valid) {
        throw new AgentResponseParseError(
          `Invalid response format: ${validation.errors.join(', ')}`,
          rawResponse
        );
      }

      // Extract the strings from the parsed response
      const reasoning: string = parsedResponse.reasoning;
      const answerToUser: string = parsedResponse.answerToUser;

      // Extract tool calls with a standardized approach
      const toolCalls: ToolCall[] = Array.isArray(parsedResponse.toolCalls) ? 
        parsedResponse.toolCalls.map((toolCall: any) => {
          return {
            function: {
              name: toolCall.name,
              args: toolCall.arguments
            }
          };
        }) : [];
      
      // Return the parsed response with tool calls
      return {
        reasoning: reasoning, 
        answerToUser: answerToUser, 
        toolCalls: toolCalls
      } as ConversationAgentResponse;
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