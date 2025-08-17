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
    };
    group: {
        email: number;
        website: number;
        picture: number;
        reference: number;
    };
}
