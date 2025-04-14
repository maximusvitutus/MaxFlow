import { KnowledgeTreeDraft, KnowledgeTreeNode, RootNode, SpanningNode, SearchableNode, isSpanningNode, isSearchableNode, AnalysisDepth } from '../../types/writing/knowledgeTree';
import { OpenAIProvider } from '../providers/openAIProvider';
import { SearchTool } from './searchTool';

/**
 * Builds a knowledge tree for a given topic.
 */
export class ContextBuilder {
    private llmProvider: OpenAIProvider;
    private searchTool: SearchTool;

    constructor(apiKey: string) {
        this.llmProvider = new OpenAIProvider(apiKey);
        this.searchTool = new SearchTool();
    }

    /**
     * Builds a knowledge tree for a given topic.
     * @param topic The topic to build the knowledge tree for.
     * @param analysisDepth The depth of the analysis.
     * @param instructions Optional instructions for the LLM.
     * @returns A knowledge tree.
     */
    async buildKnowledgeTree(topic: string, analysisDepth: AnalysisDepth, instructions?: string): Promise<KnowledgeTreeDraft> {
        const rootNode = await this.generateRootNode(topic, instructions);
        let currentDepth = 0;
        
        while (currentDepth < analysisDepth) {
            // Last level of the tree
            if (currentDepth + 1 === analysisDepth) {
                await this.createSearchableNodes(rootNode, instructions);
                break;
            }
            // Other levels of the tree
            else {
                const node = await this.expandNode(rootNode, instructions, currentDepth);
                rootNode.children.push(node);
            }
            currentDepth++;
        }

        return {
            id: this.generateId(),
            userQuery: topic,
            targetDepth: analysisDepth,
            currentDepth,
            rootNode,
            createdAt: new Date(),
            updatedAt: new Date(),
            approved: false
        };
    }

    private async expandNode(node: KnowledgeTreeNode, instructions?: string, depth: number = 0): Promise<SpanningNode> {
        const prompt = `Given the topic "${node.name}" at depth ${depth} ${instructions ? `and these instructions: ${instructions}` : ''}, 
            suggest a subtopic that should be explored. Return as JSON with fields: name, details`;
        
        const response = await this.llmProvider.getResponse(prompt, []);
        const result = JSON.parse(response);
        
        return {
            id: this.generateId(),
            name: result.name,
            details: result.details,
            nodetype: 'spanning',
            parent: node,
            children: []
        };
    }

    private async createSearchableNodes(node: KnowledgeTreeNode, instructions?: string): Promise<void> {
        const prompt = `Given the topic "${node.name}" ${instructions ? `and these instructions: ${instructions}` : ''}, 
            suggest search terms to gather detailed information. Return as JSON with fields: searchTerms (array)`;
        
        const response = await this.llmProvider.getResponse(prompt, []);
        const result = JSON.parse(response);
        
        const searchableNode: SearchableNode = {
            id: this.generateId(),
            name: `Search for ${node.name}`,
            details: `Search terms for gathering information about ${node.name}`,
            nodetype: 'searchable',
            parent: node,
            summary: '', // Will be populated after search
            searchTerms: result.searchTerms,
            approved: false
        };
        
        if ('children' in node) {
            (node as RootNode | SpanningNode).children.push(searchableNode);
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    private async generateRootNode(topic: string, instructions?: string): Promise<RootNode> {
        const prompt = `Given the topic "${topic}" ${instructions ? `and these instructions: ${instructions}` : ''}, 
            create a concise summary of the main subtopics that should be explored to build a comprehensive knowledge tree.
            Return as JSON with fields: summary, needsSubtopics, subtopics (array if needsSubtopics is true).`;

        const response = await this.llmProvider.getResponse(prompt, []);

        return JSON.parse(response);
    }
    
}
