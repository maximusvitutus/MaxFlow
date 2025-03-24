import { ChatMessage } from '../types/LLMProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { SystemOperatorEvaluator } from '../evaluators/OperatorEvaluator';
import { EvaluationResult } from '../evaluators/AbstractEvaluator';

/**
 * Manages system-level chat interactions with the AI model
 */
export class SystemOperator {
  private provider: OpenAIProvider;
  private history: ChatMessage[] = [];
  private systemPrompt: string;
  private ACCEPTABLE_SCORE = 90; // Minimum acceptable evaluation score
  private MAX_ATTEMPTS = 3;

  /**
   * Creates a new SystemOperator instance
   * @param {OpenAIProvider} provider - The OpenAI provider instance
   * @param {string} systemPrompt - The initial system prompt to set context
   */
  constructor(provider: OpenAIProvider, systemPrompt: string) {
    this.provider = provider;
    this.systemPrompt = systemPrompt;
    this.history.push({ role: 'system', content: this.systemPrompt });
  }

  /**
   * Sends a user message and gets AI response while maintaining conversation history
   * Incorporates evaluation feedback for responses that don't meet quality threshold
   * @param {string} userMessage - The message from the user
   * @param {SystemOperatorEvaluator} evaluator - The evaluator instance
   * @returns {Promise<string>} The AI's response
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
        Please provide a new response to the user's message: ${userMessage} addressing this feedback: ${evaluation.feedback}`;

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
   * Retrieves the full conversation history
   * @returns {ChatMessage[]} Array of conversation messages
   */
  getConversationHistory(): ChatMessage[] {
    return this.history;
  }
}