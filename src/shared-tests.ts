import { describe, it, expect } from 'vitest';
import { Person, Group, Event, DataPackage, ValidationOptions } from './types.js';
import { DataFactory } from './DataFactory.js';

interface TestOptions extends ValidationOptions {
  acknowledgeDeceasedFirstNations?: boolean;
}

export function validateDataPackage(dataPackage: DataPackage, options: TestOptions = {}) {
  const factory = new DataFactory(dataPackage, {
    acknowledgeDeceasedFirstNations: options.acknowledgeDeceasedFirstNations
  });

  const defaultOptions: Required<TestOptions> = {
    datasetName: options.datasetName || 'Dataset',
    minBirthYear: options.minBirthYear || 300,
    maxBirthYear: options.maxBirthYear || 2010,
    requirePronouns: options.requirePronouns ?? true,
    requireDateOfBirth: options.requireDateOfBirth ?? true,
    minBioLength: options.minBioLength || 50,
    containsFirstNationsPeople: options.containsFirstNationsPeople || false,
    validateImageUrls: options.validateImageUrls ?? false,
    validateReferenceUrls: options.validateReferenceUrls ?? false,
    httpTimeout: options.httpTimeout || 10000,
    customValidations: options.customValidations || [],
    acknowledgeDeceasedFirstNations: options.acknowledgeDeceasedFirstNations || false
  };

  describe(`${defaultOptions.datasetName} - Data Structure Validation`, () => {
    it('should have required package structure', () => {
      expect(dataPackage).toBeDefined();
      expect(Array.isArray(dataPackage.people)).toBe(true);
      expect(Array.isArray(dataPackage.groups)).toBe(true);
      expect(Array.isArray(dataPackage.events)).toBe(true);
    });

    it('should have metadata when required', () => {
      if (defaultOptions.containsFirstNationsPeople) {
        expect(dataPackage.metadata).toBeDefined();
        expect(dataPackage.metadata?.containsFirstNationsPeople).toBe(true);
      }
    });

    it('should contain people', () => {
      expect(dataPackage.people.length).toBeGreaterThan(0);
    });
  });

  describe(`${defaultOptions.datasetName} - People Validation`, () => {
    const people = dataPackage.people;

    it('should have valid person IDs', () => {
      const ids = new Set();
      people.forEach((person, index) => {
        expect(person.id, `Person ${index}: missing id`).toBeDefined();
        expect(person.id, `Person ${index}: id must be string`).toEqual(expect.any(String));
        expect(person.id.length, `Person ${index}: id too short`).toBeGreaterThan(0);
        expect(ids.has(person.id), `Person ${index}: duplicate id "${person.id}"`).toBe(false);
        ids.add(person.id);
      });
    });

    it('should have valid names', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        expect(person.fullName, `${personId}: missing fullName`).toBeDefined();
        expect(person.fullName, `${personId}: fullName must be string`).toEqual(expect.any(String));
        expect(person.fullName.length, `${personId}: fullName too short`).toBeGreaterThan(0);
      });
    });

    it('should have valid bio fields', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        expect(person.bio, `${personId}: missing bio field`).not.toBeNull();
        expect(person.bio, `${personId}: missing bio field`).not.toBeUndefined();
        expect(person.bio, `${personId}: bio must be string`).toEqual(expect.any(String));
        if (person.bio) {
          expect(person.bio.length, `${personId}: bio too short (${person.bio.length} chars, minimum ${defaultOptions.minBioLength})`).toBeGreaterThanOrEqual(defaultOptions.minBioLength);
        }
      });
    });

    if (defaultOptions.requireDateOfBirth) {
      it('should have valid birth dates', () => {
        people.forEach((person, index) => {
          const personId = person.fullName || person.preferredName || `Person ${index}`;
          expect(person.dateOfBirth, `${personId}: missing dateOfBirth field`).toBeDefined();
          expect(person.dateOfBirth, `${personId}: dateOfBirth must be a Date object`).toBeInstanceOf(Date);
          
          const birthYear = person.dateOfBirth!.getFullYear();
          expect(birthYear, `${personId}: unrealistic birth year ${birthYear} (expected ${defaultOptions.minBirthYear}-${defaultOptions.maxBirthYear})`).toBeGreaterThanOrEqual(defaultOptions.minBirthYear);
          expect(birthYear, `${personId}: unrealistic birth year ${birthYear} (expected ${defaultOptions.minBirthYear}-${defaultOptions.maxBirthYear})`).toBeLessThanOrEqual(defaultOptions.maxBirthYear);
        });
      });
    }

    if (defaultOptions.requirePronouns) {
      it('should have valid pronouns', () => {
        people.forEach((person, index) => {
          const personId = person.fullName || person.preferredName || `Person ${index}`;
          expect(person.pronouns, `${personId}: missing pronouns field`).toBeDefined();
          expect(person.pronouns, `${personId}: pronouns must be string`).toEqual(expect.any(String));
          expect(person.pronouns!.length, `${personId}: pronouns too short`).toBeGreaterThan(0);
        });
      });
    }

    it('should have valid contact information', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        expect(person.email, `${personId}: missing email`).toBeDefined();
        expect(person.email, `${personId}: email must be string`).toEqual(expect.any(String));
        expect(person.email, `${personId}: invalid email format`).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        // Test data should use .test domains for safety
        expect(person.email, `${personId}: should use .test domain for mock data safety`).toMatch(/\.test$/);
      });
    });

    it('should have valid phone numbers when present', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        if (person.phone) {
          expect(person.phone, `${personId}: phone must be string`).toEqual(expect.any(String));
          // Test data should use 555 to make phone numbers clearly fake
          expect(person.phone, `${personId}: should use 555 for mock data safety`).toMatch(/555/);
        }
      });
    });

    it('should have fake street addresses when present', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        if (person.address?.street) {
          // Test data should use " Test" to make street addresses clearly fake
          expect(person.address.street, `${personId}: should use " Test" for mock data safety`).toMatch(/ Test/);
        }
      });
    });

    it('should have valid reference URLs when present', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        const personWithRef = person as any;
        if (personWithRef.reference) {
          expect(personWithRef.reference, `${personId}: reference must be valid HTTPS URL`).toMatch(/^https:\/\/.+/);
        }
      });
    });

    it('should have valid tags', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        expect(Array.isArray(person.tags), `${personId}: tags must be array`).toBe(true);
        expect(person.tags.length, `${personId}: must have at least one tag`).toBeGreaterThan(0);
        
        person.tags.forEach((tag, tagIndex) => {
          expect(tag, `${personId}: tag ${tagIndex} must be string`).toEqual(expect.any(String));
          expect(tag, `${personId}: tag "${tag}" must be lowercase with hyphens only`).toMatch(/^[a-z0-9-]+$/);
        });
      });
    });

    it('should have valid picture URLs', () => {
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        expect(person.picture, `${personId}: missing picture URL`).toBeDefined();
        expect(person.picture, `${personId}: picture must be string`).toEqual(expect.any(String));
        expect(person.picture, `${personId}: picture must be valid HTTPS URL`).toMatch(/^https:\/\/.+/);
      });
    });

    it('should have valid group memberships', () => {
      const groupIds = new Set(dataPackage.groups.map(g => g.id));
      
      people.forEach((person, index) => {
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        expect(Array.isArray(person.groupMemberships), `${personId}: groupMemberships must be array`).toBe(true);
        
        person.groupMemberships.forEach(groupId => {
          expect(groupIds.has(groupId), `${personId}: references non-existent group "${groupId}"`).toBe(true);
        });
      });
    });

  });

  describe(`${defaultOptions.datasetName} - Groups Validation`, () => {
    const groups = dataPackage.groups;

    it('should have valid group IDs', () => {
      const ids = new Set();
      groups.forEach((group, index) => {
        expect(group.id, `Group ${index}: missing id`).toBeDefined();
        expect(group.id, `Group ${index}: id must be string`).toEqual(expect.any(String));
        expect(group.id.length, `Group ${index}: id too short`).toBeGreaterThan(0);
        expect(ids.has(group.id), `Group ${index}: duplicate id "${group.id}"`).toBe(false);
        ids.add(group.id);
      });
    });

    it('should have valid group names and descriptions', () => {
      groups.forEach((group, index) => {
        expect(group.name, `Group ${group.id}: missing name`).toBeDefined();
        expect(group.name, `Group ${group.id}: name must be string`).toEqual(expect.any(String));
        expect(group.name.length, `Group ${group.id}: name too short`).toBeGreaterThan(0);
        
        expect(group.about, `Group ${group.id}: missing about`).toBeDefined();
        expect(group.about, `Group ${group.id}: about must be string`).toEqual(expect.any(String));
        expect(group.about.length, `Group ${group.id}: about too short`).toBeGreaterThan(10);
      });
    });

    it('should have valid group contact information', () => {
      groups.forEach((group, index) => {
        // Group emails should also use .test domains when present
        if (group.email) {
          expect(group.email, `Group ${group.id}: should use .test domain for mock data safety`).toMatch(/\.test$/);
        }
      });
    });
  });

  describe(`${defaultOptions.datasetName} - Events Validation`, () => {
    const events = dataPackage.events;
    const personIds = new Set(dataPackage.people.map(p => p.id));

    it('should have valid event IDs', () => {
      const ids = new Set();
      events.forEach((event, index) => {
        expect(event.id, `Event ${index}: missing id`).toBeDefined();
        expect(event.id, `Event ${index}: id must be string`).toEqual(expect.any(String));
        expect(event.id.length, `Event ${index}: id too short`).toBeGreaterThan(0);
        expect(ids.has(event.id), `Event ${index}: duplicate id "${event.id}"`).toBe(false);
        ids.add(event.id);
      });
    });

    it('should have valid event names and dates', () => {
      events.forEach((event, index) => {
        expect(event.name, `Event ${event.id}: missing name`).toBeDefined();
        expect(event.name, `Event ${event.id}: name must be string`).toEqual(expect.any(String));
        expect(event.name.length, `Event ${event.id}: name too short`).toBeGreaterThan(0);
        
        expect(event.date, `Event ${event.id}: missing date`).toBeDefined();
        expect(event.date, `Event ${event.id}: date must be Date object`).toBeInstanceOf(Date);
      });
    });

    it('should reference valid people', () => {
      events.forEach((event, index) => {
        expect(Array.isArray(event.attendeeIds), `Event ${event.id}: attendeeIds must be array`).toBe(true);
        
        event.attendeeIds.forEach(personId => {
          expect(personIds.has(personId), `Event "${event.name}": references non-existent person "${personId}"`).toBe(true);
        });
      });
    });
  });

  // Add DataFactory integration tests
  describe(`${defaultOptions.datasetName} - DataFactory Integration`, () => {
    it('should work with DataFactory when properly acknowledged', () => {
      const testFactory = new DataFactory(dataPackage, {
        acknowledgeDeceasedFirstNations: defaultOptions.acknowledgeDeceasedFirstNations
      });

      const people = testFactory.getPeople();
      const groups = testFactory.getGroups();
      const events = testFactory.getEvents();

      expect(Array.isArray(people)).toBe(true);
      expect(Array.isArray(groups)).toBe(true);
      expect(Array.isArray(events)).toBe(true);
      expect(people.length).toBeGreaterThan(0);
    });

    it('should support filtering by count', () => {
      const testFactory = new DataFactory(dataPackage, {
        acknowledgeDeceasedFirstNations: defaultOptions.acknowledgeDeceasedFirstNations
      });

      const allPeople = testFactory.getPeople();
      const somePeople = testFactory.getPeople(5);
      
      expect(somePeople.length).toBeLessThanOrEqual(5);
      expect(somePeople.length).toBeLessThanOrEqual(allPeople.length);
    });

    if (defaultOptions.containsFirstNationsPeople) {
      it('should require acknowledgment for First Nations data', () => {
        const factoryWithoutAck = new DataFactory(dataPackage, { acknowledgeDeceasedFirstNations: false });
        expect(() => factoryWithoutAck.getPeople()).toThrow(/requires acknowledgment/);
      });
    }
  });

  // HTTP validation tests - only run when explicitly enabled
  if (defaultOptions.validateImageUrls) {
    describe(`${defaultOptions.datasetName} - HTTP Image Validation`, () => {
      it('should have accessible picture URLs', async () => {
        const people = dataPackage.people;
        const results = await Promise.allSettled(
          people.map(async (person) => {
            const personId = person.fullName || person.preferredName || person.id;
            try {
              const response = await fetch(person.picture!, { 
                method: 'HEAD'
              });
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return { personId, success: true };
            } catch (error) {
              throw new Error(`${personId}: ${(error as Error).message}`);
            }
          })
        );

        const failures = results
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason.message);

        if (failures.length > 0) {
          throw new Error(`Image URL validation failed:\n${failures.join('\n')}`);
        }
      }, 30000); // 30 second timeout for HTTP tests
    });
  }

  // Run custom validations as separate tests
  if (defaultOptions.customValidations.length > 0) {
    describe(`${defaultOptions.datasetName} - Custom Validations`, () => {
      defaultOptions.customValidations.forEach((validation, index) => {
        it(`should pass custom validation ${index + 1}`, () => {
          dataPackage.people.forEach((person, personIndex) => {
            const errors = validation(person, personIndex);
            expect(errors, `Person ${person.fullName || person.id}: ${errors.join(', ')}`).toHaveLength(0);
          });
        });
      });
    });
  }
}

// Separate HTTP image validation function that can be used independently
export function validateImageUrls(dataPackage: DataPackage, options: { datasetName?: string; httpTimeout?: number } = {}) {
  const defaultOptions = {
    datasetName: options.datasetName || 'Dataset',
    httpTimeout: options.httpTimeout || 15000
  };

  describe(`${defaultOptions.datasetName} - HTTP Image Validation`, () => {
    it('should have accessible picture URLs', async () => {
      const people = dataPackage.people;
      const results = await Promise.allSettled(
        people.map(async (person) => {
          const personId = person.fullName || person.preferredName || person.id;
          try {
            const response = await fetch(person.picture!, { 
              method: 'HEAD'
            });
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return { personId, success: true };
          } catch (error) {
            throw new Error(`${personId}: ${(error as Error).message}`);
          }
        })
      );

      const failures = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason.message);

      if (failures.length > 0) {
        throw new Error(`Image URL validation failed:\n${failures.join('\n')}`);
      }
    }, 30000); // 30 second timeout for HTTP tests
  });
}