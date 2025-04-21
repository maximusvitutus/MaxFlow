import { LLMProvider, ChatMessage } from '../../tools/providers/abstractProvider';
import { SystemOperator } from '../operators/abstractOperator';
import { SystemOperatorEvaluator } from '../agentEvaluators/operatorEvaluator';
import { ConversationAgent } from '../agents/conversationAgent';
import { WritingAgent } from '../agents/writingAgent';
import { AgentType } from '../agents/abstractAgents';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import path from 'path';

export interface PromptTestCase {
  input: ChatMessage[];
  expectedBehaviors: string[];
  metrics: {
    [key: string]: number;
  };
}

interface PromptVersion {
  id: string;
  version: string;
  filePath: string;
  testCases: PromptTestCase[];
}

interface TestResult {
  promptVersion: string;
  testCase: string;
  response: string;
  evaluationScore: number;
  metricsScores: Record<string, number>;
  passed: boolean;
}

/**
 * PromptTester is a class that tests and compares different versions of prompts.
 * It allows for recording and analyzing metrics to evaluate prompt performance.
 */
export class PromptTester {
  private versions: Map<string, PromptVersion>;
  private provider: LLMProvider;
  private evaluator: SystemOperatorEvaluator;
  private testResults: TestResult[] = [];
  private operator: SystemOperator;
  
  constructor(provider: LLMProvider, operator: SystemOperator) {
    this.versions = new Map();
    this.provider = provider;
    this.operator = operator;
    this.evaluator = new SystemOperatorEvaluator(provider, "mock for evaluation's system prompt", "mock for operator's system prompt");
  }

  /**
   * Registers a prompt version for testing
   * 
   * @param id - Identifier for the prompt version
   * @param version - Version number/string
   * @param filePath - Path to the prompt file
   * @param testCases - Test cases to evaluate the prompt
   */
  async registerPromptVersion(
    id: string, 
    version: string, 
    filePath: string, 
    testCases: PromptTestCase[] = []
  ): Promise<void> {
    this.versions.set(version, {
      id,
      version,
      filePath,
      testCases
    });
  }

