import { LLMProvider } from '../../tools/providers/abstractProvider';
import { SystemOperator } from '../operators/abstractOperator';
import { SystemOperatorEvaluator } from '../agentEvaluators/operatorEvaluator';
import { WritingStructureDraft } from '../../types/writing/writingStructure';
import { OperatorControlledAgent, AgentType } from './abstractAgents';
import { AgentResponseParserFactory } from '../prompts/parsing/parserFactory';
import { WritingAgentResponse } from '../prompts/parsing/responseSchemas';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { WritingAgentTask } from './taskTypes';
import { PromptInterface } from '../prompts/interfaces';

// Function to load a prompt from a file
async function loadPromptWritingAgent(filePath: string): Promise<PromptInterface> {
  try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      const yamlContent = yaml.load(fileContents);
      return yamlContent as PromptInterface;
  } catch (error) {
      const err = error as Error; // Type assertion
      console.error(`Failed to load prompt from ${filePath}: ${err.message}`);
      throw err;
  }
}

/**
 * Agent responsible for creating and refining writing structures
 * This agent is controlled by the system operator rather than direct user input
 */
export class WritingAgent extends OperatorControlledAgent {
  /**
   * Creates a new WritingAgent instance
   * 
   * @param provider - The LLM provider instance
   * @param operator - The system operator for handling specialized tasks
   */
  constructor(provider: LLMProvider, mockPrompt: string, operator: SystemOperator) {
    super(provider, mockPrompt, operator);
  }

  /**
   * Processes a writing structure task from the operator
   * 
   * @param task - The task description or request for a writing structure
   * @param taskType - The type of task ('creation' or 'iteration')
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to the agent's output (typically a writing structure)
   */
  async processOperatorTask(
    request: string,
    taskType: WritingAgentTask, 
    evaluator?: SystemOperatorEvaluator
  ): Promise<WritingStructureDraft> {
    try {
      // Load the appropriate template based on task type
      const promptTemplate = await loadPromptWritingAgent('./src/core/llm/prompts/writing/writingAgent.yaml');
      const template = promptTemplate.templates?.[taskType];
      
      // Set the system prompt based on the template
      this.systemPrompt = template || ''; 
      this.history = [{ role: 'system', content: this.systemPrompt }];
    } catch (error) {
      console.error('Error loading writing agent prompt:', error);
      // Use a fallback prompt when YAML loading fails
      this.systemPrompt = `You are a writing structure expert. Create a well-organized outline for: ${taskType === WritingAgentTask.CREATION ? 'a new document' : 'improving an existing document'}.`;
      this.history = [{ role: 'system', content: this.systemPrompt }];
    }
    
    // Generate initial response
    let response = await this.provider.getResponse(request, this.history);
    
    // Improve with feedback if evaluation too low
    if (evaluator) {
      response = await this.evaluateAndImprove(response, evaluator, request);
    }
    
    // Add the interaction to history
    this.history.push({ role: 'user', content: request });
    this.history.push({ role: 'assistant', content: response });
    
    // Parse the response using the proper parser from the factory
    const parser = AgentResponseParserFactory.createParser(AgentType.WRITING);
    const parsedResponse = await parser.parse(response) as WritingAgentResponse;
    
    // Create a complete WritingStructureDraft with the sections
    return {
      id: `Still Developing This`, // This will be replaced in the calling methods
      approved: false,
      sections: parsedResponse.deliverables?.writingStructureDraft || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Creates a writing structure based on a request
   * 
   * @param request - The writing project description or requirements
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to a writing structure draft
   */
  async createWritingStructure(request: string, evaluator?: SystemOperatorEvaluator): Promise<WritingStructureDraft> {
    const rawDraft = await this.processOperatorTask(request, WritingAgentTask.CREATION, evaluator);
    
    // Create a complete WritingStructureDraft with proper metadata
    return {
      id: `ws-${Date.now()}`,
      approved: false,
      sections: rawDraft?.sections || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Refines an existing writing structure based on operator feedback
   * 
   * @param currentStructure - The current writing structure draft
   * @param feedback - The operator's feedback for improvement
   * @param feedbackType - The type of feedback (add/remove sections, specific changes, or general)
   * @param evaluator - Optional evaluator for quality control
   * @returns A promise resolving to a revised writing structure draft
   */
  async refineWritingStructure(
    currentStructure: WritingStructureDraft,
    feedback: string,
    evaluator?: SystemOperatorEvaluator
  ): Promise<WritingStructureDraft> {
    
    const rawDraft = await this.processOperatorTask(feedback, WritingAgentTask.ITERATION, evaluator);
    
    // Create a revised WritingStructureDraft with updated metadata
    return {
      id: currentStructure.id, // Keep the same ID
      approved: false, // Reset approval status
      sections: rawDraft?.sections || [],
      createdAt: currentStructure.createdAt, // Keep the original creation date
      updatedAt: new Date() // Update the modification date
    };
  }

  /**
   * Evaluates a writing structure internally and suggests improvements
   * 
   * @param structure - The writing structure to evaluate
   * @returns A promise resolving to an evaluation result with suggested improvements
   */
  async evaluateStructureInternally(structure: WritingStructureDraft): Promise<{score: number, feedback: string}> {
    const evaluationPrompt = `
      Please evaluate the following writing structure and provide a score from 0-100 and specific improvement suggestions.
      
      Evaluation criteria:
      1. Coherence and logical flow between sections
      2. Comprehensiveness (covers all important aspects)
      3. Clarity of section instructions
      4. Appropriate level of detail
      5. Alignment with likely writing goals
      
      Writing structure: ${JSON.stringify(structure.sections)}
    `;
    
    const evaluationResponse = await this.provider.getResponse(evaluationPrompt, []);
    
    try {
      // Extract score and feedback from the response
      // This is a simplified parsing approach
      const scoreMatch = evaluationResponse.match(/score:?\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 70; // Default to 70 if parsing fails
      
      // Remove the score part to get the feedback
      const feedback = evaluationResponse.replace(/score:?\s*\d+/i, '').trim();
      
      return { score, feedback };
    } catch (error) {
      console.error('Error parsing evaluation response:', error);
      return { score: 70, feedback: evaluationResponse };
    }
  }
}
