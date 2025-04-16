import { OperatorState } from "../../types/agentStates";
import { KnowledgeTreeDraft } from "../../types/writing/knowledgeTree";
import { WritingStructureDraft } from "../../types/writing/writingStructure";
import { ConversationAgent } from "../agents/conversationAgent";

/**
 * Abstract base class for system operators that control the flow of the writing process
 */
export abstract class SystemOperator {
    /** Current state of the operator */
    protected status: OperatorState;
    /** Conversation agent for user interactions */
    protected conversationAgent: ConversationAgent | null;
    
    /**
     * Creates a new SystemOperator instance
     */
    constructor() {
        this.status = OperatorState.IDLE;
        this.conversationAgent = null;
    }

    /**
     * Proposes a writing structure based on the user's request
     * 
     * @param request - The user's writing request
     * @returns A promise resolving to a writing structure draft
     */
    abstract proposeWritingStructure(request: string): Promise<WritingStructureDraft>;

    /**
     * Proposes a knowledge tree for research based on the user's request
     * 
     * @param request - The user's research request
     * @returns A promise resolving to a knowledge tree draft
     */
    abstract proposeKnowledgeTree(request: string): Promise<KnowledgeTreeDraft>;

    /**
     * Routes a user request to the appropriate handling method
     * 
     * @param userRequest - The user's request to be processed
     * @returns A promise resolving to either a writing structure or knowledge tree draft
     */
    abstract routeRequest(userRequest: string): Promise<WritingStructureDraft | KnowledgeTreeDraft>;
}