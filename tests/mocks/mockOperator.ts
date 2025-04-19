import { AnalysisDepth, KnowledgeTreeDraft } from "../../src/core/types/writing/knowledgeTree";
import { WritingStructureDraft } from "../../src/core/types/writing/writingStructure";
import { SystemOperator } from "../../src/core/llm/operators/abstractOperator";

/**
 * Mock operator for testing purposes. 
 * 
 * @class
 * @extends {SystemOperator}
 */
export class MockOperator extends SystemOperator {
    /**
     * Creates a new MockOperator instance
     */
    constructor() {
        super();
    }

    /**
     * Proposes a writing structure for a given request.
     * @param request - The request to propose a writing structure for.
     * @returns A promise that resolves to the proposed writing structure.
     */
    async getWritingStructure(request: string): Promise<WritingStructureDraft> {
        console.log("(MockOperator) getWritingStructure called with request:", request);
        return {
            id: "1",
            sections: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            approved: false
        };
    }

    /**
     * Proposes a knowledge tree for a given request.
     * @param request - The request to propose a knowledge tree for.
     * @returns A promise that resolves to the proposed knowledge tree.
     */
    async getKnowledgeTree(request: string): Promise<KnowledgeTreeDraft> {
        console.log("(MockOperator) getKnowledgeTree called with request:", request);
        return {
            id: "1",    
            targetDepth: AnalysisDepth.SHALLOW,
            currentDepth: AnalysisDepth.SHALLOW,
            createdAt: new Date(),
            updatedAt: new Date(),
            approved: false,
            userQuery: request,
            rootNode: { 
                id: "1",
                nodetype: 'root',
                name: "Mock root",
                details: "",
                children: [],
            }
        };
    }

    async executeTask(): Promise<any> {
        return {};
    }

    async evaluateResponse(): Promise<number> {
        return 1;
    }
}