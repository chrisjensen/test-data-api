#!/usr/bin/env node

import { DataFactory } from '../dist/DataFactory.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Geography mapping based on various data patterns
const getGeographicInfo = (person) => {
  const email = person.email || '';
  const address = person.address;
  const tags = person.tags || [];
  const name = person.fullName || person.preferredName || person.englishName || '';
  const bio = person.bio || '';
  
  // Use address if available (most reliable)
  if (address && address.country) {
    const country = address.country;
    return mapCountryToRegion(country);
  }
  
  // Geography mapping based on tags and biographical information (for STEM data)
  if (tags.includes('american') || tags.includes('nasa') || tags.includes('african-american') || 
      tags.includes('asian-american') || tags.includes('indian-american') || bio.includes('NASA') || 
      bio.includes('United States') || bio.includes('American')) {
    return { region: 'North America', country: 'United States' };
  }
  
  if (tags.includes('british') || bio.includes('British') || bio.includes('Cambridge') || 
      bio.includes('Oxford') || bio.includes('London')) {
    return { region: 'Europe', country: 'United Kingdom' };
  }
  
  if (tags.includes('chinese') || name.includes('吳') || name.includes('王') || 
      person.preferredName?.includes('Wáng') || person.preferredName?.includes('Wú')) {
    return { region: 'Asia', country: 'China' };
  }
  
  if (tags.includes('russian') || name.includes('Софья') || name.includes('Васильевна') || 
      tags.includes('soviet')) {
    return { region: 'Europe', country: 'Russia' };
  }
  
  if (tags.includes('french') || tags.includes('polish-french') || bio.includes('Sorbonne') || 
      bio.includes('France') || bio.includes('French')) {
    return { region: 'Europe', country: 'France' };
  }
  
  if (tags.includes('german') || bio.includes('German') || bio.includes('Germany')) {
    return { region: 'Europe', country: 'Germany' };
  }
  
  if (tags.includes('italian') || bio.includes('Italian') || bio.includes('Italy')) {
    return { region: 'Europe', country: 'Italy' };
  }
  
  if (tags.includes('polish') || name.includes('Skłodowska') || bio.includes('Polish')) {
    return { region: 'Europe', country: 'Poland' };
  }
  
  if (tags.includes('austrian') || tags.includes('austrian-swedish') || bio.includes('Austrian')) {
    return { region: 'Europe', country: 'Austria' };
  }
  
  if (tags.includes('greek') || name.includes('Hypatia') || bio.includes('Alexandria')) {
    return { region: 'Europe', country: 'Greece' };
  }
  
  if (tags.includes('danish') || bio.includes('Danish') || bio.includes('Denmark')) {
    return { region: 'Europe', country: 'Denmark' };
  }
  
  // Indian scientists
  if (name.includes('श्रीनिवास') || name.includes('चन्द्रशेखर') || 
      person.englishName?.includes('Ramanujan') || person.englishName?.includes('Raman') || 
      person.englishName?.includes('Kalam') || tags.includes('indian')) {
    return { region: 'Asia', country: 'India' };
  }
  
  // Indonesian scientist
  if (person.englishName?.includes('Hassan') && bio.includes('Indonesia')) {
    return { region: 'Asia', country: 'Indonesia' };
  }
  
  // African scientists
  if (person.englishName?.includes('Diop') && bio.includes('Senegal')) {
    return { region: 'Africa', country: 'Senegal' };
  }
  
  if (person.englishName?.includes('Maathai') && bio.includes('Kenya')) {
    return { region: 'Africa', country: 'Kenya' };
  }
  
  if (person.englishName?.includes('Lambo') && bio.includes('Nigeria')) {
    return { region: 'Africa', country: 'Nigeria' };
  }
  
  if (person.englishName?.includes('Karim') && bio.includes('South Africa')) {
    return { region: 'Africa', country: 'South Africa' };
  }
  
  // Fallback to email domain patterns
  if (email.includes('.us') || email.includes('@example.com') || email.includes('@test.com')) {
    return { region: 'North America', country: 'United States' };
  }
  if (email.includes('.uk') || email.includes('.co.uk')) {
    return { region: 'Europe', country: 'United Kingdom' };
  }
  if (email.includes('.de')) {
    return { region: 'Europe', country: 'Germany' };
  }
  if (email.includes('.fr')) {
    return { region: 'Europe', country: 'France' };
  }
  if (email.includes('.cn')) {
    return { region: 'Asia', country: 'China' };
  }
  if (email.includes('.in')) {
    return { region: 'Asia', country: 'India' };
  }
  if (email.includes('.au')) {
    return { region: 'Oceania', country: 'Australia' };
  }
  
  // Default fallback
  return { region: 'Not Specified', country: 'Not Specified' };
};

