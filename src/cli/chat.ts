import readline from 'readline';
import dotenv from 'dotenv';
import { OpenAIProvider } from '../core/tools/providers/openAIProvider';
import { ConversationAgent } from '../core/llm/agents/conversationAgent';
import { SystemOperatorEvaluator } from '../core/llm/agentEvaluators/operatorEvaluator';
import { ChatMessage } from '../core/tools/providers/abstractProvider';
import { saveChat } from '../core/tools/utils/chatHistorySaver';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import { Max } from '../core/llm/operators/Max';

// Define prompt paths directly in the file
const PROMPT_PATHS = {
    CONVERSATION_AGENT: './src/core/llm/prompts/chat/conversationAgent.yaml',
    OPERATOR_EVALUATOR: './src/core/llm/prompts/evaluation/taskAgnosticEvaluation.yaml'
};

// Function to load a prompt from a file
async function loadPrompt(filePath: string): Promise<string> {
    try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const yamlContent = yaml.load(fileContents) as { template: string };
        return yamlContent.template;
    } catch (error) {
        const err = error as Error; // Type assertion
        console.error(`Failed to load prompt from ${filePath}: ${err.message}`);
        throw err;
    }
}

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY || '';
if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startChat() {
    // Load prompt templates
    const chatSystemPrompt = await loadPrompt(PROMPT_PATHS.CONVERSATION_AGENT);
    console.log(chatSystemPrompt);
    const evaluatorSystemPrompt = await loadPrompt(PROMPT_PATHS.OPERATOR_EVALUATOR);

    // Initialize provider and operator
    const provider = new OpenAIProvider(apiKey, { model: 'gpt-4o' });
    const mockOperator = new Max(provider);
    const chatAgent = new ConversationAgent(provider, chatSystemPrompt, mockOperator);
    const evaluator = new SystemOperatorEvaluator(provider, evaluatorSystemPrompt, chatSystemPrompt);

    // Initialize message history
    const history: ChatMessage[] = [{ role: 'system', content: chatSystemPrompt }];

    // Print initial prompt
    console.log('\nChat started! Type "exit" to end the conversation.\n\n');

    // Start chat loop
    while (true) {
        const userInput = await new Promise<string>((resolve) => {
            rl.question('You: ', resolve);
        });

        if (userInput.toLowerCase() === 'exit') {
            break;
        }

        try {
            const response = await chatAgent.processMessage(userInput, evaluator);
            history.push({ role: 'user', content: userInput });
            history.push({ role: 'assistant', content: response });
            console.log('\nAI:', response, '\n\n');
        } catch (error) {
            console.error('Error:', error);
            break;
        }
    }
    // After the chat, save the conversation
    console.log('Saving chat history...');
    try {
        if (saveChat(history)) {
            console.log('Chat history saved.');
        } else {
            console.error('Error saving chat history.');
        }
    } catch (error) {
        console.error('Error saving chat history:', error);
    }

    rl.close();
}

// Start the chat
startChat().catch(console.error); 