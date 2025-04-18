import { LLMProvider, ChatMessage } from '../../tools/providers/abstractProvider';
import { SystemOperatorEvaluator } from '../agentEvaluators/operatorEvaluator';
import { SystemOperator } from '../operators/abstractOperator';
import { AgentResponseParserFactory } from '../parsing/parserFactory';
import { ConversationAgentResponse } from '../parsing/responseSchemas';
import { AbstractAgent, AgentType } from './abstractAgents';
import { ToolCall } from '../../types/toolCall';

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
   * Entry point for processing user messages.
   * Adds message to history and triggers response generation.
   * 
   * @param userMessage - The message from the user
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to the AI's response
   */
  async processMessage(userMessage: string, evaluator?: SystemOperatorEvaluator): Promise<string> {
    // Add the user message to history
    this.history.push({ role: 'user', content: userMessage });
    
    // Generate response (uses evaluation and may improve response with multiple calls)
    const response = await this.respondTo(userMessage, evaluator);

    // Parse the final response
    const parser = AgentResponseParserFactory.createParser(AgentType.CONVERSATION);
    const parsedResponse: ConversationAgentResponse = parser.parse(response);
    
    // Handle any tool calls in the response
    if (parsedResponse.toolCalls && parsedResponse.toolCalls.length > 0) {
      console.log("(ConversationAgent) Registered tool calls:", parsedResponse.toolCalls);
      for (const toolCall of parsedResponse.toolCalls) {
        await this.handleToolCall(toolCall);
      }
    }
    
    // Add the assistant's response to the history
    this.history.push({ role: 'assistant', content: response });
    
    return response;
  }

  /**
   * Generates AI response to user message and handles any necessary operations
   * 
   * @param userMessage - The message from the user
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to the processed response
   */
  public async respondTo(userMessage: string, evaluator?: SystemOperatorEvaluator): Promise<string> {
    // Get the initial response
    let response = await this.provider.getResponse(userMessage, this.history);

    // Improve with feedback if evaluation too low
    if (evaluator) {
      response = await this.evaluateAndImprove(response, evaluator, userMessage);
    }

    return response;
  }

  /**
   * Handles tool calls parsed from the LLM response.
   * 
   * @param toolCall - The tool call object from the parsed response
   */
  private async handleToolCall(toolCall: ToolCall): Promise<void> {
    const { name, args } = toolCall.function;

    // Validate tool call arguments
    if (!args || typeof args !== 'object') {
      console.error(`Invalid arguments for tool call: ${name}`);
      return;
    }

    // Choose the correct tool call based on the name
    switch (name) {
      case 'getWritingStructure':
        if (typeof args.requestWithContext !== 'string') {
          console.error(`Invalid argument 'requestWithContext' for tool call: ${name}`);
          return;
        }
        await this.operator.getWritingStructure(args.requestWithContext);
        break;
      case 'getKnowledgeTree':
        if (typeof args.request !== 'string') {
          console.error(`Invalid argument 'request' for tool call: ${name}`);
          return;
        }
        await this.operator.getKnowledgeTree(args.request);
        break;
      default:
        console.error(`Unknown tool call: ${name}`);
    }
  }

  getHistory(): ChatMessage[] {
    return this.history;
  }
}