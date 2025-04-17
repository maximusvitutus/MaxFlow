import { MockOperator } from "../src/core/llm/operators/mockOperator";

describe('MockOperator', () => {
    let operator: MockOperator;

    beforeEach(() => {
        operator = new MockOperator();
    });

    it('MockOperator should propose a writing structure', async () => {
        const writingStructure = await operator.proposeWritingStructure("test");
        expect(writingStructure).toBeDefined();
    });

    it('MockOperator should propose a knowledge tree', async () => {
        const knowledgeTree = await operator.proposeKnowledgeTree("test");
        expect(knowledgeTree).toBeDefined();
    });

    it('MockOperator should handle the initial user request', async () => {
        const answer = await operator.callFunction({
            functionName: "proposeWritingStructure",
            args: { request: "test" }
        });
        expect(answer).toBeDefined();
    });
});