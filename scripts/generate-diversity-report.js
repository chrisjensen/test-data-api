#!/usr/bin/env node

import { generateDiversityReport } from './diversity-analyzer.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create synthetic test data to demonstrate DataFactory capabilities
const createSyntheticDataPackage = (sampleSize = 1000) => {
  const syntheticPeople = [];
  const regions = ['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania'];
  const countries = {
    'North America': ['United States', 'Canada', 'Mexico'],
    'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Poland', 'Russia'],
    'Asia': ['China', 'Japan', 'India', 'South Korea', 'Indonesia', 'Thailand'],
    'Africa': ['Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana'],
    'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia'],
    'Oceania': ['Australia', 'New Zealand']
  };
  const pronounOptions = ['she/her', 'he/him', 'they/them'];
  
  for (let i = 0; i < sampleSize; i++) {
    const region = regions[i % regions.length];
    const countryList = countries[region];
    const country = countryList[i % countryList.length];
    const pronouns = pronounOptions[i % pronounOptions.length];
    
    syntheticPeople.push({
      id: `person-${i}`,
      fullName: `Person ${i}`,
      dateOfBirth: new Date(1950 + (i % 70), i % 12, (i % 28) + 1),
      pronouns: pronouns,
      bio: `Sample person from ${country}`,
      email: `person${i}@example.test`,
      phone: i % 3 === 0 ? `+1-555-${String(i).padStart(4, '0')}` : null,
      picture: i % 4 === 0 ? `https://example.com/pic${i}.jpg` : null,
      tags: ['sample', 'synthetic'],
      groupMemberships: [],
      address: i % 2 === 0 ? {
        street: `${i} Main St`,
        city: `City ${i}`,
        state: `State ${i}`,
        country: country,
        zipCode: String(i).padStart(5, '0')
      } : undefined
    });
  }
  
  return {
    people: syntheticPeople,
    groups: [],
    events: [],
    metadata: { containsFirstNationsPeople: false }
  };
};

// Generate and save the report
try {
  const sampleSize = process.argv[2] ? parseInt(process.argv[2]) : 1000;
  const testDataPackage = createSyntheticDataPackage(sampleSize);
  const outputPath = join(__dirname, '..', 'DIVERSITY_REPORT.md');
  
  generateDiversityReport(testDataPackage, outputPath, {
    datasetName: 'Test Data API',
    includeUnicodeAnalysis: false
  });
  
} catch (error) {
  console.error('❌ Error generating diversity report:', error);
  process.exit(1);
}