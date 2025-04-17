export interface PromptInterface {
  id: string;
  version: string;
  description: string;
  // Support either a single template or multiple named templates
  template?: string;
  templates?: Record<string, string>;
  requiredVariables: string[];
  optionalVariables: string[];
}