#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';
const MODEL_NAME = 'bespoke-minicheck:7b';
const OUTPUT_FILE = path.join(__dirname, 'fact-check-errors.csv');

// CSV Headers
const CSV_HEADERS = 'dataset,person_id,person_name,error_type,description,confidence,reference_url,bio_excerpt\n';

class FactChecker {
  constructor() {
    this.errors = [];
  }

  /**
   * Fetch web content from URL
   */
  async fetchWebContent(url) {
    try {
      console.log(`  📡 Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BiographyFactChecker/1.0)',
        },
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract text content (basic HTML stripping)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (textContent.length < 100) {
        throw new Error('Content too short or unreadable');
      }

      console.log(`  ✅ Fetched ${textContent.length} characters`);
      return textContent;
    } catch (error) {
      console.log(`  ❌ Failed to fetch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query Ollama model for fact-checking
   */
  async queryOllama(prompt) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent fact-checking
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.log(`  ❌ Ollama query failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create fact-checking prompt
   */
  createFactCheckPrompt(bio, referenceContent, personName) {
    return `You are a professional fact-checker. Compare the biographical information against the reference source and identify any factual errors, contradictions, or false claims.

BIOGRAPHICAL TEXT TO CHECK:
"${bio}"

REFERENCE SOURCE CONTENT:
${referenceContent.substring(0, 8000)} // Limit content length

PERSON NAME: ${personName}

INSTRUCTIONS:
- Only flag CLEAR factual errors, contradictions, or false information
- Ignore minor stylistic differences or missing details
- Focus on: dates, achievements, affiliations, historical events, awards, family relations
- Do not flag information that is simply not mentioned in the reference (missing info is OK)
- Be specific about what is wrong

RESPONSE FORMAT:
If you find factual errors, respond with:
ERROR_FOUND|[confidence: high/medium/low]|[specific description of the factual error]|[relevant bio excerpt]

If no clear factual errors are found, respond with:
NO_ERRORS_FOUND

Examples:
- ERROR_FOUND|high|Bio states birth year as 1955 but reference shows 1957|"born in 1955"
- ERROR_FOUND|medium|Bio claims Nobel Prize winner but reference shows no Nobel Prize|"won the Nobel Prize"
- NO_ERRORS_FOUND

Your response:`;
  }

  /**
   * Parse Ollama response
   */
  parseFactCheckResponse(response) {
    const trimmedResponse = response.trim();
    
    if (trimmedResponse === 'NO_ERRORS_FOUND') {
      return null; // No errors found
    }

    if (trimmedResponse.startsWith('ERROR_FOUND|')) {
      const parts = trimmedResponse.split('|');
      if (parts.length >= 4) {
        return {
          confidence: parts[1],
          description: parts[2],
          bioExcerpt: parts[3],
        };
      }
    }

    // Fallback parsing for unexpected format
    if (trimmedResponse.toLowerCase().includes('error') || 
        trimmedResponse.toLowerCase().includes('incorrect') ||
        trimmedResponse.toLowerCase().includes('contradiction')) {
      return {
        confidence: 'low',
        description: 'Potential factual issue detected (parsing unclear)',
        bioExcerpt: trimmedResponse.substring(0, 100) + '...',
      };
    }

    return null; // No clear errors
  }

  /**
   * Fact-check a single person
   */
  async factCheckPerson(person, datasetName) {
    console.log(`\n🔍 Checking: ${person.fullName || person.englishName || person.preferredName}`);
    
    const personName = person.fullName || person.englishName || person.preferredName;
    const referenceUrl = person.reference;
    const bio = person.bio;

    // Check if reference URL exists
    if (!referenceUrl) {
      this.errors.push({
        dataset: datasetName,
        person_id: person.id,
        person_name: personName,
        error_type: 'url_unreachable',
        description: 'No reference URL provided',
        confidence: 'high',
        reference_url: '',
        bio_excerpt: bio.substring(0, 100) + '...',
      });
      return;
    }

    try {
      // Fetch reference content
      const referenceContent = await this.fetchWebContent(referenceUrl);

      // Query LLM for fact-checking
      console.log(`  🤖 Analyzing with ${MODEL_NAME}...`);
      const prompt = this.createFactCheckPrompt(bio, referenceContent, personName);
      const llmResponse = await this.queryOllama(prompt);
      
      // Parse response
      const error = this.parseFactCheckResponse(llmResponse);
      
      if (error) {
        console.log(`  ⚠️  Factual issue found: ${error.description}`);
        this.errors.push({
          dataset: datasetName,
          person_id: person.id,
          person_name: personName,
          error_type: 'factual_error',
          description: error.description,
          confidence: error.confidence,
          reference_url: referenceUrl,
          bio_excerpt: error.bioExcerpt,
        });
      } else {
        console.log(`  ✅ No factual errors detected`);
      }

    } catch (error) {
      // Handle fetch or analysis errors
      const errorType = error.message.includes('HTTP') || error.message.includes('timeout') 
        ? 'url_unreachable' 
        : 'content_unreadable';
      
      this.errors.push({
        dataset: datasetName,
        person_id: person.id,
        person_name: personName,
        error_type: errorType,
        description: error.message,
        confidence: 'high',
        reference_url: referenceUrl,
        bio_excerpt: bio.substring(0, 100) + '...',
      });
    }
  }

  /**
   * Process a dataset
   */
  async processDataset(datasetPath, datasetName) {
    console.log(`\n📊 Processing dataset: ${datasetName}`);
    
    try {
      // Import the dataset
      const { default: dataPackage } = await import(datasetPath);
      const actualData = dataPackage.default || dataPackage;
      const people = actualData.people || [];

      console.log(`Found ${people.length} people to fact-check`);

      // Process each person sequentially (natural rate limiting)
      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        console.log(`\n[${i + 1}/${people.length}]`);
        await this.factCheckPerson(person, datasetName);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Failed to process dataset ${datasetName}:`, error);
    }
  }

  /**
   * Write errors to CSV file
   */
  writeErrorsToCSV() {
    if (this.errors.length === 0) {
      console.log('\n🎉 No errors found! All biographical data appears factually accurate.');
      return;
    }

    console.log(`\n📝 Writing ${this.errors.length} errors to: ${OUTPUT_FILE}`);
    
    let csvContent = CSV_HEADERS;
    
    for (const error of this.errors) {
      const row = [
        error.dataset,
        error.person_id,
        `"${error.person_name}"`,
        error.error_type,
        `"${error.description.replace(/"/g, '""')}"`, // Escape quotes
        error.confidence,
        error.reference_url,
        `"${error.bio_excerpt.replace(/"/g, '""')}"`, // Escape quotes
      ].join(',');
      
      csvContent += row + '\n';
    }

    fs.writeFileSync(OUTPUT_FILE, csvContent);
    console.log('✅ Error report generated successfully!');
  }

  /**
   * Parse command line arguments for dataset paths
   */
  parseArguments() {
    const args = process.argv.slice(2);
    const datasets = [];
    
    // If no arguments provided, show usage
    if (args.length === 0) {
      console.log('Usage: node fact-check-bios.js <dataset-path> [dataset-name] [additional-dataset-path] [dataset-name] ...');
      console.log('');
      console.log('Examples:');
      console.log('  node fact-check-bios.js ../first-nations-activists-data/src/index.ts first-nations-activists');
      console.log('  node fact-check-bios.js ../stem-achievements-data/src/index.ts stem-achievements');
      console.log('  node fact-check-bios.js ../first-nations-activists-data/src/index.ts first-nations-activists ../stem-achievements-data/src/index.ts stem-achievements');
      process.exit(1);
    }
    
    // Parse pairs of path and name arguments
    for (let i = 0; i < args.length; i += 2) {
      const datasetPath = args[i];
      const datasetName = args[i + 1] || path.basename(path.dirname(datasetPath));
      
      if (datasetPath) {
        datasets.push({
          path: path.resolve(datasetPath),
          name: datasetName
        });
      }
    }
    
    return datasets;
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Starting biographical fact-checking process...');
    console.log(`Using model: ${MODEL_NAME}`);

    // Parse command line arguments
    const datasets = this.parseArguments();
    console.log(`📂 Processing ${datasets.length} dataset(s):`);
    datasets.forEach(dataset => {
      console.log(`   ${dataset.name}: ${dataset.path}`);
    });

    // Check if Ollama is running
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('Ollama not accessible');
      console.log('✅ Ollama connection verified');
    } catch (error) {
      console.error('❌ Cannot connect to Ollama. Make sure Ollama is running and the model is available.');
      console.error('Run: ollama pull bespoke-minicheck:7b');
      process.exit(1);
    }

    // Process datasets
    for (const dataset of datasets) {
      await this.processDataset(dataset.path, dataset.name);
    }

    // Generate report
    this.writeErrorsToCSV();

    console.log('\n🏁 Fact-checking complete!');
    console.log(`📊 Total errors found: ${this.errors.length}`);
    
    // Summary by error type
    const errorTypes = {};
    this.errors.forEach(error => {
      errorTypes[error.error_type] = (errorTypes[error.error_type] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }
}

// Run the fact-checker
const factChecker = new FactChecker();
factChecker.run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});