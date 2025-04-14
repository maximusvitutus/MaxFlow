import { LLMProvider, ChatMessage } from '../../tools/providers/abstractProvider';

export abstract class Evaluator {
    protected llmProvider: LLMProvider;
    protected ownSystemPrompt: string;
    protected analyzableSystemPrompt: string;

    constructor(llmProvider: LLMProvider, ownSystemPrompt: string, analyzableSystemPrompt: string) {
        this.llmProvider = llmProvider;
        this.ownSystemPrompt = ownSystemPrompt;
        this.analyzableSystemPrompt = analyzableSystemPrompt;
    }

    /**
     * Evaluates content according to specific criteria
     * 
     * @param message 
     * @param history 
     * @returns 
     */
    abstract evaluate(message: string, history: ChatMessage[]): Promise<EvaluationResult>;

    /**
     * Creates the evaluation prompt for the LLM
     * @param message 
     * @param history 
     * @returns 
     */
    protected abstract createEvaluationPrompt(message: string, history: ChatMessage[]): string;
}

export interface EvaluationResult {
    score: number;
    explanation: string;
    feedback: string;
}
