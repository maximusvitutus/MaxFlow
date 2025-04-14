export type Role = 'system' | 'user' | 'assistant';

export type ChatMessage = {
    role: Role;
    content: string;
}

export abstract class LLMProvider {
    protected apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    abstract getResponse(message: string, history: ChatMessage[]): Promise<string>;
}

export type LLMConfig = {
    model?: string;
    temperature?: number;
    maxTokens?: number;
} 