const mapCountryToRegion = (country) => {
  // Map countries to regions
  if (['United States', 'Canada', 'Mexico'].includes(country)) {
    return { region: 'North America', country };
  }
  if (['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Poland', 'Russia', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Austria', 'Greece'].includes(country)) {
    return { region: 'Europe', country };
  }
  if (['China', 'Japan', 'India', 'South Korea', 'Thailand', 'Singapore', 'Indonesia', 'Philippines'].includes(country)) {
    return { region: 'Asia', country };
  }
  if (['Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana', 'Morocco', 'Senegal'].includes(country)) {
    return { region: 'Africa', country };
  }
  if (['Australia', 'New Zealand', 'Fiji'].includes(country)) {
    return { region: 'Oceania', country };
  }
  if (['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'].includes(country)) {
    return { region: 'South America', country };
  }
  
  return { region: 'Other', country };
};

export class DiversityAnalyzer {
  constructor(dataPackage, options = {}) {
    this.dataPackage = dataPackage;
    this.options = {
      includeUnicodeAnalysis: options.includeUnicodeAnalysis || false,
      datasetName: options.datasetName || 'Dataset',
      acknowledgeDeceasedFirstNations: options.acknowledgeDeceasedFirstNations || false,
      ...options
    };
  }

  analyze() {
    const factory = new DataFactory(this.dataPackage, {
      acknowledgeDeceasedFirstNations: this.options.acknowledgeDeceasedFirstNations
    });
    const people = factory.getPeople();
    
    // Geographic analysis
    const geographic = {};
    const countryStats = {};
    const regionStats = {};
    
    // Pronoun analysis
    const pronouns = {};
    
    // Field completeness
    const fieldStats = {
      withAddress: 0,
      withoutAddress: 0,
      withDateOfBirth: 0,
      withoutDateOfBirth: 0,
      withPronouns: 0,
      withoutPronouns: 0,
      withBio: 0,
      withoutBio: 0
    };

    // Unicode analysis (if enabled)
    const unicodeStats = {
      containsUnicode: 0,
      asciiOnly: 0
    };
    
    people.forEach(person => {
      // Geography
      const geo = getGeographicInfo(person);
      const key = `${geo.region} - ${geo.country}`;
      geographic[key] = (geographic[key] || 0) + 1;
      regionStats[geo.region] = (regionStats[geo.region] || 0) + 1;
      countryStats[geo.country] = (countryStats[geo.country] || 0) + 1;
      
      // Pronouns
      const pronoun = person.pronouns || 'Not specified';
      pronouns[pronoun] = (pronouns[pronoun] || 0) + 1;
      
      // Field completeness
      if (person.address) fieldStats.withAddress++;
      else fieldStats.withoutAddress++;
      
      if (person.dateOfBirth) fieldStats.withDateOfBirth++;
      else fieldStats.withoutDateOfBirth++;
      
      if (person.pronouns) fieldStats.withPronouns++;
      else fieldStats.withoutPronouns++;
      
      if (person.bio) fieldStats.withBio++;
      else fieldStats.withoutBio++;

      // Unicode analysis
      if (this.options.includeUnicodeAnalysis) {
        const fullName = person.fullName || '';
        const preferredName = person.preferredName || '';
        if (this.containsNonAscii(fullName + preferredName)) {
          unicodeStats.containsUnicode++;
        } else {
          unicodeStats.asciiOnly++;
        }
      }
    });
    
    return {
      totalPeople: people.length,
      geographic,
      regionStats,
      countryStats,
      pronouns,
      fieldStats,
      unicodeStats: this.options.includeUnicodeAnalysis ? unicodeStats : null
    };
  }

  containsNonAscii(str) {
    return /[^\u0000-\u007F]/.test(str);
  }

  generateReport(outputPath) {
    const analysis = this.analyze();
    const now = new Date().toISOString().split('T')[0];
    
    let markdown = `# ${this.options.datasetName} - Diversity Report

*Generated on ${now}*
*Total People: ${analysis.totalPeople}*

## Geographic Distribution

### By Region
| Region | Count | Percentage |
|--------|-------|------------|
`;

    Object.entries(analysis.regionStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([region, count]) => {
        const percentage = ((count / analysis.totalPeople) * 100).toFixed(1);
        markdown += `| ${region} | ${count} | ${percentage}% |\n`;
      });

    markdown += `\n### Top Countries
| Country | Count | Percentage |
|---------|-------|------------|
`;

    Object.entries(analysis.countryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Top 15 countries
      .forEach(([country, count]) => {
        const percentage = ((count / analysis.totalPeople) * 100).toFixed(1);
        markdown += `| ${country} | ${count} | ${percentage}% |\n`;
      });

    markdown += `\n### Detailed Geographic Breakdown
| Region - Country | Count | Percentage |
|------------------|-------|------------|
`;

    Object.entries(analysis.geographic)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        const percentage = ((count / analysis.totalPeople) * 100).toFixed(1);
        markdown += `| ${location} | ${count} | ${percentage}% |\n`;
      });

    markdown += `\n## Pronoun Distribution

| Pronouns | Count | Percentage |
|----------|-------|------------|
`;

    Object.entries(analysis.pronouns)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pronoun, count]) => {
        const percentage = ((count / analysis.totalPeople) * 100).toFixed(1);
        markdown += `| ${pronoun} | ${count} | ${percentage}% |\n`;
      });

    markdown += `\n## Data Completeness

| Field | With Data | Without Data | Completion Rate |
|-------|-----------|--------------|-----------------|
| Address | ${analysis.fieldStats.withAddress} | ${analysis.fieldStats.withoutAddress} | ${((analysis.fieldStats.withAddress / analysis.totalPeople) * 100).toFixed(1)}% |
| Date of Birth | ${analysis.fieldStats.withDateOfBirth} | ${analysis.fieldStats.withoutDateOfBirth} | ${((analysis.fieldStats.withDateOfBirth / analysis.totalPeople) * 100).toFixed(1)}% |
| Pronouns | ${analysis.fieldStats.withPronouns} | ${analysis.fieldStats.withoutPronouns} | ${((analysis.fieldStats.withPronouns / analysis.totalPeople) * 100).toFixed(1)}% |
| Bio | ${analysis.fieldStats.withBio} | ${analysis.fieldStats.withoutBio} | ${((analysis.fieldStats.withBio / analysis.totalPeople) * 100).toFixed(1)}% |

## Diversity Metrics

### Geographic Diversity
- **Regions represented**: ${Object.keys(analysis.regionStats).filter(r => r !== 'Not Specified').length}
- **Countries represented**: ${Object.keys(analysis.countryStats).filter(c => c !== 'Not Specified').length}
- **North American representation**: ${((analysis.regionStats['North America'] || 0) / analysis.totalPeople * 100).toFixed(1)}%

### Gender Diversity
- **She/Her pronouns**: ${analysis.pronouns['she/her'] || 0} (${(((analysis.pronouns['she/her'] || 0) / analysis.totalPeople) * 100).toFixed(1)}%)
- **He/Him pronouns**: ${analysis.pronouns['he/him'] || 0} (${(((analysis.pronouns['he/him'] || 0) / analysis.totalPeople) * 100).toFixed(1)}%)
- **They/Them pronouns**: ${analysis.pronouns['they/them'] || 0} (${(((analysis.pronouns['they/them'] || 0) / analysis.totalPeople) * 100).toFixed(1)}%)
- **Other/Unspecified**: ${Object.entries(analysis.pronouns).filter(([p]) => !['she/her', 'he/him', 'they/them'].includes(p)).reduce((sum, [, count]) => sum + count, 0)}
`;

    if (analysis.unicodeStats) {
      markdown += `\n### Unicode Character Usage
- **Names with Unicode characters**: ${analysis.unicodeStats.containsUnicode} (${((analysis.unicodeStats.containsUnicode / analysis.totalPeople) * 100).toFixed(1)}%)
- **ASCII-only names**: ${analysis.unicodeStats.asciiOnly} (${((analysis.unicodeStats.asciiOnly / analysis.totalPeople) * 100).toFixed(1)}%)
`;
    }

    markdown += `\n---
*Report generated using test-data-factory diversity analyzer*
`;

    writeFileSync(outputPath, markdown, 'utf8');
    return markdown;
  }
}

// CLI usage
export const generateDiversityReport = (dataPackage, outputPath, options = {}) => {
  try {
    const analyzer = new DiversityAnalyzer(dataPackage, options);
    const report = analyzer.generateReport(outputPath);
    console.log(`✅ Diversity report generated: ${outputPath}`);
    return report;
  } catch (error) {
    console.error('❌ Error generating diversity report:', error);
    throw error;
  }
};

// Export for programmatic use
export { DiversityAnalyzer as default };