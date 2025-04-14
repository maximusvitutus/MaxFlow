import { OpenAIProvider } from "../../src/core/tools/providers/openAIProvider";
import { loadPrompt } from "../../src/config/promptConfig";
import { ConversationAgent } from "../../src/core/llm/agents/conversationAgent";
import { MockOperator } from "../../src/core/llm/operators/mockOperator";
import { TestingAgent } from "../testingAgent";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, '../../.env') });

const testMessages = [
    "hello", 
    "i would like to write about symbolic pillows", 
    "i am interested in symbolic pillows that relate to quantum immortality"
];

/**
 * Timeout for each test in milliseconds
 */
const timeout = 30000; 

// Use gpt-4o-mini for the providers because it's fast and cheap. Good enough for testing prompts. 
const mainAgent = new OpenAIProvider(process.env.OPENAI_API_KEY || "", { model: "gpt-4o-mini" });
const testingLLM = new OpenAIProvider(process.env.OPENAI_API_KEY || "", { model: "gpt-4o-mini" });

describe('Qualitative: Quantum Immortality Test', () => {
    let modelResponse: string;

    // Add a longer timeout since we're making API calls
    jest.setTimeout(timeout); 

    // Get the model response for the test messages
    beforeAll(async () => {
        modelResponse = await getModelResponse(testMessages);
    });

    it('should be inquisitive about the quantum immortality concept', async () => {
        await runTestCase(
            'response should ask for clarification or explanation about what the user means by quantum immortality',
            modelResponse
        );
    }, timeout);

    it('should inquire about connecting two new and unrelated concepts', async () => {
        await runTestCase(
            'response should ask how the user plans to connect symbolic pillows with quantum immortality',
            modelResponse
        );
    }, timeout);
});

async function getModelResponse(messages: string[]): Promise<string> {
    // Load prompts
    const conversationPrompt = loadPrompt('./src/core/llm/prompts/chat/conversationAgent.yaml');
    
    // Create agent
    const conversationAgent = new ConversationAgent(mainAgent, conversationPrompt, new MockOperator());
    
    // Get final response from message chain
    let modelResponse = "";
    for (const message of messages) {
        modelResponse = await conversationAgent.respondTo(message);
    }
    return modelResponse;
}

async function runTestCase(description: string, modelResponse: string): Promise<void> {
    // Load testing prompt
    const responseQualityPrompt = loadPrompt('./tests/prompts/responseQualityTest.yaml');
    const conversationQualityPrompt = loadPrompt('./tests/prompts/conversationQualityTest.yaml');
    const testingAgent = new TestingAgent(testingLLM, responseQualityPrompt, conversationQualityPrompt);
    
    // Get testing agent's evaluation
    const result = await testingAgent.evaluateResponseQuality(description, modelResponse);

    // Assert based on testing agent's evaluation
    expect(result.passed).toBe(true);
    if (!result.passed) {
        console.log(`Test failed. Reasoning: ${result.reasoning}`);
        console.log(`Evidence: ${result.evidence}`);
    }
}

// Create test where, the user sends these 3 messages, the response from the model should: 
// - be inquitisive about what the user means by quantum immortality
// - ask whether they already have an idea about how to connect these two concepts, namely symbolic pillows and quantum immortality