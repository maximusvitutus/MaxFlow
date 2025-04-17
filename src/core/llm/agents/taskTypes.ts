// Define all possible agent task types
export type AgentTaskType = WritingAgentTask | ConversationAgentTask;

// Specific task types for the writing agent
export type WritingAgentTask = 'creation' | 'iteration';

// Specific task types for the conversation agent
export type ConversationAgentTask = 'informationGathering';
