import { Person, Group, Event, DataPackage, LoadDataOptions } from './types.js';
export declare class DataFactory {
    private originalPeople;
    private originalGroups;
    private people;
    private groups;
    private events;
    private random;
    private dataPackageMetadata?;
    private firstNationsAcknowledged;
    private nullabilityConfig;
    constructor(dataPackage: DataPackage, options?: LoadDataOptions);
    loadData(dataPackage: DataPackage, options?: LoadDataOptions): void;
    private hasIndividualFirstNationsPeople;
    setSeed(seed: number): void;
    getSeed(): number;
    getPeople(count?: number): Person[];
    getPerson(id: string): Person | null;
    getPersonByEmail(email: string): Person | null;
    getGroups(count?: number): Group[];
    getGroup(id: string): Group | null;
    getEvents(count?: number): Event[];
    getEvent(id: string): Event | null;
    getPeopleByTag(tag: string): Person[];
    getPeopleInGroup(groupId: string): Person[];
    private reprocessNullableFields;
    private processNullableFieldsWithRandom;
}
