import type { DataPackage, Person } from './types.js';
export interface ValidationOptions {
    /** Dataset name for error reporting */
    datasetName?: string;
    /** Minimum birth year for validation (default: 300 for very historical figures) */
    minBirthYear?: number;
    /** Maximum birth year for validation (default: 2010) */
    maxBirthYear?: number;
    /** Whether to require pronouns field (default: true) */
    requirePronouns?: boolean;
    /** Whether to require dateOfBirth field (default: true) */
    requireDateOfBirth?: boolean;
    /** Minimum bio length in characters (default: 50) */
    minBioLength?: number;
    /** Whether this dataset contains First Nations people */
    containsFirstNationsPeople?: boolean;
    /** Whether to validate image URLs (default: true) */
    validateImageUrls?: boolean;
    /** Whether to validate reference URLs (default: true) */
    validateReferenceUrls?: boolean;
    /** Timeout for HTTP requests in milliseconds (default: 10000) */
    httpTimeout?: number;
    /** Custom validation for specific dataset requirements */
    customValidations?: Array<(person: Person, index: number) => string[]>;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    totalPeople: number;
    totalGroups: number;
    totalEvents: number;
}
export declare class DataPackageValidator {
    private dataPackage;
    private options;
    private factory;
    constructor(dataPackage: DataPackage, options?: ValidationOptions);
    validate(): Promise<ValidationResult>;
    private validateStructure;
    private validatePeople;
    private validatePerson;
    private validateGroups;
    private validateEvents;
    private validateRelationships;
    private validateFirstNationsHandling;
    /**
     * Create a test function that can be used in vitest/jest tests
     */
    static createValidationTest(dataPackage: DataPackage, options?: ValidationOptions): (expect: any) => Promise<ValidationResult>;
    /**
     * Create comprehensive test suite for a data package
     */
    static createTestSuite(dataPackage: DataPackage, options?: ValidationOptions): {
        'should have valid data structure': (expect: any) => void;
        'should have complete required fields for all people': (expect: any) => void;
        'should have valid relationships between people, groups, and events': (expect: any) => void;
        'should have proper First Nations handling': (expect: any) => void;
        'should meet data quality standards': (expect: any) => void;
    };
    private createStructureTest;
    private createCompletenessTest;
    private createRelationshipTest;
    private createFirstNationsTest;
    private createQualityTest;
    private validateHttpResources;
    private checkUrl;
}
