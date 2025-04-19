import { LLMProvider } from '../../src/core/tools/providers/abstractProvider';
import { ChatMessage } from '../../src/core/tools/providers/abstractProvider';

export class MockProvider extends LLMProvider {
  private errorMode = false;
  private errorMessage = "Mock error";
  private delayMs = 0;
  private responseMap: Map<string, string> = new Map();
  private defaultResponse = "Default response";

  setErrorMode(enabled: boolean, message: string = "Mock error") {
    this.errorMode = enabled;
    this.errorMessage = message;
  }
  
  async getResponse(prompt: string, messages: ChatMessage[]): Promise<string> {
    if (this.errorMode) {
      throw new Error(this.errorMessage);
    }
    
    // Simulate network delay
    if (this.delayMs) {
      await new Promise(r => setTimeout(r, this.delayMs));
    }
    
    // Check if we have a specific response for this input
    if (this.responseMap && this.responseMap.has(prompt)) {
      return this.responseMap.get(prompt)!;
    }
    
    // Otherwise return the default
    return this.defaultResponse;
  }
}