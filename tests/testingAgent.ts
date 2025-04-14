import { OpenAIProvider } from '../src/core/tools/providers/openAIProvider';
import { ChatMessage } from '../src/core/tools/providers/abstractProvider';
import { parseJSONSafe } from '../src/core/tools/utils/jsonParser';
interface TestResult {
  passed: boolean;
  reasoning: string;
  evidence: string;
}

export class TestingAgent {
  private provider: OpenAIProvider;
  private responseQualityPrompt: string;
  private conversationQualityPrompt: string;
  constructor(provider: OpenAIProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || "", { model: "gpt-4-mini" }), responseQualityPrompt: string, conversationQualityPrompt: string) {
    this.provider = provider;
    this.responseQualityPrompt = responseQualityPrompt;
    this.conversationQualityPrompt = conversationQualityPrompt;
  }

  /**
   * Evaluates whether a model's response meets test expectations
   * @param testDescription - Description of what the test should verify
   * @param modelResponse - The response to evaluate
   * @returns TestResult object containing evaluation details
   */
  async evaluateResponseQuality(testDescription: string, modelResponse: string): Promise<TestResult> {
    // Fill the prompt template with test details
    const filledPrompt = this.responseQualityPrompt
      .replace('{{testDescription}}', testDescription)
      .replace('{{modelResponse}}', modelResponse);

    // Get evaluation from the model
    const messages: ChatMessage[] = [
      { role: 'user', content: filledPrompt }
    ];

    const evaluation = await this.provider.getResponse(filledPrompt, messages);

    try {
      // Parse the JSON response
      const result: TestResult = JSON.parse(evaluation);
      
      // Validate the result has all required fields
      if (!this.isValidTestResult(result)) {
        throw new Error('Invalid test result format');
      }

      return result;
    } catch (error) {
      console.error('Failed to parse testing agent response:', error);
      return {
        passed: false,
        reasoning: 'Failed to parse testing agent response',
        evidence: `Raw response: ${evaluation}`
      };
    }
  }

  async evaluateConversationQuality(testDescription: string, conversation: ChatMessage[]): Promise<TestResult> {
    // Fill the prompt template with test details
    const filledPrompt = this.conversationQualityPrompt
      .replace('{{testDescription}}', testDescription)
      .replace('{{conversation}}', conversation.map(message => 
        `${message.role}: ${message.content}`).join('\n'));

    // Get evaluation from the model
    const messages: ChatMessage[] = [
      { role: 'user', content: filledPrompt }
    ];

    const evaluation = await this.provider.getResponse(filledPrompt, messages);

    try {
      // Parse the JSON response
      const result: TestResult = await parseJSONSafe(evaluation);
      
      // Validate the result has all required fields
      if (!this.isValidTestResult(result)) {
        throw new Error('Invalid test result format');
      }

      return result;
    } catch (error) {
      console.error('Failed to parse testing agent response:', error);
      return {
        passed: false,
        reasoning: 'Failed to parse testing agent response',
        evidence: `Raw response: ${evaluation}`
      };
    }
  }

  /**
   * Type guard to ensure the test result has all required fields
   */
  private isValidTestResult(result: any): result is TestResult {
    return (
      typeof result === 'object' &&
      typeof result.passed === 'boolean' &&
      typeof result.reasoning === 'string' &&
      typeof result.evidence === 'string'
    );
  }
}
