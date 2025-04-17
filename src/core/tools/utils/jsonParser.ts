/**
 * Parses a JSON string safely, handling common formatting issues
 * 
 * @param input - The input string to parse
 * @returns A promise resolving to the parsed JSON object
 * @throws Error if parsing fails after cleanup attempts
 */
export function parseJSONSafe(input: string): any {
    try {
        // Log the input for debugging
        console.log('Raw evaluation input:', input);

        // Clean the input by removing any non-JSON text
        let jsonString = input.trim();

        // Remove code block delimiters if present
        if (jsonString.startsWith('```') && jsonString.endsWith('```')) {
            jsonString = jsonString.slice(3, -3).trim();
        }

        // Remove any leading text before the JSON object
        const jsonStartIndex = jsonString.indexOf('{');
        if (jsonStartIndex !== -1) {
            jsonString = jsonString.slice(jsonStartIndex);
        }

        // Parse the cleaned JSON string
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to parse evaluation result:', error);
        throw error;
    }
}
