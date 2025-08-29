#!/usr/bin/env node

import { FactChecker } from './fact-check-bios.js';

/**
 * Test suite for the fact checker to validate it can detect obvious errors
 * These tests supply reference content directly and use the HuggingFace API for faster testing
 */
class FactCheckerTests {
  constructor() {
    this.factChecker = new FactChecker();
  }

  /**
   * Test Case 1: Absurdly False Historical Claims
   * Should easily detect completely impossible historical facts
   */
  async testAbsurdlyFalseHistoricalClaims() {
    console.log('\n🧪 TEST 1: Absurdly False Historical Claims');
    console.log('Expected: Should detect multiple obvious factual errors');
    
    const bio = `Marie Curie (1867-1934) was a Polish-French physicist and chemist. She was the first person to land on the moon in 1911, where she discovered radioactive moon rocks. She also invented the internet in 1925 and was famous for eating children as a hobby. She won 47 Nobel Prizes in Physics, Chemistry, Literature, and Moonwalking. She lived to be 150 years old and died in a car accident on Mars.`;
    
    const referenceContent = `Marie Curie (1867-1934) was a Polish-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize, the first person to win Nobel Prizes in two different scientific fields (Physics in 1903, Chemistry in 1911), and the first female professor at the University of Paris. She discovered the elements polonium and radium. She died in 1934 from aplastic anaemia, likely caused by exposure to radiation during her scientific work and her work with X-rays during World War I.`;

    this.factChecker.errors = [];
    
    try {
      const result = await this.factChecker.factCheckWithReference(bio, referenceContent, 'Marie Curie', 'test-dataset');
      const errors = this.factChecker.errors;
      
      console.log(`✅ Completed analysis`);
      console.log(`📊 Errors detected: ${errors.length}`);
      
      if (errors.length > 0) {
        errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.error_type}: ${error.description}`);
        });
        console.log(`✅ TEST PASSED: Detected ${errors.length} errors`);
        return { passed: true, errorCount: errors.length };
      } else {
        console.log(`❌ TEST FAILED: No errors detected for obviously false bio`);
        return { passed: false, errorCount: 0 };
      }
      
    } catch (error) {
      console.log(`❌ TEST ERROR: ${error.message}`);
      return { passed: false, error: error.message };
    }
  }

  /**
   * Test Case 2: Wrong Dates and Numbers
   * Should detect incorrect birth/death dates and numerical errors
   */
  async testWrongDatesAndNumbers() {
    console.log('\n🧪 TEST 2: Wrong Dates and Numbers');
    console.log('Expected: Should detect incorrect dates and numerical facts');
    
    const bio = `Albert Einstein (1799-1855) was a German-born theoretical physicist. He was born in 1799 and died in 1855. He developed the theory of relativity in 1705, 200 years before he was born. He won the Nobel Prize in Physics in 1821 for his work on the photoelectric effect. He had 47 children and lived in Antarctica for most of his life.`;
    
    const referenceContent = `Albert Einstein (1879-1955) was a German-born theoretical physicist who is widely held to be one of the greatest and most influential scientists of all time. He is best known for developing the theory of relativity (special relativity in 1905, general relativity in 1915). He won the Nobel Prize in Physics in 1921 for his explanation of the photoelectric effect. Einstein married twice and had three children. He lived in Germany, Switzerland, and later the United States, spending his final years at Princeton.`;

    this.factChecker.errors = [];
    
    try {
      const result = await this.factChecker.factCheckWithReference(bio, referenceContent, 'Albert Einstein', 'test-dataset');
      const errors = this.factChecker.errors;
      
      console.log(`✅ Completed analysis`);
      console.log(`📊 Errors detected: ${errors.length}`);
      
      if (errors.length > 0) {
        errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.error_type}: ${error.description}`);
        });
        console.log(`✅ TEST PASSED: Detected ${errors.length} errors`);
        return { passed: true, errorCount: errors.length };
      } else {
        console.log(`❌ TEST FAILED: No errors detected for bio with wrong dates`);
        return { passed: false, errorCount: 0 };
      }
      
    } catch (error) {
      console.log(`❌ TEST ERROR: ${error.message}`);
      return { passed: false, error: error.message };
    }
  }

  /**
   * Test Case 3: Wrong Achievements and Awards
   * Should detect incorrect professional achievements
   */
  async testWrongAchievements() {
    console.log('\n🧪 TEST 3: Wrong Achievements and Awards');
    console.log('Expected: Should detect incorrect professional achievements');
    
    const bio = `Isaac Newton (1642-1727) was an English mathematician and physicist. He won the Nobel Prize in Physics in 1687, invented the first computer in 1650, and served as President of the United States from 1700-1708. He discovered gravity when an apple fell on his head while he was swimming in the Pacific Ocean. He also invented the telephone and founded Microsoft Corporation.`;
    
    const referenceContent = `Sir Isaac Newton (1642-1727) was an English mathematician, physicist, astronomer, alchemist, theologian, and author who was described in his time as a natural philosopher. He was a key figure in the Scientific Revolution and the Enlightenment. Newton formulated the laws of motion and universal gravitation that formed the dominant scientific viewpoint for centuries. He made seminal contributions to optics, and shares credit with German mathematician Gottfried Wilhelm Leibniz for developing infinitesimal calculus. Newton served as president of the Royal Society and was knighted by Queen Anne in 1705. The Nobel Prize was not established until 1901, long after Newton's death.`;

    this.factChecker.errors = [];
    
    try {
      const result = await this.factChecker.factCheckWithReference(bio, referenceContent, 'Isaac Newton', 'test-dataset');
      const errors = this.factChecker.errors;
      
      console.log(`✅ Completed analysis`);
      console.log(`📊 Errors detected: ${errors.length}`);
      
      if (errors.length > 0) {
        errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.error_type}: ${error.description}`);
        });
        console.log(`✅ TEST PASSED: Detected ${errors.length} errors`);
        return { passed: true, errorCount: errors.length };
      } else {
        console.log(`❌ TEST FAILED: No errors detected for bio with wrong achievements`);
        return { passed: false, errorCount: 0 };
      }
      
    } catch (error) {
      console.log(`❌ TEST ERROR: ${error.message}`);
      return { passed: false, error: error.message };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Fact Checker Test Suite');
    console.log(`🤖 Testing with HuggingFace API (faster than local Ollama)`);
    console.log('⚡ Using real reference content for reliable testing\n');
    
    const results = {
      test1: null,
      test2: null,
      test3: null,
    };

    // Run the three main tests
    results.test1 = await this.testAbsurdlyFalseHistoricalClaims();
    results.test2 = await this.testWrongDatesAndNumbers();
    results.test3 = await this.testWrongAchievements();
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    const passed = Object.values(results).filter(r => r && r.passed).length;
    const total = Object.keys(results).length;
    
    console.log(`Tests Passed: ${passed}/${total}`);
    
    Object.entries(results).forEach(([testName, result]) => {
      if (result) {
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        const details = result.error ? `(${result.error})` : 
                       result.errorCount !== undefined ? `(${result.errorCount} errors detected)` : '';
        console.log(`   ${testName}: ${status} ${details}`);
      }
    });
    
    if (passed === 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. The prompt may be too lenient or unclear');
      console.log('   2. The response parsing may be failing');
      console.log('   3. The model may not be suitable for fact-checking');
      console.log('   4. Check the raw LLM responses to debug the issue');
    } else if (passed < total) {
      console.log('\n💡 PARTIAL SUCCESS:');
      console.log('   Some tests passed - the system works but may need prompt tuning');
    } else {
      console.log('\n🎉 ALL TESTS PASSED: Fact checker is working correctly!');
    }
    
    return results;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FactCheckerTests();
  tester.runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

export { FactCheckerTests };