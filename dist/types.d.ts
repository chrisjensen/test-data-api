export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
}
export interface Person {
    id: string;
    fullName: string;
    preferredName?: string;
    givenName?: string;
    surname?: string;
    englishName?: string;
    dateOfBirth?: Date;
    pronouns?: string;
    bio: string | null;
    email: string;
    phone: string | null;
    picture: string | null;
    tags: string[];
    groupMemberships: string[];
    reference?: string;
    address?: Address;
    quote?: string;
    isFirstNations?: boolean;
}
export interface Group {
    id: string;
    name: string;
    about: string;
    email: string | null;
    website: string | null;
    picture: string | null;
    reference?: string;
}
export interface Event {
    id: string;
    name: string;
    date: Date;
    attendeeIds: string[];
}
export interface DataPackageMetadata {
    containsFirstNationsPeople: boolean;
}
export interface LoadDataOptions {
    acknowledgeDeceasedFirstNations?: boolean;
}
export interface DataPackage {
    people: Person[];
    groups: Group[];
    events: Event[];
    metadata?: DataPackageMetadata;
}
export interface NullabilityConfig {
    person: {
        bio: number;
        phone: number;
        picture: number;
        reference: number;
        address: number;
        quote: number;
        dateOfBirth: number;
        pronouns: number;
    };
    group: {
        email: number;
        website: number;
        picture: number;
        reference: number;
    };
}
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
