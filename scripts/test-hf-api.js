#!/usr/bin/env node

import { config } from 'dotenv';
import { InferenceClient } from '@huggingface/inference';
config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_API_KEY;

console.log('Testing HuggingFace client...');

if (!HUGGINGFACE_API_KEY) {
  console.error('No API key found');
  process.exit(1);
}

const client = new InferenceClient(HUGGINGFACE_API_KEY);

const testModels = [
  'meta-llama/Llama-3.1-8B-Instruct',
  'deepseek-ai/DeepSeek-V3',
  'microsoft/DialoGPT-medium'
];

for (const model of testModels) {
  console.log(`\nTesting model: ${model}`);
  
  try {
    const result = await client.chatCompletion({
      model: model,
      messages: [
        { role: 'user', content: 'Is the sky blue? Answer with just YES or NO.' }
      ],
      max_tokens: 30,
      temperature: 0.1
    });
    
    console.log(`✅ ${model}: SUCCESS`);
    console.log(`   Response: ${result.choices[0].message.content}`);
    
    // Update the working model for later use
    console.log(`🎯 Found working model: ${model}`);
    break; // Use the first working model
    
  } catch (error) {
    console.log(`❌ ${model}: ${error.message}`);
    
    // Check if it's a quota error
    if (error.message.includes('quota') || error.message.includes('rate')) {
      console.log('🛑 QUOTA ERROR DETECTED - Stopping here');
      process.exit(1);
    }
  }
  
  // Small delay between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log('\nTesting complete');