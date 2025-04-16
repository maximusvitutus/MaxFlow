import { Evaluator, EvaluationResult } from './abstractEvaluator';
import { LLMProvider, ChatMessage } from '../../tools/providers/abstractProvider';
import { parseJSONSafe } from '../../tools/utils/jsonParser';

/**
 * Evaluator specifically for system operator responses
 */
export class SystemOperatorEvaluator extends Evaluator {
    /**
     * Creates a new SystemOperatorEvaluator instance
     * 
     * @param llmProvider - The LLM provider to use for evaluation
     * @param ownSystemPrompt - The system prompt for the evaluator itself
     * @param analyzableSystemPrompt - The system prompt of the operator being evaluated
     */
    constructor(llmProvider: LLMProvider, ownSystemPrompt: string, analyzableSystemPrompt: string) {
        super(llmProvider, ownSystemPrompt, analyzableSystemPrompt);
    }

    /**
     * Evaluates whether a system operator's response adheres to its system prompt
     * 
     * @param message - The operator's response to evaluate
     * @param history - The conversation history
     * @returns A promise resolving to an evaluation result with score, explanation, and feedback
     */
    public async evaluate(message: string, history: ChatMessage[]): Promise<EvaluationResult> {
        const evaluationPrompt = this.createEvaluationPrompt(message, history);
        const evaluation = await this.llmProvider.getResponse(evaluationPrompt, history);
        
        try {
            const result = await parseJSONSafe(evaluation);
            return {
                score: result.score,
                explanation: result.explanation,
                feedback: result.feedback
            };
        } catch (error) {
            throw new Error('Failed to parse evaluation result: ' + error);
        }
    }

    /**
     * Creates the evaluation prompt by substituting values into the prompt template
     * 
     * @param message - The message to evaluate
     * @param history - The conversation history providing context
     * @returns The formatted evaluation prompt string
     */
    protected createEvaluationPrompt(message: string, history: ChatMessage[]): string {
        // Get the prompt template
        const promptTemplate = this.ownSystemPrompt;

        // Replace the placeholders with actual values
        const prompt = promptTemplate
            .replace('${ORIGINAL_SYSTEM_PROMPT}', this.promptToAnalyze)
            .replace('${CONVERSATION_HISTORY}', history.map(msg => `${msg.role}: ${msg.content}`).join('\n'))
            .replace('${CURRENT_MESSAGE}', message);

        return prompt;
    }
}
