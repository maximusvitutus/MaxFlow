import { PromptTester } from '../../src/core/llm/prompts/PromptTester.ts';

describe('Prompt Versioning Tests', () => {
  let tester: PromptTester;

  beforeEach(() => {
    tester = new PromptTester();
  });

  test('should compare two prompt versions', async () => {
    const result = await tester.compareVersions('1.0', '2.0');
    expect(result).toHaveProperty('winner');
    expect(result).toHaveProperty('metrics');
  });

  test('should record metrics for a prompt version', async () => {
    const metrics = {
      user_satisfaction: 4.5,
      task_completion_time: 120,
      interaction_quality: 0.85
    };
    
    await expect(tester.recordMetrics('2.0', metrics)).resolves.not.toThrow();
  });
}); 