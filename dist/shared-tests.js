import { describe, it, expect } from 'vitest';
import { DataFactory } from './DataFactory.js';
export function validateDataPackage(dataPackage, options = {}) {
    const factory = new DataFactory(dataPackage, {
        acknowledgeDeceasedFirstNations: options.acknowledgeDeceasedFirstNations
    });
    const defaultOptions = {
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
                    const birthYear = person.dateOfBirth.getFullYear();
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
                    expect(person.pronouns.length, `${personId}: pronouns too short`).toBeGreaterThan(0);
                });
            });
        }
        it('should have valid contact information', () => {
            people.forEach((person, index) => {
                const personId = person.fullName || person.preferredName || `Person ${index}`;
                expect(person.email, `${personId}: missing email`).toBeDefined();
                expect(person.email, `${personId}: email must be string`).toEqual(expect.any(String));
                expect(person.email, `${personId}: invalid email format`).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
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
        if (defaultOptions.containsFirstNationsPeople) {
            it('should have First Nations people when metadata indicates', () => {
                const hasFirstNationsPeople = people.some(person => person.isFirstNations === true);
                if (!hasFirstNationsPeople) {
                    console.warn('⚠️  metadata.containsFirstNationsPeople is true but no people have isFirstNations flag');
                }
            });
        }
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
