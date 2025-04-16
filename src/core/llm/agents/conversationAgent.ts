import { ChatMessage, LLMProvider } from '../../tools/providers/abstractProvider';
import { SystemOperatorEvaluator } from '../agentEvaluators/operatorEvaluator';
import { SystemOperator } from '../operators/abstractOperator';
import { AbstractAgent } from './abstractAgents';

/**
 * Manages system-level chat interactions with the AI model
 * This agent is directly controlled by user input
 */
export class ConversationAgent extends AbstractAgent {
  /**
   * Creates a new ConversationAgent instance
   * 
   * @param provider - The LLM provider instance
   * @param systemPrompt - The initial system prompt to set context
   * @param operator - The system operator for handling specialized tasks
   */
  constructor(provider: LLMProvider, systemPrompt: string, operator: SystemOperator) {
    super(provider, systemPrompt, operator);
  }

  /**
   * Sends a user message and gets AI response while maintaining conversation history
   * Incorporates evaluation feedback for responses that don't meet quality threshold
   * 
   * @param userMessage - The message from the user
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to the AI's response
   */
  async respondTo(userMessage: string, evaluator?: SystemOperatorEvaluator): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    // Get the initial response
    let response = await this.provider.getResponse(userMessage, this.history);

    // If evaluator is provided, check response quality and retry if needed
    if (evaluator) {
      response = await this.evaluateAndImprove(response, evaluator, userMessage);
    }

    this.history.push({ role: 'assistant', content: response });
    return response;
  }

  /**
   * Sends the given context to the operator for processing
   * 
   * @param context - The context to send to the operator
   * @returns A promise that resolves when the operator has processed the request
   */
  async callOperator(context: string): Promise<void> {
    await this.operator.routeRequest(context);
  }
}