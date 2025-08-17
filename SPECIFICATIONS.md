# Test Data API Specifications

## 1. Overview
A simple, deterministic test data API that accepts data packages and provides fast retrieval methods. The API handles seeding for deterministic results and provides basic querying capabilities for developing complex test scenarios.

## 2. Architecture
- **API Package**: Core library that handles data loading, seeding, and retrieval
- **Data Package**: Separate package containing the actual test data (people, groups, events)
- Data packages are plugged into the API at runtime

## 3. API Methods

### 3.1 Initialization
```
loadData(dataPackage, options?)
```
Loads a data package into the API. The data package contains all people, groups, and events.

Options object supports:
- `acknowledgeDeceasedFirstNations: boolean` - Required flag when loading data packages containing First Nations people. Must be set to `true` to confirm that the user has been appropriately warned about viewing names/images of potentially deceased First Nations people.

### 3.2 Seed Management
```
setSeed(number)
```
Sets the random seed for deterministic data selection, ordering, and nullable field generation.

```
getSeed()
```
Returns the current seed value.

### 3.3 People Retrieval
```
getPeople(count)
```
Returns array of people from the dataset. If count is provided, returns that many people (deterministic based on current seed). If no count provided, returns all people.

```
getPerson(id)
```
Returns a single person by their unique identifier, or null if not found.

```
getPersonByEmail(email)
```
Returns a single person by their email address, or null if not found.

### 3.4 Groups Retrieval
```
getGroups(count)
```
Returns array of groups from the dataset. If count is provided, returns that many groups (deterministic based on current seed). If no count provided, returns all groups.

```
getGroup(id)
```
Returns a single group by its unique identifier, or null if not found.

### 3.5 Events Retrieval
```
getEvents(count)
```
Returns array of events from the dataset. If count is provided, returns that many events (deterministic based on current seed). If no count provided, returns all events.

```
getEvent(id)
```
Returns a single event by its unique identifier, or null if not found.

### 3.6 Simple Filtering
```
getPeopleByTag(tag)
```
Returns array of people who have the specified tag.

```
getPeopleInGroup(groupId)
```
Returns array of people who belong to the specified group.

## 4. Data Package Format
Data packages must provide objects with these structures:

### 4.1 Person Object
- id: string (required)
- fullName: string (required)
- bio: string (nullable, 20% null by default)
- email: string (required)
- phone: string (nullable, 65% null by default)
- picture: string (nullable, 25% null by default)
- tags: array of strings (required)
- groupMemberships: array of group IDs (required)
- reference: string (optional, 10% null by default) - Reference URL for verification
- address: Address object (optional, 15% null by default) - Physical address information
- quote: string (optional, 20% null by default) - Notable quote from the person

### 4.2 Group Object
- id: string (required)
- name: string (required)
- about: string (required)
- email: string (nullable, 30% null by default)
- website: string (nullable, 40% null by default)
- picture: string (nullable, 50% null by default)
- reference: string (optional, 85% null by default) - Reference URL for verification

### 4.3 Address Object
- street: string (required)
- city: string (required)
- state: string (required)
- country: string (required)
- zipCode: string (required)

### 4.4 Event Object
- id: string (required)
- name: string (required)
- date: Date object (required)
- attendeeIds: array of person IDs (required)

## 5. Performance Requirements
- Library initialization: Under 100ms
- Individual record retrieval: Under 1ms
- Random selection operations: Under 10ms
- Memory efficient for datasets up to 1000 records total

## 6. First Nations Cultural Sensitivity

### 6.1 Data Package Metadata
Data packages must declare if they contain First Nations people via metadata:
```
dataPackage.metadata = {
  containsFirstNationsPeople: boolean
}
```

### 6.2 Loading First Nations Data
When loading a data package containing First Nations people:
- The `acknowledgeDeceasedFirstNations` flag must be set to `true` in the options
- If flag is not provided or is `false`, the data package will not be loaded
- No First Nations people will be available through any retrieval methods

### 6.3 Cultural Considerations
- The API assumes any First Nations person in the dataset may have passed away since publishing of the data set
- Some First Nations communities have cultural protocols about viewing names/images of deceased people
- Applications using this data must warn users appropriately before loading First Nations data packages
- A library may flag individual persons as First Nations
- A library may flat the entire dataset as being First Nations
- Out of respect for First Nations protocols around deceased persons, First Nations people are by default excluded unless the application explicitly indicates that it has provided suitable warning that the examples may contain deceased persons

### 6.4 Error Messages
If `getPeople()` returns zero results due to First Nations data being filtered out:
- Error message must clearly indicate the reason: "No people available. This dataset contains First Nations people and requires acknowledgment of cultural protocols regarding deceased persons. Please reload with appropriate acknowledgment flag or load a different or additional dataset."

## 7. Error Handling
- Invalid IDs return null rather than throwing errors
- Missing data packages throw clear initialization errors
- Invalid seed values fall back to default seed (0)
- First Nations data access without acknowledgment returns empty results with specific error message