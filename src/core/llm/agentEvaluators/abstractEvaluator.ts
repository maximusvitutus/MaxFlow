import { LLMProvider, ChatMessage } from '../../tools/providers/abstractProvider';

/**
 * Abstract base class for evaluators that assess response quality
 * and provide feedback for improvement.
 * 
 * @abstract
 * @class
 * @constructor
 * @param {LLMProvider} llmProvider - The LLM provider to use for evaluation
 * @param {string} ownSystemPrompt - The system prompt for the evaluator itself
 * @param {string} analyzableSystemPrompt - The system prompt of the agent being evaluated
 */
export abstract class Evaluator {
    /** LLM provider used for evaluation */
    protected llmProvider: LLMProvider;
    /** System prompt used by the evaluator itself */
    protected ownSystemPrompt: string;
    /** System prompt of the agent being evaluated */
    protected promptToAnalyze: string;

    /**
     * Creates a new Evaluator instance
     * 
     * @param {LLMProvider} llmProvider - The LLM provider to use for evaluation
     * @param {string} ownSystemPrompt - The system prompt for the evaluator itself
     * @param {string} analyzableSystemPrompt - The system prompt of the agent being evaluated
     */
    constructor(llmProvider: LLMProvider, ownSystemPrompt: string, analyzableSystemPrompt: string) {
        this.llmProvider = llmProvider;
        this.ownSystemPrompt = ownSystemPrompt;
        this.promptToAnalyze = analyzableSystemPrompt;
    }

    /**
     * Evaluates content according to specific criteria
     * 
     * @param message - The message to evaluate
     * @param history - The conversation history providing context
     * @returns A promise resolving to an evaluation result
     */
    abstract evaluate(message: string, history: ChatMessage[]): Promise<EvaluationResult>;

    /**
     * Creates the evaluation prompt for the LLM
     * 
     * @param message - The message to evaluate 
     * @param history - The conversation history providing context
     * @returns The formatted evaluation prompt
     */
    protected abstract createEvaluationPrompt(message: string, history: ChatMessage[]): string;
}

/**
 * Results from an evaluation containing score and feedback
 */
export interface EvaluationResult {
    /** Numerical score representing quality (typically 0-100) */
    score: number;
    /** Detailed explanation of the evaluation */
    explanation: string;
    /** Actionable feedback for improvement */
    feedback: string;
}
