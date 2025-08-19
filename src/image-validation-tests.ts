import { describe, it, expect } from 'vitest';
import { Person, Group, DataPackage } from './types.js';

interface ImageValidationOptions {
  /** Dataset name for error reporting */
  datasetName?: string;
  /** Timeout for HTTP requests in milliseconds (default: 10000) */
  httpTimeout?: number;
  /** Whether to skip image validation (useful for CI/CD) */
  skipImageValidation?: boolean;
}

export async function validateImageUrls(dataPackage: DataPackage, options: ImageValidationOptions = {}) {
  const defaultOptions: Required<ImageValidationOptions> = {
    datasetName: options.datasetName || 'Dataset',
    httpTimeout: options.httpTimeout || 10000,
    skipImageValidation: options.skipImageValidation ?? false
  };

  if (defaultOptions.skipImageValidation) {
    describe(`${defaultOptions.datasetName} - Image URL Validation (Skipped)`, () => {
      it('should skip image validation when disabled', () => {
        expect(true).toBe(true);
      });
    });
    return;
  }

  describe(`${defaultOptions.datasetName} - Image URL Validation`, () => {
    const people = dataPackage.people;
    const groups = dataPackage.groups;

    // Helper function to validate a single image URL
    async function validateImageUrl(url: string, context: string): Promise<void> {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), defaultOptions.httpTimeout);

        const response = await fetch(url, {
          method: 'HEAD', // Use HEAD to avoid downloading full image
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check status code
        expect(response.status, `${context}: should return 200 status`).toBe(200);

        // Check content type
        const contentType = response.headers.get('content-type');
        expect(contentType, `${context}: should have content-type header`).toBeDefined();
        expect(contentType, `${context}: should be an image content type`).toMatch(/^image\//);

        // For additional safety, also check with GET request to verify no HTML in body
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: controller.signal
        });

        const body = await getResponse.text();
        
        // Check that response doesn't contain HTML tags
        const hasHtmlTags = /<[^>]*>/.test(body);
        expect(hasHtmlTags, `${context}: should not contain HTML in response body`).toBe(false);

        // Check that response doesn't contain common HTML indicators
        const hasHtmlIndicators = /<!DOCTYPE|html|head|body|script|style/i.test(body);
        expect(hasHtmlIndicators, `${context}: should not contain HTML document structure`).toBe(false);

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`${context}: request timed out after ${defaultOptions.httpTimeout}ms`);
        }
        throw error;
      }
    }

    it('should have valid person image URLs', async () => {
      const peopleWithImages = people.filter(person => person.picture);
      
      for (const person of peopleWithImages) {
        const personId = person.fullName || person.preferredName || person.id;
        await validateImageUrl(person.picture!, `${personId} (${person.picture})`);
      }
    }, defaultOptions.httpTimeout + 5000); // Add buffer time for test execution

    it('should have valid group image URLs', async () => {
      const groupsWithImages = groups.filter(group => group.picture);
      
      for (const group of groupsWithImages) {
        await validateImageUrl(group.picture!, `Group ${group.id} (${group.picture})`);
      }
    }, defaultOptions.httpTimeout + 5000); // Add buffer time for test execution
  });
}
