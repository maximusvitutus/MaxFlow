import OpenAI from 'openai';
import { ChatMessage, LLMProvider, LLMConfig } from './abstractProvider';

/**
 * Provider for OpenAI's API integration
 * @extends {LLMProvider}
 */
export class OpenAIProvider extends LLMProvider {
    private client: OpenAI;
    private config: LLMConfig;

    /**
     * Creates an instance of OpenAIProvider
     * @param {string} apiKey - OpenAI API key
     * @param {LLMConfig} [config={}] - Configuration options
     */
    constructor(apiKey: string, config: LLMConfig = {}) {
        super(apiKey);
        this.client = new OpenAI({ apiKey });
        this.config = {
            model: config.model || 'gpt-4o-mini',
            temperature: config.temperature || 1,
            maxTokens: config.maxTokens || 3000
        };
    }

    /**
     * Sends a message to OpenAI and returns the response
     * @param {string} message - The message to send
     * @param {ChatMessage[]} history - The conversation history
     * @returns {Promise<string>} The model's response
     * @throws {Error} When the API call fails
     */
    async getResponse(message: string, history: ChatMessage[]): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [...history, { role: 'user', content: message }],
                model: this.config.model as string,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            });

            if (!completion.choices[0]?.message?.content) {
                throw new Error('No response content received from OpenAI');
            }

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error calling OpenAI:', error);
            throw error;
        }
    }
} 