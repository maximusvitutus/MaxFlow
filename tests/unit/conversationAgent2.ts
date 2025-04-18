import { ConversationAgent } from '../../src/core/llm/agents/conversationAgent';
import { MockProvider } from '../mocks/mockProvider';
import { SystemOperator } from '../../src/core/llm/operators/abstractOperator';
import { SystemOperatorEvaluator } from '../../src/core/llm/agentEvaluators/operatorEvaluator';
import { createMockResponse, waitForAsync } from './testHelpers';
import { ChatMessage } from '../../src/core/tools/providers/abstractProvider';

describe('ConversationAgent Performance', () => {
  let mockProvider: MockProvider;
  let mockOperator: SystemOperator;
  let agent: ConversationAgent;
  let mockEvaluator: SystemOperatorEvaluator;

  beforeEach(() => {
    mockProvider = new MockProvider('mock-api-key');
    mockOperator = {
      getWritingStructure: jest.fn(),
      getKnowledgeTree: jest.fn()
    } as unknown as SystemOperator;
    
    agent = new ConversationAgent(mockProvider, "test system prompt", mockOperator);
    mockEvaluator = {
      evaluate: jest.fn().mockResolvedValue({ score: 0.9, feedback: "Good response" })
    } as unknown as SystemOperatorEvaluator;
  });

  describe('Concurrent Processing', () => {
    it('should handle concurrent message processing efficiently', async () => {
      const concurrentMessages = Array(5).fill(null).map((_, i) => 
        `Concurrent message ${i + 1}`
      );

      mockProvider.getResponse = jest.fn().mockImplementation(async (msg) => {
        await waitForAsync(Math.random() * 50);
        return createMockResponse({
          answerToUser: `Response to: ${msg}`
        });
      });

      const start = performance.now();
      const responses = await Promise.all(
        concurrentMessages.map(msg => agent.processMessage(msg))
      );
      const duration = performance.now() - start;

      expect(responses).toHaveLength(concurrentMessages.length);
      expect(duration).toBeLessThan(300);
    });

    it('should maintain message order under concurrent load', async () => {
      const messages = ['First', 'Second', 'Third'];
      const processOrder: string[] = [];

      mockProvider.getResponse = jest.fn().mockImplementation(async (msg) => {
        await waitForAsync(Math.random() * 30);
        processOrder.push(msg);
        return createMockResponse({
          reasoning: "Processing message",
          answerToUser: `Processed ${msg}`
        });
      });

      const responses = await Promise.all(
        messages.map(msg => agent.processMessage(msg))
      );

      // Check the order of messages processed by the provider
      expect(processOrder).toEqual(messages);
      
      // Verify all responses are valid JSON
      responses.forEach((responseStr, i) => {
        const parsed = JSON.parse(responseStr);
        expect(parsed.answerToUser).toContain(messages[i]);
      });
    });
  });

  describe('Load Testing', () => {
    it('should maintain response quality under sustained load', async () => {
      const messages = Array(5).fill(null).map((_, i) => ({
        content: `Load test message ${i + 1}`,
        expectedQuality: 0.8
      }));

      for (const { content, expectedQuality } of messages) {
        mockProvider.getResponse = jest.fn().mockResolvedValue(createMockResponse({
          reasoning: "Load test response",
          answerToUser: `Quality response to: ${content}`
        }));

        const responseStr = await agent.processMessage(content, mockEvaluator);
        const parsedResponse = JSON.parse(responseStr);
        
        // Mock evaluator was set up in beforeEach to return score: 0.9
        const evaluation = await mockEvaluator.evaluate(responseStr, []);
        expect(evaluation.score).toBeGreaterThanOrEqual(expectedQuality);
        expect(parsedResponse.answerToUser).toContain(content);
      }
    });

    it('should handle rapid sequential requests without degradation', async () => {
      const requestCount = 10;
      const times: number[] = [];

      mockProvider.getResponse = jest.fn().mockImplementation(async (msg) => {
        await waitForAsync(Math.random() * 50); // Simulate varying response times
        return createMockResponse({
          reasoning: "Processing message",
          answerToUser: `Response to: ${msg}`
        });
      });

      for (let i = 0; i < requestCount; i++) {
        const start = performance.now();
        const responseStr = await agent.processMessage(`Message ${i}`);
        times.push(performance.now() - start);
        
        // Verify each response is properly formatted
        const parsedResponse = JSON.parse(responseStr);
        expect(parsedResponse.answerToUser).toContain(`Message ${i}`);
      }

      // Verify response times don't increase significantly
      const avgFirstHalf = average(times.slice(0, 5));
      const avgSecondHalf = average(times.slice(5));
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5);
    });
  });

  describe('History Management Under Load', () => {
    it('should handle rapid history updates without data races', async () => {
      const rapidUpdates: ChatMessage[] = Array(10).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant' as const,
        content: `Rapid update ${i}`
      }));

      await Promise.all(rapidUpdates.map(async msg => {
        await waitForAsync(Math.random() * 50);
        agent['history'].push(msg);
      }));

      const history = agent.getHistory();
      const updateMessages = history.filter(msg => 
        msg.content.includes('Rapid update')
      );
      
      expect(updateMessages).toHaveLength(rapidUpdates.length);
      expect(updateMessages.map(m => m.content)).toEqual(
        rapidUpdates.map(m => m.content)
      );
    });

    it('should maintain history integrity during concurrent operations', async () => {
      const operations = 20;
      const initialHistoryLength = agent.getHistory().length;

      await Promise.all([
        ...Array(operations).fill(null).map((_, i) => 
          agent.processMessage(`Concurrent message ${i}`)
        ),
        ...Array(operations).fill(null).map((_, i) => 
          waitForAsync(Math.random() * 20).then(() => 
            agent['history'].push({
              role: 'user' as const,
              content: `Direct update ${i}`
            })
          )
        )
      ]);

      const finalHistory = agent.getHistory();
      expect(finalHistory.length).toBe(
        initialHistoryLength + operations * 2 + operations
      );
    });
  });
});

// Helper function for calculating average
function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
} 