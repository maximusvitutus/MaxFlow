/**
 * Type definition for schema validation rules.
 * Defines the structure and validation requirements for each field.
 */
type SchemaDefinition = {
  [key: string]: {
    /**
     * The expected data type of the field
     */
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    
    /**
     * Whether the field is required
     */
    required: boolean;
    
    /**
     * Optional custom validation function
     */
    validate?: (value: any) => boolean;
  };
};

/**
 * Validates data objects against a defined schema.
 * Ensures that objects conform to expected structure and data types.
 */
export class SchemaValidator {
  /**
   * Creates a new schema validator with the given schema definition.
   * 
   * @param schema - The schema definition to validate against
   */
  constructor(private schema: SchemaDefinition) {}

  /**
   * Validates a data object against the schema.
   * 
   * @param data - The data object to validate
   * @returns A validation result object with valid flag and error messages
   */
  validate(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for required fields
    for (const [field, definition] of Object.entries(this.schema)) {
      if (definition.required && (data[field] === undefined || data[field] === null)) {
        errors.push(`Required field '${field}' is missing`);
        continue;
      }
      
      if (data[field] !== undefined) {
        // Check type
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
        if (actualType !== definition.type) {
          errors.push(`Field '${field}' should be of type '${definition.type}', but got '${actualType}'`);
        }
        
        // Run custom validation if provided
        if (definition.validate && !definition.validate(data[field])) {
          errors.push(`Field '${field}' failed custom validation`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}