import { DataFactory } from './DataFactory.js';
export class DataPackageValidator {
    constructor(dataPackage, options = {}) {
        this.dataPackage = dataPackage;
        this.options = {
            datasetName: options.datasetName || 'Dataset',
            minBirthYear: options.minBirthYear || 300,
            maxBirthYear: options.maxBirthYear || 2010,
            requirePronouns: options.requirePronouns ?? true,
            requireDateOfBirth: options.requireDateOfBirth ?? true,
            minBioLength: options.minBioLength || 50,
            containsFirstNationsPeople: options.containsFirstNationsPeople ?? false,
            validateImageUrls: options.validateImageUrls ?? true,
            validateReferenceUrls: options.validateReferenceUrls ?? true,
            httpTimeout: options.httpTimeout || 10000,
            customValidations: options.customValidations || []
        };
        // Initialize DataFactory with appropriate options
        this.factory = new DataFactory(dataPackage, {
            acknowledgeDeceasedFirstNations: this.options.containsFirstNationsPeople
        });
    }
    async validate() {
        const errors = [];
        const warnings = [];
        try {
            // Validate basic structure
            this.validateStructure(errors);
            // Validate people
            this.validatePeople(errors, warnings);
            // Validate groups
            this.validateGroups(errors);
            // Validate events
            this.validateEvents(errors);
            // Validate relationships
            this.validateRelationships(errors);
            // Validate First Nations handling
            this.validateFirstNationsHandling(errors, warnings);
            // Validate HTTP resources (async)
            if (this.options.validateImageUrls || this.options.validateReferenceUrls) {
                await this.validateHttpResources(errors, warnings);
            }
        }
        catch (error) {
            errors.push(`Validation failed with error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            totalPeople: this.dataPackage.people.length,
            totalGroups: this.dataPackage.groups.length,
            totalEvents: this.dataPackage.events.length
        };
    }
    validateStructure(errors) {
        if (!this.dataPackage) {
            errors.push('DataPackage is null or undefined');
            return;
        }
        if (!Array.isArray(this.dataPackage.people)) {
            errors.push('DataPackage.people must be an array');
        }
        if (!Array.isArray(this.dataPackage.groups)) {
            errors.push('DataPackage.groups must be an array');
        }
        if (!Array.isArray(this.dataPackage.events)) {
            errors.push('DataPackage.events must be an array');
        }
        if (!this.dataPackage.metadata) {
            errors.push('DataPackage.metadata is required');
        }
    }
    validatePeople(errors, warnings) {
        // Use original data directly for validation, not processed data
        const people = this.dataPackage.people;
        if (people.length === 0) {
            warnings.push('Dataset contains no people');
            return;
        }
        people.forEach((person, index) => {
            const personErrors = this.validatePerson(person, index);
            errors.push(...personErrors);
            // Run custom validations
            this.options.customValidations.forEach(customValidation => {
                const customErrors = customValidation(person, index);
                errors.push(...customErrors);
            });
        });
    }
    validatePerson(person, index) {
        const errors = [];
        const personId = person.fullName || person.preferredName || `Person ${index}`;
        // Required fields
        if (!person.id)
            errors.push(`${personId}: missing id field`);
        if (!person.fullName)
            errors.push(`${personId}: missing fullName field`);
        if (!person.email)
            errors.push(`${personId}: missing email field`);
        if (!Array.isArray(person.tags))
            errors.push(`${personId}: tags must be an array`);
        if (!Array.isArray(person.groupMemberships))
            errors.push(`${personId}: groupMemberships must be an array`);
        // Bio validation
        if (person.bio === null || person.bio === undefined) {
            errors.push(`${personId}: missing bio field`);
        }
        else if (typeof person.bio === 'string' && person.bio.length < this.options.minBioLength) {
            errors.push(`${personId}: bio too short (${person.bio.length} chars, minimum ${this.options.minBioLength})`);
        }
        // Date of birth validation
        if (this.options.requireDateOfBirth) {
            if (!person.dateOfBirth) {
                errors.push(`${personId}: missing dateOfBirth field`);
            }
            else if (!(person.dateOfBirth instanceof Date)) {
                errors.push(`${personId}: dateOfBirth must be a Date object`);
            }
            else {
                const birthYear = person.dateOfBirth.getFullYear();
                if (birthYear < this.options.minBirthYear || birthYear > this.options.maxBirthYear) {
                    errors.push(`${personId}: unrealistic birth year ${birthYear} (expected ${this.options.minBirthYear}-${this.options.maxBirthYear})`);
                }
            }
        }
        // Pronouns validation
        if (this.options.requirePronouns) {
            if (!person.pronouns) {
                errors.push(`${personId}: missing pronouns field`);
            }
            else if (typeof person.pronouns !== 'string') {
                errors.push(`${personId}: pronouns must be a string`);
            }
            else if (!['she/her', 'he/him', 'they/them'].includes(person.pronouns)) {
                errors.push(`${personId}: invalid pronouns "${person.pronouns}" (expected: she/her, he/him, they/them)`);
            }
        }
        // Email format validation
        if (person.email && !/^[^\s@]+@[^\s@]+\.test$/.test(person.email)) {
            errors.push(`${personId}: email must use .test domain for fake data`);
        }
        // Phone format validation (if present)
        if (person.phone && !/555|test|-55-5/i.test(person.phone)) {
            errors.push(`${personId}: phone number must be clearly fake (contain 555 or test)`);
        }
        // Tags validation
        if (person.tags.length === 0) {
            errors.push(`${personId}: must have at least one tag`);
        }
        else {
            person.tags.forEach(tag => {
                if (typeof tag !== 'string') {
                    errors.push(`${personId}: all tags must be strings`);
                }
                else if (!/^[a-z0-9-]+$/.test(tag)) {
                    errors.push(`${personId}: tag "${tag}" must be lowercase with hyphens only`);
                }
            });
        }
        // Group memberships validation
        if (person.groupMemberships.length === 0) {
            errors.push(`${personId}: must belong to at least one group`);
        }
        // Picture URL validation (if present)
        if (person.picture && !/^https?:\/\/.+/.test(person.picture)) {
            errors.push(`${personId}: picture must be a valid HTTP/HTTPS URL`);
        }
        return errors;
    }
    validateGroups(errors) {
        this.dataPackage.groups.forEach((group, index) => {
            if (!group.id)
                errors.push(`Group ${index}: missing id field`);
            if (!group.name)
                errors.push(`Group ${index}: missing name field`);
            if (!group.about)
                errors.push(`Group ${index}: missing about field`);
            if (group.about && group.about.length < 20) {
                errors.push(`Group ${index} (${group.name}): about field too short (minimum 20 characters)`);
            }
            // Email format validation (if present)
            if (group.email && !/^[^\s@]+@[^\s@]+\.test$/.test(group.email)) {
                errors.push(`Group ${index} (${group.name}): email must use .test domain`);
            }
            // Website URL validation (if present)
            if (group.website && !/^https?:\/\/.+/.test(group.website)) {
                errors.push(`Group ${index} (${group.name}): website must be a valid HTTP/HTTPS URL`);
            }
        });
    }
    validateEvents(errors) {
        this.dataPackage.events.forEach((event, index) => {
            if (!event.id)
                errors.push(`Event ${index}: missing id field`);
            if (!event.name)
                errors.push(`Event ${index}: missing name field`);
            if (!event.date)
                errors.push(`Event ${index}: missing date field`);
            if (event.date && !(event.date instanceof Date)) {
                errors.push(`Event ${index}: date must be a Date object`);
            }
            if (!Array.isArray(event.attendeeIds)) {
                errors.push(`Event ${index}: attendeeIds must be an array`);
            }
            if (event.name && event.name.length < 10) {
                errors.push(`Event ${index}: name too short (minimum 10 characters)`);
            }
        });
    }
    validateRelationships(errors) {
        const groupIds = new Set(this.dataPackage.groups.map(g => g.id));
        const peopleIds = new Set(this.dataPackage.people.map(p => p.id));
        // Validate group memberships
        this.dataPackage.people.forEach(person => {
            const personId = person.fullName || person.preferredName || person.id;
            person.groupMemberships.forEach(groupId => {
                if (!groupIds.has(groupId)) {
                    errors.push(`${personId}: references non-existent group "${groupId}"`);
                }
            });
        });
        // Validate event attendees
        this.dataPackage.events.forEach(event => {
            event.attendeeIds.forEach(attendeeId => {
                if (!peopleIds.has(attendeeId)) {
                    errors.push(`Event "${event.name}": references non-existent person "${attendeeId}"`);
                }
            });
        });
        // Check for unique IDs
        const allPersonIds = this.dataPackage.people.map(p => p.id);
        const uniquePersonIds = new Set(allPersonIds);
        if (uniquePersonIds.size !== allPersonIds.length) {
            errors.push('Duplicate person IDs found');
        }
        const allGroupIds = this.dataPackage.groups.map(g => g.id);
        const uniqueGroupIds = new Set(allGroupIds);
        if (uniqueGroupIds.size !== allGroupIds.length) {
            errors.push('Duplicate group IDs found');
        }
        const allEventIds = this.dataPackage.events.map(e => e.id);
        const uniqueEventIds = new Set(allEventIds);
        if (uniqueEventIds.size !== allEventIds.length) {
            errors.push('Duplicate event IDs found');
        }
    }
    validateFirstNationsHandling(errors, warnings) {
        const firstNationsPeople = this.dataPackage.people.filter(person => person.isFirstNations);
        const metadataFlags = this.dataPackage.metadata?.containsFirstNationsPeople;
        if (firstNationsPeople.length > 0 && !metadataFlags) {
            errors.push('Dataset contains First Nations people but metadata.containsFirstNationsPeople is not set to true');
        }
        if (firstNationsPeople.length === 0 && metadataFlags) {
            warnings.push('metadata.containsFirstNationsPeople is true but no people have isFirstNations flag');
        }
        // Validate First Nations people have appropriate cultural markers
        firstNationsPeople.forEach(person => {
            const personId = person.fullName || person.preferredName || person.id;
            const hasIndigenousMarkers = person.tags.some(tag => tag.includes('indigenous') ||
                tag.includes('first-nations') ||
                tag.includes('native') ||
                tag.includes('aboriginal') ||
                tag.includes('inuit') ||
                tag.includes('maori') ||
                tag.includes('sami')) ||
                (person.bio && (person.bio.toLowerCase().includes('indigenous') ||
                    person.bio.toLowerCase().includes('first nations') ||
                    person.bio.toLowerCase().includes('native') ||
                    person.bio.toLowerCase().includes('aboriginal') ||
                    person.bio.toLowerCase().includes('tribal') ||
                    person.bio.toLowerCase().includes('traditional')));
            if (!hasIndigenousMarkers) {
                errors.push(`${personId}: marked as First Nations but lacks Indigenous cultural markers in tags or bio`);
            }
        });
    }
    /**
     * Create a test function that can be used in vitest/jest tests
     */
    static createValidationTest(dataPackage, options = {}) {
        return async (expect) => {
            const validator = new DataPackageValidator(dataPackage, options);
            const result = await validator.validate();
            if (!result.isValid) {
                console.error(`\n${options.datasetName || 'Dataset'} validation errors:`);
                result.errors.forEach(error => console.error(`  ❌ ${error}`));
                if (result.warnings.length > 0) {
                    console.warn(`\n${options.datasetName || 'Dataset'} warnings:`);
                    result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
                }
            }
            expect(result.errors.length, `Found ${result.errors.length} validation errors. See console for details.`).toBe(0);
            return result;
        };
    }
    /**
     * Create comprehensive test suite for a data package
     */
    static createTestSuite(dataPackage, options = {}) {
        const validator = new DataPackageValidator(dataPackage, options);
        return {
            'should have valid data structure': (expect) => validator.createStructureTest(expect),
            'should have complete required fields for all people': (expect) => validator.createCompletenessTest(expect),
            'should have valid relationships between people, groups, and events': (expect) => validator.createRelationshipTest(expect),
            'should have proper First Nations handling': (expect) => validator.createFirstNationsTest(expect),
            'should meet data quality standards': (expect) => validator.createQualityTest(expect)
        };
    }
    createStructureTest(expect) {
        const errors = [];
        this.validateStructure(errors);
        expect(errors.length, `Structure errors: ${errors.join(', ')}`).toBe(0);
    }
    createCompletenessTest(expect) {
        const errors = [];
        const warnings = [];
        this.validatePeople(errors, warnings);
        if (errors.length > 0) {
            console.error(`\n${this.options.datasetName} completeness errors:`);
            errors.forEach(error => console.error(`  ❌ ${error}`));
        }
        expect(errors.length, `Found ${errors.length} completeness errors. See console for details.`).toBe(0);
    }
    createRelationshipTest(expect) {
        const errors = [];
        this.validateRelationships(errors);
        expect(errors.length, `Relationship errors: ${errors.join(', ')}`).toBe(0);
    }
    createFirstNationsTest(expect) {
        const errors = [];
        const warnings = [];
        this.validateFirstNationsHandling(errors, warnings);
        if (warnings.length > 0) {
            console.warn(`\n${this.options.datasetName} First Nations warnings:`);
            warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
        }
        expect(errors.length, `First Nations handling errors: ${errors.join(', ')}`).toBe(0);
    }
    createQualityTest(expect) {
        const errors = [];
        this.validateGroups(errors);
        this.validateEvents(errors);
        expect(errors.length, `Quality errors: ${errors.join(', ')}`).toBe(0);
    }
    async validateHttpResources(errors, warnings) {
        const urlsToCheck = [];
        // Collect URLs from people (use original data, not processed)
        this.dataPackage.people.forEach(person => {
            const personName = person.fullName || person.preferredName || person.id;
            if (this.options.validateImageUrls && person.picture) {
                urlsToCheck.push({
                    url: person.picture,
                    type: 'image',
                    personName
                });
            }
            if (this.options.validateReferenceUrls && person.reference) {
                urlsToCheck.push({
                    url: person.reference,
                    type: 'reference',
                    personName
                });
            }
        });
        // Collect URLs from groups
        this.dataPackage.groups.forEach(group => {
            if (this.options.validateImageUrls && group.picture) {
                urlsToCheck.push({
                    url: group.picture,
                    type: 'image',
                    personName: `Group: ${group.name}`
                });
            }
            if (this.options.validateReferenceUrls && group.website) {
                urlsToCheck.push({
                    url: group.website,
                    type: 'reference',
                    personName: `Group: ${group.name}`
                });
            }
        });
        // Validate URLs in batches to avoid overwhelming servers
        const batchSize = 5;
        const results = [];
        for (let i = 0; i < urlsToCheck.length; i += batchSize) {
            const batch = urlsToCheck.slice(i, i + batchSize);
            const batchPromises = batch.map(item => this.checkUrl(item.url, item.type, item.personName));
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    }
                    else {
                        results.push({
                            ...batch[index],
                            error: `Request failed: ${result.reason}`
                        });
                    }
                });
                // Small delay between batches to be respectful to servers
                if (i + batchSize < urlsToCheck.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                warnings.push(`Batch URL validation failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Process results
        results.forEach(result => {
            if (result.error) {
                errors.push(`${result.personName}: ${result.type} URL "${result.url}" - ${result.error}`);
            }
            else if (result.status && result.status >= 400) {
                errors.push(`${result.personName}: ${result.type} URL "${result.url}" returns HTTP ${result.status}`);
            }
            else if (result.type === 'image' && result.contentType) {
                // Check if image URL returns actual image content
                if (!result.contentType.startsWith('image/') && !result.contentType.includes('html')) {
                    warnings.push(`${result.personName}: image URL "${result.url}" returns non-image content-type: ${result.contentType}`);
                }
                else if (result.contentType.includes('html')) {
                    errors.push(`${result.personName}: image URL "${result.url}" returns HTML content instead of image`);
                }
            }
            else if (result.type === 'reference' && result.contentType) {
                // Reference URLs should be valid web content
                if (!result.contentType.includes('html') && !result.contentType.includes('text') && !result.contentType.includes('json')) {
                    warnings.push(`${result.personName}: reference URL "${result.url}" returns unexpected content-type: ${result.contentType}`);
                }
            }
        });
    }
    async checkUrl(url, type, personName) {
        // Skip placeholder URLs
        if (url.includes('placeholder.test') || url.includes('example.com') || url.includes('test.com')) {
            throw new Error('Placeholder URL should be replaced with real content');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.httpTimeout);
        try {
            const response = await fetch(url, {
                method: 'HEAD', // Use HEAD to avoid downloading full content
                signal: controller.signal,
                headers: {
                    'User-Agent': 'DataPackageValidator/1.0 (+test-data-validation)'
                }
            });
            clearTimeout(timeoutId);
            return {
                url,
                type,
                personName,
                status: response.status,
                contentType: response.headers.get('content-type') || 'unknown'
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Timeout after ${this.options.httpTimeout}ms`);
                }
                throw new Error(error.message);
            }
            throw error;
        }
    }
}
