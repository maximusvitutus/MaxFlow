/**
 * Enum representing the different levels of analysis depth for the knowledge tree. Abstraction for ints 1, 2, 3 and 4.
 */
export enum AnalysisDepth {
    SHALLOW = "shallow",            // knowledge tree of depth 1
    INTERMEDIATE = "intermediate",  // depth 2
    DEEP = "deep",                  // depth 3
    EXTREME = "extreme"             // depth 4
  }
  
  /**
   * Base node interface with common properties for all types of nodes in the knowledge tree.
   */
  export interface KnowledgeTreeNode {
    id: string;
    name: string;                     
    details: string;  // Details about what information the node (or its children) should cover
    nodetype: 'root' | 'spanning' | 'searchable';
  }
  
  /**
   * Node for the original topic. Represents the root of the knowledge tree. Answer the question: What are we building a knowledge tree about? 
   */
  export interface RootNode extends KnowledgeTreeNode {
    nodetype: 'root';
    children: KnowledgeTreeNode[];
  }
  
  /**
   * Node that divides the topic into smaller, more manageable subtopics.
   */
  export interface SpanningNode extends KnowledgeTreeNode {
    nodetype: 'spanning';
    parent: KnowledgeTreeNode;
    children: KnowledgeTreeNode[];
  }
  
  /**
   * Leaf node that converts its parent into multiple searches and stores the results. Also has a summary of results.
   */
  export interface SearchableNode extends KnowledgeTreeNode {
    parent: KnowledgeTreeNode;
    nodetype: 'searchable';
    summary: string;                  // Summary of the search results 
    searchTerms: string[];            // Terms to search for
    approved: boolean;                // Are the results adequate in view of the system operator?
  }
  
  /**
   * The knowledge tree is the information structure that the system builds from the user query.
   */
  export interface KnowledgeTree {
    id: string;
    userQuery: string;
    analysisDepth: AnalysisDepth;
    rootNode: RootNode;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * Type guard to check if a node is a searchable node (leaf node in the knowledge tree).
   * @param node - The node to check.
   * @returns True if the node is a searchable node, false otherwise.
   */
  export function isSearchableNode(node: KnowledgeTreeNode): node is SearchableNode {
    return node.nodetype === 'searchable';
  }
  
  /**
   * Type guard to check if a node is a spanning node (non-leaf and non-root node in the knowledge tree).
   * @param node - The node to check.
   * @returns True if the node is a spanning node, false otherwise.
   */
  export function isSpanningNode(node: KnowledgeTreeNode): node is SpanningNode {
    return node.nodetype === 'spanning';
  }
  
  /**
   * Type guard to check if a node is a root node.
   * @param node - The node to check.
   * @returns True if the node is a root node, false otherwise.
   */
  export function isRootNode(node: KnowledgeTreeNode): node is RootNode {
    return node.nodetype === 'root';
  }
  
  /**
   * Legacy KnowledgeNode type for backward compatibility.
   */
  export type KnowledgeNode = RootNode | SpanningNode | SearchableNode; 