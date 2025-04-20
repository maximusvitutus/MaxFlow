import path from 'path';

/**
 * Configuration object containing paths to template files for different agents
 */
export const TEMPLATE_PATHS = {
  CONVERSATION_AGENT: path.resolve('./src/core/llm/prompts/chatAgent/conversationAgent_v0.yaml'),
  WRITING_AGENT: path.resolve('./src/core/llm/prompts/writingAgent/writingAgent.yaml'),
  WRITING_AGENT_TASKS: {
    CREATION: path.resolve('./src/core/llm/prompts/writingAgent/writingCreation.yaml'),
    ITERATION: path.resolve('./src/core/llm/prompts/writingAgent/writingIteration.yaml')
  },
  EVALUATOR: path.resolve('./src/core/llm/prompts/evaluationAgents/taskAgnosticEvaluation.yaml')
}; 