  /**
   * Loads a prompt from a file
   * 
   * @param filePath - Path to the prompt file
   * @returns The prompt content as a string
   */
  private async loadPrompt(filePath: string): Promise<string> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      if (filePath.endsWith('.yaml')) {
        const yamlContent = yaml.load(fileContent) as { template: string };
        return yamlContent.template;
      }
      return fileContent;
    } catch (error) {
      throw new Error(`Failed to load prompt: ${error}`);
    }
  }

  /**
   * Creates an agent with a specific prompt version
   * 
   * @param agentType - Type of agent to create
   * @param promptVersion - Version of the prompt to use
   * @returns A promise resolving to the created agent
   */
  private async createAgent(agentType: AgentType, promptVersion: string): Promise<ConversationAgent | WritingAgent> {
    const version = this.versions.get(promptVersion);
    if (!version) {
      throw new Error(`Prompt version ${promptVersion} not found`);
    }

    const promptTemplate = await this.loadPrompt(version.filePath);
    
    if (agentType === AgentType.CONVERSATION) {
      return new ConversationAgent(this.provider, this.operator);
    } else if (agentType === AgentType.WRITING) {
      return new WritingAgent(this.provider, this.operator);
    }
    
    throw new Error(`Unsupported agent type: ${agentType}`);
  }

  /**
   * Tests a single prompt version against a test case
   * 
   * @param version - The prompt version to test
   * @param testCase - The test case to run
   * @param agentType - The type of agent to test
   * @returns A promise resolving to a boolean indicating success
   */
  async testPrompt(
    versionId: string, 
    testCase: PromptTestCase, 
    agentType: AgentType = AgentType.CONVERSATION
  ): Promise<TestResult> {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Create an agent with the specified prompt version
    const agent = await this.createAgent(agentType, versionId);
    
    // Initialize the evaluator with the agent's system prompt
    this.evaluator = new SystemOperatorEvaluator(
      this.provider, 
      await this.loadPrompt(path.resolve('./src/core/llm/prompts/evaluationAgents/taskAgnosticEvaluation.yaml')),
      agent.getSystemPrompt()
    );
    
    let response: string;
    // Process the test input - handle ChatMessage[] input
    if (agentType === AgentType.CONVERSATION) {
      response = await (agent as ConversationAgent).processMessages(testCase.input, this.evaluator);
    } else {
      response = "MOCK RESPONSE, implement me plz";
    }
    
    // Evaluate the response
    const evaluation = await this.evaluator.evaluate(
      typeof response === 'string' ? response : JSON.stringify(response),
      agent.getConversationHistory()
    );
    
    // Check for expected behaviors
    const passed = this.checkExpectedBehaviors(response, testCase.expectedBehaviors);
    
    // Create test result
    const result: TestResult = {
      promptVersion: versionId,
      testCase: testCase.input.map(msg => msg.content).join(', '),
      response: typeof response === 'string' ? response : JSON.stringify(response),
      evaluationScore: evaluation.score,
      metricsScores: { ...testCase.metrics },
      passed
    };
    
    // Store the test result
    this.testResults.push(result);
    
    return result;
  }
  
  /**
   * Checks if a response exhibits the expected behaviors
   * 
   * @param response - The agent's response
   * @param expectedBehaviors - Array of expected behaviors
   * @returns True if all expected behaviors are present, false otherwise
   */
  private checkExpectedBehaviors(response: any, expectedBehaviors: string[]): boolean {
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
    
    // Check each expected behavior
    for (const behavior of expectedBehaviors) {
      if (!this.checkBehavior(responseStr, behavior)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Checks if a specific behavior is present in a response
   * 
   * @param response - The response string
   * @param behavior - The behavior to check for
   * @returns True if the behavior is present, false otherwise
   */
  private checkBehavior(response: string, behavior: string): boolean {
    // Simple implementation - future versions could use more sophisticated checks
    // or even delegate to the LLM for behavior verification
    if (behavior.startsWith('contains:')) {
      const content = behavior.substring('contains:'.length).trim();
      return response.includes(content);
    } else if (behavior.startsWith('excludes:')) {
      const content = behavior.substring('excludes:'.length).trim();
      return !response.includes(content);
    } else if (behavior.startsWith('regex:')) {
      const pattern = behavior.substring('regex:'.length).trim();
      return new RegExp(pattern).test(response);
    }
    
    // Default to using the behavior as a keyword
    return response.includes(behavior);
  }

  /**
   * Compares two prompt versions by running all test cases on both
   * 
   * @param versionA - First prompt version to compare
   * @param versionB - Second prompt version to compare
   * @param agentType - Type of agent to test
   * @returns A promise resolving to an object with the winner and metrics
   */
  async compareVersions(
    versionA: string, 
    versionB: string, 
    agentType: AgentType = AgentType.CONVERSATION
  ): Promise<{
    winner: string;
    metrics: Record<string, {versionA: number, versionB: number}>;
    testResults: {versionA: TestResult[], versionB: TestResult[]};
  }> {
    const verA = this.versions.get(versionA);
    const verB = this.versions.get(versionB);
    
    if (!verA || !verB) {
      throw new Error(`One or both versions not found: ${versionA}, ${versionB}`);
    }
    
    // Use union of test cases from both versions
    const testCases = [...new Set([...verA.testCases, ...verB.testCases])];
    
    const resultsA: TestResult[] = [];
    const resultsB: TestResult[] = [];
    
    // Run all test cases for both versions
    for (const testCase of testCases) {
      resultsA.push(await this.testPrompt(versionA, testCase, agentType));
      resultsB.push(await this.testPrompt(versionB, testCase, agentType));
    }
    
    // Calculate metrics for comparison
    const metrics: Record<string, {versionA: number, versionB: number}> = {
      averageScore: {
        versionA: this.calculateAverageScore(resultsA),
        versionB: this.calculateAverageScore(resultsB)
      },
      successRate: {
        versionA: this.calculateSuccessRate(resultsA),
        versionB: this.calculateSuccessRate(resultsB)
      }
    };
    
    // Determine the winner based on average score
    const winner = metrics.averageScore.versionA > metrics.averageScore.versionB 
      ? versionA : metrics.averageScore.versionB > metrics.averageScore.versionA 
      ? versionB : 'tie';
    
    return {
      winner,
      metrics,
      testResults: {
        versionA: resultsA,
        versionB: resultsB
      }
    };
  }
  
  /**
   * Calculates the average evaluation score from test results
   * 
   * @param results - Array of test results
   * @returns The average score
   */
  private calculateAverageScore(results: TestResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, result) => acc + result.evaluationScore, 0);
    return sum / results.length;
  }
  
  /**
   * Calculates the success rate from test results
   * 
   * @param results - Array of test results
   * @returns The success rate (0-1)
   */
  private calculateSuccessRate(results: TestResult[]): number {
    if (results.length === 0) return 0;
    const successes = results.filter(result => result.passed).length;
    return successes / results.length;
  }

  /**
   * Records metrics for a prompt version
   * 
   * @param version - The prompt version
   * @param metrics - The metrics to record
   */
  async recordMetrics(version: string, metrics: Record<string, number>): Promise<void> {
    // Get the existing version
    const promptVersion = this.versions.get(version);
    if (!promptVersion) {
      throw new Error(`Version ${version} not found`);
    }
    
    // Create a timestamp for the metrics
    const timestamp = new Date().toISOString();
    
    // Store the metrics with metadata
    const metricsRecord = {
      version,
      timestamp,
      metrics
    };
    
    // In a real implementation, we would persist these metrics to a database
    // For now, we'll just log them
    console.log('Recorded metrics:', metricsRecord);
  }
  
  /**
   * Gets all test results
   * 
   * @returns Array of test results
   */
  getTestResults(): TestResult[] {
    return this.testResults;
  }
}