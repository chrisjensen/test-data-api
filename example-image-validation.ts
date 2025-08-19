import { describe } from 'vitest';
import { validateImageUrls } from './src/image-validation-tests.js';
import { firstNationsActivistsData } from 'first-nations-activists-data';

// Example of running image validation tests separately
// This can be run independently from the main validation suite
describe('Image Validation Example', () => {
  // Run image validation with custom options
  validateImageUrls(firstNationsActivistsData, {
    datasetName: 'First Nations Activists',
    httpTimeout: 15000, // 15 second timeout
    skipImageValidation: false // Set to true to skip validation
  });
});

// Alternative: Run with minimal options
// validateImageUrls(firstNationsActivistsData);

// Alternative: Skip image validation entirely (useful for CI/CD)
// validateImageUrls(firstNationsActivistsData, { skipImageValidation: true });
