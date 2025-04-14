import path from 'path';

export const PROMPT_PATHS = {
    CONVERSATION_AGENT: path.join(__dirname, '../tools/prompts/chat/conversationAgent.txt'),
    OPERATOR_EVALUATOR: path.join(__dirname, '../tools/prompts/evaluation/taskAgnosticEvaluation.txt'),
} as const;

// Helper function to load prompts
export function loadPrompt(promptPath: string): string {
    const fs = require('fs');
    try {
        return fs.readFileSync(promptPath, 'utf8');
    } catch (error) {
        throw new Error(`Failed to load prompt from ${promptPath}: ${error}`);
    }
} 