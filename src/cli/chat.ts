import readline from 'readline';
import dotenv from 'dotenv';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { SystemOperator } from '../systemOperators/SystemOperator';
import fs from 'fs';
import path from 'path';
import { SystemOperatorEvaluator } from '../evaluators/OperatorEvaluator';
import { ChatMessage } from '../types/LLMProvider';

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

// Get system prompt from prompts
const operatorSystemPrompt = fs.readFileSync(path.join(__dirname, '../prompt_templates/system_prompts/operator.txt'), 'utf8');
const evaluatorSystemPrompt = fs.readFileSync(path.join(__dirname, '../prompt_templates/system_prompts/operatorEvaluator.txt'), 'utf8');

async function startChat() {
    // Initialize provider and operator
    const provider = new OpenAIProvider(apiKey);
    const operator = new SystemOperator(provider, operatorSystemPrompt);
    const evaluator = new SystemOperatorEvaluator(provider, evaluatorSystemPrompt, operatorSystemPrompt);

    // Initialize message history
    const history: ChatMessage[] = [{ role: 'system', content: operatorSystemPrompt }];

    // Print initial prompt
    console.log('\nChat started! Type "exit" to end the conversation.\n');

    // Start chat loop
    while (true) {
        const userInput = await new Promise<string>((resolve) => {
            rl.question('You: ', resolve);
        });

        if (userInput.toLowerCase() === 'exit') {
            break;
        }

        try {
            const response = await operator.respondTo(userInput, evaluator);
            history.push({ role: 'user', content: userInput });
            history.push({ role: 'assistant', content: response });
            console.log('\nAI:', response, '\n');
        } catch (error) {
            console.error('Error:', error);
            break;
        }
    }

    rl.close();
}

// Start the chat
startChat().catch(console.error); 