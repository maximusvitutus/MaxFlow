export interface PromptTemplate {
  id: string;
  version: string;
  template: string;
  description: string;
  requiredVariables: string[];
  optionalVariables: string[];
}