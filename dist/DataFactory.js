import { SeededRandom } from './random.js';
export class DataFactory {
    constructor(dataPackage, options) {
        this.originalPeople = [];
        this.originalGroups = [];
        this.people = [];
        this.groups = [];
        this.events = [];
        this.firstNationsAcknowledged = false;
        this.nullabilityConfig = {
            person: {
                bio: 20,
                phone: 65,
                picture: 25,
                reference: 10,
                address: 15,
                quote: 20,
                dateOfBirth: 10,
                pronouns: 10
            },
            group: {
                email: 30,
                website: 40,
                picture: 50,
                reference: 85
            }
        };
        this.random = new SeededRandom(0);
        this.loadData(dataPackage, options);
    }
    loadData(dataPackage, options) {
        this.dataPackageMetadata = dataPackage.metadata;
        this.firstNationsAcknowledged = options?.acknowledgeDeceasedFirstNations ?? false;
        // Check if this package contains First Nations people and validate acknowledgment
        const containsFirstNations = this.dataPackageMetadata?.containsFirstNationsPeople ||
            this.hasIndividualFirstNationsPeople(dataPackage.people);
        if (containsFirstNations && !this.firstNationsAcknowledged) {
            // Load empty data if First Nations acknowledgment is required but not provided
            this.originalPeople = [];
            this.originalGroups = [];
            this.events = [];
            this.people = [];
            this.groups = [];
            return;
        }
        this.originalPeople = [...dataPackage.people];
        this.originalGroups = [...dataPackage.groups];
        this.events = [...dataPackage.events];
        this.reprocessNullableFields();
    }
    hasIndividualFirstNationsPeople(people) {
        return people.some(person => person.isFirstNations === true);
    }
    setSeed(seed) {
        this.random.setSeed(seed);
        this.reprocessNullableFields();
    }
    getSeed() {
        return this.random.getSeed();
    }
    getPeople(count) {
        // Check if we have no people due to First Nations filtering
        if (this.people.length === 0 && this.originalPeople.length === 0 && this.dataPackageMetadata?.containsFirstNationsPeople && !this.firstNationsAcknowledged) {
            throw new Error("No people available. This dataset contains First Nations people and requires acknowledgment of cultural protocols regarding deceased persons. Please reload with appropriate acknowledgment flag or load a different or additional dataset.");
        }
        if (count === undefined) {
            return [...this.people];
        }
        const shuffled = this.random.shuffle(this.people);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    getPerson(id) {
        return this.people.find(person => person.id === id) || null;
    }
    getPersonByEmail(email) {
        return this.people.find(person => person.email === email) || null;
    }
    getGroups(count) {
        if (count === undefined) {
            return [...this.groups];
        }
        const shuffled = this.random.shuffle(this.groups);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    getGroup(id) {
        return this.groups.find(group => group.id === id) || null;
    }
    getEvents(count) {
        if (count === undefined) {
            return [...this.events];
        }
        const shuffled = this.random.shuffle(this.events);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    getEvent(id) {
        return this.events.find(event => event.id === id) || null;
    }
    getPeopleByTag(tag) {
        return this.people.filter(person => person.tags.includes(tag));
    }
    getPeopleInGroup(groupId) {
        return this.people.filter(person => person.groupMemberships.includes(groupId));
    }
    reprocessNullableFields() {
        const currentSeed = this.random.getSeed();
        const tempRandom = new SeededRandom(currentSeed);
        this.people = this.processNullableFieldsWithRandom([...this.originalPeople], 'person', tempRandom);
        this.groups = this.processNullableFieldsWithRandom([...this.originalGroups], 'group', tempRandom);
    }
    processNullableFieldsWithRandom(items, type, random) {
        return items.map(item => {
            const processed = { ...item };
            if (type === 'person' && 'bio' in processed) {
                const person = processed;
                if (random.shouldBeNull(this.nullabilityConfig.person.bio)) {
                    person.bio = null;
                }
                if (random.shouldBeNull(this.nullabilityConfig.person.phone)) {
                    person.phone = null;
                }
                if (random.shouldBeNull(this.nullabilityConfig.person.picture)) {
                    person.picture = null;
                }
            }
            if (type === 'group' && 'email' in processed) {
                const group = processed;
                if (random.shouldBeNull(this.nullabilityConfig.group.email)) {
                    group.email = null;
                }
                if (random.shouldBeNull(this.nullabilityConfig.group.website)) {
                    group.website = null;
                }
                if (random.shouldBeNull(this.nullabilityConfig.group.picture)) {
                    group.picture = null;
                }
            }
            return processed;
        });
    }
}
