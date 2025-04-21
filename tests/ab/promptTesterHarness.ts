import { MockOperator } from '../../tests/mocks/mockOperator';
import { PromptTester } from '../../src/core/llm/prompts/promptTester';
import { AgentType } from '../../src/core/llm/agents/abstractAgents';
import { LLMProvider } from '../../src/core/tools/providers/abstractProvider';
import { PromptTestCase } from '../../src/core/llm/prompts/promptTester';
/**
 * A test harness for running A/B tests on different prompt versions
 */
export class PromptTestHarness {
  private tester: PromptTester;
  
  /**
   * Creates a new PromptTestHarness
   * 
   * @param provider - The LLM provider to use for testing
   */
  constructor(provider: LLMProvider) {
    const operator = new MockOperator();
    this.tester = new PromptTester(provider, operator);
  }
  
  /**
   * Runs an A/B test comparing two prompt versions
   * 
   * @param promptA - Details for prompt version A
   * @param promptB - Details for prompt version B
   * @param testCases - Test cases to run
   * @param agentType - Type of agent to test
   */
  async runABTest(
    promptA: { id: string, version: string, filePath: string },
    promptB: { id: string, version: string, filePath: string },
    testCases: PromptTestCase[],
    agentType: AgentType = AgentType.CONVERSATION
  ): Promise<void> {
    // Register both prompt versions
    await this.tester.registerPromptVersion(
      promptA.id,
      promptA.version,
      promptA.filePath,
      testCases
    );
    
    await this.tester.registerPromptVersion(
      promptB.id,
      promptB.version,
      promptB.filePath,
      testCases
    );
    
    // Compare the versions
    const results = await this.tester.compareVersions(
      promptA.version,
      promptB.version,
      agentType
    );
    
    // Print the results
    console.log('\n=== A/B TEST RESULTS ===');
    console.log(`Comparing: ${promptA.id} (v${promptA.version}) vs ${promptB.id} (v${promptB.version})`);
    console.log(`Winner: ${results.winner === 'tie' ? 'Tie' : results.winner}`);
    console.log('\nMetrics:');
    
    for (const [metric, scores] of Object.entries(results.metrics)) {
      console.log(`- ${metric}:`);
      console.log(`  - ${promptA.id} (v${promptA.version}): ${scores.versionA.toFixed(2)}`);
      console.log(`  - ${promptB.id} (v${promptB.version}): ${scores.versionB.toFixed(2)}`);
    }
    
    console.log('\nDetailed Results:');
    console.log(`${promptA.id} (v${promptA.version}):`);
    for (const result of results.testResults.versionA) {
      console.log(`- Test: "${result.testCase.substring(0, 50)}..."`);
      console.log(`  Score: ${result.evaluationScore}`);
      console.log(`  Passed: ${result.passed ? 'Yes' : 'No'}`);
    }
    
    console.log(`\n${promptB.id} (v${promptB.version}):`);
    for (const result of results.testResults.versionB) {
      console.log(`- Test: "${result.testCase.substring(0, 50)}..."`);
      console.log(`  Score: ${result.evaluationScore}`);
      console.log(`  Passed: ${result.passed ? 'Yes' : 'No'}`);
    }
  }
}