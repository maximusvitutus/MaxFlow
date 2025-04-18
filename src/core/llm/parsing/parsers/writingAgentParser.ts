import { AgentResponseParser } from './abstractParser';
import { WritingAgentResponse } from '../responseSchemas';
import { AgentResponseParseError } from '../../../types/errors/parsingError';
import { SchemaValidator } from '../schemaValidator';
import { TextSection } from '../../../types/writing/writingStructure';
import { parseJSONSafe } from '../../../tools/utils/jsonParser';

/**
 * Parser for WritingAgent responses.
 * Validates and extracts structured data from the agent's raw text output.
 */
export class WritingAgentParser extends AgentResponseParser<WritingAgentResponse> {
  private validator: SchemaValidator;

  /**
   * Initializes a new instance of the WritingAgentParser.
   * Sets up the schema validator with the expected response format.
   */
  constructor() {
    super();
    this.validator = new SchemaValidator({
      reasoning: {
        type: 'string',
        required: true,
      },
      messageToOperator: {
        type: 'string',
        required: true,
      },
      deliverables: {
        type: 'object',
        required: true,
        validate: (value: any) => {
          if (typeof value !== 'object') return false;
          
          // Check for writingStructureDraft
          if (!value.writingStructureDraft || typeof value.writingStructureDraft !== 'object') {
            return false;
          }
          
          // Check for sections array
          const draft = value.writingStructureDraft;
          if (!Array.isArray(draft.sections)) {
            return false;
          }
          
          // Validate each section has the required fields
          for (const section of draft.sections) {
            if (!section.title || typeof section.title !== 'string' ||
                !section.instructions || typeof section.instructions !== 'string' ||
                !section.exampleContent || typeof section.exampleContent !== 'string') {
              return false;
            }
          }
          
          return true;
        }
      }
    });
  }

  /**
   * Parses a raw text response into a structured WritingAgent response.
   * 
   * @param rawResponse - The raw text response from the LLM
   * @returns A structured WritingAgent response object
   * @throws AgentResponseParseError if parsing or validation fails
   */
  parse(rawResponse: string): WritingAgentResponse {
    try {
      // Use the safer JSON parser to handle various formatting issues
      const parsedJson = parseJSONSafe(rawResponse);
      console.log("(WritingAgentParser) Parsed response:", parsedJson);
      
      // Validate the parsed JSON against our schema
      const validation = this.validator.validate(parsedJson);
      if (!validation.valid) {
        throw new AgentResponseParseError(
          `Invalid response format: ${validation.errors.join(', ')}`,
          rawResponse
        );
      }
      
      // Transform the sections array to match our TextSection interface
      const rawSections = parsedJson.deliverables.writingStructureDraft.sections || [];
      const sections: TextSection[] = rawSections.map((section: any) => ({
        content: "", // Initially empty
        creationInstructions: {
          title: section.title,
          instructions: section.instructions
        }
      }));
      
      // Return just the sections array
      return {
        reasoning: parsedJson.reasoning,
        messageToOperator: parsedJson.messageToOperator,
        deliverables: {
          writingStructureDraft: sections
        }
      };
    } catch (error) {
      const err = error as Error;
      if (err instanceof AgentResponseParseError) {
        throw err;
      }
      throw new AgentResponseParseError(`Failed to parse WritingAgent response: ${err.message}`, rawResponse);
    }
  }
} 