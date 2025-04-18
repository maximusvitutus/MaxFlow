import { WritingAgentParser } from '../../../src/core/llm/parsing/parsers/writingAgentParser';
import { AgentResponseParseError } from '../../../src/core/types/errors/parsingError';
import { parseJSONSafe } from '../../../src/core/tools/utils/jsonParser';

describe('WritingAgentParser', () => {
  let parser: WritingAgentParser;

  beforeEach(() => {
    parser = new WritingAgentParser();
  });

  it('should parse a valid JSON response correctly', () => {
    const validResponse = JSON.stringify({
      reasoning: "This is a valid reasoning.",
      messageToOperator: "This is a message to the operator.",
      deliverables: {
        writingStructureDraft: {
          sections: [
            {
              title: "Introduction",
              instructions: "Write an introduction.",
              exampleContent: "This is an example introduction."
            },
            {
              title: "Body",
              instructions: "Write a body.",
              exampleContent: "This is an example body."
            },
            {
              title: "Conclusion",
              instructions: "Write a conclusion.",
              exampleContent: "This is an example conclusion."
            }
          ]
        }
      }
    });

    const result = parser.parse(validResponse);
    expect(result.reasoning).toBe("This is a valid reasoning.");
    expect(result.messageToOperator).toBe("This is a message to the operator.");
    expect(result.deliverables.writingStructureDraft).toBeDefined();
    expect((result.deliverables.writingStructureDraft!)[0].creationInstructions.title).toBe("Introduction");
  });

  it('should throw an error for invalid JSON response', () => {
    const invalidResponse = "This is not a JSON string";

    expect(() => {
      parser.parse(invalidResponse);
    }).toThrow(AgentResponseParseError);
  });

  it('should throw an error for JSON with missing required fields', () => {
    const missingFieldsResponse = JSON.stringify({
      reasoning: "This is a valid reasoning.",
      messageToOperator: "This is a message to the operator.",
      deliverables: {
        writingStructureDraft: {
          sections: [
            {
              title: "Introduction",
              instructions: "Write an introduction."
            }
          ]
        }
      }
    });

    expect(() => parser.parse(missingFieldsResponse)).toThrow(AgentResponseParseError);
  });

  it('should handle JSON with unwanted fields gracefully', () => {
    const unwantedFieldsResponse = JSON.stringify({
      reasoning: "This is a valid reasoning.",
      messageToOperator: "This is a message to the operator.",
      deliverables: {
        writingStructureDraft: {
          sections: [
            {
              title: "Introduction",
              instructions: "Write an introduction.",
              exampleContent: "This is an example introduction.",
              intentionalExtraField: "This should be ignored"
            }
          ]
        }
      },
      intentionalExtraField: "This should be ignored"
    });

    const result = parser.parse(unwantedFieldsResponse);
    expect(result.reasoning).toBe("This is a valid reasoning.");
    expect(result.messageToOperator).toBe("This is a message to the operator.");
    expect(result.deliverables.writingStructureDraft).toBeDefined();
    expect((result.deliverables.writingStructureDraft!)[0].creationInstructions.title).toBe("Introduction");
  });
});