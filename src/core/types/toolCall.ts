export interface ToolCall {
  function: {
  name: string;       // Name of the function/tool to call
  arguments: string;  // JSON string of arguments (or object)
  }
}