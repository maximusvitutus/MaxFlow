/**     
 * Interface for text section instructions.
 */
export interface TextSectionInstructions {
    title: string;
    instructions: string;
}

/**
 * Interface representing a section of text, including a title and instructions to guide the writing process of a piece of text. 
 */
export interface TextSection {
    content: string;
    creationInstructions: TextSectionInstructions;
}

/**
 * Interface representing the structure of a writing piece, namely the text sections and the order in which they must be written.
 */
export interface WritingStructureDraft {
    id: string;
    approved: boolean;
    sections: TextSection[];
    createdAt: Date;
    updatedAt: Date;
}