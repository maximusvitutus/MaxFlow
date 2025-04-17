import { AgentType } from "../../agents/abstractAgents";
import { ConversationAgentParser } from "./parsers/conversationParser";
import { AgentResponseParser } from "./parsers/abstractParser";
import { WritingAgentParser } from "./parsers/writingAgentParser";

/**
 * Factory class for creating agent response parsers.
 * Provides a centralized way to create the appropriate parser based on agent type.
 */
export class AgentResponseParserFactory {
  /**
   * Creates and returns a parser instance appropriate for the given agent type.
   * 
   * @param agentType - The type of agent for which to create a parser
   * @returns An agent response parser instance
   * @throws Error if the agent type is not supported
   */
  static createParser(agentType: AgentType): AgentResponseParser<any> {
    switch (agentType) {
      case AgentType.CONVERSATION:
        return new ConversationAgentParser();
      case AgentType.WRITING:
        return new WritingAgentParser();
      default:
        throw new Error(`No parser available for agent type: ${agentType}`);
    }
  }
}