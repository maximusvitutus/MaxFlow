import { ChatMessage, LLMProvider } from '../../tools/providers/abstractProvider';
import { SystemOperator } from '../operators/abstractOperator';
import { SystemOperatorEvaluator } from '../agentEvaluators/operatorEvaluator';
import { EvaluationResult } from '../agentEvaluators/abstractEvaluator';
import { AgentTaskType } from './taskTypes';
import fs from 'fs/promises';
import yaml from 'js-yaml';

/**
 * Abstract base class for all AI agents in the system
 */
export abstract class AbstractAgent {
  /** The LLM provider used for generating responses */
  protected provider: LLMProvider;
  /** Full conversation history */
  protected history: ChatMessage[] = [];
  /** System prompt that guides the agent's behavior */
  protected systemPrompt: string = '';
  /** Minimum score considered acceptable in evaluations */
  protected readonly ACCEPTABLE_SCORE = 90;
  /** Maximum number of response improvement attempts */
  protected readonly MAX_ATTEMPTS = 3;
  /** System operator for handling specialized tasks */
  protected operator: SystemOperator;

  /**
   * Creates a new AbstractAgent instance
   * 
   * @param provider - The LLM provider instance
   * @param operator - The system operator for handling specialized tasks
   */
  constructor(provider: LLMProvider, operator: SystemOperator) {
    this.provider = provider;
    this.operator = operator;
  }

  /**
   * Get the template path for this agent type
   * This method should be implemented by each agent subclass
   */
  protected abstract getTemplatePath(): string;

  /**
   * Initializes the agent by loading its template and setting up history
   */
  protected async initialize(): Promise<void> {
    // Load the system prompt from template
    this.systemPrompt = await this.loadTemplate(this.getTemplatePath());
    
    // Initialize history with system prompt
    this.history = [{ role: 'system', content: this.systemPrompt }];
  }

  /**
   * Loads a template from a file
   * 
   * @param templatePath - Path to the template file
   * @returns The loaded template as a string
   */
  protected async loadTemplate(templatePath: string): Promise<string> {
    try {
      const fileContents = await fs.readFile(templatePath, 'utf8');
      const yamlContent = yaml.load(fileContents) as { template: string };
      return yamlContent.template;
    } catch (error) {
      const err = error as Error;
      console.error(`Failed to load template from ${templatePath}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Evaluates response quality and attempts to improve it if needed
   * 
   * @param initialResponse - The initial response to evaluate
   * @param evaluator - The evaluator to use
   * @param userInput - The original user input (for context in improvement)
   * @returns A promise resolving to the best response
   */
  protected async evaluateAndImprove(
    initialResponse: string, 
    evaluator: SystemOperatorEvaluator, 
    userInput: string
  ): Promise<string> {
    const evaluationHistory: EvaluationResult[] = [];
    const responseHistory: string[] = [];
    
    let response = initialResponse;
    let attempts = 0;
    responseHistory.push(response);

    while (attempts < this.MAX_ATTEMPTS) {
      const evaluation = await evaluator.evaluate(response, this.history);
      evaluationHistory.push(evaluation);
      
      if (evaluation.score >= this.ACCEPTABLE_SCORE) {
        break;
      }

      // Log the response and the evaluation
      console.log('Low-quality response:', response);
      console.log('Evaluation:', evaluation);

      // Add evaluation feedback to prompt for improvement
      const improvementPrompt = `Your previous response did not meet quality standards required by the system you are operating in. 
      Please provide a new response to the user's input: ${userInput} addressing this feedback: ${evaluation.feedback}. `;

      // Get the new response
      response = await this.provider.getResponse(improvementPrompt, this.history);
      responseHistory.push(response);
      attempts++;
    }
    
    // Pick the best response from the response history
    if (evaluationHistory.length > 0) {
      const bestEvaluation = evaluationHistory.reduce((best, current) => {
        return (current.score > best.score) ? current : best;
      }, evaluationHistory[0]);
      
      response = responseHistory[evaluationHistory.indexOf(bestEvaluation)];
    }
    
    return response;
  }

  /**
   * Retrieves the full conversation history
   * 
   * @returns Array of conversation messages
   */
  getConversationHistory(): ChatMessage[] {
    return this.history;
  }

  /**
   * Returns the current system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }
}

/**
 * Abstract class for agents that are directly controlled by the operator
 * rather than by direct user input
 */
export abstract class OperatorControlledAgent extends AbstractAgent {
  /**
   * Processes a task given by the system operator
   * 
   * @param instructions - The instructions for the task to process
   * @param taskType - The type of task to perform
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to the agent's output
   */
  abstract processOperatorTask(
    instructions: string, 
    taskType: AgentTaskType, 
    evaluator?: SystemOperatorEvaluator
  ): Promise<any>;
}

/**
 * Types of agents available in the system
 */
export enum AgentType {
  CONVERSATION = 'conversation',
  WRITING = 'writing',
}
