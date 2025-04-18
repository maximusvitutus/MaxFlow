import { KnowledgeTreeDraft } from "../../types/writing/knowledgeTree";
import { WritingStructureDraft } from "../../types/writing/writingStructure";
import { SystemOperator } from "./abstractOperator";
import { WritingAgent } from "../agents/writingAgent";
import { LLMProvider } from "../../tools/providers/abstractProvider";
import { WritingAgentTask } from "../agents/taskTypes";

export class Max extends SystemOperator {
    private writingAgent: WritingAgent;

    constructor(provider: LLMProvider) {
        super();
        // Initialize with empty prompt initially (basically a placeholder)
        this.writingAgent = new WritingAgent(provider, "", this);
        
    }

    // for now, just get the structure without any analysis or feedback
    async getWritingStructure(request: string): Promise<WritingStructureDraft> {
      try {
        return this.writingAgent.processOperatorTask(request, WritingAgentTask.CREATION);
      } catch (error) {
        console.error("Failed to get writing structure:", error);
        throw error;
      }
    }
    
    // Leave this blank for now
    async getKnowledgeTree(request: string): Promise<KnowledgeTreeDraft> {
        return new Promise((resolve, reject) => {
            resolve({} as KnowledgeTreeDraft);
        });
    }
}