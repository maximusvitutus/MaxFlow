import path from 'path';

/**
 * Configuration object containing paths to template files for different agents
 */
export const TEMPLATE_PATHS = {
  CONVERSATION_AGENT: path.resolve('./src/core/llm/prompts/chat/conversationAgent.yaml'),
  WRITING_AGENT: path.resolve('./src/core/llm/prompts/writing/writingAgent.yaml'),
  WRITING_AGENT_TASKS: {
    CREATION: path.resolve('./src/core/llm/prompts/writing/writingCreation.yaml'),
    ITERATION: path.resolve('./src/core/llm/prompts/writing/writingIteration.yaml')
  },
  EVALUATOR: path.resolve('./src/core/llm/prompts/evaluation/taskAgnosticEvaluation.yaml')
}; 