import DataFactory from './src/index.js';
import type { DataPackage } from './src/types.js';

// Example data package (this would typically come from a separate npm package)
const exampleDataPackage: DataPackage = {
  people: [
    {
      id: 'person1',
      fullName: 'Example Person One',
      bio: 'An example biographical entry',
      email: 'person1@example.test',
      phone: '+1234567890',
      picture: 'https://commons.wikimedia.org/wiki/Example.jpg',
      tags: ['environmental', 'activism'],
      groupMemberships: ['group1']
    },
    {
      id: 'person2', 
      fullName: 'Example Person Two',
      bio: 'Another example bio',
      email: 'person2@example.test',
      phone: '+0987654321',
      picture: 'https://commons.wikimedia.org/wiki/Example2.jpg',
      tags: ['education', 'community'],
      groupMemberships: ['group1', 'group2']
    }
  ],
  groups: [
    {
      id: 'group1',
      name: 'Example Organization',
      about: 'A sample organization for demonstration',
      email: 'contact@example-org.test',
      website: 'https://example-org.test',
      picture: 'https://commons.wikimedia.org/wiki/Logo.png'
    },
    {
      id: 'group2',
      name: 'Community Group',
      about: 'Local community organization',
      email: 'info@community.test',
      website: 'https://community.test',
      picture: null
    }
  ],
  events: [
    {
      id: 'event1',
      name: 'Annual Conference',
      date: new Date('2023-06-15'),
      attendeeIds: ['person1', 'person2']
    }
  ]
};

// Usage example
const factory = new DataFactory(exampleDataPackage);

console.log('=== Basic Usage ===');
console.log('All people:', factory.getPeople().map(p => p.fullName));
console.log('Random 1 person:', factory.getPeople(1)[0].fullName);

console.log('\n=== Deterministic Testing ===');
factory.setSeed(42);
const users1 = factory.getPeople(2);
factory.setSeed(42);
const users2 = factory.getPeople(2);
console.log('Same seed gives same results:', 
  users1.map(u => u.fullName).join(', ') === users2.map(u => u.fullName).join(', ')
);

console.log('\n=== Nullable Fields ===');
factory.setSeed(1);
const peopleWithNulls = factory.getPeople();
console.log('Nullable fields example:');
peopleWithNulls.forEach(person => {
  console.log(`${person.fullName}: bio=${person.bio ? 'present' : 'null'}, phone=${person.phone ? 'present' : 'null'}`);
});

console.log('\n=== Filtering ===');
console.log('Environmental activists:', factory.getPeopleByTag('environmental').map(p => p.fullName));
console.log('Group 1 members:', factory.getPeopleInGroup('group1').map(p => p.fullName));