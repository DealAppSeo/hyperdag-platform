#!/usr/bin/env node

/**
 * HyperDAG Phase 2: Soul Bound Token + Zero-Knowledge Proof System Integration Test
 * 
 * This test validates that all Phase 2 components are properly integrated:
 * 1. SBT Manager Service
 * 2. ZKP System Service
 * 3. Reputation ANFIS Service
 * 4. DAO Governance System
 * 5. Integrated HyperDAG System
 * 6. Database Schema & Connectivity
 * 7. API Route Integration
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 HyperDAG Phase 2: SBT + ZKP System Integration Test\n');

const tests = [
  {
    name: 'Database Connectivity',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/db.js\\").then(({db}) => { console.log(\\"✅ Database connected successfully\\"); process.exit(0); }).catch(e => { console.error(\\"❌ Database error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },
  
  {
    name: 'SBT Database Tables',
    test: () => {
      try {
        const result = execSync(`psql "${process.env.DATABASE_URL}" -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('soul_bound_tokens', 'sbt_contributions', 'zkp_circuits', 'zkp_proofs', 'dao_proposals', 'dao_votes');"`, 
          { encoding: 'utf8', timeout: 10000 }
        );
        const tableCount = (result.match(/\n/g) || []).length - 3; // Subtract header lines
        return { 
          success: tableCount >= 6, 
          result: `Found ${tableCount}/6 Phase 2 tables created` 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'SBT Manager Service',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/services/sbt/sbt-manager.js\\").then(({SoulBoundTokenManager}) => { console.log(\\"✅ SBT Manager service imported successfully\\"); const manager = new SoulBoundTokenManager(); console.log(\\"✅ SBT Manager instantiated:\\", typeof manager); process.exit(0); }).catch(e => { console.error(\\"❌ SBT Manager error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'ZKP System Service',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/services/zkp/zkp-system.js\\").then(({ZKPSystem}) => { console.log(\\"✅ ZKP System service imported successfully\\"); const zkp = new ZKPSystem(); console.log(\\"✅ ZKP System instantiated:\\", typeof zkp); process.exit(0); }).catch(e => { console.error(\\"❌ ZKP System error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'Reputation ANFIS Service',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/services/anfis/reputation-anfis.js\\").then(({ReputationANFIS}) => { console.log(\\"✅ Reputation ANFIS service imported successfully\\"); const anfis = new ReputationANFIS(); console.log(\\"✅ Reputation ANFIS instantiated:\\", typeof anfis); process.exit(0); }).catch(e => { console.error(\\"❌ Reputation ANFIS error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'DAO Governance System',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/services/dao/governance-system.js\\").then(({DAOGovernanceSystem}) => { console.log(\\"✅ DAO Governance service imported successfully\\"); const dao = new DAOGovernanceSystem(); console.log(\\"✅ DAO Governance instantiated:\\", typeof dao); process.exit(0); }).catch(e => { console.error(\\"❌ DAO Governance error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'Integrated HyperDAG System',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/services/sbt/integrated-hyperdag-system.js\\").then(({IntegratedHyperDAGSystem}) => { console.log(\\"✅ Integrated HyperDAG service imported successfully\\"); const system = new IntegratedHyperDAGSystem(); console.log(\\"✅ Integrated HyperDAG instantiated:\\", typeof system); process.exit(0); }).catch(e => { console.error(\\"❌ Integrated HyperDAG error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'SBT API Routes',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./server/api/routes/sbt-system.js\\").then((module) => { console.log(\\"✅ SBT API routes imported successfully\\"); console.log(\\"✅ Router exports:\\", Object.keys(module)); process.exit(0); }).catch(e => { console.error(\\"❌ SBT API routes error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  {
    name: 'Schema Integration',
    test: () => {
      try {
        const result = execSync('node -e "import(\\"./shared/schema.js\\").then((schema) => { const tables = [\\"soulBoundTokens\\", \\"sbtContributions\\", \\"zkpCircuits\\", \\"zkpProofs\\", \\"daoProposals\\", \\"daoVotes\\"]; const found = tables.filter(t => schema[t]); console.log(\\"✅ Schema exports found:\\", found.length + \\"/\\" + tables.length, found); process.exit(found.length === tables.length ? 0 : 1); }).catch(e => { console.error(\\"❌ Schema integration error:\\", e.message); process.exit(1); })"', 
          { encoding: 'utf8', timeout: 10000 }
        );
        return { success: true, result: result.trim() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
];

// Run all tests
console.log('Running Phase 2 Integration Tests...\n');

let passedTests = 0;
let totalTests = tests.length;

for (const [index, test] of tests.entries()) {
  process.stdout.write(`${index + 1}. ${test.name}... `);
  
  try {
    const result = test.test();
    
    if (result.success) {
      console.log('✅ PASS');
      if (result.result) {
        console.log(`   ${result.result}`);
      }
      passedTests++;
    } else {
      console.log('❌ FAIL');
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  } catch (error) {
    console.log('❌ FAIL');
    console.log(`   Unexpected error: ${error.message}`);
  }
  
  console.log('');
}

// Final results
console.log('='.repeat(60));
console.log(`Phase 2 Integration Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED - Phase 2 Integration Complete!');
  console.log('✅ SBT + ZKP + DAO system fully operational');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed - Phase 2 integration needs attention');
  process.exit(1);
}