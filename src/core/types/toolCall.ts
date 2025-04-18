/**
 * A tool call from an LLM response that specifies a function to execute.
 * 
 * @property function - Contains the function name and arguments
 * @property function.name - Name of the function to execute
 * @property function.args - Arguments to pass to the function, as key-value pairs: String -> Any
 */
export interface ToolCall {
  function: {
    name: string;       
    args: Record<string, any>; 
  }
}