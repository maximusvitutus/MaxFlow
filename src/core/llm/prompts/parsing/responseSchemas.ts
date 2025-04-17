import { ToolCall } from '../../../types/toolCall'
import { TextSection, WritingStructureDraft } from '../../../types/writing/writingStructure';

/**
 * Base response interface that all agent responses must implement.
 * Contains common fields that are required across all agent types.
 */
export interface BaseAgentResponse {
  /**
   * The agent's reasoning or thought process behind its response
   */
  reasoning: string;
}

/**
 * Response interface for agents that communicate directly with users.
 * Extends the base response with user-facing content.
 */
export interface ConversationAgentResponse extends BaseAgentResponse {
  /**
   * The text response to be shown to the user
   */
  answerToUser: string;
  
  /**
   * Optional tool calls that the agent wants to make
   */
  toolCalls?: ToolCall[];
}

/**
 * Response interface for operator agents that perform actions.
 * These agents focus on performing operations rather than user communication.
 */
export interface OperatorAgentResponse extends BaseAgentResponse {
  /**
   * Description of the action being performed
   */
  actionDescription: string;
  
  /**
   * Tool calls that the operator agent needs to make
   */
  toolCalls: ToolCall[];
}

/**
 * Response interface for the WritingAgent.
 * Focused on delivering writing structures and drafts.
 */
export interface WritingAgentResponse extends BaseAgentResponse {
  /**
   * Message to be shown to the operator
   */
  messageToOperator: string;
  
  /**
   * The deliverables produced by the agent, which can include
   * writing structure drafts and/or complete writing drafts
   */
  deliverables: {
    writingStructureDraft?: TextSection[];
  };
}

