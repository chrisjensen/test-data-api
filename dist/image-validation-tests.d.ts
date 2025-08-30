import { DataPackage } from './types.js';
interface ImageValidationOptions {
    /** Dataset name for error reporting */
    datasetName?: string;
    /** Timeout for HTTP requests in milliseconds (default: 10000) */
    httpTimeout?: number;
    /** Whether to skip image validation (useful for CI/CD) */
    skipImageValidation?: boolean;
}
export declare function validateImageUrls(dataPackage: DataPackage, options?: ImageValidationOptions): Promise<void>;
export {};
