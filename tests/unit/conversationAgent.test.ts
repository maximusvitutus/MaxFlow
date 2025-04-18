import { ConversationAgent } from '../../src/core/llm/agents/conversationAgent';
import { MockProvider } from '../mocks/mockProvider';
import { SystemOperator } from '../../src/core/llm/operators/abstractOperator';
import { SystemOperatorEvaluator } from '../../src/core/llm/agentEvaluators/operatorEvaluator';

// Test helper functions
const createMockResponse = (content: Partial<any>) => {
  return JSON.stringify({
    reasoning: "Default reasoning",
    answerToUser: "Default answer",
    ...content
  });
};

describe('ConversationAgent', () => {
  let mockProvider: MockProvider;
  let mockOperator: SystemOperator;
  let agent: ConversationAgent;

  beforeEach(() => {
    mockProvider = new MockProvider('mock-api-key');
    mockOperator = {
      getWritingStructure: jest.fn(),
      getKnowledgeTree: jest.fn()
    } as unknown as SystemOperator;
    
    agent = new ConversationAgent(mockProvider, "test system prompt", mockOperator);
  });

  describe('processMessage', () => {
    it('should handle empty user messages', async () => {
      const emptyMessage = "";
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Handling empty message",
        answerToUser: "I notice you sent an empty message. How an I help you?"
      }));

      const response = await agent.processMessage(emptyMessage);
      expect(JSON.parse(response).answerToUser).toContain("empty message");
    });

    it('should handle extremely long messages', async () => {
      const longMessage = "a".repeat(10000);
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Processing long message",
        answerToUser: "I've received your detailed message"
      }));

      const response = await agent.processMessage(longMessage);
      expect(JSON.parse(response).answerToUser).toContain("detailed message");
    });

    it('should handle multiple tool calls in single response', async () => {
      const userMessage = "Create a writing structure and knowledge tree";
      const responseWithTools = createMockResponse({
        reasoning: "Processing tool calls is fun!",
        answerToUser: "I'll help you create those thingies",
        toolCalls: [
          {
            name: "getWritingStructure",
            arguments: { requestWithContext: "Mock request with context" }
          },
          {
            name: "getKnowledgeTree",
            arguments: { request: "Mock request" }
          }
        ]
      });

      // Mock the provider to return the response with tool calls
      mockProvider.getResponse = jest.fn().mockResolvedValue(responseWithTools);

      // Process the message
      await agent.processMessage(userMessage);

      // Verify the tool calls were made with the correct arguments
      expect(mockOperator.getWritingStructure).toHaveBeenCalledWith("Mock request with context");
      expect(mockOperator.getKnowledgeTree).toHaveBeenCalledWith("Mock request");
    });

    it('should maintain exact history structure', async () => {
      const userMessage = "Hello AI";
      const expectedResponse = createMockResponse({
        reasoning: "Greeting the user",
        answerToUser: "Hello! How can I help you today?"
      });
      
      mockProvider.getResponse = jest.fn().mockResolvedValue(expectedResponse);
      await agent.processMessage(userMessage);

      const history = agent.getHistory();
      expect(history).toEqual([
        { role: 'system', content: "test system prompt" },
        { role: 'user', content: userMessage },
        { role: 'assistant', content: expectedResponse }
      ]);
    });
  });

  describe('Error Handling', () => {
    const errorCases = [
      { 
        name: 'API timeout',
        error: new Error("Request timeout"),
        expectedMessage: "timeout"
      },
      {
        name: 'Invalid JSON response',
        error: new SyntaxError("Unexpected token"),
        expectedMessage: "Unexpected token"
      },
      {
        name: 'Rate limit exceeded',
        error: new Error("Rate limit exceeded"),
        expectedMessage: "Rate limit exceeded"
      }
    ];

    errorCases.forEach(({ name, error, expectedMessage }) => {
      it(`should handle ${name} errors`, async () => {
        mockProvider.getResponse = jest.fn().mockRejectedValue(error);
        
        await expect(agent.processMessage("test"))
          .rejects
          .toThrow(expectedMessage);
      });
    });
  });

  describe('Edge Cases and Special Inputs', () => {
    it('should handle messages with special characters', async () => {
      const specialCharsMessage = "Hello! 🌟 Here's some special chars: &<>\"'`\n\t";
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Processing special characters",
        answerToUser: "Processed your message with special characters"
      }));

      const response = await agent.processMessage(specialCharsMessage);
      expect(JSON.parse(response).answerToUser).toBeTruthy();
      expect(mockProvider.getResponse).toHaveBeenCalledWith(
        expect.stringContaining(specialCharsMessage),
        expect.any(Array)
      );
    });

    it('should handle messages at maximum length boundary', async () => {
      // Assuming a 4096 token limit (approximate character count)
      const maxLengthMessage = "x".repeat(16384);
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Handling max length message",
        answerToUser: "Processed your long message"
      }));

      const response = await agent.processMessage(maxLengthMessage);
      expect(JSON.parse(response).answerToUser).toBeTruthy();
    });

    it('should handle messages with only whitespace', async () => {
      const whitespaceMessage = "   \n\t   ";
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Processing whitespace message",
        answerToUser: "I notice your message contains only whitespace"
      }));

      const response = await agent.processMessage(whitespaceMessage);
      expect(JSON.parse(response).answerToUser).toContain("whitespace");
    });

    it('should handle messages with code snippets', async () => {
      const codeMessage = "```javascript\nconst x = 42;\nconsole.log(x);\n```";
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Processing code snippet",
        answerToUser: "I see you've shared some code"
      }));

      const response = await agent.processMessage(codeMessage);
      expect(JSON.parse(response).answerToUser).toContain("code");
    });
  });

  describe('Tool Call Argument Verification', () => {
    it('should pass correct arguments to writing structure tool', async () => {
      const userMessage = "Create a writing structure about renewable energy";
      const responseWithTools = createMockResponse({
        toolCalls: [{
          name: "getWritingStructure",
          arguments: {
            requestWithContext: "Mock request with context"
          }
        }]
      });

      mockProvider.getResponse = jest.fn().mockResolvedValue(responseWithTools);
      await agent.processMessage(userMessage);

      // Verify exact argument structure
      expect(mockOperator.getWritingStructure).toHaveBeenCalledWith(
        "Mock request with context"
      );
    });

    it('should handle invalid tool call arguments gracefully', async () => {
      const responseWithInvalidTools = createMockResponse({
        toolCalls: [{
          name: "getWritingStructure",
          arguments: null
        }]
      });

      mockProvider.getResponse = jest.fn().mockResolvedValue(responseWithInvalidTools);
      await agent.processMessage("test message");

      expect(mockOperator.getWritingStructure).not.toHaveBeenCalled();
    });
  });

  describe('Advanced Edge Cases', () => {
    it('should handle messages with nested JSON content', async () => {
      const jsonMessage = JSON.stringify({
        query: "test",
        options: { depth: 3, format: "detailed" }
      });
      
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Processing JSON content",
        answerToUser: "Processed your JSON request",
        toolCalls: []
      }));

      const response = await agent.processMessage(jsonMessage);
      expect(JSON.parse(response).answerToUser).toBeTruthy();
      expect(mockProvider.getResponse).toHaveBeenCalledWith(
        expect.stringContaining("query"),
        expect.any(Array)
      );
    });

    it('should handle messages with HTML/XML content', async () => {
      const htmlMessage = "<div>Test <b>content</b> with <script>alert('test')</script></div>";
      mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
        reasoning: "Processing HTML content",
        answerToUser: "Processed your HTML content safely",
        toolCalls: []
      }));

      const response = await agent.processMessage(htmlMessage);
      expect(JSON.parse(response).answerToUser).toContain("HTML");
    });

    it('should handle messages approaching token limit', async () => {
      // Create a message that approaches but doesn't exceed the token limit
      const complexMessage = Array(100).fill("complex token").join(" ");
      let messageProcessed = false;

      mockProvider.getResponse = jest.fn().mockImplementation(async (msg) => {
        messageProcessed = true;
        return createMockResponse({
          reasoning: "Processing large tokenized message",
          answerToUser: "Processed your complex message",
          toolCalls: []
        });
      });

      await agent.processMessage(complexMessage);
      expect(messageProcessed).toBe(true);
    });
  });
}); 