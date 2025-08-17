import { describe, it, expect, beforeEach } from 'vitest';
import { DataFactory } from './DataFactory.js';
import type { DataPackage } from './types.js';

const mockDataPackage: DataPackage = {
  people: [
    {
      id: 'person1',
      fullName: 'Test Person One',
      bio: 'A test bio',
      email: 'test1@example.test',
      phone: '+1234567890',
      picture: 'https://example.com/pic1.jpg',
      tags: ['environmental', 'peace'],
      groupMemberships: ['group1']
    },
    {
      id: 'person2',
      fullName: 'Test Person Two',
      bio: 'Another test bio',
      email: 'test2@example.test',
      phone: '+0987654321',
      picture: 'https://example.com/pic2.jpg',
      tags: ['arts', 'education'],
      groupMemberships: ['group1', 'group2']
    },
    {
      id: 'person3',
      fullName: 'Test Person Three',
      bio: 'Third test bio',
      email: 'test3@example.test',
      phone: '+1122334455',
      picture: 'https://example.com/pic3.jpg',
      tags: ['political'],
      groupMemberships: ['group2']
    }
  ],
  groups: [
    {
      id: 'group1',
      name: 'Test Group One',
      about: 'First test group',
      email: 'group1@example.test',
      website: 'https://group1.test',
      picture: 'https://example.com/group1.jpg'
    },
    {
      id: 'group2',
      name: 'Test Group Two',
      about: 'Second test group',
      email: 'group2@example.test',
      website: 'https://group2.test',
      picture: 'https://example.com/group2.jpg'
    }
  ],
  events: [
    {
      id: 'event1',
      name: 'Test Event One',
      date: new Date('2023-01-01'),
      attendeeIds: ['person1', 'person2']
    },
    {
      id: 'event2',
      name: 'Test Event Two',
      date: new Date('2023-02-01'),
      attendeeIds: ['person2', 'person3']
    }
  ]
};

describe('DataFactory', () => {
  let factory: DataFactory;

  beforeEach(() => {
    factory = new DataFactory(mockDataPackage);
  });

  describe('Seed Management', () => {
    it('should set and get seed', () => {
      factory.setSeed(12345);
      expect(factory.getSeed()).toBe(12345);
    });

    it('should default to seed 0', () => {
      const newFactory = new DataFactory(mockDataPackage);
      expect(newFactory.getSeed()).toBe(0);
    });
  });

  describe('People Retrieval', () => {
    it('should get all people when no count specified', () => {
      const people = factory.getPeople();
      expect(people).toHaveLength(3);
      expect(people.map(p => p.id)).toEqual(['person1', 'person2', 'person3']);
    });

    it('should get specific number of people when count specified', () => {
      factory.setSeed(42);
      const people = factory.getPeople(2);
      expect(people).toHaveLength(2);
    });

    it('should return deterministic results with same seed', () => {
      factory.setSeed(42);
      const people1 = factory.getPeople(2);
      
      factory.setSeed(42);
      const people2 = factory.getPeople(2);
      
      expect(people1.map(p => p.id)).toEqual(people2.map(p => p.id));
    });

    it('should get person by id', () => {
      const person = factory.getPerson('person1');
      expect(person?.fullName).toBe('Test Person One');
    });

    it('should return null for non-existent person id', () => {
      const person = factory.getPerson('nonexistent');
      expect(person).toBeNull();
    });

    it('should get person by email', () => {
      const person = factory.getPersonByEmail('test2@example.test');
      expect(person?.fullName).toBe('Test Person Two');
    });

    it('should return null for non-existent email', () => {
      const person = factory.getPersonByEmail('nonexistent@example.test');
      expect(person).toBeNull();
    });
  });

  describe('Groups Retrieval', () => {
    it('should get all groups when no count specified', () => {
      const groups = factory.getGroups();
      expect(groups).toHaveLength(2);
      expect(groups.map(g => g.id)).toEqual(['group1', 'group2']);
    });

    it('should get specific number of groups when count specified', () => {
      factory.setSeed(42);
      const groups = factory.getGroups(1);
      expect(groups).toHaveLength(1);
    });

    it('should get group by id', () => {
      const group = factory.getGroup('group1');
      expect(group?.name).toBe('Test Group One');
    });

    it('should return null for non-existent group id', () => {
      const group = factory.getGroup('nonexistent');
      expect(group).toBeNull();
    });
  });

  describe('Events Retrieval', () => {
    it('should get all events when no count specified', () => {
      const events = factory.getEvents();
      expect(events).toHaveLength(2);
      expect(events.map(e => e.id)).toEqual(['event1', 'event2']);
    });

    it('should get specific number of events when count specified', () => {
      factory.setSeed(42);
      const events = factory.getEvents(1);
      expect(events).toHaveLength(1);
    });

    it('should get event by id', () => {
      const event = factory.getEvent('event1');
      expect(event?.name).toBe('Test Event One');
    });

    it('should return null for non-existent event id', () => {
      const event = factory.getEvent('nonexistent');
      expect(event).toBeNull();
    });
  });

  describe('Filtering', () => {
    it('should get people by tag', () => {
      const people = factory.getPeopleByTag('environmental');
      expect(people).toHaveLength(1);
      expect(people[0].fullName).toBe('Test Person One');
    });

    it('should return empty array for non-existent tag', () => {
      const people = factory.getPeopleByTag('nonexistent');
      expect(people).toHaveLength(0);
    });

    it('should get people in group', () => {
      const people = factory.getPeopleInGroup('group1');
      expect(people).toHaveLength(2);
      expect(people.map(p => p.fullName)).toEqual(['Test Person One', 'Test Person Two']);
    });

    it('should return empty array for non-existent group', () => {
      const people = factory.getPeopleInGroup('nonexistent');
      expect(people).toHaveLength(0);
    });
  });

  describe('Nullable Fields', () => {
    it('should handle nullable fields based on seed', () => {
      factory.setSeed(1);
      const people = factory.getPeople();
      
      // With seeded randomness, some fields should be null
      const hasNullBio = people.some(p => p.bio === null);
      const hasNullPhone = people.some(p => p.phone === null);
      const hasNullPicture = people.some(p => p.picture === null);
      
      // At least one of these should be true with our test data size and nullability percentages
      expect(hasNullBio || hasNullPhone || hasNullPicture).toBe(true);
    });

    it('should produce consistent null patterns with same seed', () => {
      factory.setSeed(123);
      const people1 = factory.getPeople();
      
      factory.setSeed(123);
      const people2 = factory.getPeople();
      
      expect(people1.map(p => p.bio)).toEqual(people2.map(p => p.bio));
      expect(people1.map(p => p.phone)).toEqual(people2.map(p => p.phone));
      expect(people1.map(p => p.picture)).toEqual(people2.map(p => p.picture));
    });
  });

  describe('Data Loading', () => {
    it('should load new data package', () => {
      const newPackage: DataPackage = {
        people: [
          {
            id: 'new1',
            fullName: 'New Person',
            bio: 'New bio',
            email: 'new@example.test',
            phone: '+1111111111',
            picture: 'https://example.com/new.jpg',
            tags: ['new'],
            groupMemberships: []
          }
        ],
        groups: [],
        events: []
      };

      factory.loadData(newPackage);
      const people = factory.getPeople();
      expect(people).toHaveLength(1);
      expect(people[0].fullName).toBe('New Person');
    });
  });
});