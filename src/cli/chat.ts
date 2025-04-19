import readline from 'readline';
import dotenv from 'dotenv';
import { OpenAIProvider } from '../core/tools/providers/openAIProvider';
import { ConversationAgent } from '../core/llm/agents/conversationAgent';
import { SystemOperatorEvaluator } from '../core/llm/agentEvaluators/operatorEvaluator';
import { saveChat } from '../core/tools/utils/chatHistorySaver';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import { Max } from '../core/llm/operators/Max';

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
    // Initialize provider and operator
    const provider = new OpenAIProvider(apiKey, { model: 'gpt-4o' });
    const mockOperator = new Max(provider);
    const chatAgent = new ConversationAgent(provider, mockOperator);
    
    // Load the evaluator template separately since it's not an agent
    const evaluatorSystemPrompt = await fs.readFile(
        './src/core/llm/prompts/evaluation/taskAgnosticEvaluation.yaml', 
        'utf8'
    );
    const yamlContent = yaml.load(evaluatorSystemPrompt) as { template: string };
    const evaluator = new SystemOperatorEvaluator(provider, yamlContent.template, chatAgent.getSystemPrompt());

    // Initialize message history by getting it from the agent
    const history = chatAgent.getHistory();

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