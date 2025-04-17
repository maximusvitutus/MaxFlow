export interface ToolCall {
  function: {
  name: string;       
  args: Record<string, any>; 
  }
}