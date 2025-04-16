import { AnalysisDepth, KnowledgeTreeDraft } from "../../types/writing/knowledgeTree";
import { WritingStructureDraft } from "../../types/writing/writingStructure";
import { SystemOperator } from "./abstractOperator";

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
    async proposeWritingStructure(request: string): Promise<WritingStructureDraft> {
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
    async proposeKnowledgeTree(request: string): Promise<KnowledgeTreeDraft> {
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

    /**
     * Handles the initial user request.
     * @param request - The request to handle.
     * @returns A promise that resolves to the proposed writing structure or knowledge tree.
     */
    async routeRequest(request: string): Promise<WritingStructureDraft | KnowledgeTreeDraft> {
        return this.proposeWritingStructure(request);
    }
}