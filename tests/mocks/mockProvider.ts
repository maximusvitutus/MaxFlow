import { LLMProvider, ChatMessage } from '../../src/core/tools/providers/abstractProvider';

interface MockProviderOptions {
  defaultResponse?: string;
  responseMap?: Map<string, string>; // Maps specific inputs to custom responses
  delayMs?: number; // Simulate response delay
}

export class MockProvider extends LLMProvider {
  private options: MockProviderOptions;
  private errorMode: boolean = false;
  private errorMessage: string = "";
  
  constructor(apiKey: string) {
    super(apiKey);
  }
  
  setErrorMode(enabled: boolean, message: string = "Mock error") {
    this.errorMode = enabled;
    this.errorMessage = message;
  }
  
  async getResponse(prompt: string, messages: ChatMessage[]): Promise<string> {
    if (this.errorMode) {
      throw new Error(this.errorMessage);
    }
    
    // Simulate network delay
    if (this.options.delayMs) {
      await new Promise(r => setTimeout(r, this.options.delayMs));
    }
    
    // Check if we have a specific response for this input
    if (this.options.responseMap && this.options.responseMap.has(prompt)) {
      return this.options.responseMap.get(prompt)!;
    }
    
    // Otherwise return the default
    return this.options.defaultResponse!;
  }
}