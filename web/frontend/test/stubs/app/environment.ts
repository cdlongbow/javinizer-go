import { browser } from 'vitest';

// Minimal $app/environment stub for component tests (vitest config aliases
// $app/environment here). browser is set to true because vitest resolves
// with conditions: ['browser'].
export { browser };