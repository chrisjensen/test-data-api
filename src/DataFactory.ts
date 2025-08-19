import { Person, Group, Event, DataPackage, NullabilityConfig, LoadDataOptions, DataPackageMetadata } from './types.js';
import { SeededRandom } from './random.js';

export class DataFactory {
  private originalPeople: Person[] = [];
  private originalGroups: Group[] = [];
  private people: Person[] = [];
  private groups: Group[] = [];
  private events: Event[] = [];
  private random: SeededRandom;
  private dataPackageMetadata?: DataPackageMetadata;
  private firstNationsAcknowledged: boolean = false;
  private nullabilityConfig: NullabilityConfig = {
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

  constructor(dataPackage: DataPackage, options?: LoadDataOptions) {
    this.random = new SeededRandom(0);
    this.loadData(dataPackage, options);
  }

  loadData(dataPackage: DataPackage, options?: LoadDataOptions): void {
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
  
  private hasIndividualFirstNationsPeople(people: Person[]): boolean {
    return people.some(person => person.isFirstNations === true);
  }

  setSeed(seed: number): void {
    this.random.setSeed(seed);
    this.reprocessNullableFields();
  }

  getSeed(): number {
    return this.random.getSeed();
  }

  getPeople(count?: number): Person[] {
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

  getPerson(id: string): Person | null {
    return this.people.find(person => person.id === id) || null;
  }

  getPersonByEmail(email: string): Person | null {
    return this.people.find(person => person.email === email) || null;
  }

  getGroups(count?: number): Group[] {
    if (count === undefined) {
      return [...this.groups];
    }
    const shuffled = this.random.shuffle(this.groups);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  getGroup(id: string): Group | null {
    return this.groups.find(group => group.id === id) || null;
  }

  getEvents(count?: number): Event[] {
    if (count === undefined) {
      return [...this.events];
    }
    const shuffled = this.random.shuffle(this.events);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  getEvent(id: string): Event | null {
    return this.events.find(event => event.id === id) || null;
  }

  getPeopleByTag(tag: string): Person[] {
    return this.people.filter(person => person.tags.includes(tag));
  }

  getPeopleInGroup(groupId: string): Person[] {
    return this.people.filter(person => person.groupMemberships.includes(groupId));
  }


  private reprocessNullableFields(): void {
    const currentSeed = this.random.getSeed();
    const tempRandom = new SeededRandom(currentSeed);
    
    this.people = this.processNullableFieldsWithRandom([...this.originalPeople], 'person', tempRandom);
    this.groups = this.processNullableFieldsWithRandom([...this.originalGroups], 'group', tempRandom);
  }

  private processNullableFieldsWithRandom<T extends Person | Group>(
    items: T[],
    type: 'person' | 'group',
    random: SeededRandom
  ): T[] {
    return items.map(item => {
      const processed = { ...item };
      
      if (type === 'person' && 'bio' in processed) {
        const person = processed as Person;
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
        const group = processed as Group;
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