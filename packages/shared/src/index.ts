export const VERSION = '0.1.0';

export * from './constants.js';
export * from './enums.js';
export * from './formulas.js';
export * from './types/index.js';
export { validateDesign, computeTraitBPCost } from './validation/design-validator.js';
export type { ValidationResult, ValidationError, ValidationWarning } from './validation/design-validator.js';
