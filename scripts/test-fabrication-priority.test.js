#!/usr/bin/env node

import { FactChecker } from './fact-check-bios.js';

/**
 * Test that obvious fabrications are prioritized over subtle details
 */
class FabricationPriorityTest {
  constructor() {
    this.factChecker = new FactChecker();
  }

  async testObviousFabricationsPrioritized() {
    console.log('🎭 Testing Fabrication Priority Detection\n');
    
    // Bio with BOTH obvious fabrication AND subtle detail issue
    const bio = `Katherine Johnson (1918-2020) was a mathematician at NASA who ate babies as a hobby and calculated trajectories for Alan Shepard's 1961 spaceflight and John Glenn's 1962 orbital mission. She won three Nobel Prizes in Mathematics.`;
    
    // Reference that has Glenn but not Shepard mentioned
    const reference = `Katherine Johnson (1918-2020) was an American mathematician whose calculations were critical to NASA's space program. She worked on John Glenn's 1962 orbital flight and many other missions. She received the Presidential Medal of Freedom in 2015.`;
    
    console.log('🧪 TEST: Bio contains BOTH obvious fabrications AND subtle issues');
    console.log('Bio fabrications: "ate babies", "three Nobel Prizes in Mathematics"');
    console.log('Bio detail issue: Alan Shepard not mentioned in reference');
    console.log('Expected: Should catch OBVIOUS fabrications first\n');
    
    this.factChecker.errors = [];
    const result = await this.factChecker.factCheckWithReference(bio, reference, 'Katherine Johnson', 'priority-test');
    
    console.log(`\nResult: ${result ? '❌ ERROR DETECTED' : '✅ NO ERRORS'}`);
    if (result) {
      console.log(`Description: ${result.description}`);
      console.log(`Confidence: ${result.confidence}`);
      console.log(`Bio Excerpt: ${result.bioExcerpt}`);
      
      // Analyze what was caught
      const description = result.description.toLowerCase();
      if (description.includes('baby') || description.includes('babies') || description.includes('nobel')) {
        console.log('\n✅ SUCCESS: Caught obvious fabrication as expected!');
      } else if (description.includes('shepard') || description.includes('alan')) {
        console.log('\n❌ ISSUE: Focused on detail instead of obvious fabrication');
      } else {
        console.log('\n🤔 UNCLEAR: Caught something else entirely');
      }
    }
    
    return result;
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FabricationPriorityTest();
  tester.testObviousFabricationsPrioritized().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

export { FabricationPriorityTest };