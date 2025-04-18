import { ChatMessage } from '../../src/core/tools/providers/abstractProvider';

export const createMockResponse = (content: Partial<any>) => {
  return JSON.stringify({
    reasoning: "Default reasoning",
    answerToUser: "Default answer",
    ...content
  });
};

export const createMockMessages = (count: number): ChatMessage[] => {
  return Array(count).fill(null).map((_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant' as const,
    content: `Message ${i}`
  }));
};

export const waitForAsync = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const createMockToolCall = (name: string, args: any) => ({
  function: {
    name,
    args
  }
}); 