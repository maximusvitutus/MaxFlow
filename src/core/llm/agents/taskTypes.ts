// Define all possible agent task types
export type AgentTaskType = WritingAgentTask | ConversationAgentTask;

// Specific task types for the writing agent
export enum WritingAgentTask {
  CREATION = 'creation',
  ITERATION = 'iteration'
}

// Specific task types for the conversation agent
export enum ConversationAgentTask {
  INFORMATION_GATHERING = 'informationGathering'
}
