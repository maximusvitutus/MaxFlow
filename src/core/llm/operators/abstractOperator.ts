import { OperatorState } from "../../types/agentStates";
import { KnowledgeTreeDraft } from "../../types/writing/knowledgeTree";
import { WritingStructureDraft } from "../../types/writing/writingStructure";
import { ConversationAgent } from "../agents/conversationAgent";

export abstract class SystemOperator {
    protected status: OperatorState;
    protected conversationAgent: ConversationAgent | null;
    
    constructor() {
        this.status = OperatorState.IDLE;
        this.conversationAgent = null;
    }

    abstract proposeWritingStructure(request: string): Promise<WritingStructureDraft>;

    abstract proposeKnowledgeTree(request: string): Promise<KnowledgeTreeDraft>;

    abstract routeRequest(userRequest: string): Promise<WritingStructureDraft | KnowledgeTreeDraft>;
}