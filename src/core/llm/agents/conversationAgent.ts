import { ChatMessage, LLMProvider } from '../../tools/providers/abstractProvider';
import { SystemOperatorEvaluator } from '../agentEvaluators/operatorEvaluator';
import { EvaluationResult } from '../agentEvaluators/abstractEvaluator';
import { SystemOperator } from '../operators/abstractOperator';
/**
 * Manages system-level chat interactions with the AI model
 */
export class ConversationAgent {
  /** The LLM provider used for generating responses */
  private provider: LLMProvider;
  /** Full conversation history */
  private history: ChatMessage[] = [];
  /** System prompt that guides the agent's behavior */
  private systemPrompt: string;
  /** Minimum score considered acceptable in evaluations */
  private ACCEPTABLE_SCORE = 90;
  /** Maximum number of response improvement attempts */
  private MAX_ATTEMPTS = 3;
  /** System operator for handling the writing process */
  private operator: SystemOperator;

  /**
   * Creates a new ConversationAgent instance
   * 
   * @param provider - The LLM provider instance
   * @param systemPrompt - The initial system prompt to set context
   * @param operator - The system operator for handling specialized tasks
   */
  constructor(provider: LLMProvider, systemPrompt: string, operator: SystemOperator) {
    this.provider = provider;
    this.systemPrompt = systemPrompt;
    this.history.push({ role: 'system', content: this.systemPrompt });
    this.operator = operator;
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

    // Feedback and response history
    const evaluationHistory: EvaluationResult[] = [];
    const responseHistory: string[] = [];
    
    // Get the initial response
    let response = await this.provider.getResponse(userMessage, this.history);
    let attempts = 0;
    responseHistory.push(response);

    // If evaluator is provided, check response quality and retry if needed
    if (evaluator) {
      while (attempts < this.MAX_ATTEMPTS) {
        const evaluation = await evaluator.evaluate(response, this.history);
        evaluationHistory.push(evaluation);  // Store every evaluation
        
        if (evaluation.score >= this.ACCEPTABLE_SCORE) {
          break;
        }

        // Log the response and the evaluation
        console.log('Low-quality response:', response);
        console.log('Evaluation:', evaluation);

        // Add evaluation feedback to prompt for improvement
        const improvementPrompt = `Your previous response did not meet quality standards required by the system you are operating in. 
        Please provide a new response to the user's message: ${userMessage} addressing this feedback: ${evaluation.feedback}. `;

        // Get the new response
        response = await this.provider.getResponse(improvementPrompt, this.history);
        responseHistory.push(response);
        attempts++;
      }
      // Pick the best response from the response history
      const bestEvaluation = evaluationHistory.reduce((best, current) => {
        return (current.score > best.score) ? current : best;
      }, evaluationHistory[0]);
      
      response = responseHistory[evaluationHistory.indexOf(bestEvaluation)];
    }

    this.history.push({ role: 'assistant', content: response });
    return response;
  }

  /**
   * Move forward with proposed plan by sending the context to the operator
   * 
   * @param context - The context to send to the operator
   * @returns A promise that resolves when the operator has processed the request
   */
  async callOperator(context: string): Promise<void> {
    await this.operator.routeRequest(context);
  } 

  /**
   * Retrieves the full conversation history
   * 
   * @returns Array of conversation messages
   */
  getConversationHistory(): ChatMessage[] {
    return this.history;
  }
}