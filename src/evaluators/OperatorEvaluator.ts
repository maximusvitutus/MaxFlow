import { Evaluator, EvaluationResult } from './AbstractEvaluator';
import { LLMProvider, ChatMessage } from '../types/LLMProvider';

export class SystemOperatorEvaluator extends Evaluator {
    constructor(llmProvider: LLMProvider, ownSystemPrompt: string, analyzableSystemPrompt: string) {
        super(llmProvider, ownSystemPrompt, analyzableSystemPrompt);
    }

    /**
     * Evaluates whether a system operator's response adheres to its system prompt
     * @param message The operator's response to evaluate
     * @param history The conversation history
     * @returns An evaluation result with score, explanation, and feedback
     */
    public async evaluate(message: string, history: ChatMessage[]): Promise<EvaluationResult> {
        const evaluationPrompt = this.createEvaluationPrompt(message, history);
        const evaluation = await this.llmProvider.getResponse(evaluationPrompt, history);
        
        try {
            const result = JSON.parse(evaluation);
            return {
                score: result.score,
                explanation: result.explanation,
                feedback: result.feedback
            };
        } catch (error) {
            throw new Error('Failed to parse evaluation result: ' + error);
        }
    }

    protected createEvaluationPrompt(message: string, history: ChatMessage[]): string {
        // Get the prompt template
        const promptTemplate = this.ownSystemPrompt;

        // Replace the placeholders with actual values
        const prompt = promptTemplate
            .replace('${ORIGINAL_SYSTEM_PROMPT}', this.analyzableSystemPrompt)
            .replace('${CONVERSATION_HISTORY}', history.map(msg => `${msg.role}: ${msg.content}`).join('\n'))
            .replace('${CURRENT_MESSAGE}', message);

        return prompt;
    }
}
