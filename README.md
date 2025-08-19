# Test Data Factory

A deterministic test data API that accepts data packages and provides fast retrieval methods. Perfect for creating consistent, repeatable test scenarios.

## Installation

```bash
npm install test-data-factory
```

## Basic Usage

```typescript
import DataFactory from 'test-data-factory';
import firstNationsData from 'first-nations-data-factory'; // Your data package

const factory = new DataFactory(firstNationsData);

// Get some people for your test
const users = factory.getPeople(3);

// Get a specific person
const user = factory.getPerson('person-id');

// Find by email
const userByEmail = factory.getPersonByEmail('test@example.test');
```

## Deterministic Testing

```typescript
// Set seed for consistent results
factory.setSeed(12345);
const users1 = factory.getPeople(5);

factory.setSeed(12345);
const users2 = factory.getPeople(5);

// users1 and users2 are identical
```

## API Reference

### Seed Management

- `setSeed(number)` - Sets random seed for deterministic results
- `getSeed()` - Returns current seed value

### People

- `getPeople(count?)` - Get people (all if no count, random selection if count provided)
- `getPerson(id)` - Get person by ID
- `getPersonByEmail(email)` - Get person by email
- `getPeopleByTag(tag)` - Filter people by tag
- `getPeopleInGroup(groupId)` - Get people in a group

### Groups

- `getGroups(count?)` - Get groups (all if no count, random selection if count provided)
- `getGroup(id)` - Get group by ID

### Events

- `getEvents(count?)` - Get events (all if no count, random selection if count provided)
- `getEvent(id)` - Get event by ID

## Image Validation

For datasets with image URLs, you can run separate image validation tests to ensure:

- Images return 200 status codes
- Content-Type headers indicate image files
- Response bodies don't contain HTML (prevents redirects to error pages)

```typescript
import { validateImageUrls } from 'test-data-factory';

// Run image validation separately (slower, uses bandwidth)
validateImageUrls(yourDataPackage, {
  datasetName: 'Your Dataset',
  httpTimeout: 15000, // 15 second timeout
  skipImageValidation: false
});

// Skip image validation (useful for CI/CD)
validateImageUrls(yourDataPackage, { skipImageValidation: true });
```

**Note:** Image validation is separate from the main validation suite because it:
- Makes HTTP requests (slower)
- Consumes bandwidth
- May timeout on slow connections
- Should be run selectively in development/testing

## Data Package Format

Your data package should export an object with:

```typescript
interface DataPackage {
  people: Person[];
  groups: Group[];
  events: Event[];
}

interface Person {
  id: string;
  fullName: string;
  bio: string | null;
  email: string;
  phone: string | null;
  picture: string | null;
  tags: string[];
  groupMemberships: string[];
}

interface Group {
  id: string;
  name: string;
  about: string;
  email: string | null;
  website: string | null;
  picture: string | null;
}

interface Event {
  id: string;
  name: string;
  date: Date;
  attendeeIds: string[];
}
```

## Nullable Fields

The library automatically makes certain fields nullable based on realistic percentages:

**Person:**
- `bio`: 20% null
- `phone`: 65% null  
- `picture`: 25% null

**Group:**
- `email`: 30% null
- `website`: 40% null
- `picture`: 50% null

This helps test scenarios where users haven't filled out all profile information.

## Performance

- Library initialization: < 100ms
- Individual record retrieval: < 1ms
- Random selection operations: < 10ms
- Memory efficient for datasets up to 1000 records

## Example Test

```typescript
import { describe, it, expect } from 'vitest';
import DataFactory from 'test-data-factory';
import myDataPackage from './my-data-package';

describe('User Service', () => {
  const factory = new DataFactory(myDataPackage);
  
  it('should handle user creation', () => {
    factory.setSeed(42); // Deterministic test data
    const testUser = factory.getPeople(1)[0];
    
    const result = userService.createUser(testUser);
    
    expect(result.email).toBe(testUser.email);
  });
});
```